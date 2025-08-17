'use client';

import React from 'react';
import { NodeType } from '@/types/mindmap';

interface ShapeOption {
  type: NodeType;
  label: string;
  icon: React.ReactNode;
}

interface ShapesTabProps {
  onSelect: (type: NodeType) => void;
  selectedType: NodeType;
}

const shapes: ShapeOption[] = [
  {
    type: 'rectangle',
    label: 'Rectangle',
    icon: (
      <div className="w-6 h-4 border-2 border-gray-600 bg-white" />
    ),
  },
  {
    type: 'square',
    label: 'Square',
    icon: (
      <div className="w-5 h-5 border-2 border-gray-600 bg-white" />
    ),
  },
  {
    type: 'ellipse',
    label: 'Ellipse',
    icon: (
      <div className="w-6 h-4 rounded-full border-2 border-gray-600 bg-white" />
    ),
  },
  {
    type: 'circle',
    label: 'Circle',
    icon: (
      <div className="w-5 h-5 rounded-full border-2 border-gray-600 bg-white" />
    ),
  },
  {
    type: 'triangle',
    label: 'Triangle',
    icon: (
      <div className="w-5 h-5 flex items-center justify-center">
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-b-[16px] border-b-gray-600 border-r-[10px] border-r-transparent" />
      </div>
    ),
  },
  {
    type: 'diamond',
    label: 'Diamond',
    icon: (
      <div className="w-5 h-5 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-gray-600 bg-white transform rotate-45" />
      </div>
    ),
  },
  {
    type: 'star',
    label: 'Star',
    icon: (
      <div className="w-5 h-5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
          <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z" />
        </svg>
      </div>
    ),
  },
  {
    type: 'hexagon',
    label: 'Hexagon',
    icon: (
      <div className="w-5 h-5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
          <path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" />
        </svg>
      </div>
    ),
  },
  {
    type: 'cloud',
    label: 'Cloud',
    icon: (
      <div className="w-5 h-5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </svg>
      </div>
    ),
  },
];

export function ShapesTab({ onSelect, selectedType }: ShapesTabProps) {
  return (
    <div className="grid grid-cols-3 gap-2 p-2 bg-white rounded-lg shadow-lg">
      {shapes.map((shape) => (
        <button
          key={shape.type}
          onClick={() => onSelect(shape.type)}
          className={`
            flex flex-col items-center justify-center p-2 rounded
            transition-colors duration-200
            ${selectedType === shape.type
              ? 'bg-blue-100 text-blue-600'
              : 'hover:bg-gray-100'
            }
          `}
          title={shape.label}
        >
          {shape.icon}
          <span className="text-xs mt-1">{shape.label}</span>
        </button>
      ))}
    </div>
  );
}
