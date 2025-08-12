import { useCallback, useRef, useState } from 'react';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';

interface SessionStats {
  devotionalOpens: number;
  interstitialsShown: number;
  maxInterstitials: number;
  isAtLimit: boolean;
}

/**
 * Hook específico para manejar intersticiales en momentos estratégicos
 * Más balanceado - considera que ya hay open ads y banners
 */
export function useStrategicAds() {
  const { isPremium } = usePremiumStatus();
  const [sessionStats] = useState<SessionStats>({
    devotionalOpens: 0,
    interstitialsShown: 0,
    maxInterstitials: 3,
    isAtLimit: false,
  });

  const lastDevotionalAd = useRef<number>(0);
  const lastNavigationAd = useRef<number>(0);

  /**
   * Mostrar ad después de completar un devocional - ESTRATÉGICO
   * Solo 1 vez por sesión para no molestar
   */
  const showDevotionalAd = useCallback(async (): Promise<boolean> => {
    if (isPremium) return false;

    const now = Date.now();
    const timeSinceLastAd = now - lastDevotionalAd.current;
    
    // Solo mostrar si han pasado más de 10 minutos desde el último ad
    if (timeSinceLastAd < 10 * 60 * 1000) {
      console.log('[useStrategicAds] ⏰ Demasiado pronto para mostrar ad');
      return false;
    }

    try {
      console.log('[useStrategicAds] 📱 Mostrando ad post-devocional');
      // Placeholder para AdMob interstitial
      lastDevotionalAd.current = now;
      return true;
    } catch (error) {
      console.error('[useStrategicAds] ❌ Error mostrando ad:', error);
      return false;
    }
  }, [isPremium]);

  /**
   * Mostrar ad durante navegación específica - MUY LIMITADO
   */
  const showNavigationAd = useCallback(async (destination: string): Promise<boolean> => {
    if (isPremium) return false;

    const now = Date.now();
    const timeSinceLastAd = now - lastNavigationAd.current;
    
    // Solo mostrar si han pasado más de 15 minutos
    if (timeSinceLastAd < 15 * 60 * 1000) {
      return false;
    }

    try {
      console.log(`[useStrategicAds] 📱 Mostrando ad navegación: ${destination}`);
      // Placeholder para AdMob interstitial
      lastNavigationAd.current = now;
      return true;
    } catch (error) {
      console.error('[useStrategicAds] ❌ Error mostrando ad navegación:', error);
      return false;
    }
  }, [isPremium]);

  /**
   * Obtener estadísticas de la sesión
   */
  const getSessionStats = useCallback((): SessionStats => {
    return sessionStats;
  }, [sessionStats]);

  return {
    showDevotionalAd,
    showNavigationAd,
    getSessionStats,
  };
}
