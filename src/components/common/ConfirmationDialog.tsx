"use client";

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  warningMessage?: string;
  confirmButtonText?: string;
  confirmButtonColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  cancelButtonText?: string;
  loading?: boolean;
  showWarningIcon?: boolean;
  additionalInfo?: string;
}

export default function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  warningMessage,
  confirmButtonText = 'Confirm',
  confirmButtonColor = 'error',
  cancelButtonText = 'Cancel',
  loading = false,
  showWarningIcon = true,
  additionalInfo,
}: ConfirmationDialogProps) {
  const theme = useTheme();

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showWarningIcon && (
            <WarningIcon 
              sx={{ 
                color: theme.palette.warning.main,
                fontSize: '1.5rem',
              }} 
            />
          )}
          <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              color: theme.palette.text.primary,
              lineHeight: 1.5,
            }}
          >
            {message}
          </Typography>
          
          {additionalInfo && (
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontStyle: 'italic',
              }}
            >
              {additionalInfo}
            </Typography>
          )}

          {warningMessage && (
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
                {warningMessage}
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
          onClick={onClose}
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
          {cancelButtonText}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          startIcon={<DeleteIcon />}
          disabled={loading}
          color={confirmButtonColor}
          sx={{
            backgroundColor: theme.palette[confirmButtonColor].main,
            '&:hover': {
              backgroundColor: theme.palette[confirmButtonColor].dark,
            },
            '&:disabled': {
              backgroundColor: theme.palette.action.disabled,
            },
          }}
        >
          {loading ? 'Processing...' : confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
