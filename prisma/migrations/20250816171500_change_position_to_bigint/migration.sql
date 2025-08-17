-- Change position fields from INT4 to BIGINT
-- This resolves the integer overflow issue when creating stages

-- Update PipelineStageModel position field
ALTER TABLE "PipelineStageModel" ALTER COLUMN "position" TYPE BIGINT;

-- Update PipelineCard position field  
ALTER TABLE "PipelineCard" ALTER COLUMN "position" TYPE BIGINT;
