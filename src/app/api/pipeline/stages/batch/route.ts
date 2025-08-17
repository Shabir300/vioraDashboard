import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { emitPipelineEvent } from '@/lib/realtime';
import { requireAuthWithOrg, requireRole } from '@/lib/api-helpers';
import { OrgRole } from '@prisma/client';

const batchCreateStageSchema = z.object({
  pipelineId: z.string().min(1, 'Pipeline ID is required'),
  stages: z.array(z.object({
    name: z.string().min(1, 'Stage name is required'),
    description: z.string().optional(),
    color: z.string().optional(),
  })).min(1, 'At least one stage is required').max(20, 'Maximum 20 stages allowed per batch')
});

// POST /api/pipeline/stages/batch - Create multiple stages atomically
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('POST /api/pipeline/stages/batch - Invalid JSON body:', { 
        error: parseError,
        url: request.url
      });
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate input data
    let validatedData: any;
    try {
      validatedData = batchCreateStageSchema.parse(body);
    } catch (validationError) {
      console.error('POST /api/pipeline/stages/batch - Validation failed:', { 
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

    // Check authentication and authorization
    const auth = await requireAuthWithOrg(request);
    if ("error" in auth) {
      console.error('POST /api/pipeline/stages/batch - Authentication failed:', { 
        pipelineId: validatedData.pipelineId 
      });
      return auth.error;
    }
    
    const { session, organizationId } = auth;
    if (!requireRole(session, { orgRoles: [OrgRole.Owner, OrgRole.Admin, OrgRole.Pipeline] })) {
      console.error('POST /api/pipeline/stages/batch - Insufficient permissions:', { 
        pipelineId: validatedData.pipelineId, 
        userId: session?.user?.id,
        organizationId 
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if pipeline exists and user has access
    const pipeline = await prisma.pipeline.findUnique({
      where: { id: validatedData.pipelineId },
      select: { id: true, organizationId: true, name: true }
    });

    if (!pipeline) {
      console.error('POST /api/pipeline/stages/batch - Pipeline not found:', { 
        pipelineId: validatedData.pipelineId 
      });
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    if (pipeline.organizationId !== organizationId) {
      console.error('POST /api/pipeline/stages/batch - Organization mismatch:', { 
        pipelineId: validatedData.pipelineId, 
        pipelineOrgId: pipeline.organizationId,
        userOrgId: organizationId 
      });
      return NextResponse.json(
        { error: 'Access denied to this pipeline' },
        { status: 403 }
      );
    }

    // Create all stages with unique timestamp-based positions
    const baseTimestamp = Date.now();
    const stagesToCreate = validatedData.stages.map((stage: any, index: number) => {
      const uniquePosition = (baseTimestamp + index) * 10000 + Math.floor(Math.random() * 10000);
      return {
        name: stage.name,
        description: stage.description || null,
        color: stage.color || '#6B7280',
        pipelineId: validatedData.pipelineId,
        position: uniquePosition,
      };
    });

    // Create all stages
    await prisma.pipelineStageModel.createMany({
      data: stagesToCreate
    });

    // Get the created stages with their IDs
    const createdStages = await prisma.pipelineStageModel.findMany({
      where: { 
        pipelineId: validatedData.pipelineId,
        name: { in: validatedData.stages.map((s: any) => s.name) }
      },
      orderBy: { position: 'asc' },
      include: { cards: true }
    });

    // Emit realtime events for all created stages
    try {
      emitPipelineEvent({ 
        type: 'stages:batchCreate', 
        organizationId: pipeline.organizationId, 
        payload: { 
          pipelineId: validatedData.pipelineId,
          stages: createdStages 
        } 
      });
    } catch (eventError) {
      // Log the event error but don't fail the request
      console.error('POST /api/pipeline/stages/batch - Failed to emit pipeline event:', {
        error: eventError,
        pipelineId: validatedData.pipelineId,
        stageCount: createdStages.length,
        organizationId: pipeline.organizationId
      });
    }

    console.log('POST /api/pipeline/stages/batch - Stages created successfully:', { 
      pipelineId: validatedData.pipelineId,
      stageCount: createdStages.length,
      stageIds: createdStages.map(s => s.id),
      organizationId: pipeline.organizationId
    });

    return NextResponse.json({ 
      stages: createdStages,
      count: createdStages.length,
      message: `${createdStages.length} stages created successfully`
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/pipeline/stages/batch - Unexpected error:', {
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
      const constraintTarget = error?.meta?.target;
      if (Array.isArray(constraintTarget)) {
        if (constraintTarget.includes('name')) {
          return NextResponse.json(
            { error: 'One or more stage names already exist in this pipeline' },
            { status: 409 }
          );
        }
        if (constraintTarget.includes('position')) {
          return NextResponse.json(
            { error: 'Position conflict occurred during batch creation' },
            { status: 409 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Some stages already exist with the provided configuration' },
        { status: 409 }
      );
    }

    // Handle transaction timeout
    if (error?.code === 'P2034') {
      console.error('POST /api/pipeline/stages/batch - Transaction timeout:', {
        error: error?.message
      });
      return NextResponse.json(
        { error: 'Batch creation timeout. Please try with fewer stages or try again later.' },
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
      { error: 'An unexpected error occurred during batch stage creation' },
      { status: 500 }
    );
  }
}
