import type { PipelineCard as PrismaPipelineCard, PipelineStageModel as PrismaPipelineStageModel, Client as PrismaClient } from '@prisma/client';

// Use Prisma types with some modifications for the UI
export type Client = PrismaClient;

export type Card = Omit<PrismaPipelineCard, 'priority'> & {
  priority: string; // Keep as string to match database type
  client?: Client;
  // stageId is already included from PrismaPipelineCard, but making it explicit for clarity
  stageId: string;
};

export type Stage = PrismaPipelineStageModel & {
  cards: Card[];
};
