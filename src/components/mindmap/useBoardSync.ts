'use client';

import { useCallback, useEffect, useState } from 'react';
import { Edge, Node, useReactFlow } from 'reactflow';
import { useBoardStore } from './store';

const AUTO_SAVE_DELAY = 2000; // 2 seconds

interface UseBoardSyncProps {
  boardId?: string;
  nodes: Node[];
  edges: Edge[];
}

export function useBoardSync({ boardId, nodes, edges }: UseBoardSyncProps) {
  const { isDirty, setDirty, setLoading, setError } = useBoardStore();
  const { fitView } = useReactFlow();

  const [isSaving, setIsSaving] = useState(false);

  // Save board data
  const saveBoard = useCallback(async () => {
    if (!boardId || !isDirty) return;

    try {
      setIsSaving(true);
      setLoading(true);
      const response = await fetch(`/api/mindmap/${boardId}/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes: nodes.map(node => ({
            ...node,
            position: { x: node.position.x, y: node.position.y }
          })),
          edges: edges
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save board');
      }

      setDirty(false);
    } catch (error) {
      console.error('Error saving board:', error);
      setError(error instanceof Error ? error.message : 'Failed to save board');
    } finally {
      setLoading(false);
      setIsSaving(false);
    }
  }, [boardId, nodes, edges, isDirty, setDirty, setLoading, setError]);

  // Auto-save when changes are made
  useEffect(() => {
    if (!isDirty || !boardId) return;

    const timeoutId = setTimeout(saveBoard, AUTO_SAVE_DELAY);
    return () => clearTimeout(timeoutId);
  }, [isDirty, boardId, saveBoard]);

  // Keyboard shortcuts for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveBoard();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saveBoard]);

  // Fit view when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      fitView({ duration: 200 });
    }
  }, [nodes.length, fitView]);

  return { saveBoard, isSaving };
}
