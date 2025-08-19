"use client";
import './page.css'
import { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';

import { RectangleNode } from './RectangleNode';
import { RectangleTool } from './RectangleTool';

import '@xyflow/react/dist/style.css';

const initialNodes = [
  {
    id: '1',
    type: 'rectangle',
    position: { x: 250, y: 5 },
    data: { color: '#ff7000' },
    width: 150,
    height: 100,
  },
   {
    id: '0',
    type: 'input',
    data: { label: 'Node' },
    position: { x: 0, y: 50 },
  },
];
const initialEdges = [];

const nodeTypes = {
  rectangle: RectangleNode,
};

let id = 1;
const getId = () => `${id++}`;
const nodeOrigin = [0.5, 0];

export default function RectangleFlow() {

   const reactFlowWrapper = useRef(null);
  const [nodes, _, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
   const { screenToFlowPosition } = useReactFlow();
  const onConnect = useCallback((params) => setEdges((els) => addEdge(params, els)), []);

  const [isRectangleActive, setIsRectangleActive] = useState(true);

    const onConnectEnd = useCallback(
    (event, connectionState) => {
      // when a connection is dropped on the pane it's not valid
      if (!connectionState.isValid) {
        // we need to remove the wrapper bounds, in order to get the correct position
        const id = getId();
        const { clientX, clientY } =
          'changedTouches' in event ? event.changedTouches[0] : event;
        const newNode = {
          id,
          position: screenToFlowPosition({
            x: clientX,
            y: clientY,
          }),
          data: { label: `Node ${id}` },
          origin: [0.5, 0.0],
        };
 
        setNodes((nds) => nds.concat(newNode));
        setEdges((eds) =>
          eds.concat({ id, source: connectionState.fromNode.id, target: id }),
        );
      }
    },
    [screenToFlowPosition],
  );

  return (
   <div className="wrapper" ref={reactFlowWrapper} style={{ height: '100vh', width: '100vw' }}>
     <ReactFlow
      nodes={nodes}
      nodeTypes={nodeTypes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onConnectEnd={onConnectEnd}
      fitView
      nodeOrigin={nodeOrigin}
    >
      <Controls />
      <Background />

      {isRectangleActive && <RectangleTool />}

      <Panel position="top-left">
        <div className="xy-theme__button-group">
          <button
            className={`xy-theme__button ${isRectangleActive ? 'active' : ''}`}
            onClick={() => setIsRectangleActive(true)}
          >
            Rectangle Mode
          </button>
          <button
            className={`xy-theme__button ${!isRectangleActive ? 'active' : ''}`}
            onClick={() => setIsRectangleActive(false)}
          >
            Selection Mode
          </button>
        </div>
      </Panel>
    </ReactFlow>
   </div>
  );
}
