import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { jsonError, jsonOk, requireAuthWithOrg } from "@/lib/api-helpers";
import { emitPipelineEvent } from "@/lib/realtime";

export async function DELETE(req: NextRequest, { params }: { params: { pipelineId: string; cardId: string } }) {
  const { cardId } = params;
  const auth = await requireAuthWithOrg(req);
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  await prisma.pipelineCard.delete({ where: { id: cardId } });
  emitPipelineEvent({ type: "card:delete", organizationId, payload: { id: cardId } });
  return jsonOk({ ok: true });
}


