"use client";

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Button,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPriorityColor } from '@/lib/muiTheme';

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  valueUsd: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

interface Deal {
  id: string;
  title: string;
  description?: string;
  value?: number;
  priority: string; // Changed from union type to string to match database schema
  dueDate?: string;
  stageId: string;
  stage: {
    id: string;
    name: string;
    color: string;
  };
}

interface EditClientDialogProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  onClientUpdate: (clientId: string, clientData: any) => void;
}

function EditClientDialog({ open, onClose, client, onClientUpdate }: EditClientDialogProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    valueUsd: '',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email,
        company: client.company || '',
        valueUsd: client.valueUsd.toString(),
      });
    }
  }, [client]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !formData.name.trim() || !formData.email.trim()) return;
    const clientData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      company: formData.company.trim() || undefined,
      valueUsd: parseFloat(formData.valueUsd) || 0,
    };
    onClientUpdate(client.id, clientData);
    onClose();
  };

  if (!client) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: theme.shape.borderRadius, backgroundColor: theme.palette.background.paper } }}>
      <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>Edit Client</Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>Update client information</Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField fullWidth label="Client Name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required />
            <TextField fullWidth label="Email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required />
            <TextField fullWidth label="Company" value={formData.company} onChange={(e) => handleInputChange('company', e.target.value)} />
            <TextField fullWidth label="Total Value" type="number" value={formData.valueUsd} onChange={(e) => handleInputChange('valueUsd', e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, p: 2, gap: 1 }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderColor: theme.palette.divider, color: theme.palette.text.secondary }}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={!formData.name.trim() || !formData.email.trim()} sx={{ backgroundColor: theme.palette.primary.main, '&:hover': { backgroundColor: theme.palette.primary.dark } }}>Update Client</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function ClientDetailsClient({ id }: { id: string }) {
  const theme = useTheme();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const clientRes = await fetch(`/api/clients/${id}`);
        if (clientRes.ok) setClient(await clientRes.json());
        const dealsRes = await fetch(`/api/pipeline/cards?clientId=${id}`);
        if (dealsRes.ok) setDeals(await dealsRes.json());
      } catch (error) {
        console.error('Failed to fetch client data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClientData();
  }, [id]);

  const handleClientUpdate = async (clientId: string, clientData: any) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clientData) });
      if (response.ok) setClient(await response.json());
    } catch (error) {
      console.error('Failed to update client:', error);
    }
  };

  const handleClientDelete = async () => {
    if (!client || !window.confirm(`Are you sure you want to delete "${client.name}"? This will also delete all associated deals.`)) return;
    try {
      const response = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
      if (response.ok) router.push('/pipeline');
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const getPriorityLabel = (priority: string) => ({ low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }[priority] || priority);

  if (loading) return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="body1">Loading client details...</Typography>
    </Container>
  );

  if (!client) return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" color="error">Client not found</Typography>
      <Button component={Link} href="/pipeline" sx={{ mt: 2 }}>Back to Pipeline</Button>
    </Container>
  );

  const totalDealValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button component={Link} href="/pipeline" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>Back to Pipeline</Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 80, height: 80, fontSize: '2rem', backgroundColor: theme.palette.primary.main }}>
              {client.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>{client.name}</Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>{client.company || 'No company specified'}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditDialogOpen(true)}>Edit Client</Button>
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleClientDelete}>Delete Client</Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Client Information</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon color="action" />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>{client.email}</Typography>
            </Box>
            {client.company && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="action" />
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>{client.company}</Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MoneyIcon color="action" />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Total Value: {formatCurrency(client.valueUsd)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Created: {formatDate(client.createdAt)}</Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Last Updated: {formatDate(client.updatedAt)}</Typography>
          </Box>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Deals ({deals.length})</Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.success.main }}>{formatCurrency(totalDealValue)}</Typography>
          </Box>
          {deals.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>No deals associated with this client</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {deals.map((deal) => (
                <Card key={deal.id} variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{deal.title}</Typography>
                      {deal.value && (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                          {formatCurrency(deal.value)}
                        </Typography>
                      )}
                    </Box>
                    {deal.description && (
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                        {deal.description}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip label={deal.stage.name} size="small" sx={{ backgroundColor: deal.stage.color + '20', color: deal.stage.color, fontWeight: 600 }} />
                      <Chip label={getPriorityLabel(deal.priority)} size="small" variant="outlined" sx={{ borderColor: getPriorityColor(deal.priority, theme), color: getPriorityColor(deal.priority, theme) }} />
                      {deal.dueDate && (<Chip icon={<ScheduleIcon />} label={new Date(deal.dueDate).toLocaleDateString()} size="small" variant="outlined" />)}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Paper>
      </Box>

      <EditClientDialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} client={client} onClientUpdate={handleClientUpdate} />
    </Container>
  );
}
