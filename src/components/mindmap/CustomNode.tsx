'use client';

import { memo, useMemo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const CustomNode = memo(({ data, isConnectable, selected, id }: NodeProps) => {
  const { label, type = 'text', description, icon, collapsed } = data as any;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const showSideAdders = !!selected;

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
      <div className="flex items-center justify-center gap-1">
        {icon && <span className="text-base leading-none">{icon}</span>}
        <div
          className="text-sm font-medium text-center"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            data.onChange?.(e.currentTarget.textContent);
          }}
        >
          {label}
        </div>
      </div>
      {showSideAdders && (
        <>
          <button
            className="absolute left-[-18px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-blue-500 text-white text-xs"
            title="Add left edge"
            onClick={(e) => {
              e.stopPropagation();
              data.onAddAdjacentEdge?.(id, 'left');
            }}
          >
            +
          </button>
          <button
            className="absolute right-[-18px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-blue-500 text-white text-xs"
            title="Add right edge"
            onClick={(e) => {
              e.stopPropagation();
              data.onAddAdjacentEdge?.(id, 'right');
            }}
          >
            +
          </button>
        </>
      )}
      {description && !collapsed && (
        <div
          className="text-xs mt-1 text-center opacity-80"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            data.onDescriptionChange?.(e.currentTarget.textContent);
          }}
        >
          {description}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="!bg-gray-400 dark:!bg-gray-600"
      />
    </div>
  );
});
