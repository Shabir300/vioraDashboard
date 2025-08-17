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
  Card,
  CardContent,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { usePipelineData, type PipelineInput, type StageInput } from '@/hooks/usePipelineData';

interface CreatePipelineWithStagesDialogProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess?: (pipeline: any) => void;
}

// Default stage templates for quick setup
const DEFAULT_STAGE_TEMPLATES = {
  sales: [
    { name: 'Lead', color: '#3B82F6', description: 'New potential customers' },
    { name: 'Qualified', color: '#8B5CF6', description: 'Leads that meet our criteria' },
    { name: 'Proposal', color: '#F59E0B', description: 'Proposals sent to prospects' },
    { name: 'Negotiation', color: '#EF4444', description: 'Active negotiations' },
    { name: 'Closed Won', color: '#10B981', description: 'Successful deals' },
    { name: 'Closed Lost', color: '#6B7280', description: 'Unsuccessful deals' },
  ],
  simple: [
    { name: 'To Do', color: '#6B7280', description: 'Tasks to be completed' },
    { name: 'In Progress', color: '#3B82F6', description: 'Currently working on' },
    { name: 'Review', color: '#F59E0B', description: 'Awaiting review' },
    { name: 'Done', color: '#10B981', description: 'Completed tasks' },
  ],
  support: [
    { name: 'New', color: '#3B82F6', description: 'New tickets' },
    { name: 'In Progress', color: '#F59E0B', description: 'Being worked on' },
    { name: 'Waiting', color: '#8B5CF6', description: 'Waiting for customer' },
    { name: 'Resolved', color: '#10B981', description: 'Issue resolved' },
  ],
};

export default function CreatePipelineWithStagesDialog({
  open,
  onClose,
  organizationId,
  onSuccess,
}: CreatePipelineWithStagesDialogProps) {
  const theme = useTheme();
  const { createPipelineWithStages } = usePipelineData(organizationId);
  
  const [formData, setFormData] = useState<PipelineInput>({
    name: '',
    description: '',
    status: 'Active',
    isDefault: false,
    stages: [
      { name: 'New', color: '#3B82F6', description: '', position: 1000 },
    ],
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof PipelineInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStageChange = (index: number, field: keyof StageInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      stages: prev.stages.map((stage, i) => 
        i === index ? { ...stage, [field]: value } : stage
      ),
    }));
  };

  const addStage = () => {
    setFormData(prev => ({
      ...prev,
      stages: [
        ...prev.stages,
        {
          name: `Stage ${prev.stages.length + 1}`,
          color: '#6B7280',
          description: '',
          position: (prev.stages.length + 1) * 1000,
        },
      ],
    }));
  };

  const removeStage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== index),
    }));
  };

  const loadTemplate = (template: keyof typeof DEFAULT_STAGE_TEMPLATES) => {
    const stages = DEFAULT_STAGE_TEMPLATES[template].map((stage, index) => ({
      ...stage,
      position: (index + 1) * 1000,
    }));

    setFormData(prev => ({
      ...prev,
      stages,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Pipeline name is required');
      return;
    }

    if (formData.stages.length === 0) {
      setError('At least one stage is required');
      return;
    }

    // Validate all stages have names
    const invalidStages = formData.stages.filter(stage => !stage.name.trim());
    if (invalidStages.length > 0) {
      setError('All stages must have names');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Submitting pipeline creation:', formData);
      
      const result = await createPipelineWithStages(formData);
      
      console.log('Pipeline created successfully:', result);
      
      onSuccess?.(result);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        status: 'Active',
        isDefault: false,
        stages: [
          { name: 'New', color: '#3B82F6', description: '', position: 1000 },
        ],
      });
      
    } catch (err: any) {
      console.error('Pipeline creation failed:', err);
      setError(err.message || 'Failed to create pipeline');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError(null);
    }
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
          maxHeight: '90vh',
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
          Create New Pipeline
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
          Create a pipeline with multiple stages in a single operation
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Pipeline Information */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 600 }}>
                Pipeline Information
              </Typography>
              
              <TextField
                fullWidth
                label="Pipeline Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                sx={{ mb: 2 }}
                disabled={loading}
              />
              
              <TextField
                fullWidth
                label="Description (Optional)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={2}
                sx={{ mb: 2 }}
                disabled={loading}
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Divider />

            {/* Stage Templates */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 600 }}>
                Quick Templates
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.entries(DEFAULT_STAGE_TEMPLATES).map(([key, stages]) => (
                  <Button
                    key={key}
                    variant="outlined"
                    size="small"
                    onClick={() => loadTemplate(key as keyof typeof DEFAULT_STAGE_TEMPLATES)}
                    disabled={loading}
                    sx={{
                      textTransform: 'capitalize',
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.main,
                      },
                    }}
                  >
                    {key} ({stages.length} stages)
                  </Button>
                ))}
              </Box>
            </Box>

            <Divider />

            {/* Stages Configuration */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  Pipeline Stages ({formData.stages.length})
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addStage}
                  variant="outlined"
                  size="small"
                  disabled={loading || formData.stages.length >= 10}
                  sx={{
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                  }}
                >
                  Add Stage
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 300, overflowY: 'auto' }}>
                {formData.stages.map((stage, index) => (
                  <Card
                    key={index}
                    elevation={0}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: theme.shape.borderRadius,
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: theme.palette.text.disabled }}>
                          <DragIndicatorIcon fontSize="small" />
                          <Typography variant="caption" sx={{ ml: 0.5 }}>
                            {index + 1}
                          </Typography>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                              label="Stage Name"
                              value={stage.name}
                              onChange={(e) => handleStageChange(index, 'name', e.target.value)}
                              required
                              size="small"
                              sx={{ flex: 1 }}
                              disabled={loading}
                            />
                            
                            <TextField
                              label="Color"
                              type="color"
                              value={stage.color}
                              onChange={(e) => handleStageChange(index, 'color', e.target.value)}
                              size="small"
                              sx={{ width: 80 }}
                              disabled={loading}
                            />
                          </Box>
                          
                          <TextField
                            label="Description (Optional)"
                            value={stage.description || ''}
                            onChange={(e) => handleStageChange(index, 'description', e.target.value)}
                            size="small"
                            fullWidth
                            disabled={loading}
                          />
                        </Box>

                        <IconButton
                          size="small"
                          onClick={() => removeStage(index)}
                          disabled={loading || formData.stages.length <= 1}
                          sx={{ 
                            color: theme.palette.error.main,
                            '&:disabled': {
                              color: theme.palette.action.disabled,
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
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
            disabled={loading}
            sx={{
              borderColor: theme.palette.divider,
              color: theme.palette.text.secondary,
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.name.trim() || formData.stages.length === 0}
            startIcon={loading ? <CircularProgress size={16} /> : null}
            sx={{
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            {loading ? 'Creating...' : `Create Pipeline (${formData.stages.length} stages)`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
