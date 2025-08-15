"use client";

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  List,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getStageColor } from '@/lib/muiTheme';
import PipelineCard from './PipelineCard';
import { useDroppable } from '@dnd-kit/core';
import type { Client, Card, Stage } from '@/hooks/usePipelineData';

interface PipelineStageProps {
  stage: Stage;
  onAddCard: () => void;
  onCardMove: (cardId: string, fromStageId: string, toStageId: string, newPosition: number) => void;
  onEditStage: (stage: Stage) => void;
  onDeleteStage: (stageId: string) => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: string) => void;
}

export default function PipelineStage({ stage, onAddCard, onCardMove, onEditStage, onDeleteStage, onEditCard, onDeleteCard }: PipelineStageProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEditStage(stage);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDeleteStage(stage.id);
  };

  const totalValue = stage.cards.reduce((sum, card) => sum + (card.value || 0), 0);

  // Make the cards container droppable (stage target)
  const { setNodeRef: setStageDropRef, isOver } = useDroppable({ id: stage.id, data: { type: 'stage' } });

  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
        minHeight: 400,
        minWidth: 280,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Stage Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.default,
          borderTopLeftRadius: theme.shape.borderRadius,
          borderTopRightRadius: theme.shape.borderRadius,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: stage.color,
                  display: 'inline-block',
                }}
              />
              {stage.name}
            </Typography>
            {stage.description && (
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  mt: 0.5,
                }}
              >
                {stage.description}
              </Typography>
            )}
          </Box>
          
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Stage Stats */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={`${stage.cards.length} deals`}
            size="small"
            variant="outlined"
            sx={{
              borderColor: theme.palette.divider,
              color: theme.palette.text.secondary,
              fontSize: '0.75rem',
            }}
          />
          {totalValue > 0 && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.success.main,
                fontWeight: 600,
              }}
            >
              ${totalValue.toLocaleString()}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Cards List */}
      <Box sx={{ 
        flex: 1, 
        p: 1, 
        overflowY: 'auto',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }} ref={setStageDropRef}>
        {stage.cards.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 200,
              color: theme.palette.text.secondary,
              border: `2px dashed ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
              mx: 1,
              backgroundColor: isOver ? theme.palette.action.hover : 'transparent',
              transition: 'background-color 0.15s ease-in-out',
            }}
          >
            <Typography variant="body2" sx={{ mb: 1 }}>
              No deals yet
            </Typography>
            <Typography variant="caption" sx={{ textAlign: 'center' }}>
              Drag deals here or click the button below
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
                         {stage.cards.map((card) => (
               <PipelineCard
                 key={card.id}
                 card={card}
                 stageId={stage.id}
                 onMove={onCardMove}
                 onEditCard={onEditCard}
                 onDeleteCard={onDeleteCard}
               />
             ))}
          </List>
        )}
      </Box>

      {/* Add Card Button */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onAddCard}
          sx={{
            borderColor: theme.palette.divider,
            color: theme.palette.text.secondary,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.primary.light + '10',
            },
          }}
        >
          Add Deal
        </Button>
      </Box>

      {/* Stage Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Stage
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: theme.palette.error.main }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Stage
        </MenuItem>
      </Menu>
    </Paper>
  );
}
