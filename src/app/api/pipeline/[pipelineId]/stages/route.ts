import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { jsonError, jsonOk, requireAuthWithOrg, requireRole } from "@/lib/api-helpers";
import { OrgRole } from "@prisma/client";
import { emitPipelineEvent } from "@/lib/realtime";

export async function POST(req: NextRequest, { params }: { params: { pipelineId: string } }) {
  const { pipelineId } = params;
  const auth = await requireAuthWithOrg(req);
  if ("error" in auth) return auth.error;
  const { session, organizationId } = auth;
  if (!requireRole(session, { orgRoles: [OrgRole.Owner, OrgRole.Admin, OrgRole.Pipeline] })) {
    return jsonError("Forbidden", 403);
  }
  const body = await req.json();
  const name = String(body?.name ?? "New Stage");
  const position = Number(body?.position ?? 0);

  const created = await prisma.pipelineStageModel.create({
    data: { pipelineId, name, position },
  });
  emitPipelineEvent({ type: "stage:create", organizationId, payload: { stage: created } });
  return jsonOk({ stage: created }, 201);
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
  const stages = body?.stages as { id: string; name?: string; position: number }[];
  if (!Array.isArray(stages)) return jsonError("Invalid payload", 400);
  const tx = stages.map((s) =>
    prisma.pipelineStageModel.update({ where: { id: s.id }, data: { name: s.name, position: s.position } })
  );
  await prisma.$transaction(tx);
  emitPipelineEvent({ type: "stage:update", organizationId, payload: { stages } });
  return jsonOk({ ok: true });
}


