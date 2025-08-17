import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { jsonError, jsonOk, requireAuthWithOrg, requireRole } from "@/lib/api-helpers";
import { OrgRole } from "@prisma/client";
import { emitPipelineEvent } from "@/lib/realtime";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ pipelineId: string; stageId: string }> }) {
  try {
    const { stageId } = await params;
    
    // Validate stageId parameter
    if (!stageId || typeof stageId !== 'string') {
      console.error('DELETE /api/pipeline/[pipelineId]/stages/[stageId] - Invalid stageId:', { stageId });
      return jsonError("Stage ID is required and must be a valid string", 400);
    }

    const auth = await requireAuthWithOrg(req);
    if ("error" in auth) {
      console.error('DELETE /api/pipeline/[pipelineId]/stages/[stageId] - Authentication failed:', { stageId });
      return auth.error;
    }
    
    const { session, organizationId } = auth;
    if (!requireRole(session, { orgRoles: [OrgRole.Owner, OrgRole.Admin, OrgRole.Pipeline] })) {
      console.error('DELETE /api/pipeline/[pipelineId]/stages/[stageId] - Insufficient permissions:', { 
        stageId, 
        userId: session?.user?.id,
        organizationId 
      });
      return jsonError("Forbidden", 403);
    }

    // Check if stage exists before attempting to delete
    const existingStage = await prisma.pipelineStageModel.findUnique({
      where: { id: stageId },
      select: { id: true, pipelineId: true, name: true }
    });

    if (!existingStage) {
      console.error('DELETE /api/pipeline/[pipelineId]/stages/[stageId] - Stage not found:', { stageId });
      return jsonError("Stage not found", 404);
    }

    // Delete the stage
    await prisma.pipelineStageModel.delete({ where: { id: stageId } });
    
    // Emit realtime event
    try {
      emitPipelineEvent({ type: "stage:delete", organizationId, payload: { id: stageId } });
    } catch (eventError) {
      // Log the event error but don't fail the request
      console.error('DELETE /api/pipeline/[pipelineId]/stages/[stageId] - Failed to emit pipeline event:', {
        error: eventError,
        stageId,
        organizationId
      });
    }

    console.log('DELETE /api/pipeline/[pipelineId]/stages/[stageId] - Stage deleted successfully:', { 
      stageId, 
      stageName: existingStage.name,
      organizationId 
    });
    
    return jsonOk({ ok: true });
  } catch (error: any) {
    console.error('DELETE /api/pipeline/[pipelineId]/stages/[stageId] - Unexpected error:', {
      error: {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack
      },
      stageId: (await params)?.stageId,
      url: req.url
    });

    // Handle specific Prisma errors
    if (error?.code === 'P2025') {
      return jsonError("Stage not found or already deleted", 404);
    }
    
    if (error?.code === 'P2003') {
      return jsonError("Cannot delete stage due to existing dependencies", 409);
    }

    // Handle database connection errors
    if (error?.code === 'P1001' || error?.code === 'P1002') {
      return jsonError("Database connection error. Please try again later.", 503);
    }

    // Generic error response
    return jsonError("An unexpected error occurred while deleting the stage", 500);
  }
}


