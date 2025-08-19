
import { Metadata } from 'next';
import MindMapBoardList from '@/components/mindmap/MindMapBoardList';

export const metadata: Metadata = {
  title: 'Mind-Mapping Board | Viora Dashboard',
  description: 'Create and manage mind maps with our interactive whiteboard tool',
};

export default function MindMapPage() {
  return (
    <>
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Mind-Mapping Board
          </h2>
        </div>
        <MindMapBoardList />
      </div>
    </>
  );
}
