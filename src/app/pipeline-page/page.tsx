"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Grid,
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
import { usePipelineData } from '@/hooks/usePipelineData';

// Mock data for demonstration
const mockStages = [
  {
    id: '1',
    name: 'Lead',
    description: 'New leads and prospects',
    color: '#3B82F6',
    position: 0,
    cards: [
      {
        id: '1',
        title: 'Acme Corp',
        description: 'Software company looking for CRM solution',
        value: 50000,
        priority: 'high',
        dueDate: '2024-02-15',
        client: {
          id: '1',
          name: 'John Smith',
          email: 'john@acme.com',
          company: 'Acme Corp',
          valueUsd: 50000,
        },
        position: 0,
      },
      {
        id: '2',
        title: 'TechStart Inc',
        description: 'Startup seeking marketing automation',
        value: 25000,
        priority: 'medium',
        dueDate: '2024-02-20',
        client: {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@techstart.com',
          company: 'TechStart Inc',
          valueUsd: 25000,
        },
        position: 1,
      },
    ],
  },
  {
    id: '2',
    name: 'Contacted',
    description: 'Initial contact made',
    color: '#8B5CF6',
    position: 1,
    cards: [
      {
        id: '3',
        title: 'Global Solutions',
        description: 'Enterprise client interested in our platform',
        value: 150000,
        priority: 'urgent',
        dueDate: '2024-02-10',
        client: {
          id: '3',
          name: 'Mike Davis',
          email: 'mike@globalsolutions.com',
          company: 'Global Solutions',
          valueUsd: 150000,
        },
        position: 0,
      },
    ],
  },
  {
    id: '3',
    name: 'Negotiation',
    description: 'In discussion and negotiation',
    color: '#F59E0B',
    position: 2,
    cards: [
      {
        id: '4',
        title: 'Innovation Labs',
        description: 'Finalizing contract terms',
        value: 75000,
        priority: 'high',
        dueDate: '2024-02-05',
        client: {
          id: '4',
          name: 'Lisa Chen',
          email: 'lisa@innovationlabs.com',
          company: 'Innovation Labs',
          valueUsd: 75000,
        },
        position: 0,
      },
    ],
  },
  {
    id: '4',
    name: 'Closed',
    description: 'Deal completed',
    color: '#10B981',
    position: 3,
    cards: [
      {
        id: '5',
        title: 'DataFlow Systems',
        description: 'Successfully implemented and closed',
        value: 100000,
        priority: 'low',
        dueDate: '2024-01-30',
        client: {
          id: '5',
          name: 'Robert Wilson',
          email: 'robert@dataflow.com',
          company: 'DataFlow Systems',
          valueUsd: 100000,
        },
        position: 0,
      },
    ],
  },
];

export default function PipelinePage() {
  const theme = useTheme();
  const [stages, setStages] = useState(mockStages);
  const [createCardOpen, setCreateCardOpen] = useState(false);
  const [createStageOpen, setCreateStageOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const handleCreateCard = (stageId: string) => {
    setSelectedStage(stageId);
    setCreateCardOpen(true);
  };

  const handleCreateStage = () => {
    setCreateStageOpen(true);
  };

  const handleCardMove = (cardId: string, fromStageId: string, toStageId: string, newPosition: number) => {
    setStages(prevStages => {
      const newStages = [...prevStages];
      
      // Find source and destination stages
      const fromStageIndex = newStages.findIndex(s => s.id === fromStageId);
      const toStageIndex = newStages.findIndex(s => s.id === toStageId);
      
      if (fromStageIndex === -1 || toStageIndex === -1) return prevStages;
      
      // Find the card to move
      const cardIndex = newStages[fromStageIndex].cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return prevStages;
      
      const card = newStages[fromStageIndex].cards[cardIndex];
      
      // Remove card from source stage
      newStages[fromStageIndex].cards.splice(cardIndex, 1);
      
      // Add card to destination stage
      newStages[toStageIndex].cards.splice(newPosition, 0, card);
      
      // Update positions
      newStages[fromStageIndex].cards.forEach((c, i) => {
        c.position = i;
      });
      newStages[toStageIndex].cards.forEach((c, i) => {
        c.position = i;
      });
      
      return newStages;
    });
  };

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
      <Box sx={{ overflowX: 'auto' }}>
        <Grid container spacing={3} sx={{ minWidth: 'max-content', pb: 2 }}>
          {stages.map((stage) => (
            <Grid item key={stage.id} xs={12} sm={6} md={3}>
              <PipelineStage
                stage={stage}
                onAddCard={() => handleCreateCard(stage.id)}
                onCardMove={handleCardMove}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Dialogs */}
      <CreateCardDialog
        open={createCardOpen}
        onClose={() => setCreateCardOpen(false)}
        stages={stages}
        selectedStage={selectedStage}
        onCardCreate={(card) => {
          // Handle card creation
          setCreateCardOpen(false);
        }}
      />
      
      <CreateStageDialog
        open={createStageOpen}
        onClose={() => setCreateStageOpen(false)}
        onStageCreate={(stage) => {
          // Handle stage creation
          setCreateStageOpen(false);
        }}
      />
    </Container>
  );
}
