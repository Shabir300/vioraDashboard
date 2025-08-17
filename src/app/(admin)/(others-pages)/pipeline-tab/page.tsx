"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Alert,
  Skeleton,
  Menu,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  useTheme,
  MenuItem,
  ListItemButton,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  ArrowRight as ArrowRightIcon,
  AccountTree as PipelineIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { usePipelineData } from '@/hooks/usePipelineData';
import CreatePipelineDialog from '@/components/pipeline/CreatePipelineDialog';
import EditPipelineDialog from '@/components/pipeline/EditPipelineDialog';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { useOrganizationId } from '@/context/AuthContext';
import { useNavigationLoader } from '@/hooks/useNavigationLoader';
import type { Pipeline } from '@/hooks/usePipelineData';

export default function PipelineTabPage() {
  const theme = useTheme();
  const router = useRouter();
  const {
    navigateWithLoader,
    isItemLoading,
  } = useNavigationLoader({});
  const organizationId = useOrganizationId();
  const {
    pipelines,
    loading,
    error,
    fetchPipelines,
    updatePipeline,
    deletePipeline,
  } = usePipelineData(organizationId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [menuPipelineId, setMenuPipelineId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  const handlePipelineCreated = (pipeline: any) => {
    fetchPipelines();
    setCreateDialogOpen(false);
  };

  const handlePipelineClick = async (pipelineId: string) => {
    await navigateWithLoader(
      pipelineId,
      `/pipeline?pipelineId=${pipelineId}`,
    );
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, pipelineId: string) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuPipelineId(pipelineId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuPipelineId(null);
  };

  const handleEditPipeline = () => {
    const pipeline = pipelines.find(p => p.id === menuPipelineId);
    if (pipeline) {
      setSelectedPipeline(pipeline);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeletePipeline = () => {
    const pipeline = pipelines.find(p => p.id === menuPipelineId);
    if (pipeline) {
      setSelectedPipeline(pipeline);
      setDeleteConfirmOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPipeline) return;

    setDeleteLoading(true);
    try {
      await deletePipeline(selectedPipeline.id);
      setDeleteConfirmOpen(false);
      setSelectedPipeline(null);
      fetchPipelines();
    } catch (error) {
      console.error('Failed to delete pipeline:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!deleteLoading) {
      setDeleteConfirmOpen(false);
      setSelectedPipeline(null);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              mb: 1
            }}
          >
            Pipelines
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary
            }}
          >
            Manage your sales pipelines and client journeys
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
        >
          Create Pipeline
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ width: '100%' }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} animation="wave" height={80} sx={{ mb: 1 }} />
          ))}
        </Box>
      ) : pipelines.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundColor: theme.palette.background.paper,
            border: `1px dashed ${theme.palette.divider}`,
          }}
        >
          <PipelineIcon sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1, color: theme.palette.text.primary }}>
            No pipelines yet
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: theme.palette.text.secondary }}>
            Create your first pipeline to start managing your sales process and client journey.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            size="large"
          >
            Create Pipeline
          </Button>
        </Paper>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {pipelines.map((pipeline) => (
            <ListItem
              key={pipeline.id}
              style={{ borderBottom: `1px solid ${theme.palette.divider}` }}
            >
             <ListItemButton  onClick={() => handlePipelineClick(pipeline.id)}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: pipeline.stages[0]?.color || theme.palette.primary.main }}>
                  <PipelineIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={pipeline.name}
                secondary={`${pipeline.stages.length} stages / ${pipeline.stages.reduce((acc, stage) => acc + (stage.cards?.length || 0), 0)} deals`}
              />
              </ListItemButton>
                <IconButton
                  edge="end"
                  aria-label="menu"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleMenuClick(event, pipeline.id);
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
            </ListItem>
          ))}
          </List>
      )}

      <CreatePipelineDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        organizationId={organizationId}
        onSuccess={handlePipelineCreated}
      />

      <EditPipelineDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedPipeline(null);
        }}
        pipeline={selectedPipeline}
        onPipelineUpdate={async (pipelineId, pipelineData) => {
          await updatePipeline(pipelineId, pipelineData);
          setEditDialogOpen(false);
          setSelectedPipeline(null);
          fetchPipelines();
        }}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Pipeline"
        message={`Are you sure you want to delete the pipeline "${selectedPipeline?.name}"?`}
        warningMessage="This action cannot be undone. All stages and deals in this pipeline will be permanently deleted."
        additionalInfo={selectedPipeline ? `${selectedPipeline.stages.length} stages • ${selectedPipeline.stages.reduce((acc, stage) => acc + (stage.cards?.length || 0), 0)} deals` : undefined}
        confirmButtonText="Delete Pipeline"
        confirmButtonColor="error"
        cancelButtonText="Cancel"
        loading={deleteLoading}
      />

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
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
        <MenuItem onClick={handleEditPipeline}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Pipeline
        </MenuItem>
        <MenuItem onClick={handleDeletePipeline} sx={{ color: theme.palette.error.main }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Pipeline
        </MenuItem>
      </Menu>
    </Container>
  );
}