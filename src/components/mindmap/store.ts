import { create } from 'zustand';
import { type Edge, type Node } from 'reactflow';
import type { MindMapBoard } from '@prisma/client';

interface BoardState {
  board: MindMapBoard | null;
  nodes: Node[];
  edges: Edge[];
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
  setBoard: (board: MindMapBoard) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setDirty: (isDirty: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, data: Partial<Node>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: Edge) => void;
  updateEdge: (id: string, data: Partial<Edge>) => void;
  removeEdge: (id: string) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  board: null,
  nodes: [],
  edges: [],
  isDirty: false,
  isLoading: false,
  error: null,
  setBoard: (board) => set({ board }),
  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),
  setDirty: (isDirty) => set({ isDirty }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addNode: (node) =>
    set((state) => ({ nodes: [...state.nodes, node], isDirty: true })),
  updateNode: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...data } : node
      ),
      isDirty: true,
    })),
  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
      isDirty: true,
    })),
  addEdge: (edge) =>
    set((state) => ({ edges: [...state.edges, edge], isDirty: true })),
  updateEdge: (id, data) =>
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === id ? { ...edge, ...data } : edge
      ),
      isDirty: true,
    })),
  removeEdge: (id) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
      isDirty: true,
    })),
}));
