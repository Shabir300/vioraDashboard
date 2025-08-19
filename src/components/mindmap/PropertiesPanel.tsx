'use client';

import { useMemo } from 'react';
import { Panel } from 'reactflow';
import { MindMapNode, MindMapEdge, NodeType } from '@/types/mindmap';

interface PropertiesPanelProps {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  setNodes: (nodes: MindMapNode[]) => void;
  setEdges: (edges: MindMapEdge[]) => void;
}

export function PropertiesPanel({ nodes, edges, setNodes, setEdges }: PropertiesPanelProps) {
  const selectedNode = useMemo(() => nodes.find((n) => n.selected), [nodes]);
  const selectedEdge = useMemo(() => edges.find((e) => e.selected), [edges]);

  if (!selectedNode && !selectedEdge) return null;

  return (
    <Panel position="top-right">
      <div className="w-72 rounded-lg bg-white dark:bg-gray-800 shadow-lg p-3 space-y-3">
        {selectedNode && (
          <div className="space-y-2">
            <div className="font-semibold text-sm">Node Properties</div>
            <label className="block text-xs">Title</label>
            <input
              className="w-full rounded border px-2 py-1 text-sm bg-transparent"
              value={selectedNode.data.label || ''}
              onChange={(e) => {
                setNodes(
                  nodes.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, label: e.target.value } } : n))
                );
              }}
            />
            <label className="block text-xs">Icon/Emoji</label>
            <input
              className="w-full rounded border px-2 py-1 text-sm bg-transparent"
              placeholder="😀"
              value={(selectedNode.data as any).icon || ''}
              onChange={(e) =>
                setNodes(
                  nodes.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, icon: e.target.value } } : n))
                )
              }
            />
            <label className="block text-xs">Description</label>
            <textarea
              className="w-full rounded border px-2 py-1 text-sm bg-transparent"
              rows={3}
              value={selectedNode.data.description || ''}
              onChange={(e) => {
                setNodes(
                  nodes.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, description: e.target.value } } : n))
                );
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs">Fill</label>
                <input
                  type="color"
                  className="w-full h-8"
                  value={selectedNode.data.backgroundColor || '#ffffff'}
                  onChange={(e) =>
                    setNodes(
                      nodes.map((n) =>
                        n.id === selectedNode.id ? { ...n, data: { ...n.data, backgroundColor: e.target.value } } : n
                      )
                    )
                  }
                />
              </div>
              <div>
                <label className="block text-xs">Border</label>
                <input
                  type="color"
                  className="w-full h-8"
                  value={selectedNode.data.borderColor || '#000000'}
                  onChange={(e) =>
                    setNodes(
                      nodes.map((n) =>
                        n.id === selectedNode.id ? { ...n, data: { ...n.data, borderColor: e.target.value } } : n
                      )
                    )
                  }
                />
              </div>
            </div>
          </div>
        )}

        {selectedEdge && (
          <div className="space-y-2">
            <div className="font-semibold text-sm">Edge Properties</div>
            <label className="block text-xs">Label</label>
            <input
              className="w-full rounded border px-2 py-1 text-sm bg-transparent"
              value={selectedEdge.data?.label || ''}
              onChange={(e) =>
                setEdges(
                  edges.map((edge) => (edge.id === selectedEdge.id ? { ...edge, data: { ...edge.data, label: e.target.value } } : edge))
                )
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs">Dashed</label>
                <input
                  type="checkbox"
                  checked={!!selectedEdge.data?.style?.dashed}
                  onChange={(e) =>
                    setEdges(
                      edges.map((edge) =>
                        edge.id === selectedEdge.id
                          ? { ...edge, data: { ...edge.data, style: { ...edge.data?.style, dashed: e.target.checked } } }
                          : edge
                      )
                    )
                  }
                />
              </div>
              <div>
                <label className="block text-xs">Thickness</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  className="w-full rounded border px-2 py-1 text-sm bg-transparent"
                  value={selectedEdge.data?.style?.thickness || 2}
                  onChange={(e) =>
                    setEdges(
                      edges.map((edge) =>
                        edge.id === selectedEdge.id
                          ? {
                              ...edge,
                              data: {
                                ...edge.data,
                                style: { ...edge.data?.style, thickness: Number(e.target.value) },
                              },
                            }
                          : edge
                      )
                    )
                  }
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs">Color</label>
                <input
                  type="color"
                  className="w-full h-8"
                  value={selectedEdge.data?.style?.color || '#9ca3af'}
                  onChange={(e) =>
                    setEdges(
                      edges.map((edge) =>
                        edge.id === selectedEdge.id
                          ? {
                              ...edge,
                              data: {
                                ...edge.data,
                                style: { ...edge.data?.style, color: e.target.value },
                              },
                            }
                          : edge
                      )
                    )
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


