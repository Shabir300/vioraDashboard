'use client';

import { useCallback, useState } from 'react';
import { Node, Edge, useReactFlow, XYPosition } from 'reactflow';

type ContextMenuType = 'node' | 'edge' | 'pane';

interface ContextMenuState {
  type: ContextMenuType;
  x: number;
  y: number;
  data?: Node | Edge;
}

export function useContextMenu() {
  const [menuState, setMenuState] = useState<ContextMenuState | null>(null);
  const { project } = useReactFlow();

  const showContextMenu = useCallback(
    (type: ContextMenuType, position: XYPosition, data?: Node | Edge) => {
      setMenuState({
        type,
        x: position.x,
        y: position.y,
        data,
      });
    },
    []
  );

  const hideContextMenu = useCallback(() => {
    setMenuState(null);
  }, []);

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      showContextMenu('node', { x: rect.left, y: rect.top }, node);
    },
    [showContextMenu]
  );

  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      showContextMenu('edge', { x: event.clientX, y: event.clientY }, edge);
    },
    [showContextMenu]
  );

  const handlePaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const position = project({ x: event.clientX, y: event.clientY });
      showContextMenu('pane', position);
    },
    [project, showContextMenu]
  );

  return {
    contextMenu: menuState,
    showContextMenu,
    hideContextMenu,
    handleNodeContextMenu,
    handleEdgeContextMenu,
    handlePaneContextMenu,
  };
}
