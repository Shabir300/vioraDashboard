/*
  Warnings:

  - A unique constraint covering the columns `[id,createdById]` on the table `MindMapBoard` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "MindMapBoard_createdById_idx" ON "public"."MindMapBoard"("createdById");

-- CreateIndex
CREATE INDEX "MindMapBoard_organizationId_idx" ON "public"."MindMapBoard"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "MindMapBoard_id_createdById_key" ON "public"."MindMapBoard"("id", "createdById");
