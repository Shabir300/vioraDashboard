import React from 'react';
import {
  Box,
  Container,
  Skeleton,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';

interface PipelineDetailSkeletonProps {
  stageCount?: number;
  cardsPerStage?: number;
}

export default function PipelineDetailSkeleton({ 
  stageCount = 4, 
  cardsPerStage = 3 
}: PipelineDetailSkeletonProps) {
  const theme = useTheme();

  return (
    <Container 
      maxWidth="xl" 
      sx={{ py: 3 }}
      role="status"
      aria-busy="true"
      aria-label="Loading pipeline details"
    >
      {/* Header Skeleton */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Skeleton variant="rectangular" width={140} height={36} />
          </Box>
          <Skeleton variant="text" width={280} height={48} sx={{ mb: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Skeleton variant="rounded" width={80} height={24} />
            <Skeleton variant="text" width={120} height={24} />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="rectangular" width={120} height={36} />
          <Skeleton variant="rectangular" width={100} height={36} />
        </Box>
      </Box>

      {/* Kanban Board Skeleton */}
      <Box sx={{ width: 'auto' }}>
        <Box sx={{ 
          overflowX: 'scroll',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            minWidth: 'max-content', 
            pb: 2,
            flexWrap: 'nowrap'
          }}>
            {Array.from({ length: stageCount }).map((_, stageIndex) => (
              <Box key={stageIndex} sx={{ minWidth: 300, flexShrink: 0 }}>
                <Card
                  sx={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    minHeight: 500,
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    {/* Stage Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Skeleton variant="circular" width={12} height={12} />
                        <Skeleton variant="text" width={120} height={24} />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Skeleton variant="rectangular" width={60} height={24} />
                        <Skeleton variant="circular" width={24} height={24} />
                      </Box>
                    </Box>

                    {/* Cards Skeleton */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {Array.from({ length: cardsPerStage }).map((_, cardIndex) => (
                        <Card
                          key={cardIndex}
                          sx={{
                            backgroundColor: theme.palette.background.default,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                            cursor: 'pointer',
                            opacity: 0.7,
                          }}
                        >
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Skeleton variant="text" width="70%" height={20} />
                              <Skeleton variant="circular" width={16} height={16} />
                            </Box>
                            
                            <Skeleton variant="text" width="90%" height={16} sx={{ mb: 1 }} />
                            <Skeleton variant="text" width="60%" height={16} sx={{ mb: 2 }} />
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Skeleton variant="rectangular" width={60} height={20} />
                              <Skeleton variant="text" width={80} height={16} />
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {/* Add Card Button Skeleton */}
                      <Skeleton 
                        variant="rectangular" 
                        width="100%" 
                        height={40} 
                        sx={{ borderRadius: 1, mt: 1 }} 
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
