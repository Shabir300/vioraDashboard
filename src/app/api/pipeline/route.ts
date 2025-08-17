import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { emitPipelineEvent } from '@/lib/realtime';
import { requireAuthWithOrg } from '@/lib/api-helpers';

// Validation schemas
const createStageInputSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').default('#6B7280'),
  position: z.number().int().min(0).optional(), // Will be auto-calculated if not provided
  isDefault: z.boolean().default(false),
});

const createPipelineSchema = z.object({
  name: z.string().min(1, 'Pipeline name is required'),
  description: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  isDefault: z.boolean().default(false),
  organizationId: z.string().min(1, 'Organization ID is required'),
  stages: z.array(createStageInputSchema).min(1, 'At least one stage is required').max(20, 'Maximum 20 stages allowed'),
});

const createStageSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
  position: z.number().int().min(0),
  pipelineId: z.string().min(1, 'Pipeline ID is required'),
});

const createCardSchema = z.object({
  title: z.string().min(1, 'Card title is required'),
  description: z.string().optional(),
  value: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().optional(),
  clientId: z.string().min(1, 'Client ID is required'),
  pipelineId: z.string().min(1, 'Pipeline ID is required'),
  stageId: z.string().min(1, 'Stage ID is required'),
  position: z.number().int().min(0),
});

const moveCardSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  newStageId: z.string().min(1, 'New stage ID is required'),
  newPosition: z.number().int().min(0),
});

// GET /api/pipeline - Get all pipelines for an organization
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrg(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { organizationId } = authResult;

    // Allow override for development/testing
    const paramOrgId = new URL(request.url).searchParams.get('organizationId');
    const finalOrgId = paramOrgId || organizationId;

    const pipelines = await prisma.pipeline.findMany({
      where: { organizationId: finalOrgId },
      include: {
        stages: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' as any },
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
        },
      },
    });

    return NextResponse.json(pipelines);
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipelines' },
      { status: 500 }
    );
  }
}

// POST /api/pipeline - Create a new pipeline with nested stages in a single transaction
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrg(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { organizationId } = authResult;

    const body = await request.json();
    console.log('Creating pipeline with body:', JSON.stringify(body, null, 2));
    
    // Ensure organizationId comes from auth, not request body
    const validatedData = createPipelineSchema.parse({
      ...body,
      organizationId,
    });

    console.log('Validated data:', JSON.stringify(validatedData, null, 2));

    // Use Prisma transaction to create pipeline with nested stages atomically
    const pipeline = await prisma.$transaction(async (tx) => {
      // Create the pipeline first
      const createdPipeline = await tx.pipeline.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          status: validatedData.status,
          isDefault: validatedData.isDefault,
          organizationId: validatedData.organizationId,
        },
      });

      console.log('Created pipeline:', createdPipeline.id);

      // Prepare stages with calculated positions
      // Note: pipelineId is automatically handled by Prisma nested create
      const stagesWithPositions = validatedData.stages.map((stage, index) => ({
        name: stage.name,
        description: stage.description,
        color: stage.color,
        position: stage.position ?? (index + 1) * 1000, // Auto-calculate position if not provided
        isDefault: stage.isDefault,
        // pipelineId is NOT needed here - Prisma handles the relationship automatically
      }));

      console.log('Creating stages:', stagesWithPositions.length);

      // Create all stages using nested write (Prisma's recommended approach)
      const pipelineWithStages = await tx.pipeline.update({
        where: { id: createdPipeline.id },
        data: {
          stages: {
            create: stagesWithPositions,
          },
        },
        include: {
          stages: {
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
          },
        },
      });

      console.log('Pipeline created with stages:', pipelineWithStages.stages.length);
      return pipelineWithStages;
    });

    // Emit real-time event after successful creation
    try {
      emitPipelineEvent({ 
        type: 'pipeline:create', 
        organizationId: pipeline.organizationId, 
        payload: { pipeline } 
      });
    } catch (eventError) {
      // Log event error but don't fail the request
      console.error('Failed to emit pipeline creation event:', eventError);
    }

    console.log('Pipeline creation completed successfully');
    return NextResponse.json(pipeline, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating pipeline:', {
      error: {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack?.split('\n').slice(0, 5).join('\n'), // Truncate stack trace
      },
      url: request.url,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            received: issue.received,
          })),
        },
        { status: 400 }
      );
    }

    // Handle specific Prisma errors
    if (error?.code === 'P2002') {
      const constraintField = error?.meta?.target?.[0] || 'field';
      return NextResponse.json(
        { error: `A pipeline with this ${constraintField} already exists in your organization` },
        { status: 409 }
      );
    }

    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Organization not found' },
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

    // Generic server error
    return NextResponse.json(
      { error: 'An unexpected error occurred while creating the pipeline' },
      { status: 500 }
    );
  }
}

// PUT /api/pipeline - Update pipeline
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Pipeline ID is required' },
        { status: 400 }
      );
    }

    const pipeline = await prisma.pipeline.update({
      where: { id },
      data: updateData,
      include: {
        stages: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: {
                client: true,
              },
            },
          },
        },
      },
    });

    emitPipelineEvent({ type: 'pipeline:update', organizationId: pipeline.organizationId, payload: { action: 'update', pipeline } });

    return NextResponse.json(pipeline);
  } catch (error) {
    console.error('Error updating pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to update pipeline' },
      { status: 500 }
    );
  }
}

// DELETE /api/pipeline - Delete pipeline
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Pipeline ID is required' },
        { status: 400 }
      );
    }

    const deleted = await prisma.pipeline.delete({
      where: { id },
      select: { id: true, organizationId: true },
    });

    emitPipelineEvent({ type: 'pipeline:update', organizationId: deleted.organizationId, payload: { action: 'delete', id: deleted.id } });

    return NextResponse.json({ message: 'Pipeline deleted successfully' });
  } catch (error) {
    console.error('Error deleting pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to delete pipeline' },
      { status: 500 }
    );
  }
}


