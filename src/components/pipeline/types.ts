export type PipelineStageDTO = { id: string; name: string; position: number };
export type PipelineDTO = { id: string; name: string; stages: PipelineStageDTO[] };
export type PipelineCardDTO = { id: string; title: string; clientId: string; stageId: string; value?: number | null };


