import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { jsonError, jsonOk, requireAuthWithOrg, requireRole } from "@/lib/api-helpers";
import { OrgRole } from "@prisma/client";
import { emitPipelineEvent } from "@/lib/realtime";

export async function DELETE(req: NextRequest, { params }: { params: { pipelineId: string; stageId: string } }) {
  const { stageId } = params;
  const auth = await requireAuthWithOrg(req);
  if ("error" in auth) return auth.error;
  const { session, organizationId } = auth;
  if (!requireRole(session, { orgRoles: [OrgRole.Owner, OrgRole.Admin, OrgRole.Pipeline] })) {
    return jsonError("Forbidden", 403);
  }
  await prisma.pipelineStageModel.delete({ where: { id: stageId } });
  emitPipelineEvent({ type: "stage:delete", organizationId, payload: { id: stageId } });
  return jsonOk({ ok: true });
}


