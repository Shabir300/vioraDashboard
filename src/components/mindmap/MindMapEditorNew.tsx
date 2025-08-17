'use client';

import React, { useEffect, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  Connection,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useBoardStore } from '@/store/mindmapStore';
import { useNodeActions } from '@/hooks/mindmap/useNodeActions';
import { useEdgeActions } from '@/hooks/mindmap/useEdgeActions';
import { useContextMenu } from '@/hooks/mindmap/useContextMenu';
import { useUndoRedo } from '@/hooks/mindmap/useUndoRedo';
import { CustomNode } from './CustomNode';
import { CustomEdge } from './CustomEdge';
import { ContextMenu } from './ContextMenu';
import { Toolbar } from './Toolbar';
import { MindMapNode, MindMapEdge, NodeType } from '@/types/mindmap';

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

export default function MindMapEditorNew() {
  const { snapToGrid, gridSize, setDirty } = useBoardStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<MindMapNode[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<MindMapEdge[]>([]);
  const reactFlowInstance = useReactFlow();

  const {
    addNode,
    updateNode,
    deleteNode,
    editingNodeId,
    startEditing,
    stopEditing,
  } = useNodeActions({ nodes, edges, setNodes, setEdges });

  const { addEdge, deleteEdge } = useEdgeActions({ edges, setEdges });

  const {
    contextMenu,
    hideContextMenu,
    handleNodeContextMenu,
    handleEdgeContextMenu,
    handlePaneContextMenu,
  } = useContextMenu();

  const { undo, redo, canUndo, canRedo } = useUndoRedo(nodes, edges, setNodes, setEdges);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addEdge(connection);
        setDirty(true);
      }
    },
    [addEdge, setDirty]
  );

  const handleNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: MindMapNode) => {
      startEditing(node.id);
    },
    [startEditing]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = nodes.filter((node) => node.selected);
        const selectedEdges = edges.filter((edge) => edge.selected);

        selectedNodes.forEach((node) => deleteNode(node.id));
        selectedEdges.forEach((edge) => deleteEdge(edge.id));

        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          setDirty(true);
        }
      }
    },
    [nodes, edges, deleteNode, deleteEdge, setDirty]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSave = useCallback(async () => {
    try {
      await fetch(`/api/mindmap/${reactFlowInstance.getNodes()[0]?.data?.boardId}/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes,
          edges,
        }),
      });
      setDirty(false);
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }, [nodes, edges, reactFlowInstance, setDirty]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        onPaneContextMenu={handlePaneContextMenu}
        onNodeDoubleClick={handleNodeDoubleClick}
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background gap={gridSize} size={1} />
        <Panel position="top-left">
          <Toolbar
            nodes={nodes}
            edges={edges}
            setNodes={setNodes}
            setEdges={setEdges}
            snapToGrid={snapToGrid}
            onAddNode={addNode}
            onSave={handleSave}
          />
        </Panel>
        {contextMenu && (
          <ContextMenu
            type={contextMenu.type}
            position={{ x: contextMenu.x, y: contextMenu.y }}
            data={contextMenu.data}
            onClose={hideContextMenu}
            onAddNode={addNode}
          />
        )}
      </ReactFlow>
    </div>
  );
}
