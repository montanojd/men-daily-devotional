// monetization-ios/components/ads/BannerAd.tsx
// Enhanced Banner Ad Component for Devotional Apps

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useBannerAds } from '../../hooks/useBannerAds';
import { MONETIZATION_CONFIG } from '../../config/constants';

// Type-safe imports for AdMob
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;
let isAdMobAvailable = false;

try {
  const GoogleMobileAds = require('react-native-google-mobile-ads');
  BannerAd = GoogleMobileAds.BannerAd;
  BannerAdSize = GoogleMobileAds.BannerAdSize;
  TestIds = GoogleMobileAds.TestIds;
  isAdMobAvailable = true;
} catch (error) {
  console.warn('[BannerAdComponent] ⚠️ react-native-google-mobile-ads not available');
  isAdMobAvailable = false;
}

interface BannerAdProps {
  location: string;
  size?: any; // BannerAdSize
  style?: ViewStyle;
  onAdLoaded?: () => void;
  onAdError?: (error: string) => void;
  onAdOpened?: () => void;
  onAdClosed?: () => void;
  onAdClicked?: () => void;
  enabled?: boolean;
  respectfulPlacement?: boolean;
}

export const BannerAdComponent: React.FC<BannerAdProps> = ({
  location,
  size = BannerAdSize?.BANNER,
  style,
  onAdLoaded,
  onAdError,
  onAdOpened,
  onAdClosed,
  onAdClicked,
  enabled = true,
  respectfulPlacement = true,
}) => {
  // State
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [adHeight, setAdHeight] = useState(60); // Default height

  // Use banner ads hook
  const {
    adUnitId,
    shouldShowBanner,
    isLoading,
    error,
    refreshBanner,
    adRequestOptions,
  } = useBannerAds({
    location,
    enabled,
    onAdLoaded: () => {
      setIsVisible(true);
      setHasError(false);
      onAdLoaded?.();
      console.log(`[BannerAd] ✅ Ad loaded for ${location}`);
    },
    onAdError: (errorMsg) => {
      setHasError(true);
      setIsVisible(false);
      onAdError?.(errorMsg);
      console.error(`[BannerAd] ❌ Ad error for ${location}:`, errorMsg);
    },
    onAdOpened: () => {
      onAdOpened?.();
      console.log(`[BannerAd] 👁️ Ad opened for ${location}`);
    },
    onAdClosed: () => {
      onAdClosed?.();
      console.log(`[BannerAd] ✅ Ad closed for ${location}`);
    },
  });

  /**
   * Handle ad click with devotional app tracking
   */
  const handleAdClick = useCallback(() => {
    console.log(`[BannerAd] 👆 Ad clicked for ${location}`);
    
    // Track click for analytics
    // Analytics.track('banner_ad_clicked', { location });
    
    onAdClicked?.();
  }, [location, onAdClicked]);

  /**
   * Get banner size height for layout
   */
  const getBannerHeight = useCallback(() => {
    if (!BannerAdSize) return 60;
    
    switch (size) {
      case BannerAdSize.BANNER:
        return 60;
      case BannerAdSize.LARGE_BANNER:
        return 100;
      case BannerAdSize.RECTANGLE:
        return 250;
      case BannerAdSize.FULL_BANNER:
        return 60;
      case BannerAdSize.LEADERBOARD:
        return 90;
      case BannerAdSize.SMART_BANNER:
        return Platform.OS === 'ios' ? 60 : 60;
      case BannerAdSize.ANCHORED_ADAPTIVE_BANNER:
        return 60; // Will adapt automatically
      default:
        return 60;
    }
  }, [size]);

  /**
   * Update ad height when size changes
   */
  useEffect(() => {
    const height = getBannerHeight();
    setAdHeight(height);
  }, [getBannerHeight]);

  /**
   * Refresh ad if error and retry is appropriate
   */
  useEffect(() => {
    if (hasError && shouldShowBanner) {
      const retryTimeout = setTimeout(() => {
        console.log(`[BannerAd] 🔄 Retrying ad load for ${location}`);
        refreshBanner();
        setHasError(false);
      }, 10000); // Retry after 10 seconds

      return () => clearTimeout(retryTimeout);
    }
  }, [hasError, shouldShowBanner, location, refreshBanner]);

  /**
   * Log banner ad performance for devotional app optimization
   */
  useEffect(() => {
    if (shouldShowBanner && adUnitId) {
      console.log(`[BannerAd] 📊 Banner ad metrics for ${location}:`, {
        location,
        adUnitId,
        size: size?.toString() || 'unknown',
        respectfulPlacement,
        requestNonPersonalized: adRequestOptions.requestNonPersonalizedAdsOnly,
        isVisible,
        hasError,
      });
    }
  }, [shouldShowBanner, adUnitId, location, size, respectfulPlacement, adRequestOptions, isVisible, hasError]);

  // Early returns for various states
  if (!isAdMobAvailable) {
    console.log(`[BannerAd] ⚠️ AdMob not available for ${location}`);
    return null;
  }

  if (!enabled) {
    console.log(`[BannerAd] 🚫 Banner ads disabled for ${location}`);
    return null;
  }

  if (isLoading) {
    console.log(`[BannerAd] ⏳ Loading banner ad for ${location}`);
    return (
      <View style={[styles.container, { height: adHeight }, style]}>
        <View style={styles.placeholder} />
      </View>
    );
  }

  if (!shouldShowBanner || !adUnitId) {
    console.log(`[BannerAd] 🚫 Should not show banner for ${location}:`, {
      shouldShowBanner,
      hasAdUnitId: !!adUnitId,
    });
    return null;
  }

  if (error) {
    console.log(`[BannerAd] ❌ Error state for ${location}:`, error);
    return null;
  }

  // Render the banner ad
  return (
    <View style={[styles.container, { height: adHeight }, style]}>
      <View style={styles.adContainer}>
        <BannerAd
          unitId={adUnitId}
          size={size}
          requestOptions={{
            ...adRequestOptions,
            // Additional options for devotional apps
            keywords: respectfulPlacement ? ['family', 'christian', 'faith', 'inspiration'] : undefined,
          }}
          onAdLoaded={() => {
            setIsVisible(true);
            setHasError(false);
            onAdLoaded?.();
          }}
          onAdFailedToLoad={(error: any) => {
            const errorMsg = error?.message || 'Failed to load ad';
            setHasError(true);
            setIsVisible(false);
            onAdError?.(errorMsg);
          }}
          onAdOpened={() => {
            onAdOpened?.();
            handleAdClick();
          }}
          onAdClosed={() => {
            onAdClosed?.();
          }}
        />
        
        {/* Overlay for respectful placement in devotional context */}
        {respectfulPlacement && (
          <View style={styles.respectfulOverlay} pointerEvents="none" />
        )}
      </View>
      
      {/* Loading placeholder when ad is not visible */}
      {!isVisible && !hasError && (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  adContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A', // Match app background
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    opacity: 0.3,
  },
  respectfulOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    // Subtle border to make ad blend better with devotional content
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },
});

// Export with display name for debugging
BannerAdComponent.displayName = 'BannerAd';

export default BannerAdComponent;
