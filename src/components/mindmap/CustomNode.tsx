'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const CustomNode = memo(({ data, isConnectable }: NodeProps) => {
  const { label, type = 'text' } = data;

  const getNodeStyle = () => {
    switch (type) {
      case 'rectangle':
        return 'border-2 border-gray-600 dark:border-gray-400';
      case 'ellipse':
        return 'border-2 border-gray-600 dark:border-gray-400 rounded-full';
      case 'diamond':
        return 'border-2 border-gray-600 dark:border-gray-400 rotate-45';
      case 'sticky':
        return 'bg-yellow-100 dark:bg-yellow-700 shadow-md';
      default:
        return 'border border-gray-300 dark:border-gray-700';
    }
  };

  return (
    <div
      className={`mindmap-node relative min-w-[100px] min-h-[40px] p-2 bg-white dark:bg-gray-800 ${getNodeStyle()}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!bg-gray-400 dark:!bg-gray-600"
      />
      <div
        className="text-sm font-medium text-center"
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          // Update node label
          data.onChange?.(e.currentTarget.textContent);
        }}
      >
        {label}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="!bg-gray-400 dark:!bg-gray-600"
      />
    </div>
  );
});
