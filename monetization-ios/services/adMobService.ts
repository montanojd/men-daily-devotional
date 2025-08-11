// monetization-ios/services/adMobService.ts
// Enhanced AdMob Service for Devotional Apps with Respectful Ad Management

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MONETIZATION_CONFIG, AD_UNITS } from '../config/constants';
import { ATTService } from './attService';
import type { AdConfiguration } from '../types/subscription';

// Storage keys
const AD_STATE_KEY = '@admob_state';
const INTERSTITIAL_STATS_KEY = '@interstitial_stats';
const DAILY_AD_COUNT_KEY = '@daily_ad_count';
const LAST_INTERSTITIAL_KEY = '@last_interstitial_time';

// Type-safe AdMob imports
let MobileAds: any = null;
let InterstitialAd: any = null;
let AdEventType: any = null;
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;
let AppOpenAd: any = null;
let isAdMobAvailable = false;

try {
  const GoogleMobileAds = require('react-native-google-mobile-ads');
  MobileAds = GoogleMobileAds.default;
  InterstitialAd = GoogleMobileAds.InterstitialAd;
  AdEventType = GoogleMobileAds.AdEventType;
  BannerAd = GoogleMobileAds.BannerAd;
  BannerAdSize = GoogleMobileAds.BannerAdSize;
  TestIds = GoogleMobileAds.TestIds;
  AppOpenAd = GoogleMobileAds.AppOpenAd;
  isAdMobAvailable = true;
  console.log('[AdMob] ✅ react-native-google-mobile-ads loaded successfully');
} catch (error) {
  console.warn('[AdMob] ⚠️ react-native-google-mobile-ads not available:', (error as Error).message);
  isAdMobAvailable = false;
}

interface AdState {
  initialized: boolean;
  userIsPremium: boolean;
  attAuthorized: boolean;
  dailyInterstitialCount: number;
  lastInterstitialTime: number | null;
  currentDate: string;
}

interface InterstitialStats {
  totalShown: number;
  totalRequested: number;
  successRate: number;
  lastShownAt: number | null;
  dailyCount: number;
  weeklyCount: number;
  rejectedReasons: string[];
}

export class AdMobService {
  private static instance: AdMobService;
  private state: AdState = {
    initialized: false,
    userIsPremium: false,
    attAuthorized: false,
    dailyInterstitialCount: 0,
    lastInterstitialTime: null,
    currentDate: new Date().toDateString(),
  };
  
  private interstitialAd: any = null;
  private appOpenAd: any = null;
  private interstitialStats: InterstitialStats = {
    totalShown: 0,
    totalRequested: 0,
    successRate: 0,
    lastShownAt: null,
    dailyCount: 0,
    weeklyCount: 0,
    rejectedReasons: [],
  };
  
  private attService: ATTService;

  private constructor() {
    this.attService = ATTService.getInstance();
  }

  public static getInstance(): AdMobService {
    if (!AdMobService.instance) {
      AdMobService.instance = new AdMobService();
    }
    return AdMobService.instance;
  }

  /**
   * Check if AdMob is available
   */
  public static isAvailable(): boolean {
    return isAdMobAvailable && !!MobileAds;
  }

  /**
   * Initialize AdMob with devotional app optimizations
   */
  public async initialize(): Promise<void> {
    if (this.state.initialized) {
      console.log('[AdMob] ✅ Already initialized');
      return;
    }

    if (!AdMobService.isAvailable()) {
      console.error('[AdMob] ❌ AdMob not available');
      throw new Error('AdMob not available on this platform');
    }

    try {
      console.log('[AdMob] 🚀 Initializing AdMob for devotional app...');

      // Load saved state
      await this.loadState();

      // Initialize AdMob
      await MobileAds().initialize();

      // Configure for devotional app audience
      await this.configureForDevotionalApp();

      // Initialize ATT service
      await this.attService.initialize();

      // Update ATT status
      await this.updateATTStatus();

      // Set up interstitial ad
      await this.setupInterstitialAd();

      // Set up app open ad if enabled
      if (MONETIZATION_CONFIG.ADS.APP_OPEN.ENABLED) {
        await this.setupAppOpenAd();
      }

      this.state.initialized = true;
      await this.saveState();

      console.log('[AdMob] ✅ AdMob initialized successfully:', {
        attAuthorized: this.state.attAuthorized,
        userIsPremium: this.state.userIsPremium,
        interstitialReady: !!this.interstitialAd,
        appOpenReady: !!this.appOpenAd,
      });

    } catch (error) {
      console.error('[AdMob] ❌ Error initializing AdMob:', error);
      throw error;
    }
  }

  /**
   * Configure AdMob specifically for devotional/Christian apps
   */
  private async configureForDevotionalApp(): Promise<void> {
    try {
      // Set appropriate content filtering for Christian audience
      const settings = MobileAds().settings;
      
      // Configure for family-friendly content
      await settings.setRequestConfiguration({
        // Tag for child-directed treatment if your app targets children
        // For adult devotional app, this should be false
        tagForChildDirectedTreatment: false,
        
        // Tag for users under age of consent in Europe
        tagForUnderAgeOfConsent: false,
        
        // Set max ad content rating to appropriate level
        maxAdContentRating: 'G', // General audiences - appropriate for Christian content
        
        // Test device IDs for development
        testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : [],
      });

      console.log('[AdMob] ⛪ Configured for Christian/family-friendly content');
    } catch (error) {
      console.error('[AdMob] ❌ Error configuring for devotional app:', error);
    }
  }

  /**
   * Update ATT status and adjust ad behavior
   */
  private async updateATTStatus(): Promise<void> {
    try {
      const attStatus = await this.attService.getStatus();
      this.state.attAuthorized = attStatus.canTrack;
      
      console.log('[AdMob] 🔒 ATT Status updated:', {
        status: attStatus.status,
        canTrack: attStatus.canTrack,
        shouldShowAds: attStatus.shouldShowAds,
      });
    } catch (error) {
      console.error('[AdMob] ❌ Error updating ATT status:', error);
    }
  }

  /**
   * Set up interstitial ad with respectful timing for devotional context
   */
  private async setupInterstitialAd(): Promise<void> {
    try {
      const adUnitId = this.getInterstitialAdUnitId();
      
      this.interstitialAd = InterstitialAd.createForAdRequest(adUnitId, await this.getAdRequestOptions());

      // Set up event listeners with devotional app considerations
      this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('[AdMob] 📱 Interstitial loaded and ready');
        this.interstitialStats.totalRequested++;
        this.updateSuccessRate();
      });

      this.interstitialAd.addAdEventListener(AdEventType.OPENED, () => {
        console.log('[AdMob] 👁️ Interstitial opened - user viewing ad');
        this.interstitialStats.totalShown++;
        this.interstitialStats.lastShownAt = Date.now();
        this.state.dailyInterstitialCount++;
        this.state.lastInterstitialTime = Date.now();
        this.saveState();
      });

      this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('[AdMob] ✅ Interstitial closed - resuming devotional experience');
        // Immediately start loading the next ad for respectful UX
        setTimeout(() => this.loadInterstitialAd(), 1000);
      });

      this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.error('[AdMob] ❌ Interstitial error:', error);
        this.interstitialStats.rejectedReasons.push(error.message || 'Unknown error');
        // Retry loading after a delay
        setTimeout(() => this.loadInterstitialAd(), 5000);
      });

      // Load the initial ad
      await this.loadInterstitialAd();

    } catch (error) {
      console.error('[AdMob] ❌ Error setting up interstitial ad:', error);
    }
  }

  /**
   * Load interstitial ad
   */
  private async loadInterstitialAd(): Promise<void> {
    try {
      if (!this.interstitialAd) {
        console.warn('[AdMob] ⚠️ Interstitial ad not initialized');
        return;
      }

      await this.interstitialAd.load();
      console.log('[AdMob] 🔄 Interstitial ad loading...');
    } catch (error) {
      console.error('[AdMob] ❌ Error loading interstitial ad:', error);
    }
  }

  /**
   * Set up app open ad with quiet hours for devotional apps
   */
  private async setupAppOpenAd(): Promise<void> {
    try {
      const adUnitId = this.getAppOpenAdUnitId();
      
      this.appOpenAd = AppOpenAd.createForAdRequest(adUnitId, await this.getAdRequestOptions());

      this.appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('[AdMob] 🚪 App Open ad loaded');
      });

      this.appOpenAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.error('[AdMob] ❌ App Open ad error:', error);
      });

      await this.appOpenAd.load();

    } catch (error) {
      console.error('[AdMob] ❌ Error setting up app open ad:', error);
    }
  }

  /**
   * Get appropriate ad unit ID for interstitials
   */
  private getInterstitialAdUnitId(): string {
    if (__DEV__) {
      return AD_UNITS.TEST.INTERSTITIAL;
    }
    
    return Platform.OS === 'ios' 
      ? AD_UNITS.PRODUCTION.IOS.INTERSTITIAL
      : AD_UNITS.PRODUCTION.ANDROID.INTERSTITIAL;
  }

  /**
   * Get appropriate ad unit ID for app open ads
   */
  private getAppOpenAdUnitId(): string {
    if (__DEV__) {
      return AD_UNITS.TEST.APP_OPEN;
    }
    
    return Platform.OS === 'ios'
      ? AD_UNITS.PRODUCTION.IOS.APP_OPEN
      : AD_UNITS.PRODUCTION.ANDROID.APP_OPEN;
  }

  /**
   * Get appropriate ad unit ID for banner ads
   */
  public getBannerAdUnitId(): string {
    if (__DEV__) {
      return AD_UNITS.TEST.BANNER;
    }
    
    return Platform.OS === 'ios'
      ? AD_UNITS.PRODUCTION.IOS.BANNER
      : AD_UNITS.PRODUCTION.ANDROID.BANNER;
  }

  /**
   * Get ad request options based on ATT status and devotional app needs
   */
  private async getAdRequestOptions(): Promise<any> {
    const attConfig = await this.attService.getAdRequestConfig();
    
    return {
      requestNonPersonalizedAdsOnly: attConfig.requestNonPersonalizedAdsOnly,
      
      // Content filtering for Christian apps
      contentFiltering: {
        maxAdContentRating: 'G', // General audiences
        blockCategories: [
          'gambling',
          'alcohol',
          'dating',
          'politics', // Avoid divisive content in spiritual space
        ],
      },
      
      // Additional privacy-conscious settings
      tagForChildDirectedTreatment: attConfig.tagForChildDirectedTreatment || false,
      limitAdTracking: attConfig.limitAdTracking,
    };
  }

  /**
   * Show interstitial ad with devotional app timing considerations
   */
  public async showInterstitialAd(location: string = 'unknown'): Promise<boolean> {
    try {
      console.log(`[AdMob] 🎯 Attempting to show interstitial from: ${location}`);

      // Check if we can show ads
      if (!await this.canShowInterstitialAd()) {
        console.log('[AdMob] ⏸️ Cannot show interstitial ad right now');
        return false;
      }

      // Check respectful timing for devotional apps
      if (!this.isRespectfulTimingForAd()) {
        console.log('[AdMob] 🤫 Not a respectful time for ads in devotional context');
        return false;
      }

      if (!this.interstitialAd) {
        console.warn('[AdMob] ⚠️ Interstitial ad not ready');
        return false;
      }

      // Show the ad
      await this.interstitialAd.show();
      
      // Track successful show
      console.log(`[AdMob] ✅ Interstitial shown successfully from: ${location}`);
      return true;

    } catch (error) {
      console.error('[AdMob] ❌ Error showing interstitial ad:', error);
      return false;
    }
  }

  /**
   * Check if interstitial ad can be shown based on devotional app rules
   */
  private async canShowInterstitialAd(): Promise<boolean> {
    // Check if premium user
    if (this.state.userIsPremium) {
      console.log('[AdMob] 👑 User is premium - no ads');
      return false;
    }

    // Check if ads are enabled by ATT
    if (!await this.attService.shouldShowAds()) {
      console.log('[AdMob] 🔒 ATT disallows ads');
      return false;
    }

    // Check daily limit for respectful UX
    if (this.state.dailyInterstitialCount >= MONETIZATION_CONFIG.ADS.INTERSTITIAL.MAX_PER_DAY) {
      console.log('[AdMob] 📊 Daily interstitial limit reached');
      return false;
    }

    // Check cooldown period
    const cooldown = MONETIZATION_CONFIG.ADS.INTERSTITIAL.COOLDOWN_PERIOD;
    if (this.state.lastInterstitialTime && (Date.now() - this.state.lastInterstitialTime) < cooldown) {
      console.log('[AdMob] ⏰ Still in cooldown period');
      return false;
    }

    // Check if ad is loaded
    if (!this.interstitialAd || !this.interstitialAd.loaded) {
      console.log('[AdMob] 📱 Interstitial ad not loaded');
      return false;
    }

    return true;
  }

  /**
   * Check if timing is respectful for devotional context
   */
  private isRespectfulTimingForAd(): boolean {
    const hour = new Date().getHours();
    
    // Respect quiet hours for morning devotions
    const quietHours = MONETIZATION_CONFIG.ADS.APP_OPEN.QUIET_HOURS;
    if (quietHours?.enabled) {
      if (hour >= quietHours.start && hour <= quietHours.end) {
        console.log('[AdMob] 🌅 In morning devotion quiet hours');
        return false;
      }
    }

    // Additional respectful timing considerations
    // Late evening - people might be doing evening prayers
    if (hour >= 22 || hour <= 5) {
      console.log('[AdMob] 🌙 Late night/early morning - respectful timing');
      return false;
    }

    return true;
  }

  /**
   * Show interstitial with robust error handling and user respect
   */
  public async showInterstitialWithRobustChecks(): Promise<boolean> {
    try {
      // Reset daily count if new day
      this.checkAndResetDailyCount();

      // Comprehensive checks
      const canShow = await this.canShowInterstitialAd();
      const respectfulTiming = this.isRespectfulTimingForAd();
      
      if (!canShow || !respectfulTiming) {
        console.log('[AdMob] 🛑 Cannot show ad:', { canShow, respectfulTiming });
        return false;
      }

      // Show with timeout for better UX
      const showPromise = this.showInterstitialAd('robust_check');
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 5000); // 5 second timeout
      });

      const result = await Promise.race([showPromise, timeoutPromise]);
      
      if (!result) {
        console.log('[AdMob] ⏰ Interstitial show timed out or failed');
      }

      return result;

    } catch (error) {
      console.error('[AdMob] ❌ Error in robust interstitial show:', error);
      return false;
    }
  }

  /**
   * Force show interstitial for testing (dev only)
   */
  public async forceShowInterstitialForTesting(): Promise<boolean> {
    if (!__DEV__) {
      console.warn('[AdMob] ⚠️ Force show only available in development');
      return false;
    }

    try {
      console.log('[AdMob] 🧪 FORCE SHOWING INTERSTITIAL FOR TESTING');
      
      if (!this.interstitialAd) {
        await this.setupInterstitialAd();
      }

      // Wait for ad to load
      let attempts = 0;
      while ((!this.interstitialAd || !this.interstitialAd.loaded) && attempts < 10) {
        console.log(`[AdMob] 🔄 Waiting for ad to load... (attempt ${attempts + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (this.interstitialAd && this.interstitialAd.loaded) {
        await this.interstitialAd.show();
        return true;
      } else {
        console.log('[AdMob] ❌ Could not load ad for testing');
        return false;
      }

    } catch (error) {
      console.error('[AdMob] ❌ Error force showing ad:', error);
      return false;
    }
  }

  /**
   * Show app open ad if appropriate
   */
  public async showAppOpenAd(): Promise<boolean> {
    try {
      if (!this.appOpenAd || !this.appOpenAd.loaded) {
        console.log('[AdMob] 🚪 App open ad not ready');
        return false;
      }

      if (this.state.userIsPremium) {
        console.log('[AdMob] 👑 User is premium - no app open ads');
        return false;
      }

      if (!await this.attService.shouldShowAds()) {
        console.log('[AdMob] 🔒 ATT disallows app open ads');
        return false;
      }

      if (!this.isRespectfulTimingForAd()) {
        console.log('[AdMob] 🤫 Not respectful timing for app open ad');
        return false;
      }

      await this.appOpenAd.show();
      console.log('[AdMob] ✅ App open ad shown');
      return true;

    } catch (error) {
      console.error('[AdMob] ❌ Error showing app open ad:', error);
      return false;
    }
  }

  /**
   * Check if banner ads should be shown on a specific location
   */
  public shouldShowBannerAd(location: string): boolean {
    // Check premium status
    if (this.state.userIsPremium) {
      return false;
    }

    // Check ATT status
    if (!this.state.attAuthorized && !this.canShowNonPersonalizedAds()) {
      return false;
    }

    // Check location-specific rules for devotional app
    const locationConfig = MONETIZATION_CONFIG.ADS.BANNER.LOCATIONS;
    const locationKey = location.toUpperCase() as keyof typeof locationConfig;
    return locationConfig[locationKey] || false;
  }

  /**
   * Check if non-personalized ads can be shown
   */
  private canShowNonPersonalizedAds(): boolean {
    // For devotional apps, we can show non-personalized ads even without ATT
    // as long as they are family-friendly and contextually appropriate
    return true;
  }

  /**
   * Update premium status
   */
  public async updatePremiumStatus(isPremium: boolean): Promise<void> {
    this.state.userIsPremium = isPremium;
    await this.saveState();
    
    console.log('[AdMob] 👑 Premium status updated:', isPremium);
  }

  /**
   * Get current ads status for hooks
   */
  public async getAdsStatus(): Promise<{
    userIsPremium: boolean;
    attAuthorized: boolean;
    bannerAds: boolean;
    interstitialAds: boolean;
    appOpenAds: boolean;
  }> {
    return {
      userIsPremium: this.state.userIsPremium,
      attAuthorized: this.state.attAuthorized,
      bannerAds: MONETIZATION_CONFIG.ADS.BANNER.ENABLED && !this.state.userIsPremium,
      interstitialAds: MONETIZATION_CONFIG.ADS.INTERSTITIAL.ENABLED && !this.state.userIsPremium,
      appOpenAds: MONETIZATION_CONFIG.ADS.APP_OPEN.ENABLED && !this.state.userIsPremium,
    };
  }

  /**
   * Get interstitial statistics
   */
  public getInterstitialStats(): InterstitialStats {
    return { ...this.interstitialStats };
  }

  /**
   * Reset daily count if new day
   */
  private checkAndResetDailyCount(): void {
    const today = new Date().toDateString();
    if (this.state.currentDate !== today) {
      this.state.currentDate = today;
      this.state.dailyInterstitialCount = 0;
      this.interstitialStats.dailyCount = 0;
      console.log('[AdMob] 📅 New day - reset daily ad count');
    }
  }

  /**
   * Update success rate statistics
   */
  private updateSuccessRate(): void {
    if (this.interstitialStats.totalRequested > 0) {
      this.interstitialStats.successRate = 
        this.interstitialStats.totalShown / this.interstitialStats.totalRequested;
    }
  }

  /**
   * Load state from storage
   */
  private async loadState(): Promise<void> {
    try {
      const [savedState, savedStats] = await Promise.all([
        AsyncStorage.getItem(AD_STATE_KEY),
        AsyncStorage.getItem(INTERSTITIAL_STATS_KEY),
      ]);

      if (savedState) {
        const parsed = JSON.parse(savedState);
        this.state = { ...this.state, ...parsed };
      }

      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        this.interstitialStats = { ...this.interstitialStats, ...parsed };
      }

      console.log('[AdMob] 📱 State loaded from storage');
    } catch (error) {
      console.error('[AdMob] ❌ Error loading state:', error);
    }
  }

  /**
   * Save state to storage
   */
  private async saveState(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(AD_STATE_KEY, JSON.stringify(this.state)),
        AsyncStorage.setItem(INTERSTITIAL_STATS_KEY, JSON.stringify(this.interstitialStats)),
      ]);
    } catch (error) {
      console.error('[AdMob] ❌ Error saving state:', error);
    }
  }

  /**
   * Get debug information (dev only)
   */
  public getDebugInfo(): any {
    if (!__DEV__) return null;

    return {
      state: this.state,
      stats: this.interstitialStats,
      interstitialReady: !!this.interstitialAd && this.interstitialAd.loaded,
      appOpenReady: !!this.appOpenAd && this.appOpenAd.loaded,
      canShowInterstitial: this.canShowInterstitialAd(),
      respectfulTiming: this.isRespectfulTimingForAd(),
    };
  }
}

export default AdMobService;
