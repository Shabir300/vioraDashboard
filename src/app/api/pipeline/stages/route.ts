import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { emitPipelineEvent } from '@/lib/realtime';
import { requireAuthWithOrg } from '@/lib/api-helpers';

const createStageSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
  position: z.number().int().min(0).optional(),
  pipelineId: z.string().min(1, 'Pipeline ID is required'),
});

const updateStageSchema = z.object({
  name: z.string().min(1, 'Stage name is required').optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  position: z.number().int().min(0).optional(),
});

// GET /api/pipeline/stages - Get stages for a pipeline
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');

    // Validate pipelineId parameter
    if (!pipelineId) {
      console.error('GET /api/pipeline/stages - Missing pipelineId parameter:', { url: request.url });
      return NextResponse.json(
        { error: 'Pipeline ID is required' },
        { status: 400 }
      );
    }

    if (typeof pipelineId !== 'string' || !pipelineId.trim()) {
      console.error('GET /api/pipeline/stages - Invalid pipelineId parameter:', { pipelineId, url: request.url });
      return NextResponse.json(
        { error: 'Pipeline ID must be a valid string' },
        { status: 400 }
      );
    }

    // Check if pipeline exists first
    const pipelineExists = await prisma.pipeline.findUnique({
      where: { id: pipelineId },
      select: { id: true }
    });

    if (!pipelineExists) {
      console.error('GET /api/pipeline/stages - Pipeline not found:', { pipelineId });
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    const stages = await prisma.pipelineStageModel.findMany({
      where: { pipelineId },
      orderBy: { position: 'asc' },
      include: {
        cards: {
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
          },
        },
      },
    });

    console.log('GET /api/pipeline/stages - Fetched stages successfully:', { 
      pipelineId, 
      stageCount: stages.length,
      totalCards: stages.reduce((sum, stage) => sum + stage.cards.length, 0)
    });

    return NextResponse.json(stages);
  } catch (error: any) {
    console.error('GET /api/pipeline/stages - Unexpected error:', {
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
        { error: 'Pipeline or related data not found' },
        { status: 404 }
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
      { error: 'An unexpected error occurred while fetching stages' },
      { status: 500 }
    );
  }
}

// POST /api/pipeline/stages - Create a new stage
export async function POST(request: NextRequest) {
  let validatedData: any;
  let pipelineExists: any;
  
  try {
    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('POST /api/pipeline/stages - Invalid JSON body:', { 
        error: parseError,
        url: request.url
      });
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    try {
      validatedData = createStageSchema.parse(body);
    } catch (validationError) {
      console.error('POST /api/pipeline/stages - Validation failed:', { 
        error: validationError,
        body,
        url: request.url
      });
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationError.issues },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Check if pipeline exists before creating stage
    pipelineExists = await prisma.pipeline.findUnique({
      where: { id: validatedData.pipelineId },
      select: { id: true, organizationId: true }
    });

    if (!pipelineExists) {
      console.error('POST /api/pipeline/stages - Pipeline not found:', { 
        pipelineId: validatedData.pipelineId 
      });
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    // Use simple incremental position approach
    // Get current max position and add 1000 to leave room for reordering
    let maxPositionRecord;
    try {
      maxPositionRecord = await prisma.pipelineStageModel.findFirst({
        where: { pipelineId: validatedData.pipelineId },
        orderBy: { position: 'desc' },
        select: { position: true }
      });
    } catch (queryError: any) {
      // Handle cached plan errors by disconnecting and retrying
      if (queryError?.code === 'P2010' || queryError?.message?.includes('cached plan')) {
        console.log('Clearing database connection due to cached plan error...');
        await prisma.$disconnect();
        await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay
        
        maxPositionRecord = await prisma.pipelineStageModel.findFirst({
          where: { pipelineId: validatedData.pipelineId },
          orderBy: { position: 'desc' },
          select: { position: true }
        });
      } else {
        throw queryError;
      }
    }
    
    const maxPosition = maxPositionRecord?.position ? Number(maxPositionRecord.position) : 0;
    const newPosition = maxPosition + 1000;
    
    const created = await prisma.pipelineStageModel.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color ?? '#6B7280',
        pipelineId: validatedData.pipelineId,
        position: newPosition,
      },
      include: { cards: true },
    });

    // Emit realtime event
    try {
      emitPipelineEvent({ 
        type: 'stage:create', 
        organizationId: pipelineExists.organizationId, 
        payload: { stage: created } 
      });
    } catch (eventError) {
      // Log the event error but don't fail the request
      console.error('POST /api/pipeline/stages - Failed to emit pipeline event:', {
        error: eventError,
        stageId: created.id,
        pipelineId: created.pipelineId,
        organizationId: pipelineExists.organizationId
      });
    }

    console.log('POST /api/pipeline/stages - Stage created successfully:', { 
      stageId: created.id,
      stageName: created.name,
      pipelineId: created.pipelineId,
      position: created.position
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    // Detailed error logging
    console.error('POST /api/pipeline/stages - Unexpected error:', {
      error: {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack
      },
      url: request.url
    });

    // Handle specific Prisma errors
    if (error?.code === 'P2002') {
      console.error('POST /api/pipeline/stages - Unique constraint violation:', {
        error: {
          message: error?.message,
          code: error?.code,
          meta: error?.meta
        },
        validatedData,
        target: error?.meta?.target
      });

      // Determine the specific constraint that failed
      const constraintTarget = error?.meta?.target;
      if (Array.isArray(constraintTarget)) {
        if (constraintTarget.includes('position')) {
          return NextResponse.json(
            { error: 'Position conflict occurred. This should not happen with the current implementation.' },
            { status: 409 }
          );
        }
        if (constraintTarget.includes('name')) {
          return NextResponse.json(
            { error: 'A stage with this name already exists in this pipeline' },
            { status: 409 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'A stage with this configuration already exists' },
        { status: 409 }
      );
    }

    // Handle transaction timeout or serialization failures
    if (error?.code === 'P2034') {
      console.error('POST /api/pipeline/stages - Transaction timeout:', {
        error: error?.message,
        validatedData
      });
      return NextResponse.json(
        { error: 'Request timeout. Please try again.' },
        { status: 408 }
      );
    }

    if (error?.code === 'P2003') {
      return NextResponse.json(
        { error: 'Referenced pipeline does not exist' },
        { status: 404 }
      );
    }

    // Handle database connection errors
    if (error?.code === 'P1001' || error?.code === 'P1002') {
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' },
        { status: 503 }
      );
    }

    // Handle validation errors that weren't caught earlier
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/pipeline/stages - Update a stage
export async function PUT(request: NextRequest) {
  try {
    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('PUT /api/pipeline/stages - Invalid JSON body:', { 
        error: parseError,
        url: request.url
      });
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { id, ...updateData } = body;

    // Validate stage ID
    if (!id) {
      console.error('PUT /api/pipeline/stages - Missing stage ID:', { body });
      return NextResponse.json(
        { error: 'Stage ID is required' },
        { status: 400 }
      );
    }

    if (typeof id !== 'string' || !id.trim()) {
      console.error('PUT /api/pipeline/stages - Invalid stage ID:', { id, body });
      return NextResponse.json(
        { error: 'Stage ID must be a valid string' },
        { status: 400 }
      );
    }

    // Validate update data
    let validatedData: any;
    try {
      validatedData = updateStageSchema.parse(updateData);
    } catch (validationError) {
      console.error('PUT /api/pipeline/stages - Validation failed:', { 
        error: validationError,
        id,
        updateData,
        url: request.url
      });
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationError.issues },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Check if stage exists before updating
    const existingStage = await prisma.pipelineStageModel.findUnique({
      where: { id },
      select: { id: true, name: true, pipelineId: true }
    });

    if (!existingStage) {
      console.error('PUT /api/pipeline/stages - Stage not found:', { id });
      return NextResponse.json(
        { error: 'Stage not found' },
        { status: 404 }
      );
    }

    // Update the stage
    const stage = await prisma.pipelineStageModel.update({
      where: { id },
      data: validatedData,
      include: {
        cards: {
          orderBy: { position: 'asc' },
          include: {
            client: true,
          },
        },
      },
    });

    // Find organization for broadcasting
    const pipeline = await prisma.pipeline.findUnique({ 
      where: { id: stage.pipelineId }, 
      select: { organizationId: true } 
    });

    // Emit realtime event
    if (pipeline) {
      try {
        emitPipelineEvent({ 
          type: 'stage:update', 
          organizationId: pipeline.organizationId, 
          payload: { stage } 
        });
      } catch (eventError) {
        // Log the event error but don't fail the request
        console.error('PUT /api/pipeline/stages - Failed to emit pipeline event:', {
          error: eventError,
          stageId: stage.id,
          pipelineId: stage.pipelineId,
          organizationId: pipeline.organizationId
        });
      }
    }

    console.log('PUT /api/pipeline/stages - Stage updated successfully:', { 
      stageId: stage.id,
      stageName: stage.name,
      pipelineId: stage.pipelineId,
      updatedFields: Object.keys(validatedData)
    });

    return NextResponse.json(stage);
  } catch (error: any) {
    console.error('PUT /api/pipeline/stages - Unexpected error:', {
      error: {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack
      },
      url: request.url
    });

    // Handle specific Prisma errors
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Stage not found or already deleted' },
        { status: 404 }
      );
    }

    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A stage with this name already exists in the pipeline' },
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

    // Handle validation errors that weren't caught earlier
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while updating the stage' },
      { status: 500 }
    );
  }
}

// DELETE /api/pipeline/stages - Delete a stage
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate stage ID
    if (!id) {
      console.error('DELETE /api/pipeline/stages - Missing stage ID:', { url: request.url });
      return NextResponse.json(
        { error: 'Stage ID is required' },
        { status: 400 }
      );
    }

    if (typeof id !== 'string' || !id.trim()) {
      console.error('DELETE /api/pipeline/stages - Invalid stage ID:', { id, url: request.url });
      return NextResponse.json(
        { error: 'Stage ID must be a valid string' },
        { status: 400 }
      );
    }

    // Check if stage exists before attempting to delete
    const existingStage = await prisma.pipelineStageModel.findUnique({
      where: { id },
      select: { id: true, name: true, pipelineId: true }
    });

    if (!existingStage) {
      console.error('DELETE /api/pipeline/stages - Stage not found:', { id });
      return NextResponse.json(
        { error: 'Stage not found' },
        { status: 404 }
      );
    }

    // Delete the stage
    const deleted = await prisma.pipelineStageModel.delete({
      where: { id },
      select: { id: true, pipelineId: true },
    });

    // Find organization for broadcasting
    const pipeline = await prisma.pipeline.findUnique({ 
      where: { id: deleted.pipelineId }, 
      select: { organizationId: true } 
    });

    // Emit realtime event
    if (pipeline) {
      try {
        emitPipelineEvent({ 
          type: 'stage:delete', 
          organizationId: pipeline.organizationId, 
          payload: { id: deleted.id } 
        });
      } catch (eventError) {
        // Log the event error but don't fail the request
        console.error('DELETE /api/pipeline/stages - Failed to emit pipeline event:', {
          error: eventError,
          stageId: deleted.id,
          pipelineId: deleted.pipelineId,
          organizationId: pipeline.organizationId
        });
      }
    }

    console.log('DELETE /api/pipeline/stages - Stage deleted successfully:', { 
      stageId: deleted.id,
      stageName: existingStage.name,
      pipelineId: deleted.pipelineId
    });

    return NextResponse.json({ message: 'Stage deleted successfully', id: deleted.id });
  } catch (error: any) {
    console.error('DELETE /api/pipeline/stages - Unexpected error:', {
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
        { error: 'Stage not found or already deleted' },
        { status: 404 }
      );
    }
    
    if (error?.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete stage due to existing dependencies (cards, etc.)' },
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
      { error: 'An unexpected error occurred while deleting the stage' },
      { status: 500 }
    );
  }
}
