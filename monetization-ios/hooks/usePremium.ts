// monetization-ios/hooks/usePremium.ts
// Enhanced Premium Hook for Devotional Apps

import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { RevenueCatService } from '../services/revenueCatService';
import type {
  SubscriptionStatus,
  PremiumFeatures,
  PurchaseResult,
  FormattedOfferings,
  DevotionalPremiumBenefits,
  SpiritualEngagementMetrics,
  MonetizationInsights,
} from '../types/subscription';

interface UsePremiumResult {
  // Premium status
  isPremium: boolean;
  isLoading: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  features: PremiumFeatures;
  devotionalBenefits: DevotionalPremiumBenefits | null;
  
  // Offerings and purchasing
  offerings: FormattedOfferings | null;
  loadingOfferings: boolean;
  purchaseProduct: (productPackage: any) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  getOfferings: () => Promise<any>;
  
  // Analytics and insights
  engagementMetrics: SpiritualEngagementMetrics;
  monetizationInsights: MonetizationInsights | null;
  trackEngagement: (eventType: string, data?: any) => Promise<void>;
  
  // Utilities
  refreshStatus: () => Promise<void>;
  error: string | null;
  lastUpdated: string;
}

export const usePremium = (): UsePremiumResult => {
  // State management
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [offerings, setOfferings] = useState<FormattedOfferings | null>(null);
  const [engagementMetrics, setEngagementMetrics] = useState<SpiritualEngagementMetrics>({
    devotional_streak: 0,
    weekly_completions: 0,
    monthly_completions: 0,
    favorite_verses_count: 0,
    shared_content_count: 0,
    reflection_responses: 0,
    prayer_requests_submitted: 0,
    community_interactions: 0,
  });
  const [monetizationInsights, setMonetizationInsights] = useState<MonetizationInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  
  // Service reference
  const [revenueCatService] = useState(() => RevenueCatService.getInstance());
  const isInitializing = useRef(false);

  /**
   * Initialize RevenueCat and load initial data
   */
  useEffect(() => {
    const initializePremium = async () => {
      if (isInitializing.current) return;
      isInitializing.current = true;

      try {
        console.log('[usePremium] 🚀 Initializing premium for devotional app...');
        setIsLoading(true);
        setError(null);

        // Configure RevenueCat
        await revenueCatService.configure();

        // Load initial data in parallel
        await Promise.all([
          loadPremiumStatus(),
          loadOfferings(),
          loadEngagementMetrics(),
        ]);

        // Load insights after we have the basic data
        await loadMonetizationInsights();

        console.log('[usePremium] ✅ Premium initialization complete');

      } catch (err: any) {
        console.error('[usePremium] ❌ Error initializing premium:', err);
        setError(err.message || 'Failed to initialize premium features');
      } finally {
        setIsLoading(false);
        isInitializing.current = false;
      }
    };

    initializePremium();
  }, [revenueCatService]);

  /**
   * Load premium status
   */
  const loadPremiumStatus = useCallback(async () => {
    try {
      console.log('[usePremium] 📊 Loading premium status...');
      
      const status = await revenueCatService.checkPremiumStatus();
      setSubscriptionStatus(status);
      setLastUpdated(new Date().toISOString());
      
      console.log('[usePremium] ✅ Premium status loaded:', {
        isActive: status.isActive,
        planType: status.planType,
      });

    } catch (err: any) {
      console.error('[usePremium] ❌ Error loading premium status:', err);
      setError(err.message || 'Failed to load premium status');
    }
  }, [revenueCatService]);

  /**
   * Load offerings
   */
  const loadOfferings = useCallback(async () => {
    try {
      setLoadingOfferings(true);
      console.log('[usePremium] 📦 Loading offerings...');
      
      await revenueCatService.loadOfferings();
      const formattedOfferings = revenueCatService.getFormattedOfferings();
      setOfferings(formattedOfferings);
      
      console.log('[usePremium] ✅ Offerings loaded:', {
        hasWeekly: !!formattedOfferings.weekly,
        hasMonthly: !!formattedOfferings.monthly,
        hasAnnual: !!formattedOfferings.annual,
      });

    } catch (err: any) {
      console.error('[usePremium] ❌ Error loading offerings:', err);
      setError(err.message || 'Failed to load subscription plans');
    } finally {
      setLoadingOfferings(false);
    }
  }, [revenueCatService]);

  /**
   * Load engagement metrics
   */
  const loadEngagementMetrics = useCallback(async () => {
    try {
      const metrics = revenueCatService.getEngagementMetrics();
      setEngagementMetrics(metrics);
      
      console.log('[usePremium] 📈 Engagement metrics loaded:', metrics);
    } catch (err: any) {
      console.error('[usePremium] ❌ Error loading engagement metrics:', err);
    }
  }, [revenueCatService]);

  /**
   * Load monetization insights
   */
  const loadMonetizationInsights = useCallback(async () => {
    try {
      const insights = await revenueCatService.getMonetizationInsights();
      setMonetizationInsights(insights);
      
      console.log('[usePremium] 🎯 Monetization insights loaded:', {
        userSegment: insights.user_segment,
        engagementLevel: insights.engagement_level,
        conversionProbability: insights.conversion_probability,
      });
    } catch (err: any) {
      console.error('[usePremium] ❌ Error loading monetization insights:', err);
    }
  }, [revenueCatService]);

  /**
   * Purchase a product
   */
  const purchaseProduct = useCallback(async (productPackage: any): Promise<boolean> => {
    try {
      setError(null);
      console.log('[usePremium] 💳 Starting purchase process...');

      const result: PurchaseResult = await revenueCatService.purchaseProduct(productPackage);

      if (result.success) {
        console.log('[usePremium] ✅ Purchase successful');
        
        // Refresh status immediately
        await loadPremiumStatus();
        await loadEngagementMetrics();
        await loadMonetizationInsights();
        
        return true;
      } else if (result.userCancelled) {
        console.log('[usePremium] ℹ️ Purchase cancelled by user');
        // Don't set error for cancellation
        return false;
      } else {
        console.error('[usePremium] ❌ Purchase failed:', result.error);
        setError(result.error || 'Purchase failed');
        return false;
      }

    } catch (err: any) {
      console.error('[usePremium] ❌ Error in purchase process:', err);
      setError(err.message || 'Purchase error');
      return false;
    }
  }, [revenueCatService, loadPremiumStatus, loadEngagementMetrics, loadMonetizationInsights]);

  /**
   * Restore purchases
   */
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      console.log('[usePremium] 🔄 Restoring purchases...');

      const result: PurchaseResult = await revenueCatService.restorePurchases();

      if (result.success) {
        console.log('[usePremium] ✅ Purchases restored successfully');
        
        // Refresh status
        await loadPremiumStatus();
        await loadEngagementMetrics();
        
        return true;
      } else {
        console.log('[usePremium] ℹ️ No purchases to restore');
        setError(result.error || 'No purchases found to restore');
        return false;
      }

    } catch (err: any) {
      console.error('[usePremium] ❌ Error restoring purchases:', err);
      setError(err.message || 'Failed to restore purchases');
      return false;
    }
  }, [revenueCatService, loadPremiumStatus, loadEngagementMetrics]);

  /**
   * Get offerings (compatibility method)
   */
  const getOfferings = useCallback(async () => {
    try {
      return await revenueCatService.getOfferings();
    } catch (err: any) {
      console.error('[usePremium] ❌ Error getting offerings:', err);
      setError(err.message || 'Failed to get offerings');
      return null;
    }
  }, [revenueCatService]);

  /**
   * Track spiritual engagement event
   */
  const trackEngagement = useCallback(async (eventType: string, data: any = {}) => {
    try {
      await revenueCatService.trackEngagementEvent(eventType, data);
      
      // Refresh metrics
      await loadEngagementMetrics();
      
      // Update insights if significant engagement
      if (['devotional_completed', 'verse_favorited', 'content_shared'].includes(eventType)) {
        await loadMonetizationInsights();
      }
      
    } catch (err: any) {
      console.error('[usePremium] ❌ Error tracking engagement:', err);
    }
  }, [revenueCatService, loadEngagementMetrics, loadMonetizationInsights]);

  /**
   * Refresh all premium data
   */
  const refreshStatus = useCallback(async () => {
    try {
      setError(null);
      console.log('[usePremium] 🔄 Refreshing premium status...');
      
      await Promise.all([
        loadPremiumStatus(),
        loadEngagementMetrics(),
      ]);
      
      // Refresh insights after basic data
      await loadMonetizationInsights();
      
    } catch (err: any) {
      console.error('[usePremium] ❌ Error refreshing status:', err);
      setError(err.message || 'Failed to refresh status');
    }
  }, [loadPremiumStatus, loadEngagementMetrics, loadMonetizationInsights]);

  /**
   * Listen for app state changes
   */
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[usePremium] 🔄 App active - refreshing premium status...');
        
        // Refresh status when app comes to foreground
        setTimeout(async () => {
          try {
            await refreshStatus();
          } catch (err: any) {
            console.error('[usePremium] ❌ Error refreshing on app active:', err);
          }
        }, 1000); // Small delay to ensure services are ready
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [refreshStatus]);

  /**
   * Set up customer info listener
   */
  useEffect(() => {
    let removeListener: (() => void) | null = null;

    const setupListener = () => {
      try {
        removeListener = revenueCatService.listenCustomerUpdates((customerInfo) => {
          console.log('[usePremium] 📱 Customer info updated');
          
          // Refresh status when customer info changes
          setTimeout(() => {
            loadPremiumStatus();
          }, 500);
        });
      } catch (err: any) {
        console.error('[usePremium] ❌ Error setting up customer listener:', err);
      }
    };

    // Set up listener after initialization
    if (!isLoading) {
      setupListener();
    }

    return () => {
      if (removeListener) {
        removeListener();
      }
    };
  }, [isLoading, revenueCatService, loadPremiumStatus]);

  // Computed values
  const isPremium = subscriptionStatus?.isActive || false;
  const features = subscriptionStatus?.features || {
    unlimitedDevotionals: false,
    extendedMensGuide: false,
    allSituations: false,
    noAds: false,
    offlineReading: false,
    personalizedContent: false,
    exportFeatures: false,
    prioritySupport: false,
    mensGroupSharing: false,
    weeklyReflectionPrompts: false,
    scripturalCrossReferences: false,
    dailyPrayerGuides: false,
    fatherhoodContent: false,
    leadershipInsights: false,
  };

  const devotionalBenefits = subscriptionStatus 
    ? revenueCatService.getDevotionalPremiumBenefits(subscriptionStatus.planType)
    : null;

  return {
    // Premium status
    isPremium,
    isLoading,
    subscriptionStatus,
    features,
    devotionalBenefits,
    
    // Offerings and purchasing
    offerings,
    loadingOfferings,
    purchaseProduct,
    restorePurchases,
    getOfferings,
    
    // Analytics and insights
    engagementMetrics,
    monetizationInsights,
    trackEngagement,
    
    // Utilities
    refreshStatus,
    error,
    lastUpdated,
  };
};

export default usePremium;
