import { useState, useEffect, useCallback } from 'react';

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  valueUsd: number;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  value?: number;
  priority: string; // Changed from union type to string to match database schema
  dueDate?: string;
  client?: Client; // Made optional since client details can be stored directly in card
  position: number;
  stageId: string;
  // Client details stored directly in the card (for deals not yet closed)
  clientName?: string;
  clientEmail?: string;
  clientCompany?: string;
  clientPhone?: string;
}

export interface Stage {
  id: string;
  name: string;
  description?: string;
  color: string;
  position: number;
  isDefault?: boolean;
  cards: Card[];
}

export interface StageInput {
  name: string;
  description?: string;
  color?: string;
  position?: number;
  isDefault?: boolean;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  status?: 'Active' | 'Inactive';
  isDefault?: boolean;
  stages: Stage[];
}

export interface PipelineInput {
  name: string;
  description?: string;
  status?: 'Active' | 'Inactive';
  isDefault?: boolean;
  stages: StageInput[];
}

export function usePipelineData(organizationId: string) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pipelines
  const fetchPipelines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/pipeline?organizationId=${organizationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pipelines');
      }
      
      const data = await response.json();
      setPipelines(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Create pipeline with nested stages in a single transaction
  const createPipelineWithStages = useCallback(async (pipelineData: PipelineInput) => {
    try {
      console.log('Creating pipeline with stages:', pipelineData);
      
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...pipelineData,
          organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const newPipeline = await response.json();
      console.log('Pipeline created successfully:', newPipeline);
      
      setPipelines(prev => [...prev, newPipeline]);
      return newPipeline;
    } catch (err) {
      console.error('Error in createPipelineWithStages:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create pipeline';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [organizationId]);

  // Create pipeline (legacy method - kept for backward compatibility)
  const createPipeline = useCallback(async (pipelineData: Partial<Pipeline>) => {
    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...pipelineData,
          organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create pipeline');
      }

      const newPipeline = await response.json();
      setPipelines(prev => [...prev, newPipeline]);
      return newPipeline;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pipeline');
      throw err;
    }
  }, [organizationId]);

  // Update pipeline
  const updatePipeline = useCallback(async (pipelineId: string, updateData: Partial<Pipeline>) => {
    try {
      const response = await fetch('/api/pipeline', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: pipelineId,
          ...updateData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update pipeline');
      }

      const updatedPipeline = await response.json();
      setPipelines(prev => 
        prev.map(p => p.id === pipelineId ? updatedPipeline : p)
      );
      return updatedPipeline;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pipeline');
      throw err;
    }
  }, []);

  // Delete pipeline
  const deletePipeline = useCallback(async (pipelineId: string) => {
    try {
      const response = await fetch(`/api/pipeline?id=${pipelineId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete pipeline');
      }

      setPipelines(prev => prev.filter(p => p.id !== pipelineId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pipeline');
      throw err;
    }
  }, []);


  // Create stage
  const createStage = useCallback(async (pipelineId: string, stageData: Partial<Stage>) => {
    try {
      const response = await fetch('/api/pipeline/stages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...stageData,
          pipelineId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create stage');
      }

      const newStage = await response.json();
      setPipelines(prev => 
        prev.map(p => 
          p.id === pipelineId 
            ? { ...p, stages: [...p.stages, newStage] }
            : p
        )
      );
      return newStage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create stage');
      throw err;
    }
  }, []);

  // Update stage
  const updateStage = useCallback(async (stageId: string, updateData: Partial<Stage>) => {
    try {
      const response = await fetch('/api/pipeline/stages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: stageId,
          ...updateData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stage');
      }

      const updatedStage = await response.json();
      setPipelines(prev => 
        prev.map(p => ({
          ...p,
          stages: p.stages.map(s => s.id === stageId ? updatedStage : s),
        }))
      );
      return updatedStage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stage');
      throw err;
    }
  }, []);

  // Delete stage
  const deleteStage = useCallback(async (stageId: string) => {
    try {
      const response = await fetch(`/api/pipeline/stages?id=${stageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete stage');
      }

      setPipelines(prev => 
        prev.map(p => ({
          ...p,
          stages: p.stages.filter(s => s.id !== stageId),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete stage');
      throw err;
    }
  }, []);

  // Create card
  const createCard = useCallback(async (cardData: Partial<Card>) => {
    try {
      const response = await fetch('/api/pipeline/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });

      if (!response.ok) {
        throw new Error('Failed to create card');
      }

      const newCard = await response.json();
      setPipelines(prev => 
        prev.map(p => ({
          ...p,
          stages: p.stages.map(s => 
            s.id === cardData.stageId 
              ? { ...s, cards: [...s.cards, newCard] }
              : s
          ),
        }))
      );
      return newCard;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create card');
      throw err;
    }
  }, []);

  // Update card
  const updateCard = useCallback(async (cardId: string, updateData: Partial<Card>) => {
    try {
      const response = await fetch('/api/pipeline/cards', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: cardId,
          ...updateData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update card');
      }

      const updatedCard = await response.json();
      setPipelines(prev => 
        prev.map(p => ({
          ...p,
          stages: p.stages.map(s => ({
            ...s,
            cards: s.cards.map(c => c.id === cardId ? updatedCard : c),
          })),
        }))
      );
      return updatedCard;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update card');
      throw err;
    }
  }, []);

  // Delete card
  const deleteCard = useCallback(async (cardId: string) => {
    try {
      const response = await fetch(`/api/pipeline/cards?id=${cardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete card');
      }

      setPipelines(prev => 
        prev.map(p => ({
          ...p,
          stages: p.stages.map(s => ({
            ...s,
            cards: s.cards.filter(c => c.id !== cardId),
          })),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete card');
      throw err;
    }
  }, []);

  // Move card
  const moveCard = useCallback(async (cardId: string, newStageId: string, newPosition: number) => {
    try {
      const response = await fetch('/api/pipeline/cards/move', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId,
          newStageId,
          newPosition,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to move card');
      }

      const movedCard = await response.json();
      
      // Update local state
      setPipelines(prev => 
        prev.map(p => ({
          ...p,
          stages: p.stages.map(s => ({
            ...s,
            cards: s.cards
              .filter(c => c.id !== cardId)
              .map((c, i) => ({ ...c, position: i }))
              .concat(movedCard.stageId === s.id ? [{ ...movedCard, position: newPosition }] : [])
              .sort((a, b) => a.position - b.position),
          })),
        }))
      );

      return movedCard;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move card');
      throw err;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (organizationId) {
      fetchPipelines();
    }
  }, [fetchPipelines]);

  return {
    pipelines,
    loading,
    error,
    fetchPipelines,
    createPipeline,
    createPipelineWithStages,
    updatePipeline,
    deletePipeline,
    createStage,
    updateStage,
    deleteStage,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
  };
}
