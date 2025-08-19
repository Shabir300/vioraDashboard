'use client';

import { memo, useMemo, useState, useCallback } from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';

export const CustomEdge = memo(({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const [showAddIcon, setShowAddIcon] = useState(false);

  const handleTextClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAddIcon((s) => !s);
  }, []);

  const isEditing = !!data?.editing;

  return (
    <>
      <path
        id={id}
        className={`react-flow__edge-path ${data?.style?.dashed ? 'stroke-dasharray-[6,6]' : ''}`}
        d={edgePath}
        style={{
          stroke: data?.style?.color || 'var(--tw-prose-invert-borders, #9ca3af)',
          strokeWidth: data?.style?.thickness || 2,
        }}
      />
      <foreignObject
        x={labelX - 60}
        y={labelY - 14}
        width={120}
        height={28}
        requiredExtensions="http://www.w3.org/1999/xhtml"
        style={{ overflow: 'visible' }}
      >
        <div className="flex items-center justify-center">
          {isEditing ? (
            <input
              defaultValue={data?.label || ''}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value;
                  data?.onLabelCommit?.(id, value);
                }
              }}
              onBlur={(e) => data?.onLabelCommit?.(id, (e.target as HTMLInputElement).value)}
              className="px-2 py-0.5 text-xs rounded border bg-white dark:bg-gray-800"
              style={{ minWidth: 60 }}
            />
          ) : (
            <button
              className="px-1 text-xs text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-800/70 rounded"
              onClick={handleTextClick}
            >
              {data?.label || ' '}
            </button>
          )}
          {showAddIcon && !isEditing && (
            <button
              className="ml-2 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center"
              title="Add next"
              onClick={(e) => {
                e.stopPropagation();
                data?.onChainAdd?.(id);
                setShowAddIcon(false);
              }}
            >
              +
            </button>
          )}
        </div>
      </foreignObject>
    </>
  );
});
