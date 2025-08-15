import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { jsonError, jsonOk, requireAuthWithOrg } from "@/lib/api-helpers";
import { emitPipelineEvent } from "@/lib/realtime";

export async function POST(req: NextRequest, { params }: { params: { pipelineId: string } }) {
  const { pipelineId } = params;
  const auth = await requireAuthWithOrg(req);
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const body = await req.json();
  const { stageId, clientId, title, value, metadata, client } = body ?? {};
  if (!stageId || !title) return jsonError("Missing fields", 400);
  let usedClientId: string = clientId;
  if (!usedClientId) {
    const createdClient = await prisma.client.create({
      data: {
        organizationId,
        name: client?.name || title,
        email: client?.email || `${crypto.randomUUID()}@placeholder.invalid`,
      },
    });
    usedClientId = createdClient.id;
  }
  const card = await prisma.pipelineCard.create({
    data: { organizationId, pipelineId, stageId, clientId: usedClientId, title, value, metadata },
  });
  emitPipelineEvent({ type: "card:update", organizationId, payload: { card } });
  return jsonOk({ card }, 201);
}

export async function PATCH(req: NextRequest, { params }: { params: { pipelineId: string } }) {
  const { pipelineId } = params;
  const auth = await requireAuthWithOrg(req);
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const body = await req.json();
  const { id, title, value, metadata } = body ?? {};
  if (!id) return jsonError("Missing id", 400);
  const card = await prisma.pipelineCard.update({
    where: { id },
    data: { title, value, metadata },
  });
  emitPipelineEvent({ type: "card:update", organizationId, payload: { card } });
  return jsonOk({ card });
}


