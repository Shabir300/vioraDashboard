import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { emitPipelineEvent } from '@/lib/realtime';

const moveCardSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  newStageId: z.string().min(1, 'New stage ID is required'),
  newPosition: z.number().int().min(0),
});

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, newStageId, newPosition } = moveCardSchema.parse(body);

    const current = await prisma.pipelineCard.findUnique({
      where: { id: cardId },
      select: { id: true, stageId: true, position: true, organizationId: true },
    });

    if (!current) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      if (current.stageId === newStageId) {
        // Reorder within the same stage
        if (newPosition === current.position) {
          return tx.pipelineCard.findUnique({ where: { id: cardId }, include: { client: true } });
        }
        if (newPosition > current.position) {
          // Shift up cards between (current.position+1 .. newPosition) down by 1
          await tx.pipelineCard.updateMany({
            where: {
              stageId: current.stageId,
              position: { gt: current.position, lte: newPosition },
            },
            data: { position: { decrement: 1 } },
          });
        } else {
          // Shift down cards between (newPosition .. current.position-1) up by 1
          await tx.pipelineCard.updateMany({
            where: {
              stageId: current.stageId,
              position: { gte: newPosition, lt: current.position },
            },
            data: { position: { increment: 1 } },
          });
        }

        return tx.pipelineCard.update({
          where: { id: cardId },
          data: { position: newPosition },
          include: { client: true },
        });
      }

      // Moving across stages
      // Close gap in source stage
      await tx.pipelineCard.updateMany({
        where: {
          stageId: current.stageId,
          position: { gt: current.position },
        },
        data: { position: { decrement: 1 } },
      });

      // Make room in destination stage
      await tx.pipelineCard.updateMany({
        where: {
          stageId: newStageId,
          position: { gte: newPosition },
        },
        data: { position: { increment: 1 } },
      });

      // Move the card
      return tx.pipelineCard.update({
        where: { id: cardId },
        data: { stageId: newStageId, position: newPosition },
        include: { client: true },
      });
    });

    emitPipelineEvent({ type: 'card:move', organizationId: current.organizationId, payload: { cardId, newStageId, newPosition } });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Error moving card:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
