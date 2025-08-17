import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getMindMapBoard(boardId: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const board = await prisma.mindMapBoard.findFirst({
    where: {
      id: boardId,
      createdById: user.id,
    },
    include: {
      nodes: true,
      edges: true,
    },
  });

  return board;
}
