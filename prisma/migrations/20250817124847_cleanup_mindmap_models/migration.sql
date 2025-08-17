/*
  Warnings:

  - You are about to drop the column `userId` on the `MindMapBoard` table. All the data in the column will be lost.
  - You are about to drop the `MindMap` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `createdById` to the `MindMapBoard` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."MindMap" DROP CONSTRAINT "MindMap_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MindMap" DROP CONSTRAINT "MindMap_ownerUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MindMapBoard" DROP CONSTRAINT "MindMapBoard_userId_fkey";

-- AlterTable
ALTER TABLE "public"."MindMapBoard" DROP COLUMN "userId",
ADD COLUMN     "createdById" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."MindMap";

-- AddForeignKey
ALTER TABLE "public"."MindMapBoard" ADD CONSTRAINT "MindMapBoard_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
