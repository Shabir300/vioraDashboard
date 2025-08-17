import { create } from 'zustand';
import { MindMapNode, MindMapEdge, NodeType } from '@/types/mindmap';

interface BoardState {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  selectedNodeId: string | null;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
  snapToGrid: boolean;
  gridSize: number;
  setNodes: (nodes: MindMapNode[]) => void;
  setEdges: (edges: MindMapEdge[]) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setDirty: (isDirty: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, updates: Partial<MindMapNode>) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: MindMapEdge) => void;
  updateEdge: (edgeId: string, updates: Partial<MindMapEdge>) => void;
  removeEdge: (edgeId: string) => void;
  clear: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isDirty: false,
  isLoading: false,
  error: null,
  snapToGrid: true,
  gridSize: 15,

  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),
  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),
  setDirty: (isDirty) => set({ isDirty }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  setGridSize: (size) => set({ gridSize: size }),

  addNode: (type, position) =>
    set((state) => ({
      nodes: [
        ...state.nodes,
        {
          id: `node-${Date.now()}`,
          type: 'custom',
          position,
          data: { label: 'New Node', type },
        },
      ],
      isDirty: true,
    })),

  updateNode: (nodeId, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
      isDirty: true,
    })),

  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      isDirty: true,
    })),

  addEdge: (edge) =>
    set((state) => ({
      edges: [...state.edges, edge],
      isDirty: true,
    })),

  updateEdge: (edgeId, updates) =>
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === edgeId ? { ...edge, ...updates } : edge
      ),
      isDirty: true,
    })),

  removeEdge: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
      isDirty: true,
    })),

  clear: () => set({ nodes: [], edges: [], isDirty: true }),
}));
