// monetization-ios/services/attService.ts
// Enhanced ATT Service for Devotional Apps

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MONETIZATION_CONFIG } from '../config/constants';
import type { ATTStatus } from '../types/subscription';

// Storage keys
const ATT_STATUS_KEY = '@att_status';
const ATT_REQUESTED_AT_KEY = '@att_requested_at';
const ATT_LAST_CHECKED_KEY = '@att_last_checked';

// Type-safe ATT module import
let TrackingTransparency: any = null;
let isATTAvailable = false;

try {
  TrackingTransparency = require('expo-tracking-transparency');
  isATTAvailable = true;
  console.log('[ATT] ✅ expo-tracking-transparency loaded successfully');
} catch (error) {
  console.warn('[ATT] ⚠️ expo-tracking-transparency not available:', (error as Error).message);
  isATTAvailable = false;
}

export class ATTService {
  private static instance: ATTService;
  private currentStatus: ATTStatus = {
    status: 'not-determined',
    isLoading: false,
    shouldShowAds: false,
    canTrack: false,
    lastChecked: new Date().toISOString(),
  };

  private constructor() {}

  public static getInstance(): ATTService {
    if (!ATTService.instance) {
      ATTService.instance = new ATTService();
    }
    return ATTService.instance;
  }

  /**
   * Check if ATT is available on this platform
   */
  public static isAvailable(): boolean {
    return Platform.OS === 'ios' && isATTAvailable && !!TrackingTransparency;
  }

  /**
   * Initialize ATT service and load saved status
   */
  public async initialize(): Promise<void> {
    console.log('[ATT] 🚀 Initializing ATT service...');

    if (!ATTService.isAvailable()) {
      console.log('[ATT] ℹ️ ATT not available on this platform');
      this.currentStatus = {
        status: 'authorized', // Default to authorized on non-iOS
        isLoading: false,
        shouldShowAds: true,
        canTrack: false, // Conservative default
        lastChecked: new Date().toISOString(),
      };
      return;
    }

    try {
      // Load saved status
      await this.loadSavedStatus();
      
      // Check current system status
      await this.checkCurrentStatus();
      
      console.log('[ATT] ✅ ATT service initialized:', this.currentStatus);
    } catch (error) {
      console.error('[ATT] ❌ Error initializing ATT service:', error);
      throw error;
    }
  }

  /**
   * Load previously saved ATT status from storage
   */
  private async loadSavedStatus(): Promise<void> {
    try {
      const [savedStatus, requestedAt, lastChecked] = await Promise.all([
        AsyncStorage.getItem(ATT_STATUS_KEY),
        AsyncStorage.getItem(ATT_REQUESTED_AT_KEY),
        AsyncStorage.getItem(ATT_LAST_CHECKED_KEY),
      ]);

      if (savedStatus) {
        const parsed = JSON.parse(savedStatus);
        this.currentStatus = {
          ...this.currentStatus,
          status: parsed.status || 'not-determined',
          requestedAt: requestedAt || undefined,
          lastChecked: lastChecked || new Date().toISOString(),
        };
      }

      console.log('[ATT] 📱 Loaded saved status:', this.currentStatus);
    } catch (error) {
      console.error('[ATT] ❌ Error loading saved status:', error);
    }
  }

  /**
   * Check current ATT status from the system
   */
  private async checkCurrentStatus(): Promise<void> {
    if (!ATTService.isAvailable()) {
      return;
    }

    try {
      const systemStatus = await TrackingTransparency.getTrackingPermissionsAsync();
      const attStatus = this.mapSystemStatus(systemStatus.status);
      
      // Update our status
      this.currentStatus = {
        ...this.currentStatus,
        status: attStatus,
        shouldShowAds: this.determineShouldShowAds(attStatus),
        canTrack: attStatus === 'authorized',
        lastChecked: new Date().toISOString(),
      };

      // Save updated status
      await this.saveStatus();

      console.log('[ATT] 🔄 Current system status:', {
        system: systemStatus.status,
        mapped: attStatus,
        shouldShowAds: this.currentStatus.shouldShowAds,
        canTrack: this.currentStatus.canTrack,
      });

    } catch (error) {
      console.error('[ATT] ❌ Error checking current status:', error);
    }
  }

  /**
   * Map system ATT status to our standard format
   */
  private mapSystemStatus(systemStatus: string): ATTStatus['status'] {
    switch (systemStatus) {
      case 'granted':
      case 'authorized':
        return 'authorized';
      case 'denied':
        return 'denied';
      case 'restricted':
        return 'restricted';
      case 'undetermined':
      case 'not-determined':
      default:
        return 'not-determined';
    }
  }

  /**
   * Determine if ads should be shown based on ATT status and devotional app considerations
   */
  private determineShouldShowAds(status: ATTStatus['status']): boolean {
    switch (status) {
      case 'authorized':
        return true; // User explicitly authorized - show personalized ads
      
      case 'denied':
        // For devotional apps, we can still show non-personalized ads
        // This is respectful and maintains revenue while honoring privacy
        return true; // Show non-personalized ads
      
      case 'restricted':
        // Restricted means parental controls or enterprise policy
        // For family-friendly devotional content, this should be safe
        return true; // Show non-personalized ads
      
      case 'not-determined':
        // Conservative approach: no ads until user makes a choice
        // This aligns with Christian values of respecting user autonomy
        return false;
      
      default:
        return false;
    }
  }

  /**
   * Request tracking permission with devotional app messaging
   */
  public async requestTrackingPermission(): Promise<ATTStatus['status']> {
    if (!ATTService.isAvailable()) {
      console.log('[ATT] ℹ️ ATT not available - returning authorized');
      return 'authorized';
    }

    try {
      this.currentStatus.isLoading = true;
      
      console.log('[ATT] 🙏 Requesting tracking permission with Christian context...');

      // Request permission with our devotional app context
      const result = await TrackingTransparency.requestTrackingPermissionsAsync();
      const status = this.mapSystemStatus(result.status);

      // Update status
      this.currentStatus = {
        ...this.currentStatus,
        status,
        isLoading: false,
        shouldShowAds: this.determineShouldShowAds(status),
        canTrack: status === 'authorized',
        requestedAt: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
      };

      // Save to storage
      await this.saveStatus();
      await AsyncStorage.setItem(ATT_REQUESTED_AT_KEY, this.currentStatus.requestedAt!);

      console.log('[ATT] 📝 Permission request result:', {
        requested: status,
        shouldShowAds: this.currentStatus.shouldShowAds,
        canTrack: this.currentStatus.canTrack,
      });

      // Track this important moment for analytics
      this.trackATTDecision(status);

      return status;

    } catch (error) {
      console.error('[ATT] ❌ Error requesting permission:', error);
      this.currentStatus.isLoading = false;
      throw error;
    }
  }

  /**
   * Save current status to storage
   */
  private async saveStatus(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(ATT_STATUS_KEY, JSON.stringify({
          status: this.currentStatus.status,
          shouldShowAds: this.currentStatus.shouldShowAds,
          canTrack: this.currentStatus.canTrack,
        })),
        AsyncStorage.setItem(ATT_LAST_CHECKED_KEY, this.currentStatus.lastChecked),
      ]);
    } catch (error) {
      console.error('[ATT] ❌ Error saving status:', error);
    }
  }

  /**
   * Track ATT decision for analytics and optimization
   */
  private trackATTDecision(status: ATTStatus['status']): void {
    try {
      // Track this moment for understanding user privacy preferences
      console.log('[ATT] 📊 Tracking ATT decision for devotional app optimization:', {
        status,
        timestamp: new Date().toISOString(),
        appType: MONETIZATION_CONFIG.APP_TYPE,
        audience: MONETIZATION_CONFIG.TARGET_AUDIENCE,
      });

      // Here you could send to your analytics service
      // Example: Analytics.track('att_decision', { status, app_type: 'devotional' });
      
    } catch (error) {
      console.error('[ATT] ❌ Error tracking ATT decision:', error);
    }
  }

  /**
   * Get current ATT status
   */
  public async getStatus(): Promise<ATTStatus> {
    // Refresh status from system if it's been a while
    const lastChecked = new Date(this.currentStatus.lastChecked);
    const now = new Date();
    const hoursSinceLastCheck = (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastCheck > 24) { // Refresh daily
      await this.checkCurrentStatus();
    }

    return { ...this.currentStatus };
  }

  /**
   * Check if ads should be shown (primary method for ad services)
   */
  public async shouldShowAds(): Promise<boolean> {
    const status = await this.getStatus();
    return status.shouldShowAds;
  }

  /**
   * Check if tracking is allowed
   */
  public async canTrack(): Promise<boolean> {
    const status = await this.getStatus();
    return status.canTrack;
  }

  /**
   * Get ad request configuration based on ATT status
   */
  public async getAdRequestConfig(): Promise<{
    requestNonPersonalizedAdsOnly: boolean;
    limitAdTracking: boolean;
    tagForChildDirectedTreatment?: boolean;
  }> {
    const status = await this.getStatus();
    
    return {
      requestNonPersonalizedAdsOnly: status.status !== 'authorized',
      limitAdTracking: status.status !== 'authorized',
      // For family-friendly devotional apps, we can be extra cautious
      tagForChildDirectedTreatment: false, // Set to true if your app targets children
    };
  }

  /**
   * Check if we should show the ATT prompt based on devotional app UX
   */
  public async shouldShowATTPrompt(): Promise<boolean> {
    if (!ATTService.isAvailable()) {
      return false;
    }

    const status = await this.getStatus();
    
    // Only show if status is undetermined
    if (status.status !== 'not-determined') {
      return false;
    }

    // For devotional apps, we should be respectful of timing
    // Don't show during typical morning devotion hours (6-9 AM)
    if (MONETIZATION_CONFIG.ADS.APP_OPEN.QUIET_HOURS?.enabled) {
      const hour = new Date().getHours();
      const quietStart = MONETIZATION_CONFIG.ADS.APP_OPEN.QUIET_HOURS.start;
      const quietEnd = MONETIZATION_CONFIG.ADS.APP_OPEN.QUIET_HOURS.end;
      
      if (hour >= quietStart && hour <= quietEnd) {
        console.log('[ATT] 🤫 In quiet hours - deferring ATT prompt');
        return false;
      }
    }

    return true;
  }

  /**
   * Reset ATT status (for testing purposes)
   */
  public async resetStatus(): Promise<void> {
    if (!__DEV__) {
      console.warn('[ATT] ⚠️ Reset only available in development');
      return;
    }

    try {
      await Promise.all([
        AsyncStorage.removeItem(ATT_STATUS_KEY),
        AsyncStorage.removeItem(ATT_REQUESTED_AT_KEY),
        AsyncStorage.removeItem(ATT_LAST_CHECKED_KEY),
      ]);

      this.currentStatus = {
        status: 'not-determined',
        isLoading: false,
        shouldShowAds: false,
        canTrack: false,
        lastChecked: new Date().toISOString(),
      };

      console.log('[ATT] 🔄 Status reset for testing');
    } catch (error) {
      console.error('[ATT] ❌ Error resetting status:', error);
    }
  }

  /**
   * Get human-readable status description for devotional context
   */
  public getStatusDescription(status: ATTStatus['status']): string {
    switch (status) {
      case 'authorized':
        return 'You\'ve chosen to support our ministry with personalized content. Thank you!';
      
      case 'denied':
        return 'Your privacy choice is respected. You\'ll see general Christian content and ads.';
      
      case 'restricted':
        return 'Tracking is restricted by your device settings. You\'ll see general content.';
      
      case 'not-determined':
        return 'We\'d like to show you relevant Christian content and support our ministry.';
      
      default:
        return 'Privacy settings are being configured.';
    }
  }

  /**
   * Get privacy-focused messaging for devotional apps
   */
  public getPrivacyMessage(): {
    title: string;
    message: string;
    benefits: string[];
  } {
    return {
      title: MONETIZATION_CONFIG.PRIVACY.ATT_MESSAGE.title,
      message: MONETIZATION_CONFIG.PRIVACY.ATT_MESSAGE.message,
      benefits: [
        '📖 Personalized devotional recommendations',
        '🙏 Relevant spiritual content for men',
        '⛪ Supports our Christian ministry',
        '🔒 Your privacy remains protected',
        '✋ Easy to opt out anytime in Settings',
      ],
    };
  }
}

export default ATTService;
