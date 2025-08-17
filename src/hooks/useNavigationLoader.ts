import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NavigationLoaderOptions {
  /** Minimum time to show loading state (prevents flicker) */
  minLoadingTime?: number;
  /** Threshold before showing skeleton instead of spinner */
  skeletonThreshold?: number;
}

export function useNavigationLoader(options: NavigationLoaderOptions = {}) {
  const {
    minLoadingTime = 300,
    skeletonThreshold = 500,
  } = options;

  const router = useRouter();
  const [loadingState, setLoadingState] = useState<{
    isLoading: boolean;
    loadingId: string | null;
    showSkeleton: boolean;
  }>({
    isLoading: false,
    loadingId: null,
    showSkeleton: false,
  });

  const loadingStartTime = useRef<number>(0);
  const skeletonTimer = useRef<NodeJS.Timeout>();
  const minLoadingTimer = useRef<NodeJS.Timeout>();

  const navigateWithLoader = useCallback(async (
    id: string,
    url: string,
    onNavigate?: () => Promise<void> | void
  ) => {
    // Clear any existing timers
    if (skeletonTimer.current) {
      clearTimeout(skeletonTimer.current);
    }
    if (minLoadingTimer.current) {
      clearTimeout(minLoadingTimer.current);
    }

    // Start loading state
    loadingStartTime.current = Date.now();
    setLoadingState({
      isLoading: true,
      loadingId: id,
      showSkeleton: false,
    });

    // Set skeleton threshold timer
    skeletonTimer.current = setTimeout(() => {
      setLoadingState(prev => ({
        ...prev,
        showSkeleton: true,
      }));
    }, skeletonThreshold);

    try {
      // Execute any pre-navigation logic
      if (onNavigate) {
        await onNavigate();
      }

      // Navigate
      router.push(url);

      // Ensure minimum loading time for smooth UX
      const elapsedTime = Date.now() - loadingStartTime.current;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      if (remainingTime > 0) {
        minLoadingTimer.current = setTimeout(() => {
          setLoadingState({
            isLoading: false,
            loadingId: null,
            showSkeleton: false,
          });
        }, remainingTime);
      } else {
        setLoadingState({
          isLoading: false,
          loadingId: null,
          showSkeleton: false,
        });
      }
    } catch (error) {
      console.error('Navigation error:', error);
      setLoadingState({
        isLoading: false,
        loadingId: null,
        showSkeleton: false,
      });
    }
  }, [router, minLoadingTime, skeletonThreshold]);

  const cancelLoading = useCallback(() => {
    if (skeletonTimer.current) {
      clearTimeout(skeletonTimer.current);
    }
    if (minLoadingTimer.current) {
      clearTimeout(minLoadingTimer.current);
    }
    
    setLoadingState({
      isLoading: false,
      loadingId: null,
      showSkeleton: false,
    });
  }, []);

  const isItemLoading = useCallback((id: string) => {
    return loadingState.isLoading && loadingState.loadingId === id;
  }, [loadingState]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (skeletonTimer.current) {
        clearTimeout(skeletonTimer.current);
      }
      if (minLoadingTimer.current) {
        clearTimeout(minLoadingTimer.current);
      }
    };
  }, []);

  return {
    loadingState,
    navigateWithLoader,
    cancelLoading,
    isItemLoading,
    isGlobalLoading: loadingState.isLoading,
    showSkeleton: loadingState.showSkeleton,
  };
}
