'use client';

import { memo } from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';

export const CustomEdge = memo(({ id, sourceX, sourceY, targetX, targetY, label, data }: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path stroke-gray-400 dark:stroke-gray-600"
        d={edgePath}
      />
      {label && (
        <text>
          <textPath
            href={`#${id}`}
            style={{ fontSize: '12px' }}
            startOffset="50%"
            textAnchor="middle"
            className="fill-gray-600 dark:fill-gray-400"
          >
            {label}
          </textPath>
        </text>
      )}
    </>
  );
});
