'use client';

import React from 'react';
import { MindMapBoard } from '@prisma/client';
import { createContext, useContext, useEffect } from 'react';
import { useBoardStore } from './store';

const BoardContext = createContext<{ board: MindMapBoard | null }>({ board: null });

export function BoardProvider({
  children,
  initialBoard,
}: {
  children: React.ReactNode;
  initialBoard: MindMapBoard;
}) {
  const setBoard = useBoardStore((state) => state.setBoard);

  useEffect(() => {
    setBoard(initialBoard);
  }, [initialBoard, setBoard]);

  return (
    <BoardContext.Provider value={{ board: initialBoard }}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
}
