// services/adMobService.ts - VERSIÓN MEJORADA PARA OPEN ADS (sin romper funcionalidad existente)
import { Platform, AppState } from 'react-native';
import mobileAds, { 
  MaxAdContentRating, 
  BannerAdSize, 
  TestIds,
  InterstitialAd,
  AdEventType,
  AppOpenAd
} from 'react-native-google-mobile-ads';
import { fetchAdmobConfig } from '@/services/adsConfig';
import { RevenueCatService } from '@/services/revenuecat';

interface AdConfig {
  bannerAds: {
    adUnitIdAndroid: string;
    adUnitIdIOS: string;
    status: boolean;
  };
  interstitialAds: {
    adUnitIdAndroid: string;
    adUnitIdIOS: string;
    status: boolean;
  };
  openAds: {
    adUnitIdAndroid: string;
    adUnitIdIOS: string;
    status: boolean;
  };
  anyAdEnabled: boolean;
}

class AdMobManager {
  private adConfig: AdConfig | null = null;
  private initialized = false;
  private configLoaded = false;
  private interstitialAd: InterstitialAd | null = null;
  private appOpenAd: AppOpenAd | null = null;
  
  private premiumCache: { value: boolean; timestamp: number } | null = null;
  private readonly PREMIUM_CACHE_DURATION = 30 * 1000;
  
  private lastInterstitialShow = 0;
  private lastAppOpenShow = 0;
  private readonly INTERSTITIAL_COOLDOWN = __DEV__ ? 10 * 1000 : 60 * 1000;
  
  // ✅ COOLDOWN MEJORADO PARA OPEN ADS - MÁS PERMISIVO
  private readonly APP_OPEN_COOLDOWN = __DEV__ ? 5 * 1000 : 45 * 1000; // 45 segundos en producción
  
  private _isShowingAd = false;
  private appOpenAdLoading = false;
  private appReadyForAds = false;

  // ✅ NUEVOS CONTROLES PARA EVITAR SPAM DE OPEN ADS
  private appStateChangeTime = 0;
  private readonly MIN_TIME_BETWEEN_STATE_CHANGES = 3000; // 3 segundos mínimo

  private async isPremiumUserRobust(): Promise<boolean> {
    try {
      const now = Date.now();
      if (this.premiumCache && (now - this.premiumCache.timestamp) < this.PREMIUM_CACHE_DURATION) {
        console.log('🔥 [AdMob] Using cached premium status:', this.premiumCache.value);
        return this.premiumCache.value;
      }

      const revenueCatService = RevenueCatService.getInstance();
      const subscriptionStatus = await revenueCatService.checkPremiumStatus();
      const isPremium = subscriptionStatus.isActive;

      this.premiumCache = {
        value: isPremium,
        timestamp: now
      };

      console.log('🔥 [AdMob] Premium status from RevenueCat:', isPremium);
      return isPremium;

    } catch (error) {
      console.error('🔥 [AdMob] Error checking premium status:', error);
      return false;
    }
  }

  clearPremiumCache(): void {
    this.premiumCache = null;
    console.log('🔥 [AdMob] Premium cache cleared');
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) {
      console.log('🔥 [AdMob] Already initialized');
      return true;
    }

    try {
      console.log('🔥 [AdMob] 🚀 Starting AdMob initialization...');
      
      // ATT initialization
      try {
        const ATTService = require('@/services/attService').ATTService;
        if (ATTService.isAvailable()) {
          console.log('🔥 [AdMob] 🔔 Inicializando ATT para iOS...');
          const attResult = await ATTService.initializeATT();
          console.log('🔥 [AdMob] ✅ ATT inicializado:', {
            status: attResult.status,
            shouldShowAds: attResult.shouldShowAds,
            requestedAutomatically: attResult.requestedAutomatically
          });
        } else {
          console.log('🔥 [AdMob] ℹ️ ATT no disponible (Android o módulo no instalado)');
        }
      } catch (attError) {
        console.warn('🔥 [AdMob] ⚠️ Error inicializando ATT (continuando sin ATT):', attError);
      }
      
      const isPremium = await this.isPremiumUserRobust();
      if (isPremium) {
        console.log('🔥 [AdMob] Usuario premium - no inicializar ads');
        this.initialized = true;
        this.configLoaded = true;
        return true;
      }

      console.log('🔥 [AdMob] 📋 Loading Firebase config...');
      await this.loadFirebaseConfig();

      console.log('🔥 [AdMob] 📱 Initializing AdMob SDK...');
      await mobileAds().initialize();
      
      if (__DEV__) {
        await mobileAds().setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.PG,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
          testDeviceIdentifiers: ['EMULATOR'],
        });
        console.log('🔥 [AdMob] 🧪 Test device configuration set');
      }

      if (!this.adConfig) {
        console.log('🔥 [AdMob] ⚠️ No config loaded, using fallback');
        this.setFallbackConfig();
      }

      if (await this.shouldShowAds()) {
        console.log('🔥 [AdMob] 📱 Preloading ads...');
        
        if (await this.shouldShowInterstitialAds()) {
          console.log('🔥 [AdMob] Loading interstitial...');
          await this.loadInterstitialAd();
        }
        
        if (await this.shouldShowOpenAds()) {
          console.log('🔥 [AdMob] Loading open ad...');
          await this.loadAppOpenAd();
        }
      } else {
        console.log('🔥 [AdMob] Ads disabled, skipping preload');
      }

      this.initialized = true;
      this.configLoaded = true;
      console.log('🔥 [AdMob] ✅ AdMob initialized successfully');
      return true;

    } catch (error) {
      console.error('🔥 [AdMob] ❌ AdMob initialization error:', error);
      this.setFallbackConfig();
      this.initialized = true;
      this.configLoaded = true;
      return false;
    }
  }

  private async loadFirebaseConfig(): Promise<void> {
    try {
      console.log('🔥 [AdMob] 📋 Loading ad config from Firebase...');
      const config = await fetchAdmobConfig();
      
      if (config) {
        console.log('🔥 [AdMob] 📋 Raw Firebase config received:', {
          bannerStatus: config.bannerAds?.status,
          interstitialStatus: config.interstitialAds?.status,
          openAdsStatus: config.openAds?.status,
        });
        
        this.adConfig = {
          bannerAds: {
            adUnitIdAndroid: config.bannerAds?.adUnitIdAndroid || TestIds.BANNER,
            adUnitIdIOS: config.bannerAds?.adUnitIdIOS || TestIds.BANNER,
            status: config.bannerAds?.status ?? true,
          },
          interstitialAds: {
            adUnitIdAndroid: config.interstitialAds?.adUnitIdAndroid || TestIds.INTERSTITIAL,
            adUnitIdIOS: config.interstitialAds?.adUnitIdIOS || TestIds.INTERSTITIAL,
            status: config.interstitialAds?.status ?? true,
          },
          openAds: {
            adUnitIdAndroid: config.openAds?.adUnitIdAndroid || TestIds.APP_OPEN,
            adUnitIdIOS: config.openAds?.adUnitIdIOS || 'ca-app-pub-3940256099942544/5575463023',
            status: config.openAds?.status ?? true,
          },
          anyAdEnabled: true,
        };
        
        console.log('🔥 [AdMob] ✅ Mapped ad config:', {
          bannerEnabled: this.adConfig.bannerAds.status,
          interstitialEnabled: this.adConfig.interstitialAds.status,
          openAdsEnabled: this.adConfig.openAds.status,
          anyAdEnabled: this.adConfig.anyAdEnabled,
          openAdUnitId: this.adConfig.openAds.adUnitIdIOS,
        });
        
        this.configLoaded = true;
      } else {
        console.log('🔥 [AdMob] ⚠️ No Firebase config, using fallback');
        this.setFallbackConfig();
      }
    } catch (error) {
      console.error('🔥 [AdMob] ❌ Error loading Firebase config:', error);
      this.setFallbackConfig();
    }
  }

  private setFallbackConfig(): void {
    console.log('🔥 [AdMob] 🔄 Setting fallback configuration...');
    
    this.adConfig = {
      bannerAds: {
        adUnitIdAndroid: TestIds.BANNER,
        adUnitIdIOS: TestIds.BANNER,
        status: true
      },
      interstitialAds: {
        adUnitIdAndroid: TestIds.INTERSTITIAL,
        adUnitIdIOS: TestIds.INTERSTITIAL,
        status: true
      },
      openAds: {
        adUnitIdAndroid: TestIds.APP_OPEN,
        adUnitIdIOS: 'ca-app-pub-3940256099942544/5575463023',
        status: true
      },
      anyAdEnabled: true
    };
    
    this.configLoaded = true;
    console.log('🔥 [AdMob] ✅ Fallback config set with correct Open Ad ID');
  }

  async shouldShowAds(): Promise<boolean> {
    const isPremium = await this.isPremiumUserRobust();
    if (isPremium) return false;
    
    return this.adConfig?.anyAdEnabled ?? false;
  }

  async shouldShowBannerAds(): Promise<boolean> {
    const isPremium = await this.isPremiumUserRobust();
    if (isPremium) return false;
    
    return (await this.shouldShowAds()) && (this.adConfig?.bannerAds.status ?? false);
  }

  async shouldShowInterstitialAds(): Promise<boolean> {
    const isPremium = await this.isPremiumUserRobust();
    if (isPremium) return false;
    
    return (await this.shouldShowAds()) && (this.adConfig?.interstitialAds.status ?? false);
  }

  async shouldShowOpenAds(): Promise<boolean> {
    const isPremium = await this.isPremiumUserRobust();
    if (isPremium) return false;
    
    return (await this.shouldShowAds()) && (this.adConfig?.openAds.status ?? false);
  }

  async getBannerAdUnitId(): Promise<string | null> {
    console.log('🔥 [AdMob] 📋 Getting banner ad unit ID...');
    
    const canShow = await this.shouldShowBannerAds();
    if (!canShow) {
      console.log('🔥 [AdMob] 🚫 Banner ads disabled (premium or config)');
      return null;
    }

    if (!this.adConfig) {
      console.log('🔥 [AdMob] ⚠️ No config available, returning test ID');
      return TestIds.BANNER;
    }
    
    const adUnitId = Platform.select({
      android: this.adConfig.bannerAds.adUnitIdAndroid,
      ios: this.adConfig.bannerAds.adUnitIdIOS,
      default: TestIds.BANNER
    });
    
    console.log('🔥 [AdMob] ✅ Banner ad unit ID:', {
      platform: Platform.OS,
      adUnitId: adUnitId,
      hasAdUnitId: !!adUnitId,
    });
    
    return adUnitId;
  }

  private getInterstitialAdUnitId(): string {
    if (!this.adConfig) {
      return TestIds.INTERSTITIAL;
    }
    
    return Platform.select({
      android: this.adConfig.interstitialAds.adUnitIdAndroid,
      ios: this.adConfig.interstitialAds.adUnitIdIOS,
      default: TestIds.INTERSTITIAL
    });
  }

  private getAppOpenAdUnitId(): string {
    if (!this.adConfig) {
      console.log('🔥 [AdMob] 📱 No config, using Test Open Ad ID');
      return 'ca-app-pub-3940256099942544/5575463023';
    }
    
    const adUnitId = Platform.select({
      android: this.adConfig.openAds.adUnitIdAndroid,
      ios: this.adConfig.openAds.adUnitIdIOS,
      default: 'ca-app-pub-3940256099942544/5575463023'
    });
    
    console.log('🔥 [AdMob] 📱 Open Ad Unit ID selected:', {
      platform: Platform.OS,
      adUnitId,
      usingTestId: __DEV__ || !this.adConfig,
    });
    
    return adUnitId;
  }

  private async loadInterstitialAd(): Promise<void> {
    const canShow = await this.shouldShowInterstitialAds();
    if (!canShow) return;

    try {
      const adUnitId = this.getInterstitialAdUnitId();
      console.log('🔥 [AdMob] 📱 Loading interstitial with ID:', adUnitId);
      
      this.interstitialAd = InterstitialAd.createForAdRequest(
        adUnitId,
        { requestNonPersonalizedAdsOnly: false }
      );

      this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('🔥 [AdMob] ✅ Interstitial ad loaded');
      });

      this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('🔥 [AdMob] ❌ Interstitial ad error:', error);
      });

      this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('🔥 [AdMob] 📱 Interstitial ad closed');
        this._isShowingAd = false;
        
        setTimeout(async () => {
          const stillCanShow = await this.shouldShowInterstitialAds();
          if (stillCanShow) {
            this.loadInterstitialAd();
          }
        }, 2000);
      });

      await this.interstitialAd.load();
    } catch (error) {
      console.error('🔥 [AdMob] ❌ Error loading interstitial ad:', error);
    }
  }

  async loadAppOpenAd(): Promise<boolean> {
    const canShow = await this.shouldShowOpenAds();
    if (!canShow || this.appOpenAdLoading) {
      console.log('🔥 [AdMob] Cannot load app open ad:', { canShow, loading: this.appOpenAdLoading });
      return false;
    }

    this.appOpenAdLoading = true;
    
    try {
      const adUnitId = this.getAppOpenAdUnitId();
      console.log('🔥 [AdMob] 📱 Loading app open ad with ID:', adUnitId);
      
      this.appOpenAd = AppOpenAd.createForAdRequest(
        adUnitId,
        { requestNonPersonalizedAdsOnly: false }
      );

      this.appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('🔥 [AdMob] ✅ App open ad loaded successfully');
        this.appOpenAdLoading = false;
      });

      this.appOpenAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('🔥 [AdMob] ❌ App open ad error:', error);
        this.appOpenAdLoading = false;
      });

      this.appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('🔥 [AdMob] 📱 App open ad closed');
        this._isShowingAd = false;
        this.appOpenAd = null;
        
        // ✅ MEJORADO: Cargar siguiente ad con delay más largo
        setTimeout(async () => {
          const stillCanShow = await this.shouldShowOpenAds();
          if (stillCanShow && this.appReadyForAds) {
            this.loadAppOpenAd();
          }
        }, 5000); // 5 segundos delay
      });

      await this.appOpenAd.load();
      console.log('🔥 [AdMob] ✅ App open ad load initiated');
      return true;
    } catch (error) {
      console.error('🔥 [AdMob] ❌ Error loading app open ad:', error);
      this.appOpenAdLoading = false;
      return false;
    }
  }

  // ✅ MEJORADO: Verificación más estricta para mostrar ads
  private isSafeToShowAds(): boolean {
    const appState = AppState.currentState;
    const now = Date.now();
    const timeSinceStateChange = now - this.appStateChangeTime;
    
    // Requiere que la app esté activa Y que haya pasado tiempo suficiente desde el último cambio
    const isSafe = appState === 'active' && 
                  timeSinceStateChange > this.MIN_TIME_BETWEEN_STATE_CHANGES &&
                  !this._isShowingAd;
    
    if (!isSafe) {
      console.log('🔥 [AdMob] 🚫 No es seguro mostrar ads:', {
        appState,
        timeSinceStateChange,
        isShowingAd: this._isShowingAd
      });
    }
    
    return isSafe;
  }

  async showInterstitialWithRobustChecks(): Promise<boolean> {
    const isPremium = await this.isPremiumUserRobust();
    if (isPremium) return false;
    
    const canShow = await this.shouldShowInterstitialAds();
    if (!canShow || this._isShowingAd || !this.isSafeToShowAds()) return false;
    
    const now = Date.now();
    const timeSinceLast = now - this.lastInterstitialShow;
    
    if (timeSinceLast < this.INTERSTITIAL_COOLDOWN) return false;
    
    if (!this.interstitialAd?.loaded) {
      await this.loadInterstitialAd();
      await new Promise(resolve => setTimeout(resolve, 3000));
      if (!this.interstitialAd?.loaded) return false;
    }
    
    try {
      this._isShowingAd = true;
      await this.interstitialAd.show();
      this.lastInterstitialShow = now;
      return true;
    } catch (error) {
      console.error('🔥 [AdMob] Error showing interstitial:', error);
      this._isShowingAd = false;
      return false;
    }
  }

  async forceShowInterstitialForTesting(): Promise<boolean> {
    if (!__DEV__) return false;
    
    this.lastInterstitialShow = 0;
    this._isShowingAd = false;
    
    return await this.showInterstitialWithRobustChecks();
  }

  async showInterstitialAd(): Promise<boolean> {
    return await this.showInterstitialWithRobustChecks();
  }

  // ✅ MEJORADO: Método principal para mostrar Open Ads con verificaciones robustas
  async showOpenAdWithRobustChecks(): Promise<boolean> {
    console.log('🔥 [AdMob] 📱 🔍 Verificando Open Ad...');
    
    // 1. Verificar premium
    const isPremium = await this.isPremiumUserRobust();
    if (isPremium) {
      console.log('🔥 [AdMob] 📱 Usuario premium - no mostrar Open Ad');
      return false;
    }

    // 2. Verificar si ya hay un ad mostrándose
    if (this._isShowingAd) {
      console.log('🔥 [AdMob] 📱 Ya hay un ad mostrándose');
      return false;
    }

    // 3. Verificar app state y timing
    if (!this.isSafeToShowAds()) {
      console.log('🔥 [AdMob] 📱 No es seguro mostrar ads en este momento');
      return false;
    }

    // 4. Verificar cooldown más permisivo
    const now = Date.now();
    const timeSinceLast = now - this.lastAppOpenShow;
    
    if (timeSinceLast < this.APP_OPEN_COOLDOWN) {
      console.log(`🔥 [AdMob] 📱 ⏰ Open Ad en cooldown - quedan ${Math.round((this.APP_OPEN_COOLDOWN - timeSinceLast) / 1000)}s`);
      return false;
    }

    // 5. Verificar configuración
    const canShow = await this.shouldShowOpenAds();
    if (!canShow) {
      console.log('🔥 [AdMob] 📱 Open Ads deshabilitados por configuración');
      return false;
    }

    // 6. Verificar si el ad está cargado
    if (!this.appOpenAd?.loaded) {
      console.log('🔥 [AdMob] 📱 Open Ad no está cargado - intentando cargar...');
      await this.loadAppOpenAd();
      
      // Esperar un poco para que se cargue
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!this.appOpenAd?.loaded) {
        console.log('🔥 [AdMob] 📱 Open Ad no se pudo cargar');
        return false;
      }
    }

    // 7. Mostrar el ad
    try {
      console.log('🔥 [AdMob] 📱 🚀 Mostrando Open Ad...');
      
      this._isShowingAd = true;
      await this.appOpenAd.show();
      this.lastAppOpenShow = now;
      
      console.log('🔥 [AdMob] 📱 ✅ Open Ad mostrado exitosamente');
      return true;
      
    } catch (error) {
      console.error('🔥 [AdMob] 📱 ❌ Error mostrando Open Ad:', error);
      this._isShowingAd = false;
      return false;
    }
  }

  async showAppOpenAd(): Promise<boolean> {
    return await this.showOpenAdWithRobustChecks();
  }

  async forceShowOpenAdForTesting(): Promise<boolean> {
    if (!__DEV__) {
      console.log('🔥 [AdMob] 📱 Force show solo disponible en desarrollo');
      return false;
    }
    
    console.log('🔥 [AdMob] 📱 🧪 FORZANDO OPEN AD PARA TESTING');
    
    // Reset cooldowns para testing
    this.lastAppOpenShow = 0;
    this._isShowingAd = false;
    this.appStateChangeTime = 0;
    
    // Cargar ad si no está disponible
    if (!this.appOpenAd?.loaded) {
      console.log('🔥 [AdMob] 📱 Cargando Open Ad para testing...');
      await this.loadAppOpenAd();
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    if (!this.appOpenAd?.loaded) {
      console.log('🔥 [AdMob] 📱 ❌ No se pudo cargar Open Ad para testing');
      return false;
    }
    
    try {
      console.log('🔥 [AdMob] 📱 🧪 Mostrando Open Ad de testing...');
      this._isShowingAd = true;
      await this.appOpenAd.show();
      this.lastAppOpenShow = Date.now();
      
      console.log('🔥 [AdMob] 📱 ✅ Open Ad de testing mostrado');
      return true;
      
    } catch (error) {
      console.error('🔥 [AdMob] 📱 ❌ Error en Open Ad de testing:', error);
      this._isShowingAd = false;
      return false;
    }
  }

  // ✅ NUEVO: Para verificar el estado de Open Ads
  getOpenAdStatus(): {
    isLoaded: boolean;
    isShowing: boolean;
    timeSinceLastShow: number;
    canShow: boolean;
    cooldownRemaining: number;
  } {
    const now = Date.now();
    const timeSinceLastShow = now - this.lastAppOpenShow;
    const cooldownRemaining = Math.max(0, this.APP_OPEN_COOLDOWN - timeSinceLastShow);
    
    return {
      isLoaded: this.appOpenAd?.loaded || false,
      isShowing: this._isShowingAd,
      timeSinceLastShow,
      canShow: (timeSinceLastShow >= this.APP_OPEN_COOLDOWN && !this._isShowingAd && (this.appOpenAd?.loaded ?? false)),
      cooldownRemaining
    };
  }

  setAppReadyForAds(): void {
    console.log('🔥 [AdMob] App ready for ads');
    this.appReadyForAds = true;
    this.appStateChangeTime = Date.now(); // ✅ NUEVO: Track cuando la app está lista
    
    this.shouldShowOpenAds().then(canShow => {
      if (canShow && !this.appOpenAd && !this.appOpenAdLoading) {
        // ✅ NUEVO: Delay para evitar mostrar ad inmediatamente al inicio
        setTimeout(() => {
          this.loadAppOpenAd();
        }, 3000);
      }
    });
  }

  async updatePremiumStatus(): Promise<void> {
    console.log('🔥 [AdMob] Updating premium status...');
    
    this.clearPremiumCache();
    
    const isPremium = await this.isPremiumUserRobust();
    
    if (isPremium) {
      this.interstitialAd = null;
      this.appOpenAd = null;
      console.log('🔥 [AdMob] Premium user - ads cleared');
    } else {
      const canShowAds = await this.shouldShowAds();
      if (canShowAds) {
        if (await this.shouldShowInterstitialAds()) {
          await this.loadInterstitialAd();
        }
        if (await this.shouldShowOpenAds() && this.appReadyForAds) {
          await this.loadAppOpenAd();
        }
      }
    }
    
    // ✅ NUEVO: Update app state change time
    this.appStateChangeTime = Date.now();
  }

  async refreshFirebaseConfig(): Promise<void> {
    try {
      console.log('🔥 [AdMob] Refreshing Firebase ad config...');
      await this.loadFirebaseConfig();
      console.log('🔥 [AdMob] Firebase config refreshed');
    } catch (error) {
      console.error('🔥 [AdMob] Error refreshing Firebase config:', error);
    }
  }

  async getBannerAdUnitIdForHook(): Promise<string | null> {
    return await this.getBannerAdUnitId();
  }

  async getAdsStatus() {
    const isPremium = await this.isPremiumUserRobust();
    
    return {
      userIsPremium: isPremium,
      bannerAds: await this.shouldShowBannerAds(),
      interstitialAds: await this.shouldShowInterstitialAds(),
      openAds: await this.shouldShowOpenAds(),
      initialized: this.initialized,
      configLoaded: this.configLoaded,
      cacheStatus: {
        hasPremiumCache: !!this.premiumCache,
        cacheAge: this.premiumCache ? Date.now() - this.premiumCache.timestamp : null,
      },
    };
  }

  async getATTStatus(): Promise<{
    isAvailable: boolean;
    currentStatus: string;
    shouldShowAds: boolean;
  }> {
    try {
      const ATTService = require('@/services/attService').ATTService;
      const info = await ATTService.getStatusInfo();
      return {
        isAvailable: info.isAvailable,
        currentStatus: info.currentStatus,
        shouldShowAds: info.shouldShowAds,
      };
    } catch (error) {
      console.warn('🔥 [AdMob] ⚠️ Error getting ATT status:', error);
      return {
        isAvailable: false,
        currentStatus: 'not_available',
        shouldShowAds: true,
      };
    }
  }

  cleanup(): void {
    this.interstitialAd = null;
    this.appOpenAd = null;
    this.premiumCache = null;
    this.initialized = false;
    this.configLoaded = false;
    console.log('🔥 [AdMob] Service cleaned up');
  }
}

// ✅ EXPORT CORRECTO - Manteniendo tu estructura actual
const AdMobServiceInstance = new AdMobManager();
export { AdMobServiceInstance as AdMobService };
export default AdMobServiceInstance;
