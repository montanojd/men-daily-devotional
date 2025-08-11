// monetization-ios/hooks/useInterstitialAds.ts
// Enhanced Interstitial Ads Hook for Devotional Apps

import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdMobService } from '../services/adMobService';
import { ATTService } from '../services/attService';
import { MONETIZATION_CONFIG } from '../config/constants';

// Storage keys
const INTERACTION_COUNT_KEY = '@devotional_interstitial_interactions';
const ADS_SHOWN_COUNT_KEY = '@devotional_interstitial_ads_shown';
const LAST_AD_TIME_KEY = '@devotional_interstitial_last_ad_time';

interface UseInterstitialAdsOptions {
  enabled?: boolean;
  onAdShown?: () => void;
  onAdDismissed?: () => void;
  onAdError?: (error: string) => void;
  interactionThreshold?: number;
  respectfulTiming?: boolean;
}

interface InterstitialStats {
  totalInteractions: number;
  adsShown: number;
  lastAdTime: number | null;
  isInCooldown: boolean;
  timeUntilNextAd: number;
  currentInteractionCount: number;
  interactionsUntilNext: number;
  canShowAd: boolean;
}

interface UseInterstitialAdsResult {
  // Core functionality
  trackInteraction: (triggerType: string, weight?: number) => Promise<boolean>;
  showAd: (reason?: string) => Promise<boolean>;
  canShow: boolean;
  
  // Status
  isLoaded: boolean;
  isLoading: boolean;
  isShowing: boolean;
  
  // Statistics
  stats: InterstitialStats;
  
  // Utilities
  resetStats: () => Promise<void>;
  forceShowAd: () => Promise<boolean>; // Dev only
  
  // Error handling
  error: string | null;
}

export const useInterstitialAds = (options: UseInterstitialAdsOptions = {}): UseInterstitialAdsResult => {
  const {
    enabled = true,
    onAdShown,
    onAdDismissed,
    onAdError,
    interactionThreshold = MONETIZATION_CONFIG.ADS.INTERSTITIAL.MIN_INTERACTION_THRESHOLD,
    respectfulTiming = true,
  } = options;

  // State
  const [currentInteractionCount, setCurrentInteractionCount] = useState(0);
  const [adsShown, setAdsShown] = useState(0);
  const [lastAdTime, setLastAdTime] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const [canShow, setCanShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Services
  const [adMobService] = useState(() => AdMobService.getInstance());
  const [attService] = useState(() => ATTService.getInstance());
  
  // Refs
  const isShowingRef = useRef(false);
  const isInitialized = useRef(false);

  /**
   * Initialize interstitial ads
   */
  useEffect(() => {
    const initializeInterstitialAds = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      try {
        console.log('[useInterstitialAds] 🚀 Initializing for devotional app...');
        setIsLoading(true);
        setError(null);

        // Check if AdMob is available
        if (!AdMobService.isAvailable()) {
          console.log('[useInterstitialAds] ⚠️ AdMob not available');
          setCanShow(false);
          setIsLoading(false);
          return;
        }

        // Initialize services
        await adMobService.initialize();
        await attService.initialize();

        // Load saved state
        await loadState();

        // Check initial eligibility
        await checkAdEligibility();

        console.log('[useInterstitialAds] ✅ Initialization complete');

      } catch (err: any) {
        console.error('[useInterstitialAds] ❌ Error initializing:', err);
        setError(err.message || 'Failed to initialize interstitial ads');
        setCanShow(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (enabled) {
      initializeInterstitialAds();
    }
  }, [enabled, adMobService, attService]);

  /**
   * Load saved state from storage
   */
  const loadState = useCallback(async () => {
    try {
      const [storedCount, storedAdsShown, storedLastAdTime] = await Promise.all([
        AsyncStorage.getItem(INTERACTION_COUNT_KEY),
        AsyncStorage.getItem(ADS_SHOWN_COUNT_KEY),
        AsyncStorage.getItem(LAST_AD_TIME_KEY),
      ]);

      if (storedCount !== null) {
        setCurrentInteractionCount(parseInt(storedCount, 10));
      }
      if (storedAdsShown !== null) {
        setAdsShown(parseInt(storedAdsShown, 10));
      }
      if (storedLastAdTime !== null) {
        setLastAdTime(parseInt(storedLastAdTime, 10));
      }

      console.log('[useInterstitialAds] 📱 State loaded:', {
        interactions: parseInt(storedCount || '0', 10),
        adsShown: parseInt(storedAdsShown || '0', 10),
        lastAdTime: storedLastAdTime,
      });
    } catch (err: any) {
      console.error('[useInterstitialAds] ❌ Error loading state:', err);
    }
  }, []);

  /**
   * Save state to storage
   */
  const saveState = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(INTERACTION_COUNT_KEY, currentInteractionCount.toString()),
        AsyncStorage.setItem(ADS_SHOWN_COUNT_KEY, adsShown.toString()),
        lastAdTime !== null ? AsyncStorage.setItem(LAST_AD_TIME_KEY, lastAdTime.toString()) : Promise.resolve(),
      ]);
    } catch (err: any) {
      console.error('[useInterstitialAds] ❌ Error saving state:', err);
    }
  }, [currentInteractionCount, adsShown, lastAdTime]);

  /**
   * Check if interstitial ads can be shown
   */
  const checkAdEligibility = useCallback(async () => {
    try {
      if (!enabled) {
        setCanShow(false);
        return;
      }

      // Get ads status
      const adsStatus = await adMobService.getAdsStatus();
      
      // Check premium status
      if (adsStatus.userIsPremium) {
        setCanShow(false);
        return;
      }

      // Check if interstitial ads are enabled
      if (!adsStatus.interstitialAds) {
        setCanShow(false);
        return;
      }

      // Check ATT status
      const canShowAds = await attService.shouldShowAds();
      if (!canShowAds) {
        setCanShow(false);
        return;
      }

      // Check daily limit
      if (adsShown >= MONETIZATION_CONFIG.ADS.INTERSTITIAL.MAX_PER_DAY) {
        setCanShow(false);
        return;
      }

      // Check cooldown
      const cooldown = MONETIZATION_CONFIG.ADS.INTERSTITIAL.COOLDOWN_PERIOD;
      if (lastAdTime && (Date.now() - lastAdTime) < cooldown) {
        setCanShow(false);
        return;
      }

      // Check interaction threshold
      if (currentInteractionCount < interactionThreshold) {
        setCanShow(false);
        return;
      }

      // Check respectful timing for devotional apps
      if (respectfulTiming && !isRespectfulTimingForAd()) {
        setCanShow(false);
        return;
      }

      setCanShow(true);
      
    } catch (err: any) {
      console.error('[useInterstitialAds] ❌ Error checking eligibility:', err);
      setCanShow(false);
    }
  }, [enabled, adsShown, lastAdTime, currentInteractionCount, interactionThreshold, respectfulTiming, adMobService, attService]);

  /**
   * Check if timing is respectful for devotional context
   */
  const isRespectfulTimingForAd = useCallback((): boolean => {
    const hour = new Date().getHours();
    
    // Respect quiet hours for morning devotions
    const quietHours = MONETIZATION_CONFIG.ADS.APP_OPEN.QUIET_HOURS;
    if (quietHours?.enabled) {
      if (hour >= quietHours.start && hour <= quietHours.end) {
        console.log('[useInterstitialAds] 🌅 In morning devotion quiet hours');
        return false;
      }
    }

    // Late evening/early morning - people might be praying
    if (hour >= 22 || hour <= 5) {
      console.log('[useInterstitialAds] 🌙 Late night/early morning - respectful timing');
      return false;
    }

    return true;
  }, []);

  /**
   * Track spiritual interaction with weighted triggers
   */
  const trackInteraction = useCallback(async (triggerType: string, weight: number = 1): Promise<boolean> => {
    try {
      console.log(`[useInterstitialAds] 🎯 Tracking interaction: ${triggerType} (weight: ${weight})`);

      if (!enabled) {
        console.log('[useInterstitialAds] 🚫 Hook disabled');
        return false;
      }

      // Check trigger configuration
      const triggers = MONETIZATION_CONFIG.ADS.INTERSTITIAL.TRIGGERS;
      const triggerKey = triggerType.toUpperCase() as keyof typeof triggers;
      const triggerConfig = triggers[triggerKey];
      
      if (triggerConfig && !triggerConfig.enabled) {
        console.log(`[useInterstitialAds] 🚫 Trigger ${triggerType} disabled`);
        return false;
      }

      // Apply weight from configuration if available
      const finalWeight = triggerConfig ? triggerConfig.weight * weight : weight;
      
      // Increment interaction count
      const newCount = currentInteractionCount + finalWeight;
      setCurrentInteractionCount(newCount);
      
      console.log(`[useInterstitialAds] 📈 Interaction count: ${newCount} (added ${finalWeight})`);

      // Check if we should show an ad
      await checkAdEligibility();
      
      if (canShow && newCount >= interactionThreshold) {
        console.log('[useInterstitialAds] 🎯 Threshold reached - attempting to show ad');
        
        // Apply delay from trigger configuration
        const delay = triggerConfig?.delay || 1000;
        
        setTimeout(async () => {
          const success = await showAd(`triggered_by_${triggerType}`);
          if (success) {
            // Reset interaction count on successful ad show
            setCurrentInteractionCount(0);
          }
        }, delay);
        
        return true;
      }

      return false;

    } catch (err: any) {
      console.error('[useInterstitialAds] ❌ Error tracking interaction:', err);
      setError(err.message);
      return false;
    }
  }, [enabled, currentInteractionCount, interactionThreshold, canShow]);

  /**
   * Show interstitial ad
   */
  const showAd = useCallback(async (reason: string = 'manual'): Promise<boolean> => {
    if (isShowingRef.current) {
      console.log('[useInterstitialAds] ⚠️ Ad already showing');
      return false;
    }

    try {
      isShowingRef.current = true;
      setIsShowing(true);
      setError(null);
      
      console.log(`[useInterstitialAds] 📱 Attempting to show ad (reason: ${reason})`);

      // Use AdMobService robust show method
      const success = await adMobService.showInterstitialWithRobustChecks();

      if (success) {
        console.log('[useInterstitialAds] ✅ Ad shown successfully');
        
        // Update statistics
        setAdsShown(prev => prev + 1);
        setLastAdTime(Date.now());
        setCurrentInteractionCount(0); // Reset interaction count
        
        // Call callback
        onAdShown?.();
        
        return true;
      } else {
        console.log('[useInterstitialAds] ❌ Failed to show ad');
        setError('Failed to show ad');
        onAdError?.('Failed to show ad');
        return false;
      }

    } catch (err: any) {
      console.error('[useInterstitialAds] ❌ Error showing ad:', err);
      setError(err.message);
      onAdError?.(err.message);
      return false;
    } finally {
      isShowingRef.current = false;
      setIsShowing(false);
      onAdDismissed?.();
      
      // Refresh eligibility after ad attempt
      setTimeout(() => checkAdEligibility(), 1000);
    }
  }, [adMobService, onAdShown, onAdError, onAdDismissed, checkAdEligibility]);

  /**
   * Force show ad for testing (dev only)
   */
  const forceShowAd = useCallback(async (): Promise<boolean> => {
    if (!__DEV__) {
      console.warn('[useInterstitialAds] ⚠️ Force show only available in development');
      return false;
    }

    try {
      console.log('[useInterstitialAds] 🧪 FORCING AD FOR TESTING');
      
      const success = await adMobService.forceShowInterstitialForTesting();
      
      if (success) {
        setAdsShown(prev => prev + 1);
        setLastAdTime(Date.now());
        setCurrentInteractionCount(0);
        onAdShown?.();
      }
      
      return success;
      
    } catch (err: any) {
      console.error('[useInterstitialAds] ❌ Error forcing ad:', err);
      return false;
    }
  }, [adMobService, onAdShown]);

  /**
   * Reset statistics
   */
  const resetStats = useCallback(async () => {
    try {
      setCurrentInteractionCount(0);
      setAdsShown(0);
      setLastAdTime(null);
      setError(null);

      await Promise.all([
        AsyncStorage.removeItem(INTERACTION_COUNT_KEY),
        AsyncStorage.removeItem(ADS_SHOWN_COUNT_KEY),
        AsyncStorage.removeItem(LAST_AD_TIME_KEY),
      ]);

      console.log('[useInterstitialAds] 🔄 Statistics reset');
    } catch (err: any) {
      console.error('[useInterstitialAds] ❌ Error resetting statistics:', err);
    }
  }, []);

  /**
   * Save state whenever relevant values change
   */
  useEffect(() => {
    if (isInitialized.current) {
      saveState();
    }
  }, [currentInteractionCount, adsShown, lastAdTime, saveState]);

  /**
   * Refresh eligibility periodically
   */
  useEffect(() => {
    const interval = setInterval(() => {
      checkAdEligibility();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [checkAdEligibility]);

  /**
   * Listen for app state changes
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[useInterstitialAds] 🔄 App active - refreshing eligibility');
        setTimeout(() => checkAdEligibility(), 1000);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [checkAdEligibility]);

  // Calculate statistics
  const stats: InterstitialStats = {
    totalInteractions: currentInteractionCount,
    adsShown,
    lastAdTime,
    isInCooldown: lastAdTime ? (Date.now() - lastAdTime) < MONETIZATION_CONFIG.ADS.INTERSTITIAL.COOLDOWN_PERIOD : false,
    timeUntilNextAd: lastAdTime ? Math.max(0, MONETIZATION_CONFIG.ADS.INTERSTITIAL.COOLDOWN_PERIOD - (Date.now() - lastAdTime)) : 0,
    currentInteractionCount,
    interactionsUntilNext: Math.max(0, interactionThreshold - currentInteractionCount),
    canShowAd: canShow,
  };

  return {
    // Core functionality
    trackInteraction,
    showAd,
    canShow,
    
    // Status
    isLoaded: true, // Always true once initialized
    isLoading,
    isShowing,
    
    // Statistics
    stats,
    
    // Utilities
    resetStats,
    forceShowAd,
    
    // Error handling
    error,
  };
};

export default useInterstitialAds;
