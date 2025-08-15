/*
  Warnings:

  - A unique constraint covering the columns `[stageId,position]` on the table `PipelineCard` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pipelineId,position]` on the table `PipelineStageModel` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Pipeline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `PipelineCard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PipelineStageModel` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."PipelineCard" DROP CONSTRAINT "PipelineCard_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PipelineCard" DROP CONSTRAINT "PipelineCard_pipelineId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PipelineCard" DROP CONSTRAINT "PipelineCard_stageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PipelineStageModel" DROP CONSTRAINT "PipelineStageModel_pipelineId_fkey";

-- AlterTable
ALTER TABLE "public"."Pipeline" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."PipelineCard" ADD COLUMN     "description" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "position" INTEGER NOT NULL,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium';

-- AlterTable
ALTER TABLE "public"."PipelineStageModel" ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#6B7280',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PipelineCard_stageId_position_key" ON "public"."PipelineCard"("stageId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStageModel_pipelineId_position_key" ON "public"."PipelineStageModel"("pipelineId", "position");

-- AddForeignKey
ALTER TABLE "public"."PipelineStageModel" ADD CONSTRAINT "PipelineStageModel_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "public"."Pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PipelineCard" ADD CONSTRAINT "PipelineCard_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "public"."Pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PipelineCard" ADD CONSTRAINT "PipelineCard_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "public"."PipelineStageModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PipelineCard" ADD CONSTRAINT "PipelineCard_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
