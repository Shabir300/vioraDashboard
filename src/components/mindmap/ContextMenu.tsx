'use client';

import { useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import { NodeType } from '@/types/mindmap';
import { useNodeActions } from '@/hooks/mindmap/useNodeActions';
import { useEdgeActions } from '@/hooks/mindmap/useEdgeActions';

interface ContextMenuProps {
  type: 'node' | 'edge' | 'pane';
  position: { x: number; y: number };
  data?: Node | Edge;
  onClose: () => void;
  onAddNode?: (type: NodeType, position: { x: number; y: number }) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  onToggleCollapse?: (nodeId: string) => void;
}

export function ContextMenu({ type, position, data, onClose, onAddNode, onDeleteNode, onDeleteEdge, onToggleCollapse }: ContextMenuProps) {

  const handleNodeTypeSelect = useCallback(
    (nodeType: NodeType) => {
      if (onAddNode) {
        onAddNode(nodeType, position);
      }
      onClose();
    },
    [onAddNode, position, onClose]
  );

  const menuStyle = {
    top: position.y,
    left: position.x,
  };

  const renderNodeMenu = () => (
    <>
      <button
        onClick={() => {
          if (data?.id && onToggleCollapse) onToggleCollapse(String(data.id));
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Toggle Collapse
      </button>
      <button
        onClick={() => {
          // Handle rename
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Rename
      </button>
      <button
        onClick={() => {
          if (data?.id && onDeleteNode) onDeleteNode(String(data.id));
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
      >
        Delete
      </button>
    </>
  );

  const renderEdgeMenu = () => (
    <button
      onClick={() => {
        if (data?.id && onDeleteEdge) onDeleteEdge(String(data.id));
        onClose();
      }}
      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
    >
      Delete
    </button>
  );

  const renderPaneMenu = () => (
    <>
      <button
        onClick={() => handleNodeTypeSelect('text')}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Add Text Node
      </button>
      <button
        onClick={() => handleNodeTypeSelect('rectangle')}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Add Rectangle
      </button>
      <button
        onClick={() => handleNodeTypeSelect('ellipse')}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Add Ellipse
      </button>
      <button
        onClick={() => handleNodeTypeSelect('diamond')}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Add Diamond
      </button>
      <button
        onClick={() => handleNodeTypeSelect('sticky')}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Add Sticky Note
      </button>
    </>
  );

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        onClick={onClose}
      />
      <div
        style={menuStyle}
        className="fixed z-50 min-w-[150px] bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
      >
        {type === 'node' && renderNodeMenu()}
        {type === 'edge' && renderEdgeMenu()}
        {type === 'pane' && renderPaneMenu()}
      </div>
    </>
  );
}
