'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from '@heroicons/react/24/outline';

async function fetchBoards() {
  const response = await fetch('/api/mindmap');
  if (!response.ok) {
    throw new Error('Failed to fetch boards');
  }
  return response.json();
}

async function createBoard(name: string) {
  // The organizationId will be determined server-side from the user's first membership
  const response = await fetch('/api/mindmap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create board');
  }
  
  return response.json();
}

export default function MindMapBoardList() {
  const [newBoardName, setNewBoardName] = useState('');
  const queryClient = useQueryClient();

  const { data: boards = [], isLoading, error } = useQuery({
    queryKey: ['mindmap-boards'],
    queryFn: fetchBoards,
  });

  const createBoardMutation = useMutation({
    mutationFn: createBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mindmap-boards'] });
      setNewBoardName('');
    },
  });

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBoardName.trim()) {
      createBoardMutation.mutate(newBoardName);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading boards</div>;
  }

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Your Mind Maps
        </h4>
        
        <form onSubmit={handleCreateBoard} className="flex gap-3">
          <input
            type="text"
            placeholder="New board name"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          />
          <button
            type="submit"
            disabled={!newBoardName.trim() || createBoardMutation.isPending}
            className="inline-flex items-center justify-center rounded-lg border border-primary py-3 px-6 text-center font-medium text-primary hover:bg-opacity-90 lg:px-8 xl:px-10 disabled:opacity-50"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            Create Board
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
        {boards.map((board: any) => (
          <Link
            key={board.id}
            href={`/mindmap/${board.id}`}
            className="relative rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark"
          >
            <div className="mt-4 h-20">
              <h4 className="text-xl font-semibold text-black dark:text-white">
                {board.name}
              </h4>
              <p className="mt-2 text-sm font-medium">
                Created {new Date(board.createdAt).toLocaleDateString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
