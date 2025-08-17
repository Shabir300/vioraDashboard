-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('TEXT', 'RECTANGLE', 'ELLIPSE', 'DIAMOND', 'STICKY_NOTE');

-- CreateTable
CREATE TABLE "MindMapBoard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MindMapBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MindMapNode" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "NodeType" NOT NULL DEFAULT 'TEXT',
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "parentId" TEXT,
    "style" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MindMapNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MindMapEdge" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "label" TEXT,
    "style" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MindMapEdge_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MindMapBoard" ADD CONSTRAINT "MindMapBoard_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindMapBoard" ADD CONSTRAINT "MindMapBoard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindMapNode" ADD CONSTRAINT "MindMapNode_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "MindMapBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindMapNode" ADD CONSTRAINT "MindMapNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MindMapNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindMapEdge" ADD CONSTRAINT "MindMapEdge_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "MindMapBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindMapEdge" ADD CONSTRAINT "MindMapEdge_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "MindMapNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindMapEdge" ADD CONSTRAINT "MindMapEdge_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "MindMapNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
