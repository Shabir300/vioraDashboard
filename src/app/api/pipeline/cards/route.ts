import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { emitPipelineEvent } from '@/lib/realtime';

const createCardSchema = z.object({
  title: z.string().min(1, 'Card title is required'),
  description: z.string().optional(),
  value: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().optional(),
  clientId: z.string().optional(), // Optional - can link to existing client
  pipelineId: z.string().min(1, 'Pipeline ID is required'),
  stageId: z.string().min(1, 'Stage ID is required'),
  position: z.number().int().min(0).optional(),
  // Client details stored directly in the card (for deals not yet closed)
  clientName: z.string().optional(),
  clientEmail: z.string().email('Valid email is required').optional(),
  clientCompany: z.string().optional(),
  clientPhone: z.string().optional(),
  // Legacy client object support (for backward compatibility)
  client: z.object({
    name: z.string().min(1, 'Client name is required'),
    email: z.string().email('Valid email is required'),
    company: z.string().optional(),
    valueUsd: z.number().int().min(0).default(0),
  }).optional(),
});

const moveCardSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  newStageId: z.string().min(1, 'New stage ID is required'),
  newPosition: z.number().int().min(0),
});

// GET /api/pipeline/cards - Get cards for a stage or client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stageId = searchParams.get('stageId');
    const clientId = searchParams.get('clientId');

    if (!stageId && !clientId) {
      return NextResponse.json(
        { error: 'Stage ID or Client ID is required' },
        { status: 400 }
      );
    }

    const whereClause: any = {};
    if (stageId) whereClause.stageId = stageId;
    if (clientId) whereClause.clientId = clientId;

    const cards = await prisma.pipelineCard.findMany({
      where: whereClause,
      orderBy: { position: 'asc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            valueUsd: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}

// POST /api/pipeline/cards - Create a new card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createCardSchema.parse(body);

    // Resolve organizationId from pipeline
    const pipeline = await prisma.pipeline.findUnique({
      where: { id: validatedData.pipelineId },
      select: { organizationId: true },
    });

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    // Handle client creation or linking
    let clientId = validatedData.clientId;
    
    // If no clientId provided, we'll store client details directly in the card
    // Only create a client if we have both name and email
    if (!clientId && validatedData.clientName && validatedData.clientEmail) {
      // Check if client with same email already exists
      const existingClient = await prisma.client.findFirst({
        where: {
          email: validatedData.clientEmail,
          organizationId: pipeline.organizationId,
        },
      });

      if (existingClient) {
        clientId = existingClient.id;
      }
      // Note: We don't create a new client here - we'll store details in the card
    }

    // Get the highest position in the stage if not provided
    let position = validatedData.position ?? 0;
    if (validatedData.position === undefined) {
      const maxPosition = await prisma.pipelineCard.findFirst({
        where: { stageId: validatedData.stageId },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      position = maxPosition ? maxPosition.position + 1 : 0;
    }

    const cardData: any = {
      organizationId: pipeline.organizationId,
      pipelineId: validatedData.pipelineId,
      stageId: validatedData.stageId,
      title: validatedData.title,
      description: validatedData.description,
      value: validatedData.value,
      priority: validatedData.priority,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      position,
      // Store client details directly in the card
      clientName: validatedData.clientName,
      clientEmail: validatedData.clientEmail,
      clientCompany: validatedData.clientCompany,
      clientPhone: validatedData.clientPhone,
    };

    // Only add clientId if it exists
    if (clientId) {
      cardData.clientId = clientId;
    }

    const card = await prisma.pipelineCard.create({
      data: cardData,
      include: {
        client: clientId ? {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            valueUsd: true,
          },
        } : undefined,
      },
    });

    emitPipelineEvent({ type: 'card:update', organizationId: pipeline.organizationId, payload: { action: 'create', card } });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating card:', error);
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    );
  }
}

// PUT /api/pipeline/cards - Update a card
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      );
    }

    // Get the current card to access organizationId
    const currentCard = await prisma.pipelineCard.findUnique({
      where: { id },
      include: { pipeline: true },
    });

    if (!currentCard) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    // Handle client creation or linking
    let clientId = updateData.clientId;
    
    // If no clientId provided, we'll store client details directly in the card
    // Only create a client if we have both name and email
    if (!clientId && updateData.clientName && updateData.clientEmail) {
      // Check if client with same email already exists
      const existingClient = await prisma.client.findFirst({
        where: {
          email: updateData.clientEmail,
          organizationId: currentCard.pipeline.organizationId,
        },
      });

      if (existingClient) {
        clientId = existingClient.id;
      }
      // Note: We don't create a new client here - we'll store details in the card
    }

    // Prepare update data
    const updateDataToUse: any = {
      title: updateData.title,
      description: updateData.description,
      value: updateData.value,
      priority: updateData.priority,
      dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
      // Store client details directly in the card
      clientName: updateData.clientName,
      clientEmail: updateData.clientEmail,
      clientCompany: updateData.clientCompany,
      clientPhone: updateData.clientPhone,
    };

    // Add stageId if provided (for moving cards between stages)
    if (updateData.stageId) {
      updateDataToUse.stageId = updateData.stageId;
    }

    // Add clientId if resolved
    if (clientId) {
      updateDataToUse.clientId = clientId;
    }

    const card = await prisma.pipelineCard.update({
      where: { id },
      data: updateDataToUse,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            valueUsd: true,
          },
        },
      },
    });

    emitPipelineEvent({ type: 'card:update', organizationId: currentCard.pipeline.organizationId, payload: { action: 'update', card } });

    return NextResponse.json(card);
  } catch (error) {
    console.error('Error updating card:', error);
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    );
  }
}

// DELETE /api/pipeline/cards - Delete a card
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      console.error('DELETE /api/pipeline/cards - Missing card ID:', { url: request.url });
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      );
    }

    if (typeof id !== 'string' || !id.trim()) {
      console.error('DELETE /api/pipeline/cards - Invalid card ID:', { id, url: request.url });
      return NextResponse.json(
        { error: 'Card ID must be a valid string' },
        { status: 400 }
      );
    }

    // Check if card exists before attempting to delete
    const existingCard = await prisma.pipelineCard.findUnique({
      where: { id },
      select: { id: true, title: true, organizationId: true }
    });

    if (!existingCard) {
      console.error('DELETE /api/pipeline/cards - Card not found:', { id });
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    const deleted = await prisma.pipelineCard.delete({
      where: { id },
      select: { id: true, organizationId: true },
    });

    // Emit realtime event
    try {
      emitPipelineEvent({ 
        type: 'card:delete', 
        organizationId: deleted.organizationId, 
        payload: { id: deleted.id } 
      });
    } catch (eventError) {
      // Log the event error but don't fail the request
      console.error('DELETE /api/pipeline/cards - Failed to emit pipeline event:', {
        error: eventError,
        cardId: deleted.id,
        organizationId: deleted.organizationId
      });
    }

    console.log('DELETE /api/pipeline/cards - Card deleted successfully:', { 
      cardId: deleted.id,
      cardTitle: existingCard.title,
      organizationId: deleted.organizationId
    });

    return NextResponse.json({ 
      message: 'Card deleted successfully', 
      id: deleted.id 
    });
  } catch (error: any) {
    console.error('DELETE /api/pipeline/cards - Unexpected error:', {
      error: {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack
      },
      url: request.url,
      searchParams: Object.fromEntries(new URL(request.url).searchParams)
    });

    // Handle specific Prisma errors
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Card not found or already deleted' },
        { status: 404 }
      );
    }
    
    if (error?.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete card due to existing dependencies' },
        { status: 409 }
      );
    }

    // Handle database connection errors
    if (error?.code === 'P1001' || error?.code === 'P1002') {
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while deleting the card' },
      { status: 500 }
    );
  }
}

// PATCH /api/pipeline/cards/move - Move a card between stages
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = moveCardSchema.parse(body);

    const { cardId, newStageId, newPosition } = validatedData;

    // Get the current card
    const currentCard = await prisma.pipelineCard.findUnique({
      where: { id: cardId },
    });

    if (!currentCard) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update positions of other cards in the new stage
      await tx.pipelineCard.updateMany({
        where: {
          stageId: newStageId,
          position: {
            gte: newPosition,
          },
        },
        data: {
          position: {
            increment: 1,
          },
        },
      });

      // Update the moved card
      const updatedCard = await tx.pipelineCard.update({
        where: { id: cardId },
        data: {
          stageId: newStageId,
          position: newPosition,
        },
        include: {
          client: true,
        },
      });

      return updatedCard;
    });

    emitPipelineEvent({ type: 'card:move', organizationId: result.organizationId, payload: { cardId, newStageId, newPosition } });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error moving card:', error);
    return NextResponse.json(
      { error: 'Failed to move card' },
      { status: 500 }
    );
  }
}
