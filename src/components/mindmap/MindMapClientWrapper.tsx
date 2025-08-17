'use client';

import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { BoardProvider } from './BoardProvider';
import MindMapEditor from './MindMapEditor';
import type { MindMapBoard } from '@prisma/client';

export default function MindMapClientWrapper({
  board,
}: {
  board: MindMapBoard;
}) {
  return (
    <div className="mx-auto h-[calc(100vh-120px)] w-full">
      <BoardProvider initialBoard={board}>
        <ReactFlowProvider>
          <MindMapEditor />
        </ReactFlowProvider>
      </BoardProvider>
    </div>
  );
}
