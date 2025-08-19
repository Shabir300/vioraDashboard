'use client';

import React, { useCallback, useState } from 'react';
import { NodeResizer, NodeProps } from 'reactflow';
import { MindMapNode, NodeType } from '@/types/mindmap';
import '@/styles/shapes.css';

const shapeStyles: Record<NodeType, string> = {
  text: '',
  rectangle: 'rounded',
  square: 'aspect-square rounded',
  ellipse: 'rounded-full',
  circle: 'aspect-square rounded-full',
  triangle: 'clip-path-triangle',
  diamond: 'transform rotate-45',
  star: 'clip-path-star',
  hexagon: 'clip-path-hexagon',
  cloud: 'clip-path-cloud',
  sticky: 'rotate-2',
};

const defaultSizes: Record<NodeType, { width: number; height: number }> = {
  text: { width: 120, height: 40 },
  rectangle: { width: 150, height: 80 },
  square: { width: 100, height: 100 },
  ellipse: { width: 150, height: 80 },
  circle: { width: 100, height: 100 },
  triangle: { width: 100, height: 100 },
  diamond: { width: 100, height: 100 },
  star: { width: 100, height: 100 },
  hexagon: { width: 100, height: 100 },
  cloud: { width: 150, height: 100 },
  sticky: { width: 150, height: 150 },
};

export function ShapeNode({ data, selected, id }: NodeProps<MindMapNode['data']>) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const handleDoubleClick = useCallback((evt: React.MouseEvent) => {
    evt.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    data.onChange?.(label);
  }, [label, data]);

  const style = {
    width: data.width || defaultSizes[data.type].width,
    height: data.height || defaultSizes[data.type].height,
    backgroundColor: data.backgroundColor || '#ffffff',
    borderColor: data.borderColor || '#000000',
    color: data.textColor || '#000000',
  };

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={40}
      />
      <div
        className={`
          border-2 flex items-center justify-center p-4
          transition-shadow duration-200
          ${shapeStyles[data.type]}
          ${selected ? 'shadow-lg' : 'shadow-md'}
        `}
        style={style}
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            className="w-full h-full bg-transparent text-center focus:outline-none"
            autoFocus
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-center">
            {label}
          </div>
        )}
      </div>
    </>
  );
}
