'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  Connection,
  useReactFlow,
  Node,
  Edge,
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
import { ShapeNode } from './ShapeNode';
import { MindMapNode, MindMapEdge, MindMapNodeData, MindMapEdgeData } from '@/types/mindmap';
import { PropertiesPanel } from './PropertiesPanel';
import { useBoard } from './BoardProvider';

const nodeTypes = {
  text: CustomNode,
  rectangle: ShapeNode,
  square: ShapeNode,
  ellipse: ShapeNode,
  circle: ShapeNode,
  triangle: ShapeNode,
  diamond: ShapeNode,
  star: ShapeNode,
  hexagon: ShapeNode,
  cloud: ShapeNode,
  sticky: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

export default function MindMapEditorNew() {
  const { snapToGrid, gridSize, setDirty, setSnapToGrid, showGrid, layoutMode } = useBoardStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<MindMapNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<MindMapEdgeData>([]);
  const reactFlowInstance = useReactFlow();
  const { board } = useBoard();

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
  
  // Helpers to wire node-side adders and edge chain adders
  const handleAddAdjacentEdge = useCallback((nodeId: string, side: 'left' | 'right') => {
    const base = nodes.find((n) => n.id === nodeId);
    if (!base) return;
    const dx = side === 'left' ? -160 : 160;
    const newNode = addNode('text', { x: base.position.x + dx, y: base.position.y });
    setEdges([
      ...edges,
      { id: `edge-${Date.now()}`, source: side === 'left' ? newNode.id : nodeId, target: side === 'left' ? nodeId : newNode.id, type: 'custom', data: { label: '', editing: true, onLabelCommit: (eid: string, value: string) => {
        setEdges((prev as any).map((e: any) => e.id === eid ? { ...e, data: { ...e.data, label: value, editing: false } } : e));
      }, onChainAdd: (eid: string) => {
        // Add another hop on the side of target
        const edge = (edges as any).find((e: any) => e.id === eid) || ({} as any);
        const tgt = nodes.find((n) => n.id === (edge.target || nodeId)) || base;
        const nn = addNode('text', { x: tgt.position.x + dx, y: tgt.position.y });
        setEdges((prev as any).concat({ id: `edge-${Date.now()}`, source: tgt.id, target: nn.id, type: 'custom', data: { label: '', editing: true, onLabelCommit: (id2: string, val2: string) => {
          setEdges((p2 as any).map((e2: any) => e2.id === id2 ? { ...e2, data: { ...e2.data, label: val2, editing: false } } : e2));
        }, onChainAdd: (id2: string) => {/* wired by component via data */} } }));
      } } },
    ] as any);
  }, [nodes, edges, addNode, setEdges]);

  const wireNodeDataCallbacks = useCallback((list: MindMapNode[]) => {
    return list.map((n) => ({
      ...n,
      data: {
        ...n.data,
        onAddAdjacentEdge: handleAddAdjacentEdge,
        onChange: (value?: string | null) => {
          setNodes((prev as any).map((pn: any) => pn.id === n.id ? { ...pn, data: { ...pn.data, label: value ?? '' } } : pn));
        },
        onDescriptionChange: (value?: string | null) => {
          setNodes((prev as any).map((pn: any) => pn.id === n.id ? { ...pn, data: { ...pn.data, description: value ?? '' } } : pn));
        },
      }
    })) as any;
  }, [handleAddAdjacentEdge, setNodes]);

  // Ensure a root node exists and is undeletable
  useEffect(() => {
    if (nodes.length === 0) {
      const root: MindMapNode = {
        id: `node-root`,
        type: 'custom',
        position: { x: 0, y: 0 },
        data: { label: 'Central Topic', type: 'text', isRoot: true },
      } as any;
      setNodes([root as any]);
    }
  }, []);

  // Load from server-provided board (if present) or localStorage
  useEffect(() => {
    const key = board?.id ? `mindmap:${board.id}` : 'mindmap:local';
    const load = () => {
      if (board && Array.isArray((board as any).nodes) && (board as any).nodes.length > 0) {
        const n = (board as any).nodes.map((bn: any) => ({
          id: bn.id,
          type: 'custom',
          position: { x: bn.positionX ?? bn.position?.x ?? 0, y: bn.positionY ?? bn.position?.y ?? 0 },
          data: {
            label: bn.label ?? bn.data?.label ?? '',
            type: (bn.type?.toLowerCase?.() || bn.data?.type || 'text') as any,
            width: bn.width ?? bn.data?.width,
            height: bn.height ?? bn.data?.height,
            backgroundColor: bn.style?.backgroundColor ?? bn.data?.backgroundColor,
            borderColor: bn.style?.borderColor ?? bn.data?.borderColor,
            textColor: bn.style?.textColor ?? bn.data?.textColor,
            isRoot: bn.isRoot ?? bn.data?.isRoot,
            description: bn.description ?? bn.data?.description,
          },
        })) as any;
        const e = (board as any).edges.map((be: any) => ({
          id: be.id,
          source: be.sourceNodeId ?? be.source,
          target: be.targetNodeId ?? be.target,
          type: 'custom',
          data: { label: be.label ?? be.data?.label, style: be.style ?? be.data?.style },
        })) as any;
        setNodes(n);
        setEdges(e);
      } else {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
              setNodes(parsed.nodes);
              setEdges(parsed.edges);
            }
          } catch {}
        }
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board?.id]);

  // Persist to localStorage
  useEffect(() => {
    const key = board?.id ? `mindmap:${board.id}` : 'mindmap:local';
    if (nodes.length > 0) {
      localStorage.setItem(key, JSON.stringify({ nodes, edges }));
    }
  }, [nodes, edges, board?.id]);

  // Simple tree layout when enabled
  useEffect(() => {
    if (layoutMode !== 'tree') return;
    const root = nodes.find((n) => (n.data as any)?.isRoot) || nodes[0];
    if (!root) return;
    const childMap = new Map<string, string[]>();
    edges.forEach((e) => {
      const arr = childMap.get(e.source) || [];
      arr.push(e.target);
      childMap.set(e.source, arr);
    });
    const levelMap = new Map<string, number>();
    const orderMap = new Map<string, number>();
    const visited = new Set<string>();
    const queue: Array<{ id: string; level: number }> = [{ id: root.id, level: 0 }];
    let counters: number[] = [];
    while (queue.length) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      levelMap.set(id, level);
      counters[level] = (counters[level] || 0) + 1;
      orderMap.set(id, counters[level] - 1);
      const children = childMap.get(id) || [];
      children.forEach((cid) => queue.push({ id: cid, level: level + 1 }));
    }
    const xGap = 220;
    const yGap = 120;
    const nextNodes = nodes.map((n) => {
      const level = levelMap.get(n.id);
      if (level == null) return n;
      const index = orderMap.get(n.id) || 0;
      const siblingsCount = counters[level] || 1;
      const yStart = -((siblingsCount - 1) * yGap) / 2;
      return {
        ...n,
        position: {
          x: (level - 0) * xGap,
          y: yStart + index * yGap,
        },
      } as any;
    });
    setNodes(nextNodes as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutMode]);

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
        selectedNodes.forEach((node) => {
          if (!(node.data as any)?.isRoot) {
            deleteNode(node.id);
          }
        });
        selectedEdges.forEach((edge) => deleteEdge(edge.id));

        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          setDirty(true);
        }
      }

      // Enter -> add child, Tab -> add sibling
      const selected = nodes.find((n) => n.selected);
      if (selected) {
        if (event.key === 'Enter') {
          event.preventDefault();
          const child = addNode('text', { x: selected.position.x + 180, y: selected.position.y });
          setEdges([
            ...edges,
            { id: `edge-${Date.now()}`, source: selected.id, target: child.id, type: 'custom', data: { label: '' } },
          ] as any);
          setDirty(true);
        }
        if (event.key === 'Tab') {
          event.preventDefault();
          const sibling = addNode('text', { x: selected.position.x, y: selected.position.y + 120 });
          // Find parent edge (target == selected.id)
          const parentEdge = edges.find((e) => e.target === selected.id);
          if (parentEdge) {
            setEdges([
              ...edges,
              { id: `edge-${Date.now()}`, source: parentEdge.source, target: sibling.id, type: 'custom', data: { label: '' } },
            ] as any);
            setDirty(true);
          }
        }
      }
      // Ctrl+Y redo
      if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase?.() === 'y')) {
        event.preventDefault();
        redo();
      }
    },
    [nodes, edges, deleteNode, deleteEdge, setDirty, addNode, setEdges, redo]
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

  // Collapse/expand: compute descendants and toggle hidden flag
  const getDescendants = useCallback((startId: string) => {
    const map = new Map<string, string[]>();
    edges.forEach((e) => {
      const arr = map.get(e.source) || [];
      arr.push(e.target);
      map.set(e.source, arr);
    });
    const result = new Set<string>();
    const stack = [...(map.get(startId) || [])];
    while (stack.length) {
      const id = stack.pop()!;
      if (result.has(id)) continue;
      result.add(id);
      const children = map.get(id) || [];
      stack.push(...children);
    }
    return result;
  }, [edges]);

  const toggleCollapse = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const collapsed = !(node.data as any)?.collapsed;
    const descendants = getDescendants(nodeId);
    setNodes(nodes.map((n) => {
      if (n.id === nodeId) return { ...n, data: { ...n.data, collapsed } } as any;
      if (descendants.has(n.id)) return { ...n, data: { ...n.data, hidden: collapsed } } as any;
      return n;
    }) as any);
  }, [nodes, setNodes, getDescendants]);

  const renderedNodes = useMemo(() => nodes.filter((n) => !(n.data as any)?.hidden), [nodes]);
  const renderedEdges = useMemo(() => edges.filter((e) => {
    const sHidden = nodes.find((n) => n.id === e.source)?.data as any;
    const tHidden = nodes.find((n) => n.id === e.target)?.data as any;
    return !sHidden?.hidden && !tHidden?.hidden;
  }), [edges, nodes]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={wireNodeDataCallbacks(renderedNodes as any)}
        edges={renderedEdges}
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
        {showGrid && <Background gap={gridSize} size={1} />}
        <Panel position="top-left">
          <Toolbar
            nodes={nodes as MindMapNode[]}
            edges={edges as MindMapEdge[]}
            setNodes={setNodes as (nodes: MindMapNode[]) => void}
            setEdges={setEdges as (edges: MindMapEdge[]) => void}
            snapToGrid={snapToGrid}
            setSnapToGrid={setSnapToGrid}
            onAddNode={addNode}
            onSave={handleSave}
            isSaving={false}
          />
        </Panel>
        <PropertiesPanel
          nodes={nodes as any}
          edges={edges as any}
          setNodes={setNodes as any}
          setEdges={setEdges as any}
        />
        {contextMenu && (
          <ContextMenu
            type={contextMenu.type}
            position={{ x: contextMenu.x, y: contextMenu.y }}
            data={contextMenu.data}
            onClose={hideContextMenu}
            onAddNode={addNode}
            onDeleteNode={(id) => deleteNode(id)}
            onDeleteEdge={(id) => deleteEdge(id)}
            onToggleCollapse={(id) => toggleCollapse(id)}
          />
        )}
      </ReactFlow>
    </div>
  );
}
