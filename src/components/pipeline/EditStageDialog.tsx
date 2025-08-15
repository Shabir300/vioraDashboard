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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface Stage {
  id: string;
  name: string;
  description?: string;
  color: string;
  position: number;
  cards: any[];
}

interface EditStageDialogProps {
  open: boolean;
  onClose: () => void;
  stage: Stage | null;
  onStageUpdate: (stageId: string, stageData: any) => void;
}

const colorOptions = [
  { value: '#6B7280', label: 'Gray' },
  { value: '#EF4444', label: 'Red' },
  { value: '#F59E0B', label: 'Yellow' },
  { value: '#10B981', label: 'Green' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#F97316', label: 'Orange' },
];

export default function EditStageDialog({
  open,
  onClose,
  stage,
  onStageUpdate,
}: EditStageDialogProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6B7280',
  });

  // Update form data when stage changes
  useEffect(() => {
    if (stage) {
      setFormData({
        name: stage.name,
        description: stage.description || '',
        color: stage.color,
      });
    }
  }, [stage]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stage || !formData.name.trim()) {
      return;
    }

    const stageData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color,
    };

    onStageUpdate(stage.id, stageData);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!stage) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
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
          Edit Stage
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
          Update stage information and appearance
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Stage Information */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 600 }}>
                Stage Information
              </Typography>
              
              <TextField
                fullWidth
                label="Stage Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
            </Box>

            {/* Stage Color */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 600 }}>
                Stage Color
              </Typography>
              
              <FormControl fullWidth>
                <InputLabel>Select Color</InputLabel>
                <Select
                  value={formData.color}
                  label="Select Color"
                  onChange={(e) => handleInputChange('color', e.target.value)}
                >
                  {colorOptions.map((color) => (
                    <MenuItem key={color.value} value={color.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          component="span"
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: color.value,
                            border: `2px solid ${theme.palette.divider}`,
                          }}
                        />
                        {color.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Preview */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 600 }}>
                Preview
              </Typography>
              
              <Box
                sx={{
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                  backgroundColor: theme.palette.background.default,
                }}
              >
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
                      backgroundColor: formData.color,
                      display: 'inline-block',
                    }}
                  />
                  {formData.name || 'Stage Name'}
                </Typography>
                {formData.description && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      mt: 0.5,
                    }}
                  >
                    {formData.description}
                  </Typography>
                )}
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
            disabled={!formData.name.trim()}
            sx={{
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Update Stage
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
