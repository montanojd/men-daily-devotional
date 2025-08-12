import { useCallback, useState } from 'react';

interface UseInterstitialAdsOptions {
  enabled: boolean;
  interactionThreshold?: number;
  onAdShown?: () => void;
}

interface UseInterstitialAdsReturn {
  trackInteraction: (type: string) => void;
  showAd: (context: string) => Promise<boolean>;
  isAdLoaded: boolean;
  stats: {
    interactions: number;
    adsShown: number;
  };
}

export function useInterstitialAds(options: UseInterstitialAdsOptions): UseInterstitialAdsReturn {
  const [stats, setStats] = useState({
    interactions: 0,
    adsShown: 0,
  });

  const trackInteraction = useCallback((type: string) => {
    if (!options.enabled) return;
    
    console.log(`[useInterstitialAds] Interaction tracked: ${type}`);
    setStats(prev => ({
      ...prev,
      interactions: prev.interactions + 1,
    }));
  }, [options.enabled]);

  const showAd = useCallback(async (context: string): Promise<boolean> => {
    if (!options.enabled) return false;
    
    console.log(`[useInterstitialAds] Showing ad: ${context}`);
    
    setStats(prev => ({
      ...prev,
      adsShown: prev.adsShown + 1,
    }));

    options.onAdShown?.();
    return true;
  }, [options.enabled, options.onAdShown]);

  return {
    trackInteraction,
    showAd,
    isAdLoaded: true,
    stats,
  };
}
