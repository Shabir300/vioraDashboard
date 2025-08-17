import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await request.json();
    const { nodes, edges } = json;

    // Start a transaction to update both nodes and edges
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing nodes and edges (cascade will handle edges)
      await tx.mindMapNode.deleteMany({
        where: {
          boardId: params.boardId,
        },
      });

      // Create new nodes
      const createdNodes = await Promise.all(
        nodes.map((node: any) =>
          tx.mindMapNode.create({
            data: {
              id: node.id,
              boardId: params.boardId,
              label: node.label,
              type: node.type || 'TEXT',
              positionX: node.position.x,
              positionY: node.position.y,
              width: node.width,
              height: node.height,
              parentId: node.parentId,
              style: node.style,
            },
          })
        )
      );

      // Create new edges
      const createdEdges = await Promise.all(
        edges.map((edge: any) =>
          tx.mindMapEdge.create({
            data: {
              id: edge.id,
              boardId: params.boardId,
              sourceNodeId: edge.source,
              targetNodeId: edge.target,
              label: edge.label,
              style: edge.style,
            },
          })
        )
      );

      return { nodes: createdNodes, edges: createdEdges };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating mind map:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
