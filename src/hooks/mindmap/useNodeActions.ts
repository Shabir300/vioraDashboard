'use client';

import { useCallback, useState } from 'react';
import { Node, Edge, useReactFlow } from 'reactflow';
import { NodeType, MindMapNode, MindMapEdge } from '@/types/mindmap';

interface UseNodeActionsProps {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  setNodes: (nodes: MindMapNode[]) => void;
  setEdges: (edges: MindMapEdge[]) => void;
}

export function useNodeActions({
  nodes,
  edges,
  setNodes,
  setEdges,
}: UseNodeActionsProps) {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const { project } = useReactFlow();

  const addNode = useCallback(
    (type: NodeType, position?: { x: number; y: number }) => {
      const pos = position || project({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const newNode: MindMapNode = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position: pos,
        data: {
          label: 'New Node',
          type,
          width: 150,
          height: 40,
          collapsed: false,
        },
      };

      setNodes([...nodes, newNode]);
      return newNode;
    },
    [nodes, setNodes]
  );

  const updateNode = useCallback(
    (nodeId: string, data: Partial<MindMapNode['data']>) => {
      setNodes(
        nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...data,
                },
              }
            : node
        )
      );
    },
    [nodes, setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      const nodeToDelete = nodes.find((n) => n.id === nodeId);
      if (nodeToDelete?.data?.isRoot) return; // undeletable root
      setNodes(nodes.filter((node) => node.id !== nodeId));
      setEdges(edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    },
    [nodes, edges, setNodes, setEdges]
  );

  const startEditing = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingNodeId(null);
  }, []);

  const updateNodePosition = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      setNodes(
        nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                position,
              }
            : node
        )
      );
    },
    [nodes, setNodes]
  );

  const updateNodeSize = useCallback(
    (nodeId: string, width: number, height: number) => {
      setNodes(
        nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  width,
                  height,
                },
              }
            : node
        )
      );
    },
    [nodes, setNodes]
  );

  return {
    addNode,
    updateNode,
    deleteNode,
    editingNodeId,
    startEditing,
    stopEditing,
    updateNodePosition,
    updateNodeSize,
  };
}
