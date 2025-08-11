// hooks/useInterstitialAds.ts - Hook para anuncios intersticiales
import { useEffect, useState, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdMobService } from '@/services/adMobService';

// Claves para AsyncStorage
const CURRENT_INTERACTION_COUNT_KEY = '@interstitial_interactions';
const ADS_SHOWN_COUNT_KEY = '@interstitial_ads_shown';
const LAST_AD_TIME_KEY = '@interstitial_last_ad_time';

interface UseInterstitialAdsOptions {
  onAdShown?: () => void;
  onAdClosed?: () => void;
  enabled?: boolean;
  interactionThreshold?: number; // Número de interacciones antes de mostrar ad
}

interface AdStats {
  totalInteractions: number;
  adsShown: number;
  lastAdTime: number | null;
  isInCooldown: boolean;
  timeUntilNextAd: number;
  currentInteractionCount: number;
  minInteractionThreshold: number;
  interactionsUntilNext: number;
}

export const useInterstitialAds = (options: UseInterstitialAdsOptions = {}) => {
  const {
    onAdShown,
    onAdClosed,
    enabled = true,
    interactionThreshold = 3, // Mostrar ad cada 3 interacciones por defecto
  } = options;

  // Configuración
  const minInteractionThreshold = interactionThreshold;
  const cooldownPeriod = 60 * 1000; // 1 minuto entre ads

  // Estados
  const [currentInteractionCount, setCurrentInteractionCount] = useState(0);
  const [adsShown, setAdsShown] = useState(0);
  const [lastAdTime, setLastAdTime] = useState<number | null>(null);
  const [isUserPremium, setIsUserPremium] = useState(false);
  const [canShowAds, setCanShowAds] = useState(false);
  const isShowingAdRef = useRef(false);

  // ✅ CARGAR ESTADO INICIAL
  useEffect(() => {
    const loadState = async () => {
      try {
        const [storedCount, storedAdsShown, storedLastAdTime] = await Promise.all([
          AsyncStorage.getItem(CURRENT_INTERACTION_COUNT_KEY),
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

        console.log('🔥 [useInterstitialAds] State loaded:', {
          interactions: parseInt(storedCount || '0', 10),
          adsShown: parseInt(storedAdsShown || '0', 10),
          lastAdTime: storedLastAdTime,
        });
      } catch (error) {
        console.error('🔥 [useInterstitialAds] Error loading state:', error);
      }
    };

    loadState();
  }, []);

  // ✅ GUARDAR ESTADO
  useEffect(() => {
    const saveState = async () => {
      try {
        await Promise.all([
          AsyncStorage.setItem(CURRENT_INTERACTION_COUNT_KEY, currentInteractionCount.toString()),
          AsyncStorage.setItem(ADS_SHOWN_COUNT_KEY, adsShown.toString()),
          lastAdTime !== null ? AsyncStorage.setItem(LAST_AD_TIME_KEY, lastAdTime.toString()) : Promise.resolve(),
        ]);
      } catch (error) {
        console.error('🔥 [useInterstitialAds] Error saving state:', error);
      }
    };

    saveState();
  }, [currentInteractionCount, adsShown, lastAdTime]);

  // ✅ VERIFICAR ESTADO DE ADS INMEDIATAMENTE AL INICIAR
  useEffect(() => {
    const checkAdsStatus = async () => {
      try {
        console.log('🔥 [useInterstitialAds] Checking ads status...');
        const status = await AdMobService.getAdsStatus();
        console.log('🔥 [useInterstitialAds] AdMobService status:', status);

        setIsUserPremium(status.userIsPremium);
        setCanShowAds(status.interstitialAds && !status.userIsPremium);

        console.log('🔥 [useInterstitialAds] Updated state:', {
          isUserPremium: status.userIsPremium,
          canShowAds: status.interstitialAds && !status.userIsPremium,
          interstitialAds: status.interstitialAds,
        });
      } catch (error) {
        console.error('🔥 [useInterstitialAds] Error checking ads status:', error);
        setIsUserPremium(false);
        setCanShowAds(false);
      }
    };
    
    // Verificar inmediatamente
    checkAdsStatus();

    // Verificar cada 15 segundos
    const interval = setInterval(checkAdsStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // ✅ VERIFICAR SI SE PUEDE MOSTRAR AD
  const getCanShowAdStatus = useCallback((): boolean => {
    if (!enabled || isUserPremium || !canShowAds || isShowingAdRef.current) {
      return false;
    }

    // Verificar umbral
    if (currentInteractionCount < minInteractionThreshold) {
      return false;
    }

    // Verificar cooldown
    if (lastAdTime && Date.now() - lastAdTime < cooldownPeriod) {
      return false;
    }

    return true;
  }, [enabled, isUserPremium, canShowAds, currentInteractionCount, minInteractionThreshold, lastAdTime, cooldownPeriod]);

  // ✅ TRACK INTERACTION (Función principal)
  const trackInteraction = useCallback(async (source: string = 'unknown'): Promise<boolean> => {
    console.log('🔥 [useInterstitialAds] trackInteraction called with source:', source);
    console.log('🔥 [useInterstitialAds] Current state:', {
      enabled,
      isUserPremium,
      canShowAds,
      currentInteractionCount,
      minInteractionThreshold,
    });
    
    if (!enabled) {
      console.log('🔥 [useInterstitialAds] Hook disabled - skipping');
      return false;
    }
    if (isUserPremium) {
      console.log('🔥 [useInterstitialAds] User is premium - skipping');
      return false;
    }
    if (!canShowAds) {
      console.log('🔥 [useInterstitialAds] Ads disabled by AdMobService - skipping');
      return false;
    }
    
    const newCount = currentInteractionCount + 1;
    setCurrentInteractionCount(newCount);
    console.log(`🔥 [useInterstitialAds] Interaction ${newCount} tracked from: ${source}`);
    
    // Verificar si debemos mostrar el ad
    if (newCount >= minInteractionThreshold) {
      const canShow = getCanShowAdStatus();
      console.log('🔥 [useInterstitialAds] Can show ad status:', canShow);

      if (canShow) {
        console.log('🔥 [useInterstitialAds] Threshold met - attempting to show ad');
        return await showInterstitial();
      } else {
        console.log('🔥 [useInterstitialAds] Threshold met but cannot show ad (cooldown or other reason)');
      }
    } else {
      const remaining = minInteractionThreshold - newCount;
      console.log(`🔥 [useInterstitialAds] Need ${remaining} more interactions to show ad`);
    }
    
    return false;
  }, [enabled, isUserPremium, canShowAds, currentInteractionCount, minInteractionThreshold, getCanShowAdStatus]);

  // ✅ MOSTRAR INTERSTITIAL
  const showInterstitial = useCallback(async (): Promise<boolean> => {
    if (isShowingAdRef.current) {
      console.log('🔥 [useInterstitialAds] Ad already showing, skipping');
      return false;
    }

    try {
      isShowingAdRef.current = true;
      console.log('🔥 [useInterstitialAds] Attempting to show interstitial...');

      // Usar el método robusto del AdMobService
      const shown = await AdMobService.showInterstitialWithRobustChecks();

      if (shown) {
        console.log('🔥 [useInterstitialAds] ✅ Interstitial shown successfully');
        setAdsShown(prev => prev + 1);
        setLastAdTime(Date.now());
        setCurrentInteractionCount(0); // Reset counter
        onAdShown?.();
        return true;
      } else {
        console.log('🔥 [useInterstitialAds] ❌ Failed to show interstitial');
        return false;
      }
    } catch (error) {
      console.error('🔥 [useInterstitialAds] Error showing interstitial:', error);
      return false;
    } finally {
      isShowingAdRef.current = false;
      onAdClosed?.();
    }
  }, [onAdShown, onAdClosed]);

  // ✅ FORZAR MOSTRAR AD (para testing)
  const forceShowAd = useCallback(async (): Promise<boolean> => {
    if (!__DEV__) {
      console.log('🔥 [useInterstitialAds] Force show only available in development');
      return false;
    }

    if (isUserPremium) {
      console.log('🔥 [useInterstitialAds] Cannot force show - user is premium');
      return false;
    }

    console.log('🔥 [useInterstitialAds] 🧪 FORCING INTERSTITIAL FOR TESTING');

    try {
      isShowingAdRef.current = true;
      const shown = await AdMobService.forceShowInterstitialForTesting();

      if (shown) {
        console.log('🔥 [useInterstitialAds] ✅ Forced interstitial shown');
        setAdsShown(prev => prev + 1);
        setLastAdTime(Date.now());
        setCurrentInteractionCount(0);
        onAdShown?.();
        return true;
      } else {
        console.log('🔥 [useInterstitialAds] ❌ Failed to force show interstitial');
        return false;
      }
    } catch (error) {
      console.error('🔥 [useInterstitialAds] Error forcing interstitial:', error);
      return false;
    } finally {
      isShowingAdRef.current = false;
      onAdClosed?.();
    }
  }, [isUserPremium, onAdShown, onAdClosed]);

  // ✅ RESETEAR CONTADOR
  const resetInteractionCount = useCallback(async () => {
    try {
      setCurrentInteractionCount(0);
      setAdsShown(0);
      setLastAdTime(null);

      await Promise.all([
        AsyncStorage.removeItem(CURRENT_INTERACTION_COUNT_KEY),
        AsyncStorage.removeItem(ADS_SHOWN_COUNT_KEY),
        AsyncStorage.removeItem(LAST_AD_TIME_KEY),
      ]);

      console.log('🔥 [useInterstitialAds] All counters reset');
    } catch (error) {
      console.error('🔥 [useInterstitialAds] Error resetting counters:', error);
    }
  }, []);

  // ✅ OBTENER ESTADÍSTICAS
  const getAdStats = useCallback((): AdStats => {
    const now = Date.now();
    const isInCooldown = lastAdTime ? (now - lastAdTime) < cooldownPeriod : false;
    const timeUntilNextAd = lastAdTime ? Math.max(0, cooldownPeriod - (now - lastAdTime)) : 0;
    const interactionsUntilNext = Math.max(0, minInteractionThreshold - currentInteractionCount);

    return {
      totalInteractions: currentInteractionCount,
      adsShown,
      lastAdTime,
      isInCooldown,
      timeUntilNextAd,
      currentInteractionCount,
      minInteractionThreshold,
      interactionsUntilNext,
    };
  }, [currentInteractionCount, adsShown, lastAdTime, cooldownPeriod, minInteractionThreshold]);

  // ✅ LISTENER PARA CAMBIOS DE ESTADO DE APP
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('🔥 [useInterstitialAds] App came to foreground - checking ad status');

        // Verificar estado cuando la app vuelve al foreground
        setTimeout(async () => {
          try {
            const status = await AdMobService.getAdsStatus();
            setIsUserPremium(status.userIsPremium);
            setCanShowAds(status.interstitialAds && !status.userIsPremium);
          } catch (error) {
            console.error('🔥 [useInterstitialAds] Error checking status on app foreground:', error);
          }
        }, 1000);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // ✅ LOGGING PARA DESARROLLO
  useEffect(() => {
    if (__DEV__) {
      const logStats = () => {
        const stats = getAdStats();
        console.log('🔥 [useInterstitialAds] 📊 Stats:', {
          currentCount: stats.currentInteractionCount,
          adsShown: stats.adsShown,
          canShow: getCanShowAdStatus(),
          isUserPremium,
          canShowAds,
          interactionsUntilNext: stats.interactionsUntilNext,
        });
      };

      const interval = setInterval(logStats, 60000); // Log every minute
      return () => clearInterval(interval);
    }
  }, [getAdStats, getCanShowAdStatus, isUserPremium, canShowAds]);

  return {
    // Core functions
    trackInteraction,
    forceShowAd,

    // Status
    isAdShowing: isShowingAdRef.current,
    currentInteractionCount,
    canShowAd: getCanShowAdStatus(),
    isUserPremium,

    // Utilities
    resetInteractionCount,
    getAdStats,
  };
};

export default useInterstitialAds;
