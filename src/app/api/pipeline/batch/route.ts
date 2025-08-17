import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { emitPipelineEvent } from '@/lib/realtime';
import { requireAuthWithOrg } from '@/lib/api-helpers';

const batchDeleteSchema = z.object({
  items: z.array(z.object({
    type: z.enum(['stage', 'card']),
    id: z.string().min(1, 'Item ID is required'),
  })).min(1, 'At least one item is required').max(50, 'Maximum 50 items allowed per batch'),
});

const batchUpdateSchema = z.object({
  items: z.array(z.object({
    type: z.enum(['stage', 'card']),
    id: z.string().min(1, 'Item ID is required'),
  })).min(1, 'At least one item is required').max(50, 'Maximum 50 items allowed per batch'),
  operation: z.string().min(1, 'Operation is required'),
  value: z.any().optional(),
});

// POST /api/pipeline/batch - Batch delete operations
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrg(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { organizationId } = authResult;

    const body = await request.json();
    const { operation } = body;

    if (operation === 'delete') {
      return handleBatchDelete(body, organizationId);
    } else if (operation === 'update') {
      return handleBatchUpdate(body, organizationId);
    } else {
      return NextResponse.json(
        { error: 'Invalid operation. Supported operations: delete, update' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in batch operation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred during batch operation' },
      { status: 500 }
    );
  }
}

async function handleBatchDelete(body: any, organizationId: string) {
  try {
    const validatedData = batchDeleteSchema.parse(body);
    const { items } = validatedData;

    const stageIds = items.filter(item => item.type === 'stage').map(item => item.id);
    const cardIds = items.filter(item => item.type === 'card').map(item => item.id);

    let deletedStages: any[] = [];
    let deletedCards: any[] = [];
    let results = {
      deletedStages: 0,
      deletedCards: 0,
      errors: [] as string[],
    };

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete cards first (to avoid foreign key constraints)
      if (cardIds.length > 0) {
        try {
          // Get card details before deletion for logging
          const cardsToDelete = await tx.pipelineCard.findMany({
            where: { 
              id: { in: cardIds },
              organizationId: organizationId // Ensure user can only delete their own cards
            },
            select: { id: true, title: true, organizationId: true }
          });

          // Delete cards
          const deleteCardResult = await tx.pipelineCard.deleteMany({
            where: { 
              id: { in: cardIds },
              organizationId: organizationId 
            },
          });

          deletedCards = cardsToDelete;
          results.deletedCards = deleteCardResult.count;

          console.log(`Batch deleted ${deleteCardResult.count} cards:`, cardsToDelete.map(c => c.id));
        } catch (error: any) {
          console.error('Error deleting cards in batch:', error);
          results.errors.push(`Failed to delete some cards: ${error.message}`);
        }
      }

      // Delete stages (this will cascade delete any remaining cards in those stages)
      if (stageIds.length > 0) {
        try {
          // Get stage details before deletion for logging
          const stagesToDelete = await tx.pipelineStageModel.findMany({
            where: { 
              id: { in: stageIds },
              pipeline: { organizationId: organizationId } // Ensure user can only delete their own stages
            },
            select: { id: true, name: true, cards: { select: { id: true } } }
          });

          // Delete stages (this will cascade delete cards)
          const deleteStageResult = await tx.pipelineStageModel.deleteMany({
            where: { 
              id: { in: stageIds },
              pipeline: { organizationId: organizationId }
            },
          });

          deletedStages = stagesToDelete;
          results.deletedStages = deleteStageResult.count;

          // Count additional cards that were deleted due to cascade
          const additionalDeletedCards = stagesToDelete.reduce((sum, stage) => sum + stage.cards.length, 0);
          results.deletedCards += additionalDeletedCards;

          console.log(`Batch deleted ${deleteStageResult.count} stages:`, stagesToDelete.map(s => s.id));
        } catch (error: any) {
          console.error('Error deleting stages in batch:', error);
          results.errors.push(`Failed to delete some stages: ${error.message}`);
        }
      }
    });

    // Emit real-time events for deleted items
    try {
      if (deletedCards.length > 0) {
        emitPipelineEvent({ 
          type: 'cards:batchDelete', 
          organizationId, 
          payload: { 
            cardIds: deletedCards.map(c => c.id),
            count: deletedCards.length
          } 
        });
      }

      if (deletedStages.length > 0) {
        emitPipelineEvent({ 
          type: 'stages:batchDelete', 
          organizationId, 
          payload: { 
            stageIds: deletedStages.map(s => s.id),
            count: deletedStages.length
          } 
        });
      }
    } catch (eventError) {
      console.error('Failed to emit batch delete events:', eventError);
    }

    console.log('Batch delete completed:', results);

    return NextResponse.json({
      message: 'Batch delete completed',
      results,
      success: results.errors.length === 0,
    });
  } catch (error: any) {
    console.error('Error in handleBatchDelete:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to complete batch delete operation' },
      { status: 500 }
    );
  }
}

async function handleBatchUpdate(body: any, organizationId: string) {
  try {
    const validatedData = batchUpdateSchema.parse(body);
    const { items, operation, value } = validatedData;

    const stageIds = items.filter(item => item.type === 'stage').map(item => item.id);
    const cardIds = items.filter(item => item.type === 'card').map(item => item.id);

    let results = {
      updatedStages: 0,
      updatedCards: 0,
      errors: [] as string[],
    };

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Update cards
      if (cardIds.length > 0) {
        try {
          let updateData: any = {};

          switch (operation) {
            case 'move':
              if (value) {
                updateData.stageId = value;
              }
              break;
            case 'priority':
              if (value && ['low', 'medium', 'high', 'urgent'].includes(value)) {
                updateData.priority = value;
              }
              break;
            case 'status':
              // Add status update logic if needed
              break;
            default:
              throw new Error(`Unsupported operation: ${operation}`);
          }

          if (Object.keys(updateData).length > 0) {
            const updateResult = await tx.pipelineCard.updateMany({
              where: { 
                id: { in: cardIds },
                organizationId: organizationId 
              },
              data: updateData,
            });

            results.updatedCards = updateResult.count;
            console.log(`Batch updated ${updateResult.count} cards with operation: ${operation}`);
          }
        } catch (error: any) {
          console.error('Error updating cards in batch:', error);
          results.errors.push(`Failed to update some cards: ${error.message}`);
        }
      }

      // Update stages
      if (stageIds.length > 0 && operation !== 'move') { // Stages can't be moved
        try {
          let updateData: any = {};

          switch (operation) {
            case 'color':
              if (value && typeof value === 'string' && value.match(/^#[0-9A-Fa-f]{6}$/)) {
                updateData.color = value;
              }
              break;
            // Add more stage update operations as needed
            default:
              // Skip unsupported operations for stages
              break;
          }

          if (Object.keys(updateData).length > 0) {
            const updateResult = await tx.pipelineStageModel.updateMany({
              where: { 
                id: { in: stageIds },
                pipeline: { organizationId: organizationId }
              },
              data: updateData,
            });

            results.updatedStages = updateResult.count;
            console.log(`Batch updated ${updateResult.count} stages with operation: ${operation}`);
          }
        } catch (error: any) {
          console.error('Error updating stages in batch:', error);
          results.errors.push(`Failed to update some stages: ${error.message}`);
        }
      }
    });

    // Emit real-time events
    try {
      if (results.updatedCards > 0 || results.updatedStages > 0) {
        emitPipelineEvent({ 
          type: 'batch:update', 
          organizationId, 
          payload: { 
            operation,
            value,
            results
          } 
        });
      }
    } catch (eventError) {
      console.error('Failed to emit batch update events:', eventError);
    }

    console.log('Batch update completed:', results);

    return NextResponse.json({
      message: 'Batch update completed',
      results,
      success: results.errors.length === 0,
    });
  } catch (error: any) {
    console.error('Error in handleBatchUpdate:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to complete batch update operation' },
      { status: 500 }
    );
  }
}
