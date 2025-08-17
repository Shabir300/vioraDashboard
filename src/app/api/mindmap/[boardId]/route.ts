import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
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

    const board = await prisma.mindMapBoard.findFirst({
      where: {
        id: params.boardId,
        createdById: user.id,
      },
      include: {
        nodes: true,
        edges: true,
      },
    });

    if (!board) {
      return new NextResponse('Not found', { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error('Error fetching mind map board:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PUT(
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
    const { name } = json;

    const board = await prisma.mindMapBoard.update({
      where: {
        id: params.boardId,
        userId: user.id,
      },
      data: {
        name,
      },
    });

    return NextResponse.json(board);
  } catch (error) {
    console.error('Error updating mind map board:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.mindMapBoard.delete({
      where: {
        id: params.boardId,
        createdById: user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting mind map board:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
