"use client";

import React, { useState, useEffect } from 'react';
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
  InputAdornment,
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

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  valueUsd: number;
}

interface CreateCardDialogProps {
  open: boolean;
  onClose: () => void;
  stages: Stage[];
  selectedStage: string | null;
  onCardCreate: (card: any) => void;
  organizationId: string;
}

export default function CreateCardDialog({
  open,
  onClose,
  stages,
  selectedStage,
  onCardCreate,
  organizationId,
}: CreateCardDialogProps) {
  const theme = useTheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(true); // Default to creating new client
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: '',
    priority: 'medium',
    dueDate: '',
    stageId: selectedStage || (stages.length > 0 ? stages[0].id : ''),
    clientName: '',
    clientEmail: '',
    clientCompany: '',
  });

  // Fetch existing clients
  useEffect(() => {
    if (open && organizationId) {
      fetch(`/api/clients?organizationId=${organizationId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setClients(data);
          }
        })
        .catch(err => console.error('Failed to fetch clients:', err));
    }
  }, [open, organizationId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission:', {
      title: formData.title.trim(),
      stageId: formData.stageId,
      isCreatingNewClient,
      selectedClientId,
      clientName: formData.clientName.trim(),
      clientEmail: formData.clientEmail.trim(),
    });
    
    if (!formData.title.trim() || !formData.stageId) {
      console.log('Validation failed: missing title or stageId');
      return;
    }

    // Check if client is selected or being created
    if (!isCreatingNewClient && !selectedClientId) {
      console.log('Validation failed: no client selected');
      return;
    }

    if (isCreatingNewClient && (!formData.clientName.trim() || !formData.clientEmail.trim())) {
      console.log('Validation failed: missing client name or email');
      return;
    }

    const card: any = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      value: formData.value ? parseFloat(formData.value) : undefined,
      priority: formData.priority,
      dueDate: formData.dueDate || undefined,
      stageId: formData.stageId,
    };

    // If creating new client, send client details directly in the card
    if (isCreatingNewClient) {
      card.clientName = formData.clientName.trim() || 'Unknown Client';
      card.clientEmail = formData.clientEmail.trim() || '';
      card.clientCompany = formData.clientCompany.trim() || '';
      card.clientPhone = ''; // Add phone field if needed
    } else if (selectedClientId) {
      // If selecting existing client, send clientId
      card.clientId = selectedClientId;
    }

    console.log('Sending card data:', card);
    onCardCreate(card);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      value: '',
      priority: 'medium',
      dueDate: '',
      stageId: selectedStage || (stages.length > 0 ? stages[0].id : ''),
      clientName: '',
      clientEmail: '',
      clientCompany: '',
    });
    setSelectedClientId('');
    setIsCreatingNewClient(false);
  };

  const handleClose = () => {
    onClose();
    // Reset form on close
    setFormData({
      title: '',
      description: '',
      value: '',
      priority: 'medium',
      dueDate: '',
      stageId: selectedStage || (stages.length > 0 ? stages[0].id : ''),
      clientName: '',
      clientEmail: '',
      clientCompany: '',
    });
    setSelectedClientId('');
    setIsCreatingNewClient(false);
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
          Add New Deal
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
          Create a new deal and add it to your pipeline
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Deal Information */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 600 }}>
                Deal Information
              </Typography>
              
              <TextField
                fullWidth
                label="Deal Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
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
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Deal Value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
                
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    label="Priority"
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                sx={{ mt: 2 }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {/* Client Information */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 600 }}>
                Client Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Select Client</InputLabel>
                                     <Select
                     value={isCreatingNewClient ? 'new' : (selectedClientId || '')}
                     label="Select Client"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'new') {
                        setIsCreatingNewClient(true);
                        setSelectedClientId('');
                      } else {
                        setIsCreatingNewClient(false);
                        setSelectedClientId(value);
                        // Pre-fill form with selected client data
                        const selectedClient = clients.find(c => c.id === value);
                        if (selectedClient) {
                          setFormData(prev => ({
                            ...prev,
                            clientName: selectedClient.name,
                            clientEmail: selectedClient.email,
                            clientCompany: selectedClient.company || '',
                          }));
                        }
                      }
                    }}
                                     >
                     <MenuItem value="new">+ Create New Client</MenuItem>
                     {clients.length === 0 && (
                       <MenuItem value="" disabled>
                         No existing clients
                       </MenuItem>
                     )}
                     {clients.map((client) => (
                       <MenuItem key={client.id} value={client.id}>
                         {client.name} ({client.email})
                       </MenuItem>
                     ))}
                   </Select>
                </FormControl>
              </Box>
              
              {isCreatingNewClient && (
                <>
                  <TextField
                    fullWidth
                    label="Client Name"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Client Email"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Company"
                    value={formData.clientCompany}
                    onChange={(e) => handleInputChange('clientCompany', e.target.value)}
                  />
                </>
              )}
            </Box>

            {/* Stage Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 600 }}>
                Pipeline Stage
              </Typography>
              
              <FormControl fullWidth>
                <InputLabel>Select Stage</InputLabel>
                <Select
                  value={formData.stageId}
                  label="Select Stage"
                  onChange={(e) => handleInputChange('stageId', e.target.value)}
                  required
                >
                  {stages.map((stage) => (
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
             disabled={
               !formData.title.trim() || 
               !formData.stageId || 
               (!isCreatingNewClient && !selectedClientId) ||
               (isCreatingNewClient && (!formData.clientName.trim() || !formData.clientEmail.trim()))
             }
             sx={{
               backgroundColor: theme.palette.primary.main,
               '&:hover': {
                 backgroundColor: theme.palette.primary.dark,
               },
             }}
           >
             Create Deal
           </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
