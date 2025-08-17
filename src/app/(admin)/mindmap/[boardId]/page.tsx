import { Metadata } from 'next';
import { getMindMapBoard } from '@/lib/mindmap/queries';
import MindMapClientWrapper from '@/components/mindmap/MindMapClientWrapper';

export const metadata: Metadata = {
  title: 'Mind Map Editor | Viora Dashboard',
  description: 'Interactive mind map editor',
};

export default async function MindMapEditorPage({
  params,
}: {
  params: { boardId: string };
}) {
  const board = await getMindMapBoard(params.boardId);

  if (!board) {
    return <div>Board not found</div>;
  }

  return <MindMapClientWrapper board={board} />;
}
