import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { emitPipelineEvent } from '@/lib/realtime';

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

    if (!pipelineId) {
      return NextResponse.json(
        { error: 'Pipeline ID is required' },
        { status: 400 }
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

    return NextResponse.json(stages);
  } catch (error) {
    console.error('Error fetching stages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stages' },
      { status: 500 }
    );
  }
}

// POST /api/pipeline/stages - Create a new stage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createStageSchema.parse(body);

    const created = await prisma.$transaction(async (tx) => {
      const max = await tx.pipelineStageModel.findFirst({
        where: { pipelineId: validatedData.pipelineId },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      const nextPos = (max?.position ?? -1) + 1;
      return tx.pipelineStageModel.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          color: validatedData.color ?? '#6B7280',
          pipelineId: validatedData.pipelineId,
          position: nextPos,
        },
        include: { cards: true },
      });
    });

    // Find organization for broadcasting
    const pipeline = await prisma.pipeline.findUnique({ where: { id: created.pipelineId }, select: { organizationId: true } });
    if (pipeline) emitPipelineEvent({ type: 'stage:create', organizationId: pipeline.organizationId, payload: { stage: created } });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    // Retry once if unique constraint due to race
    if (typeof error?.message === 'string' && error.message.includes('Unique constraint failed') && request?.json) {
      try {
        const body = await request.json();
        const validatedData = createStageSchema.parse(body);
        const created = await prisma.$transaction(async (tx) => {
          const max = await tx.pipelineStageModel.findFirst({
            where: { pipelineId: validatedData.pipelineId },
            orderBy: { position: 'desc' },
            select: { position: true },
          });
          const nextPos = (max?.position ?? -1) + 1;
          return tx.pipelineStageModel.create({
            data: {
              name: validatedData.name,
              description: validatedData.description,
              color: validatedData.color ?? '#6B7280',
              pipelineId: validatedData.pipelineId,
              position: nextPos,
            },
            include: { cards: true },
          });
        });
        const pipeline = await prisma.pipeline.findUnique({ where: { id: created.pipelineId }, select: { organizationId: true } });
        if (pipeline) emitPipelineEvent({ type: 'stage:create', organizationId: pipeline.organizationId, payload: { stage: created } });
        return NextResponse.json(created, { status: 201 });
      } catch {}
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating stage:', error);
    return NextResponse.json(
      { error: 'Failed to create stage' },
      { status: 500 }
    );
  }
}

// PUT /api/pipeline/stages - Update a stage
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Stage ID is required' },
        { status: 400 }
      );
    }

    const validatedData = updateStageSchema.parse(updateData);

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

    const pipeline = await prisma.pipeline.findUnique({ where: { id: stage.pipelineId }, select: { organizationId: true } });
    if (pipeline) emitPipelineEvent({ type: 'stage:update', organizationId: pipeline.organizationId, payload: { stage } });

    return NextResponse.json(stage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating stage:', error);
    return NextResponse.json(
      { error: 'Failed to update stage' },
      { status: 500 }
    );
  }
}

// DELETE /api/pipeline/stages - Delete a stage
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Stage ID is required' },
        { status: 400 }
      );
    }

    const deleted = await prisma.pipelineStageModel.delete({
      where: { id },
      select: { id: true, pipelineId: true },
    });

    const pipeline = await prisma.pipeline.findUnique({ where: { id: deleted.pipelineId }, select: { organizationId: true } });
    if (pipeline) emitPipelineEvent({ type: 'stage:delete', organizationId: pipeline.organizationId, payload: { id: deleted.id } });

    return NextResponse.json({ message: 'Stage deleted successfully' });
  } catch (error) {
    console.error('Error deleting stage:', error);
    return NextResponse.json(
      { error: 'Failed to delete stage' },
      { status: 500 }
    );
  }
}
