import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { RemoteAdConfig } from './adsConfig';

class InterstitialManager {
  private ad: InterstitialAd | null = null;
  private lastShown = 0;
  private cooldownMs = 120000; // 2 minutes
  private config: RemoteAdConfig | null = null;
  private isLoading = false;

  setConfig(config: RemoteAdConfig | null) {
    this.config = config;
    if (config?.interstitialAds?.status) {
      this.preload();
    }
  }

  private getAdUnitId() {
    return __DEV__ ? TestIds.INTERSTITIAL : (this.config?.interstitialAds?.adUnitIdIOS || TestIds.INTERSTITIAL);
  }

  private preload() {
    if (this.isLoading || this.ad) return;
    try {
      this.isLoading = true;
      this.ad = InterstitialAd.createForAdRequest(this.getAdUnitId(), {
        requestNonPersonalizedAdsOnly: true
      });
      
      this.ad.addAdEventListener(AdEventType.LOADED, () => {
        this.isLoading = false;
      });
      
      this.ad.addAdEventListener(AdEventType.CLOSED, () => {
        this.ad = null;
        this.lastShown = Date.now();
        // Preload next ad
        setTimeout(() => this.preload(), 1000);
      });
      
      this.ad.addAdEventListener(AdEventType.ERROR, () => {
        this.ad = null;
        this.isLoading = false;
      });

      this.ad.load();
    } catch (e) {
      this.isLoading = false;
      console.warn('Interstitial preload error:', e);
    }
  }

  async show(isPremium: boolean): Promise<boolean> {
    if (isPremium || !this.config?.interstitialAds?.status) return false;
    
    const now = Date.now();
    if (now - this.lastShown < this.cooldownMs) return false;
    
    if (!this.ad) {
      this.preload();
      return false;
    }

    try {
      await this.ad.show();
      return true;
    } catch (e) {
      console.warn('Interstitial show error:', e);
      return false;
    }
  }
}

export const interstitialManager = new InterstitialManager();
