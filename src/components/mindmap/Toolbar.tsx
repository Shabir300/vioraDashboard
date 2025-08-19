'use client';

import { useState, useCallback, useRef } from 'react';
import { Panel, useReactFlow } from 'reactflow';
import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useUndoRedo } from '@/hooks/mindmap/useUndoRedo';
import { ShapesTab } from './ShapesTab';
import { NodeType, MindMapNode, MindMapEdge } from '@/types/mindmap';
import { Templates } from './Templates';
import { useBoardStore } from '@/store/mindmapStore';

interface ToolbarProps {
  onSave: () => Promise<void>;
  isSaving: boolean;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  setNodes: (nodes: MindMapNode[]) => void;
  setEdges: (edges: MindMapEdge[]) => void;
  onAddNode: (type: NodeType, position?: { x: number; y: number }) => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  exportRef?: React.RefObject<HTMLDivElement>;
}

export function Toolbar({
  onSave,
  isSaving,
  nodes,
  edges,
  setNodes,
  setEdges,
  onAddNode,
  snapToGrid,
  setSnapToGrid,
}: ToolbarProps) {
  const [nodeType, setNodeType] = useState<NodeType>('text');
  const [showShapes, setShowShapes] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { undo, redo, canUndo, canRedo } = useUndoRedo(nodes, edges, setNodes, setEdges);
  const { showGrid, setShowGrid, layoutMode, setLayoutMode } = useBoardStore();

  const handleZoom = useCallback((type: 'in' | 'out' | 'fit') => {
    if (type === 'in') {
      reactFlowInstance.zoomIn();
    } else if (type === 'out') {
      reactFlowInstance.zoomOut();
    } else {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  }, [reactFlowInstance]);

  const handleExport = useCallback(async (format: 'png' | 'svg' | 'pdf') => {
    const host = reactFlowWrapper.current || (document.querySelector('.react-flow') as HTMLDivElement) || undefined;
    if (!host) return;

    try {
      const scale = 2; // Higher resolution
      const options = {
        backgroundColor: '#ffffff',
        width: host.offsetWidth * scale,
        height: host.offsetHeight * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        },
      };

      switch (format) {
        case 'png': {
          const dataUrl = await toPng(host, options as any);
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = 'mindmap.png';
          link.click();
          break;
        }
        case 'svg': {
          const dataUrl = await toSvg(host, options as any);
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = 'mindmap.svg';
          link.click();
          break;
        }
        case 'pdf': {
          const dataUrl = await toPng(host, options as any);
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [options.width, options.height],
          });
          
          pdf.addImage(
            dataUrl,
            'PNG',
            0,
            0,
            options.width,
            options.height,
            undefined,
            'FAST'
          );
          
          pdf.save('mindmap.pdf');
          break;
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      // Here you could add a toast notification for the error
    }
  }, []);

  return (
    <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg">
      <div className="flex items-center space-x-2 border-r pr-2">
        <button
          onClick={() => onAddNode('text')}
          className="px-3 py-1 text-sm font-medium rounded bg-blue-500 text-white hover:bg-blue-600"
          title="Add Node"
        >
          + Node
        </button>
        <div className="relative">
          <button
            onClick={() => setShowShapes(!showShapes)}
            className="px-3 py-1 text-sm font-medium rounded bg-blue-500 text-white hover:bg-blue-600 flex items-center space-x-1"
          >
            <span>Diagram Shapes</span>
            <svg className={`w-4 h-4 transform transition-transform ${showShapes ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showShapes && (
            <div className="absolute top-full left-0 mt-1 z-50">
              <ShapesTab
                onSelect={(type) => {
                  setNodeType(type);
                  setShowShapes(false);
                  onAddNode(type);
                }}
                selectedType={nodeType}
              />
            </div>
          )}
        </div>

        <button
          onClick={() => onAddNode('text')}
          className="px-3 py-1 text-sm font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Add Text
        </button>

        <div className="relative">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-3 py-1 text-sm font-medium rounded bg-indigo-500 text-white hover:bg-indigo-600"
          >
            Templates
          </button>
          {showTemplates && (
            <div className="absolute top-full left-0 mt-1 z-50 w-56 bg-white dark:bg-gray-800 rounded shadow-lg p-2 space-y-1">
              {Object.keys(Templates).map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    const center = reactFlowInstance.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
                    const tpl = Templates[name].build(center);
                    setNodes([...nodes, ...tpl.nodes]);
                    setEdges([...edges, ...tpl.edges]);
                    setShowTemplates(false);
                  }}
                  className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 border-r pr-2">
        <button
          onClick={() => handleZoom('in')}
          className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Zoom In"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>

        <button
          onClick={() => handleZoom('out')}
          className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Zoom Out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10h4" />
          </svg>
        </button>

        <button
          onClick={() => handleZoom('fit')}
          className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Fit View"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
          </svg>
        </button>

        <div className="border-l pl-2">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              className="form-checkbox h-4 w-4"
            />
            <span>Snap to Grid</span>
          </label>
        </div>

        <div className="border-l pl-2">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="form-checkbox h-4 w-4"
            />
            <span>Grid</span>
          </label>
        </div>

        <div className="border-l pl-2">
          <button
            onClick={() => setLayoutMode(layoutMode === 'free' ? 'tree' : 'free')}
            className="px-3 py-1 text-sm font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
            title="Toggle Layout"
          >
            {layoutMode === 'free' ? 'Tree Layout' : 'Freeform'}
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2 border-r pr-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
          title="Undo (Ctrl+Z)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
          title="Redo (Ctrl+Shift+Z)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-3 py-1 text-sm font-medium rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save'
          )}
        </button>

        <div className="relative inline-block">
          <button
            onClick={() => handleExport('png')}
            className="px-3 py-1 text-sm font-medium rounded bg-purple-500 text-white hover:bg-purple-600"
          >
            Export
          </button>
          <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded shadow-lg z-10 hidden group-hover:block">
            <button
              onClick={() => handleExport('png')}
              className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              PNG
            </button>
            <button
              onClick={() => handleExport('svg')}
              className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              SVG
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              PDF
            </button>
          </div>
        </div>

        <div className="border-l pl-2 flex items-center space-x-2">
          <button
            onClick={() => {
              const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ nodes, edges }));
              const link = document.createElement('a');
              link.href = dataStr;
              link.download = 'mindmap.json';
              link.click();
            }}
            className="px-3 py-1 text-sm font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Export JSON
          </button>
          <label className="px-3 py-1 text-sm font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer">
            Import JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                try {
                  const parsed = JSON.parse(text);
                  if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
                    setNodes(parsed.nodes);
                    setEdges(parsed.edges);
                  }
                } catch {}
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
