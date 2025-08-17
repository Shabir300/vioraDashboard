"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Collapse,
  Fade,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  Edit as EditIcon,
  Cancel as CancelIcon,
  Save as SaveIcon,
  ErrorOutline as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import type { Pipeline } from '@/hooks/usePipelineData';

interface EditPipelineDialogProps {
  open: boolean;
  onClose: () => void;
  pipeline: Pipeline | null;
  onPipelineUpdate: (pipelineId: string, pipelineData: any) => Promise<void>;
}

export default function EditPipelineDialog({
  open,
  onClose,
  pipeline,
  onPipelineUpdate,
}: EditPipelineDialogProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
    isDefault: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Update form data when pipeline changes
  useEffect(() => {
    if (pipeline) {
      setFormData({
        name: pipeline.name,
        description: pipeline.description || '',
        status: pipeline.status || 'Active',
        isDefault: pipeline.isDefault || false,
      });
      setErrors({});
      setSubmitError(null);
      setShowSuccess(false);
      setIsLoading(false);
    }
  }, [pipeline]);

  // Reset states when dialog closes
  useEffect(() => {
    if (!open) {
      setErrors({});
      setSubmitError(null);
      setShowSuccess(false);
      setIsLoading(false);
    }
  }, [open]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear submit error when user starts typing
    if (submitError) {
      setSubmitError(null);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Pipeline name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Pipeline name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Pipeline name must be less than 100 characters';
    }
    
    if (formData.description && formData.description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pipeline || !validateForm() || isLoading) {
      return;
    }

    const pipelineData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      status: formData.status,
      isDefault: formData.isDefault,
    };

    setIsLoading(true);
    setSubmitError(null);
    setShowSuccess(false);

    try {
      await onPipelineUpdate(pipeline.id, pipelineData);
      
      // Show success state briefly
      setShowSuccess(true);
      
      // Close dialog after a short delay to show success feedback
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error: any) {
      console.error('Failed to update pipeline:', error);
      
      // Set user-friendly error message
      const errorMessage = error?.message || 
        error?.response?.data?.error || 
        'Failed to update pipeline. Please check your connection and try again.';
      
      setSubmitError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Prevent accidental closing during loading
  const handleDialogClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (isLoading && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return;
    }
    handleClose();
  };

  if (!pipeline) return null;

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isLoading}
      PaperProps={{
        sx: {
          borderRadius: theme.shape.borderRadius,
          backgroundColor: theme.palette.background.paper,
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
          Edit Pipeline
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
          Update pipeline information and settings
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
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
                error={!!errors.name}
                helperText={errors.name}
                sx={{ mb: 2 }}
                disabled={isLoading}
              />
              
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={3}
                error={!!errors.description}
                helperText={errors.description || `${formData.description.length}/500 characters`}
                sx={{ mb: 2 }}
                disabled={isLoading}
              />
            </Box>

            {/* Pipeline Settings */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 600 }}>
                Pipeline Settings
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  disabled={isLoading}
                >
                  <MenuItem value="Active">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        component="span"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: theme.palette.success.main,
                        }}
                      />
                      Active
                    </Box>
                  </MenuItem>
                  <MenuItem value="Inactive">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        component="span"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: theme.palette.error.main,
                        }}
                      />
                      Inactive
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              {formData.isDefault && (
                <Alert 
                  severity="info"
                  sx={{
                    backgroundColor: theme.palette.info.light + '20',
                    '& .MuiAlert-icon': {
                      color: theme.palette.info.main,
                    },
                  }}
                >
                  <Typography variant="body2">
                    This is the default pipeline and will be used for new deals when no specific pipeline is selected.
                  </Typography>
                </Alert>
              )}
            </Box>

            {/* Pipeline Statistics */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 600 }}>
                Pipeline Statistics
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={`${pipeline.stages.length} stages`}
                  size="medium"
                  variant="outlined"
                  sx={{
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                  }}
                />
                <Chip
                  label={`${pipeline.stages.reduce((acc, stage) => acc + stage.cards.length, 0)} deals`}
                  size="medium"
                  variant="outlined"
                  sx={{
                    borderColor: theme.palette.success.main,
                    color: theme.palette.success.main,
                  }}
                />
                {pipeline.stages.reduce((acc, stage) => acc + stage.cards.reduce((sum, card) => sum + (card.value || 0), 0), 0) > 0 && (
                  <Chip
                    label={`$${pipeline.stages.reduce((acc, stage) => acc + stage.cards.reduce((sum, card) => sum + (card.value || 0), 0), 0).toLocaleString()} total value`}
                    size="medium"
                    variant="outlined"
                    sx={{
                      borderColor: theme.palette.warning.main,
                      color: theme.palette.warning.main,
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>
          {/* Error Alert */}
          <Collapse in={!!submitError}>
            <Alert 
              severity="error" 
              icon={<ErrorIcon />}
              sx={{ 
                mt: 2,
                '& .MuiAlert-message': {
                  width: '100%',
                },
              }}
              onClose={() => setSubmitError(null)}
            >
              <Typography variant="body2">
                <strong>Update Failed:</strong> {submitError}
              </Typography>
            </Alert>
          </Collapse>

          {/* Success Alert */}
          <Collapse in={showSuccess}>
            <Alert 
              severity="success" 
              icon={<SuccessIcon />}
              sx={{ 
                mt: 2,
                '& .MuiAlert-message': {
                  width: '100%',
                },
              }}
            >
              <Typography variant="body2">
                <strong>Success!</strong> Pipeline has been updated successfully.
              </Typography>
            </Alert>
          </Collapse>
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
            disabled={isLoading}
            sx={{
              borderColor: theme.palette.divider,
              color: theme.palette.text.secondary,
              '&:hover': {
                borderColor: theme.palette.text.secondary,
              },
              '&:disabled': {
                borderColor: theme.palette.action.disabled,
                color: theme.palette.action.disabled,
              },
            }}
            aria-label="Cancel pipeline editing"
          >
            Cancel
          </Button>
          
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isLoading}
            loadingPosition="start"
            startIcon={showSuccess ? <SuccessIcon /> : <SaveIcon />}
            disabled={!formData.name.trim()}
            sx={{
              minWidth: 160, // Consistent width to prevent layout shift
              backgroundColor: showSuccess 
                ? theme.palette.success.main 
                : theme.palette.primary.main,
              '&:hover': {
                backgroundColor: showSuccess 
                  ? theme.palette.success.dark 
                  : theme.palette.primary.dark,
              },
              '&:disabled': {
                backgroundColor: theme.palette.action.disabled,
              },
              '& .MuiLoadingButton-loadingIndicator': {
                color: theme.palette.primary.contrastText,
              },
            }}
            aria-label={isLoading ? 'Updating pipeline' : 'Update pipeline'}
            aria-describedby={submitError ? 'submit-error' : undefined}
          >
            {isLoading 
              ? 'Updating...' 
              : showSuccess 
              ? 'Updated!' 
              : 'Update Pipeline'
            }
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
