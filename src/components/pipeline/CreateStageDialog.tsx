"use client";

import React, { useState } from 'react';
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

interface CreateStageDialogProps {
  open: boolean;
  onClose: () => void;
  onStageCreate: (stage: any) => void;
}

const stageColors = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
];

export default function CreateStageDialog({
  open,
  onClose,
  onStageCreate,
}: CreateStageDialogProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    const stage = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color,
    };

    onStageCreate(stage);
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
    });
  };

  const handleClose = () => {
    onClose();
    // Reset form on close
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
    });
  };

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
          Add New Stage
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
          Create a new stage for your pipeline
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Stage Name */}
            <TextField
              fullWidth
              label="Stage Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              placeholder="e.g., Lead, Contacted, Negotiation"
              helperText="Choose a clear, descriptive name for this stage"
            />
            
            {/* Stage Description */}
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              multiline
              rows={3}
              placeholder="Describe what happens in this stage..."
              helperText="Optional: Add context about what this stage represents"
            />
            
            {/* Stage Color */}
            <FormControl fullWidth>
              <InputLabel>Stage Color</InputLabel>
              <Select
                value={formData.color}
                label="Stage Color"
                onChange={(e) => handleInputChange('color', e.target.value)}
              >
                {stageColors.map((color) => (
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
                      <Typography variant="body2">{color.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 0.5, display: 'block' }}>
                This color will be used to identify the stage throughout the pipeline
              </Typography>
            </FormControl>
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
            Create Stage
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
