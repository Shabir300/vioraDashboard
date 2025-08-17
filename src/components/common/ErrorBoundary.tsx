"use client";

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Container,
  Paper,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const theme = useTheme();

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: 'center',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: theme.shape.borderRadius,
        }}
      >
        <Box sx={{ mb: 3 }}>
          <ErrorIcon
            sx={{
              fontSize: '4rem',
              color: theme.palette.error.main,
              mb: 2,
            }}
          />
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              mb: 1,
            }}
          >
            Something went wrong
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              mb: 3,
            }}
          >
            We're sorry, but an unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={onReset}
            sx={{
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
              mr: 2,
            }}
          >
            Try Again
          </Button>
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
            sx={{
              borderColor: theme.palette.divider,
              color: theme.palette.text.secondary,
              '&:hover': {
                borderColor: theme.palette.text.secondary,
              },
            }}
          >
            Refresh Page
          </Button>
        </Box>

        {isDevelopment && error && (
          <Alert
            severity="error"
            icon={<BugReportIcon />}
            sx={{
              textAlign: 'left',
              mt: 3,
              backgroundColor: theme.palette.error.light + '10',
              '& .MuiAlert-icon': {
                color: theme.palette.error.main,
              },
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Development Error Details:
            </Typography>
            <Typography
              variant="body2"
              component="pre"
              sx={{
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                backgroundColor: theme.palette.background.paper,
                p: 2,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {error.stack}
            </Typography>
          </Alert>
        )}
      </Paper>
    </Container>
  );
}

export default ErrorBoundary;
