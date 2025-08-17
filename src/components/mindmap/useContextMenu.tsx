'use client';

import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Node, Edge } from 'reactflow';

type ContextMenuProps = {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
};

const ContextMenu = ({ x, y, onClose, children }: ContextMenuProps) => {
  return createPortal(
    <div
      className="absolute z-50 min-w-[180px] bg-white dark:bg-gray-800 shadow-lg rounded-md py-1"
      style={{ top: y, left: x }}
    >
      {children}
    </div>,
    document.body
  );
};

const MenuItem = ({ onClick, children }: any) => (
  <button
    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
    onClick={onClick}
  >
    {children}
  </button>
);

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    type: 'node' | 'edge' | 'pane';
    x: number;
    y: number;
    data?: Node | Edge;
  } | null>(null);

  const hideContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      const bounds = event.currentTarget.getBoundingClientRect();
      setContextMenu({
        type: 'node',
        x: bounds.left,
        y: bounds.top,
        data: node,
      });
    },
    []
  );

  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setContextMenu({
        type: 'edge',
        x: event.clientX,
        y: event.clientY,
        data: edge,
      });
    },
    []
  );

  const handlePaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setContextMenu({
        type: 'pane',
        x: event.clientX,
        y: event.clientY,
      });
    },
    []
  );

  const contextMenuContent = contextMenu && (
    <ContextMenu
      x={contextMenu.x}
      y={contextMenu.y}
      onClose={hideContextMenu}
    >
      {contextMenu.type === 'node' && (
        <>
          <MenuItem onClick={hideContextMenu}>Rename</MenuItem>
          <MenuItem onClick={hideContextMenu}>Duplicate</MenuItem>
          <MenuItem onClick={hideContextMenu}>Delete</MenuItem>
        </>
      )}
      {contextMenu.type === 'edge' && (
        <>
          <MenuItem onClick={hideContextMenu}>Edit Label</MenuItem>
          <MenuItem onClick={hideContextMenu}>Delete</MenuItem>
        </>
      )}
      {contextMenu.type === 'pane' && (
        <>
          <MenuItem onClick={hideContextMenu}>Add Node</MenuItem>
          <MenuItem onClick={hideContextMenu}>Zoom to Fit</MenuItem>
        </>
      )}
    </ContextMenu>
  );

  return {
    contextMenu: contextMenuContent,
    showContextMenu: setContextMenu,
    hideContextMenu,
    handleNodeContextMenu,
    handleEdgeContextMenu,
    handlePaneContextMenu,
  };
}
