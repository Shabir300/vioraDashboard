"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getStageColor, getPriorityColor } from '@/lib/muiTheme';
import PipelineStage from '@/components/pipeline/PipelineStage';
import PipelineCard from '@/components/pipeline/PipelineCard';
import CreateCardDialog from '@/components/pipeline/CreateCardDialog';
import CreateStageDialog from '@/components/pipeline/CreateStageDialog';
import EditStageDialog from '@/components/pipeline/EditStageDialog';
import EditCardDialog from '@/components/pipeline/EditCardDialog';
import { usePipelineData } from '@/hooks/usePipelineData';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { Client, Card, Stage } from '@/hooks/usePipelineData';

export default function PipelinePage() {
  const theme = useTheme();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Use seeded org for now. Replace with actual org from session once auth is wired.
  const organizationId = 'org_seed_1';
  const {
    pipelines,
    loading,
    error,
    fetchPipelines,
    createStage,
    updateStage,
    deleteStage,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
  } = usePipelineData(organizationId);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  const activePipeline = pipelines[0];
  const stages: Stage[] = useMemo(() => activePipeline?.stages ?? [], [activePipeline]);

  const [createCardOpen, setCreateCardOpen] = useState(false);
  const [createStageOpen, setCreateStageOpen] = useState(false);
  const [editStageOpen, setEditStageOpen] = useState(false);
  const [editCardOpen, setEditCardOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const handleCreateCard = (stageId: string) => {
    setSelectedStage(stageId);
    setCreateCardOpen(true);
  };

  const handleCreateStage = () => {
    setCreateStageOpen(true);
  };

  const handleEditStage = (stage: Stage) => {
    setEditingStage(stage);
    setEditStageOpen(true);
  };

  const handleDeleteStage = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    if (stage && window.confirm(`Are you sure you want to delete the stage "${stage.name}"? This will also delete all cards in this stage.`)) {
      deleteStage(stageId).catch(error => {
        console.error('Failed to delete stage:', error);
      });
    }
  };

  const handleEditCard = (card: Card) => {
    setEditingCard(card);
    setEditCardOpen(true);
  };

  const handleDeleteCard = (cardId: string) => {
    const card = stages.flatMap(s => s.cards).find(c => c.id === cardId);
    if (card && window.confirm(`Are you sure you want to delete the deal "${card.title}"?`)) {
      deleteCard(cardId).catch(error => {
        console.error('Failed to delete card:', error);
      });
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCardId = String(active.id);
    const fromStageId = active.data?.current?.stageId as string | undefined;

    let toStageId: string | undefined;
    let newIndex: number | undefined;

    const overData = over.data?.current as any;

    if (overData?.type === 'card') {
      toStageId = overData.stageId as string;
      const targetStage = stages.find(s => s.id === toStageId);
      if (!targetStage) return;
      const overIndex = targetStage.cards.findIndex(c => c.id === String(over.id));
      newIndex = overIndex === -1 ? targetStage.cards.length : overIndex;
    } else if (overData?.type === 'stage') {
      toStageId = String(over.id);
      const targetStage = stages.find(s => s.id === toStageId);
      if (!targetStage) return;
      newIndex = targetStage.cards.length;
    } else {
      toStageId = String(over.id);
      const targetStage = stages.find(s => s.id === toStageId);
      if (!targetStage) return;
      newIndex = targetStage.cards.length;
    }

    if (!fromStageId || !toStageId || newIndex === undefined) return;

    // Persist move via API (hook will update state upon success)
    moveCard(activeCardId, toStageId, newIndex).catch(() => {/* noop */});
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="body1">Loading pipeline…</Typography>
      </Container>
    );
  }

  if (!activePipeline) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">No pipeline found</Typography>
          <Button variant="contained" onClick={() => fetchPipelines()}>Refresh</Button>
        </Box>
        <Typography variant="body2" color="text.secondary">Seed the database, then refresh.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
              color: theme.palette.text.primary,
              mb: 1 
            }}
          >
            Pipeline
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: theme.palette.text.secondary,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Chip 
              label={`${stages.reduce((acc, stage) => acc + stage.cards.length, 0)} deals`}
              size="small"
              variant="outlined"
              sx={{ 
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main 
              }}
            />
            across {stages.length} stages
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleCreateStage}
            sx={{
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                backgroundColor: theme.palette.primary.light + '10',
              },
            }}
          >
            Add Stage
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateCardOpen(true)}
            sx={{
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Add Deal
          </Button>
        </Box>
      </Box>

      {/* Kanban Board */}
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <Box sx={{ width: 'auto'}}>
          <Box sx={{ 
            overflowX: 'scroll',
            // msOverflowStyle: 'none',
            // scrollbarWidth: 'none',
            // '&::-webkit-scrollbar': { display: 'none' },
          }}>
            <Box sx={{ 
              display: 'flex', 
              gap: 3, 
              minWidth: 'max-content', 
              pb: 2,
              flexWrap: 'nowrap'
            }}>
              {stages.map((stage) => (
                <Box key={stage.id} sx={{ minWidth: 300, flexShrink: 0 }}>
                                     <PipelineStage
                     stage={stage}
                     onAddCard={() => handleCreateCard(stage.id)}
                     onCardMove={() => { /* not used now; we handle in onDragEnd */ }}
                     onEditStage={handleEditStage}
                     onDeleteStage={handleDeleteStage}
                     onEditCard={handleEditCard}
                     onDeleteCard={handleDeleteCard}
                   />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </DndContext>

      {/* Dialogs */}
      <CreateCardDialog
        open={createCardOpen}
        onClose={() => setCreateCardOpen(false)}
        stages={stages}
        selectedStage={selectedStage}
        organizationId={organizationId}
        onCardCreate={async (card) => {
          console.log('Pipeline page received card:', card);
          // Create card with proper API structure
          if (activePipeline && card.stageId) {
            try {
              const result = await createCard({
                ...card,
                pipelineId: activePipeline.id,
              });
              console.log('Card created successfully:', result);
            } catch (error) {
              console.error('Failed to create card:', error);
            }
          } else {
            console.error('Missing stageId or activePipeline:', { stageId: card.stageId, activePipeline });
          }
          setCreateCardOpen(false);
        }}
      />
      
             <CreateStageDialog
         open={createStageOpen}
         onClose={() => setCreateStageOpen(false)}
         onStageCreate={async (stage) => {
           if (activePipeline) {
             await createStage(activePipeline.id, stage as any);
           }
           setCreateStageOpen(false);
         }}
       />
       
       <EditStageDialog
         open={editStageOpen}
         onClose={() => {
           setEditStageOpen(false);
           setEditingStage(null);
         }}
         stage={editingStage}
         onStageUpdate={async (stageId, stageData) => {
           try {
             await updateStage(stageId, stageData);
             console.log('Stage updated successfully');
           } catch (error) {
             console.error('Failed to update stage:', error);
           }
         }}
       />
       
       <EditCardDialog
         open={editCardOpen}
         onClose={() => {
           setEditCardOpen(false);
           setEditingCard(null);
         }}
         card={editingCard}
         stages={stages}
         organizationId={organizationId}
         onCardUpdate={async (cardId, cardData) => {
           try {
             await updateCard(cardId, cardData);
             console.log('Card updated successfully');
           } catch (error) {
             console.error('Failed to update card:', error);
           }
         }}
       />
    </Container>
  );
}
