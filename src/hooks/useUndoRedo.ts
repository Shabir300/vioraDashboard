'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

export function useUndoRedo(nodes: Node[], edges: Edge[], setNodes: (nodes: Node[]) => void, setEdges: (edges: Edge[]) => void) {
  const historyRef = useRef<HistoryState[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const isInitialRender = useRef(true);

  // Save current state to history
  const saveToHistory = useCallback((nodes: Node[], edges: Edge[]) => {
    const nextIndex = currentIndexRef.current + 1;
    historyRef.current = historyRef.current.slice(0, nextIndex);
    historyRef.current.push({ nodes: [...nodes], edges: [...edges] });
    currentIndexRef.current = nextIndex;
  }, []);

  // Initialize history with current state
  useEffect(() => {
    if (isInitialRender.current) {
      saveToHistory(nodes, edges);
      isInitialRender.current = false;
    }
  }, [nodes, edges, saveToHistory]);

  // Handle undo operation
  const undo = useCallback(() => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--;
      const { nodes, edges } = historyRef.current[currentIndexRef.current];
      setNodes([...nodes]);
      setEdges([...edges]);
    }
  }, [setNodes, setEdges]);

  // Handle redo operation
  const redo = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      currentIndexRef.current++;
      const { nodes, edges } = historyRef.current[currentIndexRef.current];
      setNodes([...nodes]);
      setEdges([...edges]);
    }
  }, [setNodes, setEdges]);

  // Add changes to history
  const addToHistory = useCallback((nodes: Node[], edges: Edge[]) => {
    if (!isInitialRender.current) {
      saveToHistory(nodes, edges);
    }
  }, [saveToHistory]);

  // Listen for keyboard shortcuts
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
    addToHistory,
    canUndo: currentIndexRef.current > 0,
    canRedo: currentIndexRef.current < historyRef.current.length - 1,
  };
}
