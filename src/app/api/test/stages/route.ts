import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Simple test endpoint to create stages without auth for testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pipelineId, stageName } = body;

    if (!pipelineId || !stageName) {
      return NextResponse.json(
        { error: 'pipelineId and stageName are required' },
        { status: 400 }
      );
    }

    // Create stage with simple incremental position
    const maxPositionRecord = await prisma.pipelineStageModel.findFirst({
      where: { pipelineId },
      orderBy: { position: 'desc' },
      select: { position: true }
    });
    
    const maxPosition = maxPositionRecord?.position ? Number(maxPositionRecord.position) : 0;
    const newPosition = maxPosition + 1000;

    console.log('Creating test stage:', { pipelineId, stageName, position: newPosition });

    const created = await prisma.pipelineStageModel.create({
      data: {
        name: stageName,
        pipelineId: pipelineId,
        position: newPosition,
        color: '#6B7280',
      },
    });

    console.log('Test stage created successfully:', created);

    return NextResponse.json({ 
      success: true, 
      stage: created,
      message: 'Test stage created successfully'
    });

  } catch (error: any) {
    console.error('Test stage creation error:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });

    return NextResponse.json(
      { 
        error: 'Failed to create test stage',
        details: error?.message,
        code: error?.code
      },
      { status: 500 }
    );
  }
}

// Get all stages for a pipeline (for testing)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');

    if (!pipelineId) {
      return NextResponse.json(
        { error: 'pipelineId is required' },
        { status: 400 }
      );
    }

    const stages = await prisma.pipelineStageModel.findMany({
      where: { pipelineId },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({ stages });

  } catch (error: any) {
    console.error('Test get stages error:', error);
    return NextResponse.json(
      { error: 'Failed to get stages' },
      { status: 500 }
    );
  }
}
