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

export function ShapeNode({ data, selected }: NodeProps<MindMapNode['data']>) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const handleDoubleClick = useCallback((evt: React.MouseEvent) => {
    evt.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  const style = {
    width: data.width || defaultSizes[data.type].width,
    height: data.height || defaultSizes[data.type].height,
    backgroundColor: data.backgroundColor || '#ffffff',
    borderColor: data.borderColor || '#000000',
    color: data.textColor || '#000000',
  };

  return (
    <div className="shape-node-wrapper">
      <NodeResizer isVisible={selected} minWidth={60} minHeight={40} />
      <div
        className={`
          flex items-center justify-center relative
          ${selected ? 'shadow-lg' : 'shadow-md'}
        `}
        style={{
          width: style.width,
          height: style.height,
        }}
      >
        <div
          className={`
            absolute inset-0
            border-2
            flex items-center justify-center
            bg-white dark:bg-gray-800
            overflow-hidden
            ${shapeStyles[data.type]}
          `}
          style={{
            borderColor: style.borderColor,
            backgroundColor: style.backgroundColor,
          }}
          onDoubleClick={handleDoubleClick}
        >
          <div
            className={`
              w-full h-full
              flex items-center justify-center
              ${data.type === 'diamond' ? '-rotate-45' : ''}
              px-4
            `}
          >
            {isEditing ? (
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onBlur={handleBlur}
                className="w-full bg-transparent text-center focus:outline-none"
                style={{ color: style.color }}
                autoFocus
              />
            ) : (
              <div className="w-full text-center" style={{ color: style.color }}>
                {label}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
