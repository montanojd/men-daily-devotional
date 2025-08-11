import { useCallback, useRef } from 'react';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useInterstitialAds } from '../monetization-ios/hooks/useInterstitialAds';

interface AggressiveAdsConfig {
  interactionThreshold: number; // Cada cuántas interacciones mostrar ad
  minTimeInterval: number; // Tiempo mínimo entre ads (ms)
  maxAdsPerSession: number; // Máximo de ads por sesión
}

const DEFAULT_CONFIG: AggressiveAdsConfig = {
  interactionThreshold: 3, // Cada 3 interacciones (más razonable)
  minTimeInterval: 120000, // 2 minutos mínimo (más tiempo)
  maxAdsPerSession: 3, // Máximo 3 intersticiales por sesión
};

/**
 * Hook para mostrar ads agresivos que fuercen al usuario hacia premium
 * Estrategia: Hacer que el usuario no-premium tenga una experiencia molesta
 */
export function useAggressiveAds(config: Partial<AggressiveAdsConfig> = {}) {
  const { isPremium } = usePremiumStatus();
  const { showAd } = useInterstitialAds();
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const interactionCount = useRef(0);
  const lastAdTime = useRef(0);
  const sessionAdCount = useRef(0);

  const trackInteraction = useCallback(async (action: string) => {
    // Si es premium, no molestar
    if (isPremium) {
      console.log('🏆 [AggressiveAds] Usuario premium - sin ads');
      return false;
    }

    interactionCount.current++;
    console.log(`📱 [AggressiveAds] Interacción ${interactionCount.current}: ${action}`);

    // Verificar si debe mostrar ad
    const shouldShowAd = 
      interactionCount.current >= finalConfig.interactionThreshold &&
      (Date.now() - lastAdTime.current) >= finalConfig.minTimeInterval &&
      sessionAdCount.current < finalConfig.maxAdsPerSession;

    if (shouldShowAd) {
      console.log('💀 [AggressiveAds] Mostrando ad para presionar hacia premium...');
      
      try {
        const adShown = await showAd(`aggressive_${action}`);
        
        if (adShown) {
          // Resetear contador y actualizar estadísticas
          interactionCount.current = 0;
          lastAdTime.current = Date.now();
          sessionAdCount.current++;
          
          console.log(`💀 [AggressiveAds] Ad mostrado exitosamente. Session ads: ${sessionAdCount.current}/${finalConfig.maxAdsPerSession}`);
          return true;
        }
      } catch (error) {
        console.error('💀 [AggressiveAds] Error mostrando ad:', error);
      }
    }

    return false;
  }, [isPremium, showAd, finalConfig]);

  const forceShowAd = useCallback(async (reason: string = 'forced') => {
    if (isPremium) return false;
    
    if (sessionAdCount.current >= finalConfig.maxAdsPerSession) {
      console.log('💀 [AggressiveAds] Límite de ads por sesión alcanzado');
      return false;
    }

    console.log(`💀 [AggressiveAds] Forzando ad: ${reason}`);
    
    try {
      const adShown = await showAd(`forced_${reason}`);
      
      if (adShown) {
        sessionAdCount.current++;
        lastAdTime.current = Date.now();
        return true;
      }
    } catch (error) {
      console.error('💀 [AggressiveAds] Error en ad forzado:', error);
    }
    
    return false;
  }, [isPremium, showAd, finalConfig.maxAdsPerSession]);

  const getAdPressureLevel = useCallback(() => {
    if (isPremium) return 'none';
    
    const adPercentage = (sessionAdCount.current / finalConfig.maxAdsPerSession) * 100;
    
    if (adPercentage >= 80) return 'maximum';
    if (adPercentage >= 60) return 'high';
    if (adPercentage >= 40) return 'medium';
    if (adPercentage >= 20) return 'low';
    return 'minimal';
  }, [isPremium, sessionAdCount.current, finalConfig.maxAdsPerSession]);

  return {
    trackInteraction,
    forceShowAd,
    getAdPressureLevel,
    stats: {
      interactionCount: interactionCount.current,
      sessionAdCount: sessionAdCount.current,
      maxAdsPerSession: finalConfig.maxAdsPerSession,
      isAtLimit: sessionAdCount.current >= finalConfig.maxAdsPerSession,
    },
  };
}
