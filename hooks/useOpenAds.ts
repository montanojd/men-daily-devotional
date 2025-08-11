// hooks/useOpenAds.ts - Hook para anuncios de apertura de app
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AdMobService } from '@/services/adMobService';

interface UseOpenAdsOptions {
  enabled?: boolean;
  minimumAppBackgroundTime?: number; // Minimum time in background before showing ad
  showOnColdStart?: boolean; // Show ad when app starts fresh
  showOnAppResume?: boolean; // Show ad when app resumes from background
  maxAdsPerSession?: number; // Maximum open ads per session
  cooldownPeriod?: number; // Minimum time between open ads
  onAdShown?: () => void;
  onAdClosed?: () => void;
  onAdFailedToShow?: (error: any) => void;
}

interface UseOpenAdsReturn {
  showOpenAd: () => Promise<boolean>;
  isAdShowing: boolean;
  isAdLoaded: boolean;
  adsShownThisSession: number;
  canShowAd: boolean;
  forceShowAd: () => Promise<boolean>;
  getOpenAdStats: () => OpenAdStats;
  resetSessionStats: () => void;
}

interface OpenAdStats {
  adsShownThisSession: number;
  lastAdTime: number | null;
  isInCooldown: boolean;
  timeUntilNextAd: number;
  appBackgroundTime: number | null;
  isAdLoaded: boolean;
  sessionStartTime: number;
  appResumeCount: number;
}

export const useOpenAds = (options: UseOpenAdsOptions = {}): UseOpenAdsReturn => {
  const {
    enabled = true,
    minimumAppBackgroundTime = 30 * 1000, // 30 seconds
    showOnColdStart = false, // Usually false to avoid interrupting onboarding
    showOnAppResume = true,
    maxAdsPerSession = 3,
    cooldownPeriod = 2 * 60 * 1000, // 2 minutes
    onAdShown,
    onAdClosed,
    onAdFailedToShow,
  } = options;

  // ✅ STATE
  const [isAdShowing, setIsAdShowing] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [adsShownThisSession, setAdsShownThisSession] = useState(0);
  const [lastAdTime, setLastAdTime] = useState<number | null>(null);
  const [appBackgroundTime, setAppBackgroundTime] = useState<number | null>(null);
  const [appResumeCount, setAppResumeCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUserPremium, setIsUserPremium] = useState(false);

  // ✅ REFS
  const appState = useRef(AppState.currentState);
  const sessionStartTime = useRef(Date.now());
  const backgroundStartTime = useRef<number | null>(null);
  const hasShownColdStartAd = useRef(false);

  // ✅ LOAD OPEN AD
  const loadOpenAd = useCallback(async (): Promise<boolean> => {
    console.log('[useOpenAds] 🚀 loadOpenAd called with state:', {
      enabled,
      isInitialized,
      isUserPremium
    });

    if (!enabled || !isInitialized || isUserPremium) {
      console.log('[useOpenAds] ❌ Cannot load Open Ad:', {
        enabled,
        isInitialized,
        isUserPremium
      });
      return false;
    }

    try {
      console.log('[useOpenAds] 📱 Cargando Open Ad...');
      
      // 🔥 USAR MÉTODO DEL ADMOBSERVICE LIMPIO
      const loaded = await AdMobService.loadAppOpenAd();
      setIsAdLoaded(loaded);
      
      if (loaded) {
        console.log('[useOpenAds] ✅ Open Ad cargado correctamente');
      } else {
        console.log('[useOpenAds] ❌ Open Ad no se pudo cargar');
      }
      
      return loaded;
    } catch (error) {
      console.error('[useOpenAds] ❌ Error cargando Open Ad:', error);
      setIsAdLoaded(false);
      return false;
    }
  }, [enabled, isInitialized, isUserPremium]);

  // ✅ INITIALIZE ADMOB
  useEffect(() => {
    const initializeOpenAds = async () => {
      if (!enabled) {
        console.log('[useOpenAds] 🚫 Open Ads deshabilitados');
        return;
      }

      try {
        console.log('[useOpenAds] 🚀 Inicializando Open Ads...');
        
        // 🔥 VERIFICAR ESTADO DE ADS
        const adsStatus = await AdMobService.getAdsStatus();
        setIsUserPremium(adsStatus.userIsPremium);
        setIsInitialized(adsStatus.initialized);

        if (adsStatus.userIsPremium) {
          console.log('[useOpenAds] 🚫 Usuario premium - Open Ads deshabilitados');
          return;
        }

        if (adsStatus.initialized && adsStatus.openAds) {
          console.log('[useOpenAds] ✅ Open Ads inicializados correctamente');
          
          // Load first open ad
          await loadOpenAd();
          
          // Show cold start ad if enabled
          if (showOnColdStart && !hasShownColdStartAd.current) {
            setTimeout(() => {
              showColdStartAd();
            }, 3000); // Wait 3 seconds after app start
          }
        } else {
          console.log('[useOpenAds] ❌ Open Ads no disponibles (premium o Firebase)');
        }
      } catch (error) {
        console.error('[useOpenAds] ❌ Error inicializando Open Ads:', error);
        setIsInitialized(false);
      }
    };

    initializeOpenAds();
  }, [enabled, showOnColdStart, loadOpenAd]);

  // ✅ VERIFICAR ESTADO DE ADS INMEDIATAMENTE AL INICIAR
  useEffect(() => {
    const checkAdsStatus = async () => {
      try {
        console.log('[useOpenAds] 🔍 Checking ads status...');
        const status = await AdMobService.getAdsStatus();
        console.log('[useOpenAds] 📊 AdMobService status:', status);
        
        setIsUserPremium(status.userIsPremium);
        setIsInitialized(status.initialized);
        
        console.log('[useOpenAds] 🔄 Updated state:', {
          isUserPremium: status.userIsPremium,
          isInitialized: status.initialized,
          openAds: status.openAds,
        });
        
        // Si el usuario se volvió premium, limpiar estado
        if (status.userIsPremium && isAdLoaded) {
          console.log('[useOpenAds] 🚫 User is premium - clearing ad state');
          setIsAdLoaded(false);
          setIsAdShowing(false);
        }
      } catch (error) {
        console.error('[useOpenAds] ❌ Error checking ads status:', error);
      }
    };

    // Verificar inmediatamente
    checkAdsStatus();
    
    // Verificar cada 15 segundos
    const interval = setInterval(checkAdsStatus, 15000);
    return () => clearInterval(interval);
  }, [isAdLoaded]);

  // ✅ CHECK IF CAN SHOW AD
  const canShowAd = useCallback((): boolean => {
    console.log('[useOpenAds] 🤔 canShowAd check:', {
      enabled,
      isInitialized,
      isAdShowing,
      isAdLoaded,
      isUserPremium,
      adsShownThisSession,
      maxAdsPerSession,
      lastAdTime,
      cooldownPeriod
    });

    if (!enabled || !isInitialized || isAdShowing || !isAdLoaded || isUserPremium) {
      console.log('[useOpenAds] 🚫 Cannot show - basic checks failed');
      return false;
    }

    // Check session limit
    if (adsShownThisSession >= maxAdsPerSession) {
      console.log('[useOpenAds] 🚫 Límite de sesión alcanzado');
      return false;
    }

    // Check cooldown
    if (lastAdTime && (Date.now() - lastAdTime) < cooldownPeriod) {
      console.log('[useOpenAds] ⏰ En período de cooldown');
      return false;
    }

    console.log('[useOpenAds] ✅ Can show Open Ad');
    return true;
  }, [enabled, isInitialized, isAdShowing, isAdLoaded, isUserPremium, adsShownThisSession, maxAdsPerSession, lastAdTime, cooldownPeriod]);

  // ✅ SHOW OPEN AD
  const showOpenAd = useCallback(async (): Promise<boolean> => {
    if (!canShowAd()) {
      console.log('[useOpenAds] 🚫 No se puede mostrar Open Ad ahora');
      return false;
    }

    try {
      console.log('[useOpenAds] 📱 Mostrando Open Ad...');
      setIsAdShowing(true);
      onAdShown?.();

      // 🔥 USAR MÉTODO ROBUSTO DEL ADMOBSERVICE
      const adShown = await AdMobService.showAppOpenAd();

      if (adShown) {
        setAdsShownThisSession(prev => prev + 1);
        setLastAdTime(Date.now());
        
        console.log('[useOpenAds] ✅ Open Ad mostrado exitosamente');
        
        // Ad will close automatically, but we handle it in the service
        setTimeout(() => {
          setIsAdShowing(false);
          setIsAdLoaded(false); // Will need to load next ad
          onAdClosed?.();
          
          // Load next ad for future use
          setTimeout(() => {
            loadOpenAd();
          }, 2000);
        }, 1000);

        return true;
      } else {
        setIsAdShowing(false);
        onAdFailedToShow?.({ message: 'Open Ad no se pudo mostrar' });
        return false;
      }

    } catch (error: any) {
      console.error('[useOpenAds] ❌ Error mostrando Open Ad:', error);
      setIsAdShowing(false);
      onAdFailedToShow?.(error);
      return false;
    }
  }, [canShowAd, onAdShown, onAdClosed, onAdFailedToShow, loadOpenAd]);

  // ✅ FORCE SHOW AD (for testing)
  const forceShowAd = useCallback(async (): Promise<boolean> => {
    if (!enabled || !isInitialized || isAdShowing || isUserPremium) {
      console.log('[useOpenAds] 🚫 Cannot force show:', {
        enabled,
        isInitialized,
        isAdShowing,
        isUserPremium
      });
      return false;
    }

    if (!__DEV__) {
      console.log('[useOpenAds] 🚫 Force show only available in development');
      return false;
    }

    console.log('[useOpenAds] 🚀 Forzando Open Ad...');
    
    try {
      setIsAdShowing(true);
      onAdShown?.();

      // 🔥 USAR MÉTODO ROBUSTO DEL ADMOBSERVICE
      const adShown = await AdMobService.forceShowOpenAdForTesting();

      if (adShown) {
        setAdsShownThisSession(prev => prev + 1);
        setLastAdTime(Date.now());
        
        console.log('[useOpenAds] ✅ Forced Open Ad shown successfully');
        
        setTimeout(() => {
          setIsAdShowing(false);
          setIsAdLoaded(false);
          onAdClosed?.();
          
          // Load next ad
          setTimeout(() => {
            loadOpenAd();
          }, 2000);
        }, 1000);

        return true;
      } else {
        setIsAdShowing(false);
        onAdFailedToShow?.({ message: 'Forced Open Ad failed' });
        return false;
      }

    } catch (error: any) {
      console.error('[useOpenAds] ❌ Error forcing Open Ad:', error);
      setIsAdShowing(false);
      onAdFailedToShow?.(error);
      return false;
    }
  }, [enabled, isInitialized, isAdShowing, isUserPremium, onAdShown, onAdClosed, onAdFailedToShow, loadOpenAd]);

  // ✅ SHOW COLD START AD
  const showColdStartAd = useCallback(async () => {
    if (hasShownColdStartAd.current || !showOnColdStart || isUserPremium) return;

    console.log('[useOpenAds] 🌟 Evaluando Cold Start Ad...');
    
    hasShownColdStartAd.current = true;
    const shown = await showOpenAd();
    
    if (shown) {
      console.log('[useOpenAds] ✅ Cold Start Ad mostrado');
    }
  }, [showOnColdStart, isUserPremium, showOpenAd]);

  // ✅ APP STATE MONITORING
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log(`[useOpenAds] 📱 App state cambió: ${appState.current} -> ${nextAppState}`);

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App going to background
        backgroundStartTime.current = Date.now();
        console.log('[useOpenAds] 📱 App en background');
        
      } else if (nextAppState === 'active' && appState.current.match(/inactive|background/)) {
        // App coming to foreground
        const now = Date.now();
        setAppResumeCount(prev => prev + 1);
        
        if (backgroundStartTime.current) {
          const timeInBackground = now - backgroundStartTime.current;
          setAppBackgroundTime(timeInBackground);
          
          console.log(`[useOpenAds] 📱 App resumed después de ${Math.round(timeInBackground / 1000)}s en background`);
          
          // 🔥 VERIFICAR PREMIUM ANTES DE MOSTRAR
          const status = await AdMobService.getAdsStatus();
          setIsUserPremium(status.userIsPremium);
          
          if (status.userIsPremium) {
            console.log('[useOpenAds] 🚫 Usuario premium - no mostrar Open Ad');
            return;
          }
          
          // Show open ad if conditions are met
          if (showOnAppResume && timeInBackground >= minimumAppBackgroundTime) {
            console.log('[useOpenAds] 🎯 Condiciones cumplidas para Open Ad');
            
            // Small delay to let the app settle
            setTimeout(async () => {
              await showOpenAd();
            }, 500);
          } else {
            console.log('[useOpenAds] ⏰ No mostrar Open Ad - tiempo insuficiente en background');
          }
        }
        
        backgroundStartTime.current = null;
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [showOnAppResume, minimumAppBackgroundTime, showOpenAd]);

  // ✅ PERIODICALLY CHECK AND RELOAD AD
  useEffect(() => {
    if (!enabled || !isInitialized || isUserPremium) return;

    const checkAdInterval = setInterval(async () => {
      if (!isAdLoaded && !isAdShowing) {
        console.log('[useOpenAds] 🔄 Recargando Open Ad...');
        await loadOpenAd();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkAdInterval);
  }, [enabled, isInitialized, isUserPremium, isAdLoaded, isAdShowing, loadOpenAd]);

  // ✅ GET STATS
  const getOpenAdStats = useCallback((): OpenAdStats => {
    const now = Date.now();
    const isInCooldown = lastAdTime ? (now - lastAdTime) < cooldownPeriod : false;
    const timeUntilNextAd = lastAdTime ? Math.max(0, cooldownPeriod - (now - lastAdTime)) : 0;

    return {
      adsShownThisSession,
      lastAdTime,
      isInCooldown,
      timeUntilNextAd,
      appBackgroundTime,
      isAdLoaded,
      sessionStartTime: sessionStartTime.current,
      appResumeCount,
    };
  }, [adsShownThisSession, lastAdTime, cooldownPeriod, appBackgroundTime, isAdLoaded, appResumeCount]);

  // ✅ RESET SESSION STATS
  const resetSessionStats = useCallback(() => {
    setAdsShownThisSession(0);
    setLastAdTime(null);
    setAppResumeCount(0);
    sessionStartTime.current = Date.now();
    hasShownColdStartAd.current = false;
    console.log('[useOpenAds] 🔄 Stats de sesión reseteadas');
  }, []);

  // ✅ CLEANUP
  useEffect(() => {
    return () => {
      console.log('[useOpenAds] 🧹 Limpiando Open Ads hook...');
    };
  }, []);

  // ✅ LOGGING PARA DESARROLLO
  useEffect(() => {
    if (__DEV__) {
      const logStats = () => {
        console.log('[useOpenAds] 📊 Stats:', {
          adsShownThisSession,
          canShow: canShowAd(),
          isUserPremium,
          isAdLoaded,
          isAdShowing,
          appResumeCount,
        });
      };

      const interval = setInterval(logStats, 60000); // Log every minute
      return () => clearInterval(interval);
    }
  }, [adsShownThisSession, canShowAd, isUserPremium, isAdLoaded, isAdShowing, appResumeCount]);

  return {
    showOpenAd,
    isAdShowing,
    isAdLoaded,
    adsShownThisSession,
    canShowAd: canShowAd(),
    forceShowAd,
    getOpenAdStats,
    resetSessionStats,
  };
};

export default useOpenAds;
