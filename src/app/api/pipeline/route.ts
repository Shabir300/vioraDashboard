import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { emitPipelineEvent } from '@/lib/realtime';

// Validation schemas
const createPipelineSchema = z.object({
  name: z.string().min(1, 'Pipeline name is required'),
  description: z.string().optional(),
  organizationId: z.string().min(1, 'Organization ID is required'),
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
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const pipelines = await prisma.pipeline.findMany({
      where: { organizationId },
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

// POST /api/pipeline - Create a new pipeline
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createPipelineSchema.parse(body);

    const pipeline = await prisma.pipeline.create({
      data: validatedData,
      include: {
        stages: true,
      },
    });

    emitPipelineEvent({ type: 'pipeline:update', organizationId: pipeline.organizationId, payload: { action: 'create', pipeline } });

    return NextResponse.json(pipeline, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to create pipeline' },
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


