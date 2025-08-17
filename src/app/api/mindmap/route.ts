import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
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

    const boards = await prisma.mindMapBoard.findMany({
      where: {
        createdById: user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(boards);
  } catch (error) {
    console.error('Error fetching mind map boards:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!user || user.memberships.length === 0) {
      return new NextResponse('Unauthorized - No organization found', { status: 401 });
    }

    // Get the first organization the user is a member of
    // In the future, you might want to allow selecting which organization to create in
    const organization = user.memberships[0].organization;

    const json = await request.json();
    const { name } = json;

    const board = await prisma.mindMapBoard.create({
      data: {
        name,
        organizationId: organization.id,
        createdById: user.id,
      },
    });

    return NextResponse.json(board);
  } catch (error) {
    console.error('Error creating mind map board:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
