// monetization-ios/index.ts
// Main Monetization Module for Devotional Apps

import { Platform } from 'react-native';
import { MONETIZATION_CONFIG, AD_UNITS } from './config/constants';
import { ATTService } from './services/attService';
import { AdMobService } from './services/adMobService';
import { RevenueCatService } from './services/revenueCatService';

// Export services
export { ATTService } from './services/attService';
export { AdMobService } from './services/adMobService';
export { RevenueCatService } from './services/revenueCatService';

// Export hooks
export { useATT } from './hooks/useATT';
export { usePremium } from './hooks/usePremium';
export { useBannerAds } from './hooks/useBannerAds';
export { useInterstitialAds } from './hooks/useInterstitialAds';

// Export components
export { BannerAdComponent as BannerAd } from './components/ads/BannerAd';

// Export types
export type {
  SubscriptionStatus,
  PremiumFeatures,
  PurchaseResult,
  CustomerInfo,
  FormattedOfferings,
  FormattedPackage,
  DevotionalPremiumBenefits,
  SpiritualEngagementMetrics,
  MonetizationInsights,
  ATTStatus,
  ATTConfiguration,
  AdConfiguration,
  BannerAdConfig,
  InterstitialAdConfig,
  AppOpenAdConfig,
  RevenueAnalytics,
  DevotionalMonetizationConfig,
} from './types/subscription';

// Export configuration
export { MONETIZATION_CONFIG, AD_UNITS } from './config/constants';

// Configuration interface for initialization
interface MonetizationConfig {
  // AdMob configuration
  admob?: {
    testMode?: boolean;
    enableLogging?: boolean;
    bannerAds?: {
      enabled?: boolean;
      adUnitIdIOS?: string;
      adUnitIdAndroid?: string;
      refreshIntervalMs?: number;
      autoShow?: boolean;
    };
    interstitialAds?: {
      enabled?: boolean;
      adUnitIdIOS?: string;
      adUnitIdAndroid?: string;
      minIntervalMs?: number;
      cooldownMs?: number;
      maxPerDay?: number;
    };
    appOpenAds?: {
      enabled?: boolean;
      adUnitIdIOS?: string;
      adUnitIdAndroid?: string;
      timeoutMs?: number;
      maxShowIntervalMs?: number;
    };
  };
  
  // RevenueCat configuration
  revenuecat?: {
    iosApiKey?: string;
    androidApiKey?: string;
    entitlementId?: string;
    enableDebugLogs?: boolean;
    appVersion?: string;
  };
  
  // ATT configuration
  att?: {
    message?: {
      title?: string;
      description?: string;
    };
    timing?: {
      showAfterOnboarding?: boolean;
      delaySeconds?: number;
    };
  };
  
  // Debug configuration
  debug?: {
    enableConsoleLogging?: boolean;
    forceTestAds?: boolean;
    mockPremiumStatus?: boolean;
  };
}

/**
 * Configure the monetization module for devotional apps
 */
export async function configureMonetization(config: MonetizationConfig = {}): Promise<void> {
  try {
    console.log('[Monetization] 🚀 Configuring monetization for devotional app...');
    
    // Initialize ATT service first (required for iOS)
    console.log('[Monetization] 🔒 Initializing ATT service...');
    const attService = ATTService.getInstance();
    await attService.initialize();
    
    // Initialize AdMob service
    if (config.admob && AdMobService.isAvailable()) {
      console.log('[Monetization] 📱 Initializing AdMob service...');
      const adMobService = AdMobService.getInstance();
      await adMobService.initialize();
    } else {
      console.log('[Monetization] ⚠️ AdMob initialization skipped or not available');
    }
    
    // Initialize RevenueCat service
    if (config.revenuecat) {
      console.log('[Monetization] 💰 Initializing RevenueCat service...');
      const revenueCatService = RevenueCatService.getInstance();
      await revenueCatService.configure();
    } else {
      console.log('[Monetization] ⚠️ RevenueCat initialization skipped');
    }
    
    console.log('[Monetization] ✅ Monetization configuration complete for devotional app');
    
    // Log configuration summary
    logConfigurationSummary(config);
    
  } catch (error: any) {
    console.error('[Monetization] ❌ Error configuring monetization:', error);
    throw new Error(`Failed to configure monetization: ${error.message}`);
  }
}

/**
 * Log configuration summary for debugging
 */
function logConfigurationSummary(config: MonetizationConfig): void {
  console.log('[Monetization] 📊 Configuration Summary:');
  console.log('  App Type: Devotional for Men');
  console.log('  Target Audience: Christian Men');
  console.log('  Platform:', Platform.OS);
  console.log('  ATT Available:', ATTService.isAvailable());
  console.log('  AdMob Available:', AdMobService.isAvailable());
  console.log('  RevenueCat Available:', true); // Always available as it has fallbacks
  
  // AdMob configuration
  if (config.admob) {
    console.log('  AdMob Configuration:');
    console.log('    Test Mode:', config.admob?.testMode || __DEV__);
    console.log('    Banner Ads:', config.admob?.bannerAds?.enabled !== false);
    console.log('    Interstitial Ads:', config.admob?.interstitialAds?.enabled !== false);
    console.log('    App Open Ads:', config.admob?.appOpenAds?.enabled !== false);
  }
  
  // RevenueCat configuration
  if (config.revenuecat) {
    console.log('  RevenueCat Configuration:');
    console.log('    iOS API Key:', !!config.revenuecat?.iosApiKey);
    console.log('    Android API Key:', !!config.revenuecat?.androidApiKey);
    console.log('    Entitlement ID:', config.revenuecat?.entitlementId || 'devotional_premium');
    console.log('    Debug Logs:', config.revenuecat?.enableDebugLogs || __DEV__);
  }
  
  // Devotional app specific settings
  console.log('  Devotional App Settings:');
  console.log('    Respectful Ad Timing:', MONETIZATION_CONFIG.ADS.APP_OPEN.QUIET_HOURS?.enabled);
  console.log('    Morning Quiet Hours:', `${MONETIZATION_CONFIG.ADS.APP_OPEN.QUIET_HOURS?.start}:00 - ${MONETIZATION_CONFIG.ADS.APP_OPEN.QUIET_HOURS?.end}:00`);
  console.log('    Max Daily Interstitials:', MONETIZATION_CONFIG.ADS.INTERSTITIAL.MAX_PER_DAY);
  console.log('    Privacy First Approach:', MONETIZATION_CONFIG.PRIVACY.DATA_COLLECTION.minimal);
}

/**
 * Quick setup for common devotional app configurations
 */
export async function quickSetupDevotionalApp(options: {
  testMode?: boolean;
  enableQuietHours?: boolean;
  maxDailyAds?: number;
} = {}): Promise<void> {
  const {
    testMode = __DEV__,
    enableQuietHours = true,
    maxDailyAds = 4,
  } = options;
  
  console.log('[Monetization] 🙏 Quick setup for devotional app...');
  
  await configureMonetization({
    admob: {
      testMode,
      enableLogging: testMode,
      bannerAds: {
        enabled: true,
        refreshIntervalMs: 60000, // 1 minute (respectful)
        autoShow: false, // Manual control for respectful placement
      },
      interstitialAds: {
        enabled: true,
        minIntervalMs: 120000, // 2 minutes minimum
        cooldownMs: 180000,    // 3 minutes cooldown (respectful)
        maxPerDay: maxDailyAds,
      },
      appOpenAds: {
        enabled: enableQuietHours,
        timeoutMs: 4000,
        maxShowIntervalMs: 300000, // 5 minutes
      },
    },
    revenuecat: {
      enableDebugLogs: testMode,
      entitlementId: 'devotional_premium',
    },
    att: {
      message: {
        title: 'Support Our Christian Ministry',
        description: 'Help us keep this devotional app free while supporting our Christian ministry with relevant, faith-based content.',
      },
      timing: {
        showAfterOnboarding: true,
        delaySeconds: 3,
      },
    },
    debug: {
      enableConsoleLogging: testMode,
      forceTestAds: testMode,
      mockPremiumStatus: false,
    },
  });
  
  console.log('[Monetization] ✅ Devotional app setup complete');
}

/**
 * Check monetization health for devotional app
 */
export async function checkMonetizationHealth(): Promise<{
  att: {
    available: boolean;
    configured: boolean;
    status: string;
  };
  admob: {
    available: boolean;
    configured: boolean;
    adsEnabled: boolean;
  };
  revenuecat: {
    available: boolean;
    configured: boolean;
    hasOfferings: boolean;
  };
  overall: {
    healthy: boolean;
    issues: string[];
  };
}> {
  const issues: string[] = [];
  
  // Check ATT
  const attAvailable = ATTService.isAvailable();
  let attStatus = 'unknown';
  let attConfigured = false;
  
  try {
    const attService = ATTService.getInstance();
    const status = await attService.getStatus();
    attStatus = status.status;
    attConfigured = true;
  } catch (error) {
    issues.push('ATT service not properly configured');
  }
  
  // Check AdMob
  const admobAvailable = AdMobService.isAvailable();
  let admobConfigured = false;
  let adsEnabled = false;
  
  if (admobAvailable) {
    try {
      const adMobService = AdMobService.getInstance();
      const adsStatus = await adMobService.getAdsStatus();
      admobConfigured = true;
      adsEnabled = adsStatus.bannerAds || adsStatus.interstitialAds || adsStatus.appOpenAds;
    } catch (error) {
      issues.push('AdMob service not properly configured');
    }
  } else {
    issues.push('AdMob not available on this platform');
  }
  
  // Check RevenueCat
  let revenuecatConfigured = false;
  let hasOfferings = false;
  
  try {
    const revenueCatService = RevenueCatService.getInstance();
    const config = revenueCatService.getConfiguration();
    revenuecatConfigured = config.isConfigured && !config.hasError;
    
    if (revenuecatConfigured) {
      const offerings = revenueCatService.getCurrentOfferings();
      hasOfferings = !!offerings?.current;
    }
    
    if (!revenuecatConfigured) {
      issues.push('RevenueCat service not properly configured');
    }
    if (!hasOfferings) {
      issues.push('No RevenueCat offerings available');
    }
  } catch (error) {
    issues.push('RevenueCat service error');
  }
  
  const healthy = issues.length === 0;
  
  return {
    att: {
      available: attAvailable,
      configured: attConfigured,
      status: attStatus,
    },
    admob: {
      available: admobAvailable,
      configured: admobConfigured,
      adsEnabled,
    },
    revenuecat: {
      available: true,
      configured: revenuecatConfigured,
      hasOfferings,
    },
    overall: {
      healthy,
      issues,
    },
  };
}

/**
 * Helper function for GitHub Copilot implementation
 * This function analyzes the app and applies optimal monetization strategy
 */
export async function implementOptimalMonetization(): Promise<void> {
  console.log('[Monetization] 🎯 Implementing optimal monetization for devotional app...');
  
  // Use quick setup with devotional app optimizations
  await quickSetupDevotionalApp({
    testMode: __DEV__,
    enableQuietHours: true,
    maxDailyAds: 4, // Respectful for spiritual content
  });
  
  console.log('[Monetization] ✅ Optimal monetization implemented');
  console.log('[Monetization] 📋 Next steps:');
  console.log('  1. Configure ad unit IDs in app.json');
  console.log('  2. Set up RevenueCat API keys');
  console.log('  3. Create subscription products in App Store Connect');
  console.log('  4. Test with TestFlight/internal testing');
  console.log('  5. Monitor performance and adjust settings');
}

// Default export for convenience
export default {
  configureMonetization,
  quickSetupDevotionalApp,
  checkMonetizationHealth,
  implementOptimalMonetization,
  MONETIZATION_CONFIG,
  AD_UNITS,
};
