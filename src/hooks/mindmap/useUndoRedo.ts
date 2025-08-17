'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import { MindMapNode, MindMapEdge } from '@/types/mindmap';

interface HistoryState {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export function useUndoRedo(
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  setNodes: (nodes: MindMapNode[]) => void,
  setEdges: (edges: MindMapEdge[]) => void,
) {
  const historyRef = useRef<HistoryState[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const isInitialRender = useRef(true);
  const ignoreNextChange = useRef(false);

  // Save current state to history
  const saveToHistory = useCallback((nodes: MindMapNode[], edges: MindMapEdge[]) => {
    if (ignoreNextChange.current) {
      ignoreNextChange.current = false;
      return;
    }

    const nextIndex = currentIndexRef.current + 1;
    historyRef.current = historyRef.current.slice(0, nextIndex);
    historyRef.current.push({
      nodes: nodes.map(node => ({ ...node })),
      edges: edges.map(edge => ({ ...edge })),
    });
    currentIndexRef.current = nextIndex;
  }, []);

  // Initialize history with current state
  useEffect(() => {
    if (isInitialRender.current) {
      saveToHistory(nodes, edges);
      isInitialRender.current = false;
    }
  }, []); // Empty dependency array to only run once

  // Save changes to history
  useEffect(() => {
    if (!isInitialRender.current) {
      saveToHistory(nodes, edges);
    }
  }, [nodes, edges, saveToHistory]);

  const undo = useCallback(() => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--;
      const { nodes, edges } = historyRef.current[currentIndexRef.current];
      ignoreNextChange.current = true;
      setNodes([...nodes]);
      setEdges([...edges]);
    }
  }, [setNodes, setEdges]);

  const redo = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      currentIndexRef.current++;
      const { nodes, edges } = historyRef.current[currentIndexRef.current];
      ignoreNextChange.current = true;
      setNodes([...nodes]);
      setEdges([...edges]);
    }
  }, [setNodes, setEdges]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    undo,
    redo,
    canUndo: currentIndexRef.current > 0,
    canRedo: currentIndexRef.current < historyRef.current.length - 1,
  };
}
