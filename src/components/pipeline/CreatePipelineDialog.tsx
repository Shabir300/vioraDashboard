"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';


import { usePipelineData, type PipelineInput } from '@/hooks/usePipelineData';

interface CreatePipelineDialogProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess?: (pipeline: any) => void;
}

// Generate random distinct colors for stages
const generateStageColors = (stageCount: number): string[] => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#F43F5E', '#A855F7', '#EAB308', '#22C55E'
  ];
  
  const shuffled = [...colors].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, stageCount);
};

export default function CreatePipelineDialog({
  open,
  onClose,
  organizationId,
  onSuccess,
}: CreatePipelineDialogProps) {
  const { createPipelineWithStages } = usePipelineData(organizationId);
  
  const [pipelineName, setPipelineName] = useState('');
  const [description, setDescription] = useState('');
  const [stages, setStages] = useState<string[]>([]);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [newStage, setNewStage] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleAddStage = () => {
    if (newStage.trim() && !stages.includes(newStage.trim())) {
      setStages([...stages, newStage.trim()]);
      setNewStage('');
      setErrors(prev => ({ ...prev, stages: '' }));
    }
  };

  const handleRemoveStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!pipelineName.trim()) {
      newErrors.name = 'Pipeline name is required';
    }

    if (stages.length === 0) {
      newErrors.stages = 'At least one stage is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      // Generate colors for stages
      const stageColors = generateStageColors(stages.length);
      
      // Create pipeline with nested stages in single transaction
      const pipelineInput: PipelineInput = {
        name: pipelineName.trim(),
        description: description.trim() || undefined,
        status,
        stages: stages.map((stageName, index) => ({
          name: stageName,
          color: stageColors[index],
          description: '',
          position: (index + 1) * 1000,
        })),
      };

      const result = await createPipelineWithStages(pipelineInput);
      
      // Success callback
      onSuccess?.(result);
      
      // Reset form and close
      handleClose();
      
    } catch (error: any) {
      console.error('Failed to create pipeline:', error);
      setErrors({ general: error.message || 'Failed to create pipeline' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing during creation
    
    setPipelineName('');
    setDescription('');
    setStages([]);
    setStatus('Active');
    setNewStage('');
    setErrors({});
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleAddStage();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2">
          Create New Pipeline
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* General Error */}
          {errors.general && (
            <Alert severity="error">
              {errors.general}
            </Alert>
          )}

          {/* Pipeline Name */}
          <TextField
            label="Pipeline Name"
            value={pipelineName}
            onChange={(e) => {
              setPipelineName(e.target.value);
              if (errors.name) setErrors(prev => ({ ...prev, name: '', general: '' }));
            }}
            error={!!errors.name}
            helperText={errors.name}
            placeholder="e.g., Sales Pipeline, Lead Generation"
            fullWidth
            required
            disabled={loading}
          />

          {/* Description */}
          <TextField
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this pipeline's purpose"
            multiline
            rows={2}
            fullWidth
            disabled={loading}
          />

          {/* Status */}
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>

          {/* Stages */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
              Stages *
            </Typography>
            
            {/* Existing Stages */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              {stages.map((stage, index) => {
                // Generate preview color for this stage
                const stageColors = generateStageColors(stages.length);
                const stageColor = stageColors[index] || '#6B7280';
                
                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 1,
                      border: `2px solid ${stageColor}`,
                      borderRadius: 2,
                      backgroundColor: `${stageColor}08`,
                      position: 'relative',
                      minWidth: 120,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: `${stageColor}15`,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${stageColor}25`,
                      },
                    }}
                  >
                    {/* Stage Number Badge */}
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: stageColor,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </Box>
                    
                    {/* Stage Name */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 500,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {stage}
                    </Typography>
                    
                    {/* Delete Button */}
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveStage(index)}
                      sx={{
                        width: 20,
                        height: 20,
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          backgroundColor: theme.palette.error.main,
                          color: 'white',
                        },
                      }}
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>

            {/* Add New Stage */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Add Stage"
                value={newStage}
                onChange={(e) => setNewStage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter stage name"
                size="small"
                sx={{ flexGrow: 1 }}
                disabled={loading}
              />
              <Button
                variant="outlined"
                onClick={handleAddStage}
                disabled={loading || !newStage.trim() || stages.includes(newStage.trim())}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </Box>
            
            {errors.stages && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errors.stages}
              </Alert>
            )}
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Stages will be automatically assigned distinct colors for easy visual identification.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={handleClose} 
          color="inherit"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={loading || !pipelineName.trim() || stages.length === 0}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Creating...' : 'Create Pipeline'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
