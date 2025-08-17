"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Snackbar, Alert, Button, Box, Typography } from '@mui/material';
import { Undo as UndoIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// Types
interface UndoableAction {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  data: any;
  rollback: () => Promise<void>;
}

interface UndoState {
  actions: UndoableAction[];
  showSnackbar: boolean;
  currentAction: UndoableAction | null;
}

interface UndoContextType {
  addUndoableAction: (action: Omit<UndoableAction, 'id' | 'timestamp'>) => void;
  performUndo: (actionId: string) => Promise<void>;
  clearUndoHistory: () => void;
}

// Actions
type UndoActionType = 
  | { type: 'ADD_ACTION'; payload: UndoableAction }
  | { type: 'REMOVE_ACTION'; payload: string }
  | { type: 'SHOW_SNACKBAR'; payload: UndoableAction }
  | { type: 'HIDE_SNACKBAR' }
  | { type: 'CLEAR_HISTORY' };

// Reducer
function undoReducer(state: UndoState, action: UndoActionType): UndoState {
  switch (action.type) {
    case 'ADD_ACTION':
      return {
        ...state,
        actions: [...state.actions, action.payload],
        showSnackbar: true,
        currentAction: action.payload,
      };
    case 'REMOVE_ACTION':
      return {
        ...state,
        actions: state.actions.filter(a => a.id !== action.payload),
      };
    case 'SHOW_SNACKBAR':
      return {
        ...state,
        showSnackbar: true,
        currentAction: action.payload,
      };
    case 'HIDE_SNACKBAR':
      return {
        ...state,
        showSnackbar: false,
        currentAction: null,
      };
    case 'CLEAR_HISTORY':
      return {
        ...state,
        actions: [],
        showSnackbar: false,
        currentAction: null,
      };
    default:
      return state;
  }
}

// Context
const UndoContext = createContext<UndoContextType | undefined>(undefined);

// Provider component
interface UndoProviderProps {
  children: React.ReactNode;
  maxHistorySize?: number;
  autoExpireDuration?: number; // in milliseconds
}

export function UndoProvider({ 
  children, 
  maxHistorySize = 10, 
  autoExpireDuration = 10000 // 10 seconds
}: UndoProviderProps) {
  const theme = useTheme();
  const [state, dispatch] = useReducer(undoReducer, {
    actions: [],
    showSnackbar: false,
    currentAction: null,
  });

  // Generate unique ID for actions
  const generateActionId = () => `undo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add undoable action
  const addUndoableAction = useCallback((actionData: Omit<UndoableAction, 'id' | 'timestamp'>) => {
    const action: UndoableAction = {
      id: generateActionId(),
      timestamp: Date.now(),
      ...actionData,
    };

    dispatch({ type: 'ADD_ACTION', payload: action });

    // Auto-expire old actions
    if (state.actions.length >= maxHistorySize) {
      const oldestAction = state.actions[0];
      setTimeout(() => {
        dispatch({ type: 'REMOVE_ACTION', payload: oldestAction.id });
      }, 100);
    }

    // Auto-expire this action after specified duration
    setTimeout(() => {
      dispatch({ type: 'REMOVE_ACTION', payload: action.id });
    }, autoExpireDuration);
  }, [state.actions.length, maxHistorySize, autoExpireDuration]);

  // Perform undo operation
  const performUndo = useCallback(async (actionId: string) => {
    const action = state.actions.find(a => a.id === actionId);
    if (!action) return;

    try {
      await action.rollback();
      dispatch({ type: 'REMOVE_ACTION', payload: actionId });
      dispatch({ type: 'HIDE_SNACKBAR' });
    } catch (error) {
      console.error('Failed to perform undo operation:', error);
      // You might want to show an error message to the user here
    }
  }, [state.actions]);

  // Clear undo history
  const clearUndoHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  // Handle snackbar close
  const handleSnackbarClose = () => {
    dispatch({ type: 'HIDE_SNACKBAR' });
  };

  // Handle undo button click
  const handleUndoClick = () => {
    if (state.currentAction) {
      performUndo(state.currentAction.id);
    }
  };

  const contextValue: UndoContextType = {
    addUndoableAction,
    performUndo,
    clearUndoHistory,
  };

  return (
    <UndoContext.Provider value={contextValue}>
      {children}
      
      {/* Undo Snackbar */}
      <Snackbar
        open={state.showSnackbar}
        autoHideDuration={autoExpireDuration}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        sx={{ mb: 2 }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="info"
          variant="filled"
          sx={{
            backgroundColor: theme.palette.grey[800],
            color: theme.palette.common.white,
            '& .MuiAlert-icon': {
              color: theme.palette.common.white,
            },
            minWidth: 350,
            alignItems: 'center',
          }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<UndoIcon />}
              onClick={handleUndoClick}
              sx={{
                color: theme.palette.common.white,
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              UNDO
            </Button>
          }
        >
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {state.currentAction?.description || 'Action completed'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Click UNDO to reverse this action
            </Typography>
          </Box>
        </Alert>
      </Snackbar>
    </UndoContext.Provider>
  );
}

// Hook to use undo context
export function useUndo(): UndoContextType {
  const context = useContext(UndoContext);
  if (context === undefined) {
    throw new Error('useUndo must be used within an UndoProvider');
  }
  return context;
}

// Helper functions for creating common undo actions
export const createDeleteStageUndoAction = (
  stage: any,
  restoreStage: (stage: any) => Promise<void>
) => ({
  type: 'delete_stage',
  description: `Deleted stage "${stage.name}"`,
  data: stage,
  rollback: () => restoreStage(stage),
});

export const createDeleteCardUndoAction = (
  card: any,
  restoreCard: (card: any) => Promise<void>
) => ({
  type: 'delete_card',
  description: `Deleted deal "${card.title}"`,
  data: card,
  rollback: () => restoreCard(card),
});

export const createBatchDeleteUndoAction = (
  items: any[],
  restoreItems: (items: any[]) => Promise<void>
) => ({
  type: 'batch_delete',
  description: `Deleted ${items.length} item${items.length !== 1 ? 's' : ''}`,
  data: items,
  rollback: () => restoreItems(items),
});

export const createEditUndoAction = (
  itemType: string,
  itemName: string,
  previousData: any,
  restoreData: (data: any) => Promise<void>
) => ({
  type: `edit_${itemType}`,
  description: `Edited ${itemType} "${itemName}"`,
  data: previousData,
  rollback: () => restoreData(previousData),
});
