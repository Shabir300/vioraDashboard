import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { jsonError, jsonOk, requireAuthWithOrg } from "@/lib/api-helpers";
import { emitPipelineEvent } from "@/lib/realtime";

// Move a card to another stage (and optionally reorder)
export async function POST(req: NextRequest, { params }: { params: Promise<{ pipelineId: string }> }) {
  const { pipelineId } = await params;
  const auth = await requireAuthWithOrg(req);
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const body = await req.json();
  const { cardId, toStageId } = body ?? {};
  if (!cardId || !toStageId) return jsonError("Missing fields", 400);

  try {
    // Get the current card and the target stage
    const [card, targetStage] = await Promise.all([
      prisma.pipelineCard.findUnique({
        where: { id: cardId },
        include: { stage: true }
      }),
      prisma.pipelineStageModel.findUnique({
        where: { id: toStageId }
      })
    ]);

    if (!card) return jsonError("Card not found", 404);
    if (!targetStage) return jsonError("Target stage not found", 404);

    // Check if moving to "Closed" stage
    const isMovingToClosed = targetStage.name === "Closed";
    
    let clientId = card.clientId;
    let newClient = null;

    // If moving to "Closed" stage and no client exists, create one from card details
    if (isMovingToClosed && !clientId && card.clientEmail && card.clientName) {
      // Check if client with same email already exists
      const existingClient = await prisma.client.findFirst({
        where: {
          email: card.clientEmail,
          organizationId: organizationId,
        },
      });

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        // Create new client from card details
        newClient = await prisma.client.create({
          data: {
            organizationId: organizationId,
            name: card.clientName,
            email: card.clientEmail,
            company: card.clientCompany,
            phone: card.clientPhone,
            valueUsd: card.value ? Math.round(card.value) : 0,
            stage: "Closed", // Set stage to Closed since deal is closed
          },
        });
        clientId = newClient.id;
      }
    }

    // Update the card
    const updatedCard = await prisma.pipelineCard.update({
      where: { id: cardId },
      data: { 
        stageId: toStageId,
        clientId: clientId, // Link to existing or newly created client
      },
      include: {
        client: true,
        stage: true,
      }
    });

    emitPipelineEvent({ type: "card:move", organizationId, payload: { cardId, toStageId, pipelineId } });

    // If we created a new client, emit an event for that too
    if (newClient) {
      emitPipelineEvent({ 
        type: "card:update", 
        organizationId, 
        payload: { action: 'update', card: updatedCard, clientCreated: newClient } 
      });
    }

    return jsonOk({ card: updatedCard, clientCreated: !!newClient });
  } catch (error) {
    console.error('Error moving card:', error);
    return jsonError("Failed to move card", 500);
  }
}


