import { MindMapNode, MindMapEdge } from '@/types/mindmap';

type Template = {
  name: string;
  build: (origin?: { x: number; y: number }) => { nodes: MindMapNode[]; edges: MindMapEdge[] };
};

const id = () => `node-${Math.random().toString(36).slice(2)}`;
const eid = () => `edge-${Math.random().toString(36).slice(2)}`;

function root(origin?: { x: number; y: number }) {
  const rId = id();
  const nodes: MindMapNode[] = [
    {
      id: rId,
      type: 'custom',
      position: { x: origin?.x ?? 0, y: origin?.y ?? 0 },
      data: { label: 'Central Topic', type: 'text', isRoot: true },
    },
  ];
  return { nodes, edges: [] as MindMapEdge[] };
}

export const Templates: Record<string, Template> = {
  'Project Planning': {
    name: 'Project Planning',
    build(origin) {
      const { nodes, edges } = root(origin);
      const rootId = nodes[0].id;
      const items = ['Goals', 'Scope', 'Timeline', 'Resources', 'Risks'];
      let x = (origin?.x ?? 0) - 300;
      let y = (origin?.y ?? 0) - 150;
      items.forEach((label, idx) => {
        const nid = id();
        nodes.push({ id: nid, type: 'custom', position: { x: x + idx * 150, y }, data: { label, type: 'rectangle' } });
        edges.push({ id: eid(), source: rootId, target: nid, type: 'custom', data: { label: '' } });
      });
      return { nodes, edges };
    },
  },
  Brainstorming: {
    name: 'Brainstorming',
    build(origin) {
      const { nodes, edges } = root(origin);
      const rootId = nodes[0].id;
      for (let i = 0; i < 6; i++) {
        const nid = id();
        nodes.push({ id: nid, type: 'custom', position: { x: (origin?.x ?? 0) + Math.cos((i / 6) * Math.PI * 2) * 220, y: (origin?.y ?? 0) + Math.sin((i / 6) * Math.PI * 2) * 160 }, data: { label: `Idea ${i + 1}`, type: 'sticky' } });
        edges.push({ id: eid(), source: rootId, target: nid, type: 'custom', data: { label: '' } });
      }
      return { nodes, edges };
    },
  },
  'SWOT Analysis': {
    name: 'SWOT Analysis',
    build(origin) {
      const { nodes, edges } = root(origin);
      const rootId = nodes[0].id;
      const quads = [
        { label: 'Strengths', dx: -220, dy: -140 },
        { label: 'Weaknesses', dx: 220, dy: -140 },
        { label: 'Opportunities', dx: -220, dy: 140 },
        { label: 'Threats', dx: 220, dy: 140 },
      ];
      quads.forEach((q) => {
        const nid = id();
        nodes.push({ id: nid, type: 'custom', position: { x: (origin?.x ?? 0) + q.dx, y: (origin?.y ?? 0) + q.dy }, data: { label: q.label, type: 'rectangle' } });
        edges.push({ id: eid(), source: rootId, target: nid, type: 'custom', data: { label: '' } });
      });
      return { nodes, edges };
    },
  },
  'Roadmap Tree': {
    name: 'Roadmap Tree',
    build(origin) {
      const { nodes, edges } = root(origin);
      const rootId = nodes[0].id;
      const phases = ['Q1', 'Q2', 'Q3', 'Q4'];
      phases.forEach((p, i) => {
        const nid = id();
        nodes.push({ id: nid, type: 'custom', position: { x: (origin?.x ?? 0) + i * 180 - 270, y: (origin?.y ?? 0) + 140 }, data: { label: p, type: 'diamond' } });
        edges.push({ id: eid(), source: rootId, target: nid, type: 'custom', data: { label: '' } });
      });
      return { nodes, edges };
    },
  },
  'Pros/Cons Board': {
    name: 'Pros/Cons Board',
    build(origin) {
      const { nodes, edges } = root(origin);
      const rootId = nodes[0].id;
      const pros = id();
      const cons = id();
      nodes.push({ id: pros, type: 'custom', position: { x: (origin?.x ?? 0) - 220, y: (origin?.y ?? 0) }, data: { label: 'Pros', type: 'rectangle' } });
      nodes.push({ id: cons, type: 'custom', position: { x: (origin?.x ?? 0) + 220, y: (origin?.y ?? 0) }, data: { label: 'Cons', type: 'rectangle' } });
      edges.push({ id: eid(), source: rootId, target: pros, type: 'custom', data: { label: '' } });
      edges.push({ id: eid(), source: rootId, target: cons, type: 'custom', data: { label: '' } });
      return { nodes, edges };
    },
  },
};

export type TemplateName = keyof typeof Templates;


