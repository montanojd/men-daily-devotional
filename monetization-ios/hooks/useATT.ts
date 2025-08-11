// monetization-ios/hooks/useATT.ts
// Enhanced ATT Hook for Devotional Apps

import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ATTService } from '../services/attService';
import type { ATTStatus } from '../types/subscription';

interface UseATTResult {
  status: ATTStatus['status'];
  isLoading: boolean;
  shouldShowAds: boolean;
  canTrack: boolean;
  requestTracking: () => Promise<void>;
  shouldShowATTPrompt: () => Promise<boolean>;
  getPrivacyMessage: () => {
    title: string;
    message: string;
    benefits: string[];
  };
  getStatusDescription: (status?: ATTStatus['status']) => string;
  lastChecked: string;
  error: string | null;
}

export const useATT = (): UseATTResult => {
  const [attStatus, setAttStatus] = useState<ATTStatus>({
    status: 'not-determined',
    isLoading: false,
    shouldShowAds: false,
    canTrack: false,
    lastChecked: new Date().toISOString(),
  });
  const [error, setError] = useState<string | null>(null);
  const [attService] = useState(() => ATTService.getInstance());

  /**
   * Initialize ATT service and load status
   */
  useEffect(() => {
    const initializeATT = async () => {
      try {
        console.log('[useATT] 🚀 Initializing ATT for devotional app...');
        
        await attService.initialize();
        const status = await attService.getStatus();
        
        setAttStatus(status);
        setError(null);
        
        console.log('[useATT] ✅ ATT initialized:', status);
      } catch (err: any) {
        console.error('[useATT] ❌ Error initializing ATT:', err);
        setError(err.message || 'Failed to initialize ATT');
        
        // Set fallback status
        setAttStatus({
          status: 'not-determined',
          isLoading: false,
          shouldShowAds: false,
          canTrack: false,
          lastChecked: new Date().toISOString(),
        });
      }
    };

    initializeATT();
  }, [attService]);

  /**
   * Request tracking permission with devotional app context
   */
  const requestTracking = useCallback(async () => {
    try {
      setError(null);
      setAttStatus(prev => ({ ...prev, isLoading: true }));
      
      console.log('[useATT] 🙏 Requesting tracking permission...');
      
      const newStatus = await attService.requestTrackingPermission();
      const fullStatus = await attService.getStatus();
      
      setAttStatus(fullStatus);
      
      console.log('[useATT] ✅ Permission request completed:', newStatus);
      
    } catch (err: any) {
      console.error('[useATT] ❌ Error requesting permission:', err);
      setError(err.message || 'Failed to request tracking permission');
      setAttStatus(prev => ({ ...prev, isLoading: false }));
    }
  }, [attService]);

  /**
   * Check if ATT prompt should be shown
   */
  const shouldShowATTPrompt = useCallback(async (): Promise<boolean> => {
    try {
      return await attService.shouldShowATTPrompt();
    } catch (err: any) {
      console.error('[useATT] ❌ Error checking prompt status:', err);
      return false;
    }
  }, [attService]);

  /**
   * Get privacy message for devotional context
   */
  const getPrivacyMessage = useCallback(() => {
    return attService.getPrivacyMessage();
  }, [attService]);

  /**
   * Get status description
   */
  const getStatusDescription = useCallback((status?: ATTStatus['status']) => {
    return attService.getStatusDescription(status || attStatus.status);
  }, [attService, attStatus.status]);

  /**
   * Listen for app state changes to refresh status
   */
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        try {
          // Refresh status when app comes to foreground
          const status = await attService.getStatus();
          setAttStatus(status);
        } catch (err: any) {
          console.error('[useATT] ❌ Error refreshing status on app active:', err);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [attService]);

  /**
   * Periodic status refresh for long-running sessions
   */
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        const status = await attService.getStatus();
        setAttStatus(status);
      } catch (err: any) {
        console.error('[useATT] ❌ Error in periodic refresh:', err);
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [attService]);

  return {
    status: attStatus.status,
    isLoading: attStatus.isLoading,
    shouldShowAds: attStatus.shouldShowAds,
    canTrack: attStatus.canTrack,
    requestTracking,
    shouldShowATTPrompt,
    getPrivacyMessage,
    getStatusDescription,
    lastChecked: attStatus.lastChecked,
    error,
  };
};

export default useATT;
