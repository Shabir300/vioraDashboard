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
  Alert,
  Menu,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  DragIndicator as DragIndicatorIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRouter, useSearchParams } from 'next/navigation';
import { getStageColor, getPriorityColor } from '@/lib/muiTheme';
import { useOrganizationId } from '@/context/AuthContext';
import PipelineStage from '@/components/pipeline/PipelineStage';
import PipelineCard from '@/components/pipeline/PipelineCard';
import CreateCardDialog from '@/components/pipeline/CreateCardDialog';
import CreateStageDialog from '@/components/pipeline/CreateStageDialog';
import EditStageDialog from '@/components/pipeline/EditStageDialog';
import EditCardDialog from '@/components/pipeline/EditCardDialog';
import EditPipelineDialog from '@/components/pipeline/EditPipelineDialog';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import PipelineDetailSkeleton from '@/components/pipeline/PipelineDetailSkeleton';
import { usePipelineData } from '@/hooks/usePipelineData';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { Client, Card, Stage, Pipeline } from '@/hooks/usePipelineData';

export default function PipelinePage() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Get organizationId from auth context
  const organizationId = useOrganizationId();
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
    updatePipeline,
    deletePipeline,
  } = usePipelineData(organizationId);

  const pipelineId = searchParams.get('pipelineId');

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  const activePipeline = useMemo(() => {
    if (pipelineId) {
      return pipelines.find(p => p.id === pipelineId);
    }
    return pipelines[0]; // Fallback to first pipeline if no ID specified
  }, [pipelines, pipelineId]);

  const stages: Stage[] = useMemo(() => activePipeline?.stages ?? [], [activePipeline]);

  const [createCardOpen, setCreateCardOpen] = useState(false);
  const [createStageOpen, setCreateStageOpen] = useState(false);
  const [editStageOpen, setEditStageOpen] = useState(false);
  const [editCardOpen, setEditCardOpen] = useState(false);
  const [editPipelineOpen, setEditPipelineOpen] = useState(false);
  const [pipelineMenuAnchorEl, setPipelineMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  
  // Confirmation dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePending, setDeletePending] = useState<{
    type: 'stage' | 'card' | 'pipeline';
    id: string;
    name: string;
    additionalInfo?: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    if (stage) {
      setDeletePending({
        type: 'stage',
        id: stageId,
        name: stage.name,
        additionalInfo: `This stage contains ${stage.cards.length} deal(s). All deals in this stage will also be deleted.`,
      });
      setDeleteConfirmOpen(true);
    }
  };

  const handleEditCard = (card: Card) => {
    setEditingCard(card);
    setEditCardOpen(true);
  };

  const handleDeleteCard = (cardId: string) => {
    const card = stages.flatMap(s => s.cards).find(c => c.id === cardId);
    if (card) {
      const stageName = stages.find(s => s.cards.find(c => c.id === cardId))?.name || 'Unknown';
      setDeletePending({
        type: 'card',
        id: cardId,
        name: card.title,
        additionalInfo: `From stage: ${stageName}${card.value ? ` • Value: $${card.value.toLocaleString()}` : ''}`,
      });
      setDeleteConfirmOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletePending) return;

    setDeleteLoading(true);
    try {
      if (deletePending.type === 'stage') {
        await deleteStage(deletePending.id);
      } else if (deletePending.type === 'card') {
        await deleteCard(deletePending.id);
      } else if (deletePending.type === 'pipeline') {
        await deletePipeline(deletePending.id);
        // Navigate back to pipeline tab after successful deletion
        router.push('/pipeline-tab');
        return; // Early return to avoid cleanup below
      }
      setDeleteConfirmOpen(false);
      setDeletePending(null);
    } catch (error) {
      console.error(`Failed to delete ${deletePending.type}:`, error);
      // You could show an error message here
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!deleteLoading) {
      setDeleteConfirmOpen(false);
      setDeletePending(null);
    }
  };

  const handlePipelineMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setPipelineMenuAnchorEl(event.currentTarget);
  };

  const handlePipelineMenuClose = () => {
    setPipelineMenuAnchorEl(null);
  };

  const handleEditPipeline = () => {
    setEditPipelineOpen(true);
    handlePipelineMenuClose();
  };


  const handleDeletePipelineConfirm = () => {
    if (activePipeline) {
      setDeletePending({
        type: 'pipeline',
        id: activePipeline.id,
        name: activePipeline.name,
        additionalInfo: `${stages.length} stages • ${stages.reduce((acc, stage) => acc + stage.cards.length, 0)} deals`,
      });
      setDeleteConfirmOpen(true);
    }
    handlePipelineMenuClose();
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
    return <PipelineDetailSkeleton />;
  }

  if (!activePipeline) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            {pipelineId ? 'Pipeline not found' : 'No pipeline found'}
          </Typography>
          <Button variant="contained" onClick={() => router.push('/pipeline-tab')}>
            Back to Pipelines
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {pipelineId 
            ? 'The requested pipeline could not be found. It may have been deleted or you may not have access to it.'
            : 'No pipelines exist yet. Create your first pipeline to get started.'
          }
        </Typography>
        {!pipelineId && (
          <Button 
            variant="outlined" 
            onClick={() => router.push('/pipeline-tab')}
            sx={{ mt: 2 }}
          >
            Go to Pipeline Tab
          </Button>
        )}
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/pipeline-tab')}
              sx={{ color: theme.palette.text.secondary }}
            >
              Back to Pipelines
            </Button>
          </Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
              color: theme.palette.text.primary,
              mb: 1 
            }}
          >
            {activePipeline ? activePipeline.name : 'Pipeline'}
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
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <IconButton
            onClick={handlePipelineMenuClick}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <MoreVertIcon />
          </IconButton>
          
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
       
       {/* Edit Pipeline Dialog */}
       <EditPipelineDialog
         open={editPipelineOpen}
         onClose={() => setEditPipelineOpen(false)}
         pipeline={activePipeline}
         onPipelineUpdate={async (pipelineId, pipelineData) => {
           await updatePipeline(pipelineId, pipelineData);
           setEditPipelineOpen(false);
           // Refresh data
           fetchPipelines();
         }}
       />


       {/* Delete Confirmation Dialog */}
       <ConfirmationDialog
         open={deleteConfirmOpen}
         onClose={handleDeleteCancel}
         onConfirm={handleDeleteConfirm}
         title={`Delete ${deletePending?.type === 'stage' ? 'Stage' : deletePending?.type === 'card' ? 'Deal' : 'Pipeline'}`}
         message={`Are you sure you want to delete the ${deletePending?.type === 'stage' ? 'stage' : deletePending?.type === 'card' ? 'deal' : 'pipeline'} "${deletePending?.name}"?`}
         warningMessage={
           deletePending?.type === 'stage' 
             ? 'This action cannot be undone. All deals in this stage will also be permanently deleted.'
             : deletePending?.type === 'pipeline'
             ? 'This action cannot be undone. All stages and deals in this pipeline will be permanently deleted.'
             : 'This action cannot be undone.'
         }
         additionalInfo={deletePending?.additionalInfo}
         confirmButtonText={`Delete ${deletePending?.type === 'stage' ? 'Stage' : deletePending?.type === 'card' ? 'Deal' : 'Pipeline'}`}
         confirmButtonColor="error"
         cancelButtonText="Cancel"
         loading={deleteLoading}
       />

       {/* Pipeline Menu */}
       <Menu
         anchorEl={pipelineMenuAnchorEl}
         open={Boolean(pipelineMenuAnchorEl)}
         onClose={handlePipelineMenuClose}
         anchorOrigin={{
           vertical: 'bottom',
           horizontal: 'right',
         }}
         transformOrigin={{
           vertical: 'top',
           horizontal: 'right',
         }}
       >
         <MenuItem onClick={handleEditPipeline}>
           <EditIcon fontSize="small" sx={{ mr: 1 }} />
           Edit Pipeline
         </MenuItem>
         <MenuItem onClick={handleDeletePipelineConfirm} sx={{ color: theme.palette.error.main }}>
           <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
           Delete Pipeline
         </MenuItem>
       </Menu>
    </Container>
  );
}
