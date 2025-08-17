"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Chip,
  Divider,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import {
  DeleteSweep as BatchDeleteIcon,
  Cancel as CancelIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  DragIndicator as StageIcon,
  Business as CardIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import type { Card, Stage } from '@/hooks/usePipelineData';

interface BatchOperationsDialogProps {
  open: boolean;
  onClose: () => void;
  stages: Stage[];
  onBatchDelete: (items: { type: 'stage' | 'card'; id: string; name: string }[]) => void;
  onBatchEdit: (items: { type: 'stage' | 'card'; id: string }[], operation: string, value?: any) => void;
  loading?: boolean;
}

export default function BatchOperationsDialog({
  open,
  onClose,
  stages,
  onBatchDelete,
  onBatchEdit,
  loading = false,
}: BatchOperationsDialogProps) {
  const theme = useTheme();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [operation, setOperation] = useState<'delete' | 'edit'>('delete');
  const [editOperation, setEditOperation] = useState<string>('move');
  const [editValue, setEditValue] = useState<any>('');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedItems(new Set());
      setOperation('delete');
      setEditOperation('move');
      setEditValue('');
    }
  }, [open]);

  // Get all available items (stages and cards)
  const allItems = [
    ...stages.map(stage => ({
      type: 'stage' as const,
      id: stage.id,
      name: stage.name,
      description: stage.description,
      color: stage.color,
      cardCount: stage.cards.length,
      parentId: null,
    })),
    ...stages.flatMap(stage => 
      stage.cards.map(card => ({
        type: 'card' as const,
        id: card.id,
        name: card.title,
        description: card.description,
        value: card.value,
        priority: card.priority,
        parentId: stage.id,
        parentName: stage.name,
      }))
    ),
  ];

  const selectedItemsArray = allItems.filter(item => selectedItems.has(item.id));
  const selectedStages = selectedItemsArray.filter(item => item.type === 'stage');
  const selectedCards = selectedItemsArray.filter(item => item.type === 'card');

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (type?: 'stage' | 'card') => {
    const items = type ? allItems.filter(item => item.type === type) : allItems;
    const allIds = items.map(item => item.id);
    const allSelected = allIds.every(id => selectedItems.has(id));

    if (allSelected) {
      // Deselect all items of this type
      const newSelected = new Set(selectedItems);
      allIds.forEach(id => newSelected.delete(id));
      setSelectedItems(newSelected);
    } else {
      // Select all items of this type
      const newSelected = new Set(selectedItems);
      allIds.forEach(id => newSelected.add(id));
      setSelectedItems(newSelected);
    }
  };

  const handleSubmit = () => {
    if (selectedItems.size === 0) return;

    const itemsForOperation = selectedItemsArray.map(item => ({
      type: item.type,
      id: item.id,
      name: item.name,
    }));

    if (operation === 'delete') {
      onBatchDelete(itemsForOperation);
    } else {
      const itemsForEdit = selectedItemsArray.map(item => ({
        type: item.type,
        id: item.id,
      }));
      onBatchEdit(itemsForEdit, editOperation, editValue);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getItemIcon = (type: 'stage' | 'card') => {
    return type === 'stage' ? <StageIcon /> : <CardIcon />;
  };

  const getTotalValue = () => {
    return selectedCards.reduce((sum, card) => sum + (card.value || 0), 0);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: theme.shape.borderRadius,
          backgroundColor: theme.palette.background.paper,
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
          Batch Operations
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
          Select multiple items to perform bulk operations
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Operation Selection */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 600 }}>
              Select Operation
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant={operation === 'delete' ? 'contained' : 'outlined'}
                onClick={() => setOperation('delete')}
                startIcon={<BatchDeleteIcon />}
                color={operation === 'delete' ? 'error' : 'inherit'}
                disabled={loading}
              >
                Batch Delete
              </Button>
              <Button
                variant={operation === 'edit' ? 'contained' : 'outlined'}
                onClick={() => setOperation('edit')}
                startIcon={<EditIcon />}
                disabled={loading}
              >
                Batch Edit
              </Button>
            </Box>
          </Box>

          {/* Edit Operation Options */}
          {operation === 'edit' && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 600 }}>
                Edit Options
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Edit Operation</InputLabel>
                <Select
                  value={editOperation}
                  label="Edit Operation"
                  onChange={(e) => setEditOperation(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="move">Move to Stage</MenuItem>
                  <MenuItem value="priority">Change Priority</MenuItem>
                  <MenuItem value="status">Change Status</MenuItem>
                </Select>
              </FormControl>

              {editOperation === 'move' && (
                <FormControl fullWidth>
                  <InputLabel>Target Stage</InputLabel>
                  <Select
                    value={editValue}
                    label="Target Stage"
                    onChange={(e) => setEditValue(e.target.value)}
                    disabled={loading}
                  >
                    {stages.map(stage => (
                      <MenuItem key={stage.id} value={stage.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            component="span"
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: stage.color,
                            }}
                          />
                          {stage.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}

          {/* Selection Summary */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 600 }}>
              Selection Summary
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                label={`${selectedStages.length} stages selected`}
                size="small"
                variant="outlined"
                sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main }}
              />
              <Chip
                label={`${selectedCards.length} deals selected`}
                size="small"
                variant="outlined"
                sx={{ borderColor: theme.palette.success.main, color: theme.palette.success.main }}
              />
              {getTotalValue() > 0 && (
                <Chip
                  label={`$${getTotalValue().toLocaleString()} total value`}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: theme.palette.warning.main, color: theme.palette.warning.main }}
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                size="small"
                onClick={() => handleSelectAll()}
                startIcon={selectedItems.size === allItems.length ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
              >
                {selectedItems.size === allItems.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                size="small"
                onClick={() => handleSelectAll('stage')}
                startIcon={selectedStages.length === stages.length ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
              >
                {selectedStages.length === stages.length ? 'Deselect' : 'Select'} All Stages
              </Button>
              <Button
                size="small"
                onClick={() => handleSelectAll('card')}
                startIcon={selectedCards.length === allItems.filter(i => i.type === 'card').length ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
              >
                {selectedCards.length === allItems.filter(i => i.type === 'card').length ? 'Deselect' : 'Select'} All Deals
              </Button>
            </Box>
          </Box>

          {/* Items List */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 600 }}>
              Available Items ({allItems.length})
            </Typography>
            
            <List
              sx={{
                maxHeight: 300,
                overflow: 'auto',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.shape.borderRadius,
              }}
            >
              {stages.map((stage) => (
                <Box key={stage.id}>
                  {/* Stage Item */}
                  <ListItem button onClick={() => handleSelectItem(stage.id)}>
                    <ListItemIcon>
                      <Checkbox
                        checked={selectedItems.has(stage.id)}
                        onChange={() => handleSelectItem(stage.id)}
                      />
                    </ListItemIcon>
                    <ListItemIcon>
                      {getItemIcon('stage')}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            component="span"
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: stage.color,
                            }}
                          />
                          {stage.name}
                        </Box>
                      }
                      secondary={stage.description}
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        {stage.cards.length} deals
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>

                  {/* Cards in this stage */}
                  {stage.cards.map((card) => (
                    <ListItem
                      key={card.id}
                      button
                      onClick={() => handleSelectItem(card.id)}
                      sx={{ pl: 6 }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          checked={selectedItems.has(card.id)}
                          onChange={() => handleSelectItem(card.id)}
                        />
                      </ListItemIcon>
                      <ListItemIcon>
                        {getItemIcon('card')}
                      </ListItemIcon>
                      <ListItemText
                        primary={card.title}
                        secondary={card.description}
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ textAlign: 'right' }}>
                          {card.value && (
                            <Typography variant="caption" sx={{ color: theme.palette.success.main, display: 'block' }}>
                              ${card.value.toLocaleString()}
                            </Typography>
                          )}
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {card.priority}
                          </Typography>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}

                  <Divider />
                </Box>
              ))}
            </List>
          </Box>

          {/* Warning */}
          {operation === 'delete' && selectedItems.size > 0 && (
            <Alert
              severity="warning"
              sx={{
                backgroundColor: theme.palette.warning.light + '20',
                '& .MuiAlert-icon': {
                  color: theme.palette.warning.main,
                },
              }}
            >
              <Typography variant="body2">
                <strong>Warning:</strong> This action cannot be undone. Deleting stages will also delete all deals within them.
                {selectedStages.length > 0 && ` ${selectedStages.reduce((sum, stage) => sum + (stage.cardCount || 0), 0)} additional deals will be deleted.`}
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          p: 2,
          gap: 1,
        }}
      >
        <Button
          onClick={handleClose}
          variant="outlined"
          startIcon={<CancelIcon />}
          disabled={loading}
          sx={{
            borderColor: theme.palette.divider,
            color: theme.palette.text.secondary,
            '&:hover': {
              borderColor: theme.palette.text.secondary,
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || selectedItems.size === 0}
          color={operation === 'delete' ? 'error' : 'primary'}
          startIcon={operation === 'delete' ? <BatchDeleteIcon /> : <EditIcon />}
          sx={{
            '&:disabled': {
              backgroundColor: theme.palette.action.disabled,
            },
          }}
        >
          {loading 
            ? 'Processing...' 
            : `${operation === 'delete' ? 'Delete' : 'Edit'} ${selectedItems.size} Item${selectedItems.size !== 1 ? 's' : ''}`
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}
