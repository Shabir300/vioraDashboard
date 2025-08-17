'use client';

import { useCallback } from 'react';
import { Edge, Connection, useReactFlow } from 'reactflow';
import { MindMapEdge } from '@/types/mindmap';

interface UseEdgeActionsProps {
  edges: MindMapEdge[];
  setEdges: (edges: MindMapEdge[]) => void;
}

export function useEdgeActions({ edges, setEdges }: UseEdgeActionsProps) {
  const { project } = useReactFlow();

  const addEdge = useCallback(
    (connection: Connection) => {
      const newEdge: MindMapEdge = {
        id: `edge-${Date.now()}`,
        source: connection.source!,
        target: connection.target!,
        type: 'custom',
        data: {
          label: '',
        },
      };

      setEdges([...edges, newEdge]);
      return newEdge;
    },
    [edges, setEdges]
  );

  const updateEdge = useCallback(
    (edgeId: string, data: Partial<MindMapEdge['data']>) => {
      setEdges(
        edges.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                data: {
                  ...edge.data,
                  ...data,
                },
              }
            : edge
        )
      );
    },
    [edges, setEdges]
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      setEdges(edges.filter((edge) => edge.id !== edgeId));
    },
    [edges, setEdges]
  );

  return {
    addEdge,
    updateEdge,
    deleteEdge,
  };
}
