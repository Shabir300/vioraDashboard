import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { jsonError, jsonOk, requireAuthWithOrg, requireRole } from "@/lib/api-helpers";
import { OrgRole } from "@prisma/client";
import { emitPipelineEvent } from "@/lib/realtime";

export async function GET(_req: NextRequest, { params }: { params: { pipelineId: string } }) {
  const { pipelineId } = params;
  const auth = await requireAuthWithOrg(_req);
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const pipeline = await prisma.pipeline.findFirst({
    where: { id: pipelineId, organizationId },
    include: {
      stages: { orderBy: { position: "asc" } },
      pipelineCards: true,
    },
  });
  if (!pipeline) return jsonError("Not found", 404);
  return jsonOk({ pipeline });
}

export async function PATCH(req: NextRequest, { params }: { params: { pipelineId: string } }) {
  const { pipelineId } = params;
  const auth = await requireAuthWithOrg(req);
  if ("error" in auth) return auth.error;
  const { session, organizationId } = auth;
  if (!requireRole(session, { orgRoles: [OrgRole.Owner, OrgRole.Admin, OrgRole.Pipeline] })) {
    return jsonError("Forbidden", 403);
  }
  const body = await req.json();
  const name = body?.name as string | undefined;
  const pipeline = await prisma.pipeline.update({
    where: { id: pipelineId },
    data: { name },
  });
  emitPipelineEvent({ type: "pipeline:update", organizationId, payload: { pipeline } });
  return jsonOk({ pipeline });
}

export async function DELETE(req: NextRequest, { params }: { params: { pipelineId: string } }) {
  const { pipelineId } = params;
  const auth = await requireAuthWithOrg(req);
  if ("error" in auth) return auth.error;
  const { session, organizationId } = auth;
  if (!requireRole(session, { orgRoles: [OrgRole.Owner, OrgRole.Admin, OrgRole.Pipeline] })) {
    return jsonError("Forbidden", 403);
  }
  await prisma.pipeline.delete({ where: { id: pipelineId } });
  emitPipelineEvent({ type: "pipeline:update", organizationId, payload: { id: pipelineId, deleted: true } });
  return jsonOk({ ok: true });
}


