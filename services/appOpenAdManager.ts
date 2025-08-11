import { AppOpenAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { AppState, AppStateStatus } from 'react-native';
import { RemoteAdConfig } from './adsConfig';

class AppOpenAdManager {
  private ad: AppOpenAd | null = null;
  private config: RemoteAdConfig | null = null;
  private isLoading = false;
  private lastShown = 0;
  private appStateListener: any = null;

  setConfig(config: RemoteAdConfig | null) {
    this.config = config;
    if (config?.openAds?.status) {
      this.setupAppStateListener();
      this.preload();
    } else {
      this.removeAppStateListener();
    }
  }

  private getAdUnitId() {
    return __DEV__ ? TestIds.APP_OPEN : (this.config?.openAds?.adUnitIdIOS || TestIds.APP_OPEN);
  }

  private setupAppStateListener() {
    if (this.appStateListener) return;
    this.appStateListener = AppState.addEventListener('change', this.handleAppStateChange);
  }

  private removeAppStateListener() {
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // Show ad when app becomes active (foreground)
      this.showIfReady();
    }
  };

  private preload() {
    if (this.isLoading || this.ad) return;
    try {
      this.isLoading = true;
      this.ad = AppOpenAd.createForAdRequest(this.getAdUnitId(), {
        requestNonPersonalizedAdsOnly: true
      });
      
      this.ad.addAdEventListener(AdEventType.LOADED, () => {
        this.isLoading = false;
      });
      
      this.ad.addAdEventListener(AdEventType.CLOSED, () => {
        this.ad = null;
        this.lastShown = Date.now();
        setTimeout(() => this.preload(), 2000);
      });
      
      this.ad.addAdEventListener(AdEventType.ERROR, () => {
        this.ad = null;
        this.isLoading = false;
        setTimeout(() => this.preload(), 5000);
      });

      this.ad.load();
    } catch (e) {
      this.isLoading = false;
      console.warn('App Open ad preload error:', e);
    }
  }

  private async showIfReady() {
    // Don't show too frequently (once per session roughly)
    const now = Date.now();
    if (now - this.lastShown < 300000) return; // 5 minutes cooldown
    
    if (!this.ad) return;

    try {
      await this.ad.show();
    } catch (e) {
      console.warn('App Open ad show error:', e);
    }
  }

  setPremiumStatus(isPremium: boolean) {
    if (isPremium) {
      this.removeAppStateListener();
      this.ad = null;
    } else if (this.config?.openAds?.status) {
      this.setupAppStateListener();
      this.preload();
    }
  }

  cleanup() {
    this.removeAppStateListener();
    this.ad = null;
  }
}

export const appOpenAdManager = new AppOpenAdManager();
