// monetization-ios/hooks/useBannerAds.ts
// Enhanced Banner Ads Hook for Devotional Apps

import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { AdMobService } from '../services/adMobService';
import { ATTService } from '../services/attService';
import { MONETIZATION_CONFIG } from '../config/constants';
import type { BannerAdConfig } from '../types/subscription';

interface UseBannerAdsOptions {
  location: string;
  enabled?: boolean;
  onAdLoaded?: () => void;
  onAdError?: (error: string) => void;
  onAdOpened?: () => void;
  onAdClosed?: () => void;
}

interface UseBannerAdsResult {
  adUnitId: string | null;
  shouldShowBanner: boolean;
  isLoading: boolean;
  error: string | null;
  refreshBanner: () => void;
  adRequestOptions: {
    requestNonPersonalizedAdsOnly: boolean;
    limitAdTracking: boolean;
  };
}

export const useBannerAds = (options: UseBannerAdsOptions): UseBannerAdsResult => {
  const {
    location,
    enabled = true,
    onAdLoaded,
    onAdError,
    onAdOpened,
    onAdClosed,
  } = options;

  // State
  const [shouldShowBanner, setShouldShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adUnitId, setAdUnitId] = useState<string | null>(null);
  const [adRequestOptions, setAdRequestOptions] = useState({
    requestNonPersonalizedAdsOnly: true,
    limitAdTracking: true,
  });

  // Services
  const [adMobService] = useState(() => AdMobService.getInstance());
  const [attService] = useState(() => ATTService.getInstance());

  /**
   * Initialize and check if banner should be shown
   */
  useEffect(() => {
    const initializeBannerAds = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`[useBannerAds] 🚀 Initializing banner ads for location: ${location}`);

        // Initialize services if needed
        if (!AdMobService.isAvailable()) {
          console.log('[useBannerAds] ⚠️ AdMob not available');
          setShouldShowBanner(false);
          setIsLoading(false);
          return;
        }

        await adMobService.initialize();
        await attService.initialize();

        // Check if this location should show banner ads
        await checkBannerEligibility();

        console.log(`[useBannerAds] ✅ Banner ads initialized for ${location}`);

      } catch (err: any) {
        console.error('[useBannerAds] ❌ Error initializing banner ads:', err);
        setError(err.message || 'Failed to initialize banner ads');
        setShouldShowBanner(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeBannerAds();
  }, [location, adMobService, attService]);

  /**
   * Check if banner ads should be shown for this location
   */
  const checkBannerEligibility = useCallback(async () => {
    try {
      console.log(`[useBannerAds] 🔍 Checking banner eligibility for: ${location}`);

      // Check if ads are enabled
      if (!enabled || !MONETIZATION_CONFIG.ADS.BANNER.ENABLED) {
        console.log('[useBannerAds] 🚫 Banner ads disabled');
        setShouldShowBanner(false);
        return;
      }

      // Check location-specific rules for devotional app
      if (!isLocationAllowedForBanners(location)) {
        console.log(`[useBannerAds] 🚫 Location ${location} not allowed for banner ads`);
        setShouldShowBanner(false);
        return;
      }

      // Get ads status from AdMobService
      const adsStatus = await adMobService.getAdsStatus();
      
      // Check premium status
      if (adsStatus.userIsPremium) {
        console.log('[useBannerAds] 👑 User is premium - no banner ads');
        setShouldShowBanner(false);
        return;
      }

      // Check if banner ads are enabled
      if (!adsStatus.bannerAds) {
        console.log('[useBannerAds] 🚫 Banner ads disabled by service');
        setShouldShowBanner(false);
        return;
      }

      // Get ATT status and ad request options
      const attConfig = await attService.getAdRequestConfig();
      setAdRequestOptions(attConfig);

      // Check if we can show ads (even non-personalized)
      const canShowAds = await attService.shouldShowAds();
      if (!canShowAds && !canShowNonPersonalizedAds()) {
        console.log('[useBannerAds] 🔒 ATT blocks all ads');
        setShouldShowBanner(false);
        return;
      }

      // Set ad unit ID
      const unitId = adMobService.getBannerAdUnitId();
      setAdUnitId(unitId);

      // All checks passed
      setShouldShowBanner(true);
      
      console.log(`[useBannerAds] ✅ Banner ads approved for ${location}:`, {
        isPremium: adsStatus.userIsPremium,
        canShowAds,
        adUnitId: unitId,
        requestNonPersonalized: attConfig.requestNonPersonalizedAdsOnly,
      });

    } catch (err: any) {
      console.error('[useBannerAds] ❌ Error checking banner eligibility:', err);
      setError(err.message || 'Failed to check banner eligibility');
      setShouldShowBanner(false);
    }
  }, [location, enabled, adMobService, attService]);

  /**
   * Check if location is allowed for banner ads in devotional context
   */
  const isLocationAllowedForBanners = (loc: string): boolean => {
    const locationConfig = MONETIZATION_CONFIG.ADS.BANNER.LOCATIONS;
    const locationKey = loc.toUpperCase() as keyof typeof locationConfig;
    
    // Default to false for unknown locations (safe for devotional content)
    return locationConfig[locationKey] || false;
  };

  /**
   * Check if non-personalized ads can be shown for devotional apps
   */
  const canShowNonPersonalizedAds = (): boolean => {
    // For devotional apps, we can show family-friendly, non-personalized ads
    // even without full ATT authorization
    return true;
  };

  /**
   * Refresh banner ad eligibility
   */
  const refreshBanner = useCallback(() => {
    console.log(`[useBannerAds] 🔄 Refreshing banner for ${location}...`);
    checkBannerEligibility();
  }, [checkBannerEligibility, location]);

  /**
   * Listen for premium status changes
   */
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const adsStatus = await adMobService.getAdsStatus();
        if (adsStatus.userIsPremium && shouldShowBanner) {
          console.log('[useBannerAds] 👑 User became premium - hiding banner');
          setShouldShowBanner(false);
        } else if (!adsStatus.userIsPremium && !shouldShowBanner && enabled) {
          console.log('[useBannerAds] 🔄 User no longer premium - checking banner eligibility');
          await checkBannerEligibility();
        }
      } catch (err: any) {
        console.error('[useBannerAds] ❌ Error checking premium status:', err);
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkPremiumStatus, 30000);
    return () => clearInterval(interval);
  }, [shouldShowBanner, enabled, adMobService, checkBannerEligibility]);

  /**
   * Handle ad events with devotional app considerations
   */
  useEffect(() => {
    if (shouldShowBanner) {
      // Set up ad event tracking
      console.log(`[useBannerAds] 📱 Banner ad ready for ${location}`);
      
      // Call onAdLoaded if banner is ready
      onAdLoaded?.();
    }
  }, [shouldShowBanner, location, onAdLoaded]);

  /**
   * Log banner ad activity for devotional app analytics
   */
  useEffect(() => {
    if (shouldShowBanner && adUnitId) {
      console.log(`[useBannerAds] 📊 Banner ad shown for devotional location: ${location}`, {
        adUnitId,
        location,
        requestNonPersonalized: adRequestOptions.requestNonPersonalizedAdsOnly,
        timestamp: new Date().toISOString(),
      });
      
      // Here you could track to analytics service
      // Analytics.track('banner_ad_shown', { location, adUnitId });
    }
  }, [shouldShowBanner, adUnitId, location, adRequestOptions]);

  return {
    adUnitId,
    shouldShowBanner,
    isLoading,
    error,
    refreshBanner,
    adRequestOptions,
  };
};

export default useBannerAds;
