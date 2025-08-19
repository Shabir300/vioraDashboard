import { Node, Edge } from 'reactflow';

export type NodeType = 
  | 'text' 
  | 'rectangle' 
  | 'square'
  | 'ellipse' 
  | 'circle'
  | 'triangle'
  | 'diamond' 
  | 'star'
  | 'hexagon'
  | 'cloud'
  | 'sticky';

export interface MindMapNodeData {
  label: string;
  type: NodeType;
  width?: number;
  height?: number;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  description?: string;
  isRoot?: boolean;
  collapsed?: boolean;
  icon?: string;
}

export type MindMapNode = Node<MindMapNodeData>;

export interface MindMapEdgeData {
  label?: string;
  style?: {
    dashed?: boolean;
    thickness?: number; // stroke width
    color?: string;
  };
}

export type MindMapEdge = Edge<MindMapEdgeData>;

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface NodeUpdateData {
  label?: string;
  type?: NodeType;
  position?: Position;
  size?: Size;
}
