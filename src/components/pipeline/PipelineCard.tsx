"use client";

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItem,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getPriorityColor } from '@/lib/muiTheme';
import Link from 'next/link';
import { useDraggable, useDroppable } from '@dnd-kit/core';

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  valueUsd: number;
}

interface CardData {
  id: string;
  title: string;
  description?: string;
  value?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  client?: Client; // Made optional since client details can be stored directly in card
  position: number;
  // Client details stored directly in the card (for deals not yet closed)
  clientName?: string;
  clientEmail?: string;
  clientCompany?: string;
  clientPhone?: string;
}

interface PipelineCardProps {
  card: CardData;
  stageId: string;
  onMove: (cardId: string, fromStageId: string, toStageId: string, newPosition: number) => void;
  onEditCard: (card: CardData) => void;
  onDeleteCard: (cardId: string) => void;
}

export default function PipelineCard({ card, stageId, onMove, onEditCard, onDeleteCard }: PipelineCardProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Draggable
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({ id: card.id, data: { type: 'card', stageId } });

  // Droppable (to detect hover position in list)
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: card.id, data: { type: 'card', stageId } });

  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {};

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEditCard(card);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDeleteCard(card.id);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent',
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();

  return (
    <ListItem
      sx={{
        p: 0,
        mb: 1,
        '&:last-child': { mb: 0 },
        opacity: isDragging ? 0.5 : 1,
      }}
      ref={setDropRef}
      data-card-id={card.id}
    >
      <Card
        elevation={0}
        ref={setDragRef}
        {...listeners}
        {...attributes}
        sx={{
          width: '100%',
          backgroundColor: isOver ? theme.palette.action.hover : theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: theme.shape.borderRadius,
          cursor: 'grab',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: theme.shadows[4],
            transform: 'translateY(-2px)',
            borderColor: theme.palette.primary.main,
          },
        }}
        style={style}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Card Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                lineHeight: 1.3,
                flex: 1,
                mr: 1,
              }}
            >
              {card.title}
            </Typography>
            
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

          {/* Description */}
          {card.description && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                mb: 2,
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {card.description}
            </Typography>
          )}

          {/* Client Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                width: 24,
                height: 24,
                fontSize: '0.75rem',
                backgroundColor: theme.palette.primary.main,
                mr: 1,
              }}
            >
              {(card.client?.name || card.clientName || 'N/A').charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {card.client?.name || card.clientName || 'N/A'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <BusinessIcon fontSize="inherit" />
                {card.client?.company || card.clientCompany || 'N/A'}
              </Typography>
            </Box>
          </Box>

          {/* Card Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Priority Badge */}
              <Chip
                label={getPriorityLabel(card.priority)}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: getPriorityColor(card.priority, theme),
                  color: getPriorityColor(card.priority, theme),
                  fontSize: '0.625rem',
                  height: 20,
                  fontWeight: 600,
                }}
              />
              
              {/* Due Date */}
              {card.dueDate && (
                <Chip
                  icon={<ScheduleIcon />}
                  label={formatDate(card.dueDate)}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: isOverdue ? theme.palette.error.main : theme.palette.divider,
                    color: isOverdue ? theme.palette.error.main : theme.palette.text.secondary,
                    fontSize: '0.625rem',
                    height: 20,
                  }}
                />
              )}
            </Box>

            {/* Value */}
            {card.value && (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.success.main,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <MoneyIcon fontSize="inherit" />
                {formatCurrency(card.value)}
              </Typography>
            )}
          </Box>
        </CardContent>

        {/* Card Menu */}
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
          {card.client?.id && (
            <MenuItem component={Link} href={`/clients/${card.client.id}`}>
              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
              View Client
            </MenuItem>
          )}
          <MenuItem onClick={handleEdit}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit Deal
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: theme.palette.error.main }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete Deal
          </MenuItem>
        </Menu>
      </Card>
    </ListItem>
  );
}
