import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { jsonError, jsonOk, requireAuthWithOrg, requireRole } from "@/lib/api-helpers";
import { OrgRole } from "@prisma/client";
import { emitPipelineEvent } from "@/lib/realtime";

export async function POST(req: NextRequest, { params }: { params: Promise<{ pipelineId: string }> }) {
  try {
    const { pipelineId } = await params;
    
    // Validate pipelineId parameter
    if (!pipelineId || typeof pipelineId !== 'string') {
      console.error('POST /api/pipeline/[pipelineId]/stages - Invalid pipelineId:', { pipelineId });
      return jsonError("Pipeline ID is required and must be a valid string", 400);
    }

    const auth = await requireAuthWithOrg(req);
    if ("error" in auth) {
      console.error('POST /api/pipeline/[pipelineId]/stages - Authentication failed:', { pipelineId });
      return auth.error;
    }
    
    const { session, organizationId } = auth;
    if (!requireRole(session, { orgRoles: [OrgRole.Owner, OrgRole.Admin, OrgRole.Pipeline] })) {
      console.error('POST /api/pipeline/[pipelineId]/stages - Insufficient permissions:', { 
        pipelineId, 
        userId: session?.user?.id,
        organizationId 
      });
      return jsonError("Forbidden", 403);
    }

    // Parse and validate request body
    let body: any;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('POST /api/pipeline/[pipelineId]/stages - Invalid JSON body:', { 
        pipelineId, 
        error: parseError 
      });
      return jsonError("Invalid JSON in request body", 400);
    }

    const name = String(body?.name ?? "New Stage");
    const position = Number(body?.position ?? 0);
    
    // Validate name is not empty
    if (!name.trim()) {
      console.error('POST /api/pipeline/[pipelineId]/stages - Empty stage name:', { pipelineId });
      return jsonError("Stage name cannot be empty", 400);
    }

    // Validate position is a valid number
    if (isNaN(position) || position < 0) {
      console.error('POST /api/pipeline/[pipelineId]/stages - Invalid position:', { pipelineId, position });
      return jsonError("Position must be a non-negative number", 400);
    }

    // Check if pipeline exists
    const existingPipeline = await prisma.pipeline.findUnique({
      where: { id: pipelineId },
      select: { id: true, name: true, organizationId: true }
    });

    if (!existingPipeline) {
      console.error('POST /api/pipeline/[pipelineId]/stages - Pipeline not found:', { pipelineId });
      return jsonError("Pipeline not found", 404);
    }

    // Verify user has access to this pipeline's organization
    if (existingPipeline.organizationId !== organizationId) {
      console.error('POST /api/pipeline/[pipelineId]/stages - Organization mismatch:', { 
        pipelineId, 
        pipelineOrgId: existingPipeline.organizationId,
        userOrgId: organizationId 
      });
      return jsonError("Access denied to this pipeline", 403);
    }

    // Create the stage
    const created = await prisma.pipelineStageModel.create({
      data: { pipelineId, name: name.trim(), position },
    });

    // Emit realtime event
    try {
      emitPipelineEvent({ type: "stage:create", organizationId, payload: { stage: created } });
    } catch (eventError) {
      // Log the event error but don't fail the request
      console.error('POST /api/pipeline/[pipelineId]/stages - Failed to emit pipeline event:', {
        error: eventError,
        pipelineId,
        stageId: created.id,
        organizationId
      });
    }

    console.log('POST /api/pipeline/[pipelineId]/stages - Stage created successfully:', { 
      pipelineId, 
      stageId: created.id,
      stageName: created.name,
      organizationId 
    });
    
    return jsonOk({ stage: created }, 201);
  } catch (error: any) {
    console.error('POST /api/pipeline/[pipelineId]/stages - Unexpected error:', {
      error: {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack
      },
      pipelineId: (await params)?.pipelineId,
      url: req.url
    });

    // Handle specific Prisma errors
    if (error?.code === 'P2002') {
      return jsonError("A stage with this name already exists in the pipeline", 409);
    }

    if (error?.code === 'P2003') {
      return jsonError("Referenced pipeline does not exist", 404);
    }

    // Handle database connection errors
    if (error?.code === 'P1001' || error?.code === 'P1002') {
      return jsonError("Database connection error. Please try again later.", 503);
    }

    // Generic error response
    return jsonError(error.message, 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ pipelineId: string }> }) {
  try {
    const { pipelineId } = await params;
    
    // Validate pipelineId parameter
    if (!pipelineId || typeof pipelineId !== 'string') {
      console.error('PATCH /api/pipeline/[pipelineId]/stages - Invalid pipelineId:', { pipelineId });
      return jsonError("Pipeline ID is required and must be a valid string", 400);
    }

    const auth = await requireAuthWithOrg(req);
    if ("error" in auth) {
      console.error('PATCH /api/pipeline/[pipelineId]/stages - Authentication failed:', { pipelineId });
      return auth.error;
    }
    
    const { session, organizationId } = auth;
    if (!requireRole(session, { orgRoles: [OrgRole.Owner, OrgRole.Admin, OrgRole.Pipeline] })) {
      console.error('PATCH /api/pipeline/[pipelineId]/stages - Insufficient permissions:', { 
        pipelineId, 
        userId: session?.user?.id,
        organizationId 
      });
      return jsonError("Forbidden", 403);
    }

    // Parse and validate request body
    let body: any;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('PATCH /api/pipeline/[pipelineId]/stages - Invalid JSON body:', { 
        pipelineId, 
        error: parseError 
      });
      return jsonError("Invalid JSON in request body", 400);
    }

    const stages = body?.stages as { id: string; name?: string; position: number }[];
    
    if (!Array.isArray(stages)) {
      console.error('PATCH /api/pipeline/[pipelineId]/stages - Invalid payload structure:', { 
        pipelineId, 
        receivedType: typeof stages 
      });
      return jsonError("Invalid payload: stages must be an array", 400);
    }

    if (stages.length === 0) {
      console.error('PATCH /api/pipeline/[pipelineId]/stages - Empty stages array:', { pipelineId });
      return jsonError("At least one stage must be provided", 400);
    }

    // Validate each stage in the array
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      if (!stage.id || typeof stage.id !== 'string') {
        console.error('PATCH /api/pipeline/[pipelineId]/stages - Invalid stage ID:', { 
          pipelineId, 
          stageIndex: i, 
          stageId: stage.id 
        });
        return jsonError(`Stage at index ${i} must have a valid ID`, 400);
      }
      if (typeof stage.position !== 'number' || stage.position < 0) {
        console.error('PATCH /api/pipeline/[pipelineId]/stages - Invalid stage position:', { 
          pipelineId, 
          stageIndex: i, 
          stageId: stage.id,
          position: stage.position 
        });
        return jsonError(`Stage at index ${i} must have a valid non-negative position`, 400);
      }
      if (stage.name !== undefined && (!stage.name || typeof stage.name !== 'string' || !stage.name.trim())) {
        console.error('PATCH /api/pipeline/[pipelineId]/stages - Invalid stage name:', { 
          pipelineId, 
          stageIndex: i, 
          stageId: stage.id,
          name: stage.name 
        });
        return jsonError(`Stage at index ${i} must have a non-empty name if provided`, 400);
      }
    }

    // Check if pipeline exists and user has access
    const existingPipeline = await prisma.pipeline.findUnique({
      where: { id: pipelineId },
      select: { id: true, name: true, organizationId: true }
    });

    if (!existingPipeline) {
      console.error('PATCH /api/pipeline/[pipelineId]/stages - Pipeline not found:', { pipelineId });
      return jsonError("Pipeline not found", 404);
    }

    if (existingPipeline.organizationId !== organizationId) {
      console.error('PATCH /api/pipeline/[pipelineId]/stages - Organization mismatch:', { 
        pipelineId, 
        pipelineOrgId: existingPipeline.organizationId,
        userOrgId: organizationId 
      });
      return jsonError("Access denied to this pipeline", 403);
    }

    // Verify all stages belong to this pipeline
    const stageIds = stages.map(s => s.id);
    const existingStages = await prisma.pipelineStageModel.findMany({
      where: { id: { in: stageIds }, pipelineId },
      select: { id: true }
    });

    if (existingStages.length !== stages.length) {
      const foundIds = existingStages.map(s => s.id);
      const missingIds = stageIds.filter(id => !foundIds.includes(id));
      console.error('PATCH /api/pipeline/[pipelineId]/stages - Some stages not found or not in pipeline:', { 
        pipelineId, 
        missingIds 
      });
      return jsonError("Some stages do not exist or do not belong to this pipeline", 404);
    }

    // Update stages in transaction
    const tx = stages.map((s) => {
      const updateData: any = { position: s.position };
      if (s.name !== undefined) {
        updateData.name = s.name.trim();
      }
      return prisma.pipelineStageModel.update({ 
        where: { id: s.id }, 
        data: updateData 
      });
    });
    
    await prisma.$transaction(tx);

    // Emit realtime event
    try {
      emitPipelineEvent({ type: "stage:update", organizationId, payload: { stages } });
    } catch (eventError) {
      // Log the event error but don't fail the request
      console.error('PATCH /api/pipeline/[pipelineId]/stages - Failed to emit pipeline event:', {
        error: eventError,
        pipelineId,
        stageIds,
        organizationId
      });
    }

    console.log('PATCH /api/pipeline/[pipelineId]/stages - Stages updated successfully:', { 
      pipelineId, 
      stageIds,
      organizationId 
    });
    
    return jsonOk({ ok: true });
  } catch (error: any) {
    console.error('PATCH /api/pipeline/[pipelineId]/stages - Unexpected error:', {
      error: {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack
      },
      pipelineId: (await params)?.pipelineId,
      url: req.url
    });

    // Handle specific Prisma errors
    if (error?.code === 'P2025') {
      return jsonError("One or more stages not found", 404);
    }

    if (error?.code === 'P2002') {
      return jsonError("Duplicate stage names or positions detected", 409);
    }

    // Handle database connection errors
    if (error?.code === 'P1001' || error?.code === 'P1002') {
      return jsonError("Database connection error. Please try again later.", 503);
    }

    // Generic error response
    return jsonError("An unexpected error occurred while updating stages", 500);
  }
}


