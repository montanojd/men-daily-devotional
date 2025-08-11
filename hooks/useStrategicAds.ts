import { useCallback, useRef } from 'react';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useInterstitialAds } from '../monetization-ios/hooks/useInterstitialAds';

/**
 * Hook específico para manejar intersticiales en momentos estratégicos
 * Más balanceado - considera que ya hay open ads y banners
 */
export function useStrategicAds() {
  const { isPremium } = usePremiumStatus();
  const { showAd } = useInterstitialAds();
  
  const devotionalOpensCount = useRef(0);
  const lastDevotionalAdTime = useRef(0);
  const sessionInterstitialCount = useRef(0);

  // Máximo 2 intersticiales por sesión (balance con open ads + banners)
  const MAX_INTERSTITIALS_PER_SESSION = 2;
  const MIN_TIME_BETWEEN_ADS = 300000; // 5 minutos mínimo

  const showDevotionalAd = useCallback(async () => {
    if (isPremium) return false;
    
    devotionalOpensCount.current++;
    
    // Intersticial solo después del 2do devocional y luego cada 3
    const shouldShowAd = 
      (devotionalOpensCount.current === 2 || devotionalOpensCount.current % 3 === 0) &&
      sessionInterstitialCount.current < MAX_INTERSTITIALS_PER_SESSION &&
      (Date.now() - lastDevotionalAdTime.current) >= MIN_TIME_BETWEEN_ADS;

    if (shouldShowAd) {
      console.log('📱 [StrategicAds] Mostrando intersticial después del devocional');
      
      try {
        const adShown = await showAd('devotional_completed');
        
        if (adShown) {
          sessionInterstitialCount.current++;
          lastDevotionalAdTime.current = Date.now();
          console.log(`📱 [StrategicAds] Intersticial ${sessionInterstitialCount.current}/${MAX_INTERSTITIALS_PER_SESSION} mostrado`);
          return true;
        }
      } catch (error) {
        console.error('📱 [StrategicAds] Error mostrando intersticial:', error);
      }
    }

    return false;
  }, [isPremium, showAd]);

  const showNavigationAd = useCallback(async (destination: string) => {
    if (isPremium) return false;
    
    // Solo mostrar si no hemos alcanzado el límite y ha pasado tiempo suficiente
    const shouldShowAd = 
      sessionInterstitialCount.current < MAX_INTERSTITIALS_PER_SESSION &&
      (Date.now() - lastDevotionalAdTime.current) >= MIN_TIME_BETWEEN_ADS;

    if (shouldShowAd) {
      console.log(`📱 [StrategicAds] Mostrando intersticial de navegación: ${destination}`);
      
      try {
        const adShown = await showAd(`navigation_${destination}`);
        
        if (adShown) {
          sessionInterstitialCount.current++;
          lastDevotionalAdTime.current = Date.now();
          return true;
        }
      } catch (error) {
        console.error('📱 [StrategicAds] Error mostrando intersticial de navegación:', error);
      }
    }

    return false;
  }, [isPremium, showAd]);

  const getSessionStats = useCallback(() => {
    return {
      devotionalOpens: devotionalOpensCount.current,
      interstitialsShown: sessionInterstitialCount.current,
      maxInterstitials: MAX_INTERSTITIALS_PER_SESSION,
      isAtLimit: sessionInterstitialCount.current >= MAX_INTERSTITIALS_PER_SESSION,
    };
  }, []);

  return {
    showDevotionalAd,
    showNavigationAd,
    getSessionStats,
  };
}
