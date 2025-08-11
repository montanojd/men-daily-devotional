import { useEffect, useState } from 'react';
import { fetchAdmobConfig, RemoteAdConfig } from '@/services/adsConfig';
import { requestTrackingPermissionsAsync, getTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { Platform } from 'react-native';
import { usePremiumStatus } from './usePremiumStatus';

interface AdsState {
  config: RemoteAdConfig | null;
  loading: boolean;
  trackingGranted: boolean;
  error?: string;
}

export function useAds() {
  const [state, setState] = useState<AdsState>({ config: null, loading: true, trackingGranted: false });
  const { isPremium } = usePremiumStatus();

  useEffect(() => {
    (async () => {
      try {
        setState(s => ({ ...s, loading: true }));
        const cfg = await fetchAdmobConfig();
        let trackingGranted = true;
        if (Platform.OS === 'ios' && cfg && (cfg.bannerAds?.status || cfg.interstitialAds?.status || cfg.openAds?.status) && !isPremium) {
          const perm = await getTrackingPermissionsAsync();
            if (perm.status !== 'granted') {
              const req = await requestTrackingPermissionsAsync();
              trackingGranted = req.status === 'granted';
            }
        }
        setState({ config: cfg, loading: false, trackingGranted });
      } catch (e) {
        setState({ config: null, loading: false, trackingGranted: false, error: (e as Error).message });
      }
    })();
  }, [isPremium]);

  return state;
}
