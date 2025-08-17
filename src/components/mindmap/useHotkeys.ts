'use client';

import { useCallback } from 'react';
import { useHotkeys as useHotkeysHook } from 'react-hotkeys-hook';

export function useHotkeys({ nodes, edges, setNodes, setEdges }: any) {
  const handleDelete = useCallback(() => {
    const selectedNodes = nodes.filter((n: any) => n.selected);
    const selectedEdges = edges.filter((e: any) => e.selected);

    if (selectedNodes.length > 0) {
      setNodes(nodes.filter((n: any) => !n.selected));
      // Also remove any connected edges
      const nodeIds = selectedNodes.map((n: any) => n.id);
      setEdges(
        edges.filter(
          (e: any) =>
            !nodeIds.includes(e.source) && !nodeIds.includes(e.target)
        )
      );
    }

    if (selectedEdges.length > 0) {
      setEdges(edges.filter((e: any) => !e.selected));
    }
  }, [nodes, edges, setNodes, setEdges]);

  const handleUndo = useCallback(() => {
    // Implement undo logic here
  }, []);

  const handleRedo = useCallback(() => {
    // Implement redo logic here
  }, []);

  useHotkeysHook('delete', handleDelete);
  useHotkeysHook('ctrl+z, cmd+z', handleUndo);
  useHotkeysHook('ctrl+shift+z, cmd+shift+z', handleRedo);
}
