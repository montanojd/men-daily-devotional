// monetization-ios/services/revenueCatService.ts
// Enhanced RevenueCat Service for Devotional Apps

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MONETIZATION_CONFIG } from '../config/constants';
import type {
  PurchaseResult,
  SubscriptionStatus,
  PremiumFeatures,
  CustomerInfo,
  FormattedOfferings,
  DevotionalPremiumBenefits,
  SpiritualEngagementMetrics,
  MonetizationInsights,
} from '../types/subscription';

// Storage keys
const CUSTOMER_INFO_KEY = '@revenuecat_customer_info';
const PREMIUM_STATUS_KEY = '@premium_status';
const ENGAGEMENT_METRICS_KEY = '@spiritual_engagement_metrics';
const LAST_SYNC_KEY = '@revenuecat_last_sync';

// Type-safe RevenueCat import
let Purchases: any = null;
let LOG_LEVEL: any = null;
let PURCHASE_TYPE: any = null;
let PACKAGE_TYPE: any = null;
let PERIOD_TYPE: any = null;
let PURCHASES_ERROR_CODE: any = null;
let isRevenueCatAvailable = false;

try {
  const RevenueCatModule = require('react-native-purchases');
  
  if (RevenueCatModule && RevenueCatModule.default) {
    Purchases = RevenueCatModule.default;
    LOG_LEVEL = RevenueCatModule.LOG_LEVEL;
    PURCHASE_TYPE = RevenueCatModule.PURCHASE_TYPE;
    PACKAGE_TYPE = RevenueCatModule.PACKAGE_TYPE;
    PERIOD_TYPE = RevenueCatModule.PERIOD_TYPE;
    PURCHASES_ERROR_CODE = RevenueCatModule.PURCHASES_ERROR_CODE;
    
    isRevenueCatAvailable = true;
    console.log('[RevenueCat] ✅ Module loaded successfully for devotional app');
  }
} catch (error: any) {
  console.warn('[RevenueCat] ⚠️ react-native-purchases not available:', error.message);
  isRevenueCatAvailable = false;
}

export class RevenueCatService {
  private static instance: RevenueCatService;
  private isConfigured: boolean = false;
  private configurationError: string | null = null;
  private currentOfferings: any = null;
  private customerInfo: CustomerInfo | null = null;
  private availableProducts: any[] = [];
  private engagementMetrics: SpiritualEngagementMetrics = {
    devotional_streak: 0,
    weekly_completions: 0,
    monthly_completions: 0,
    favorite_verses_count: 0,
    shared_content_count: 0,
    reflection_responses: 0,
    prayer_requests_submitted: 0,
    community_interactions: 0,
  };

  private constructor() {}

  public static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  /**
   * Check if RevenueCat is available
   */
  private checkAvailability(): boolean {
    if (!isRevenueCatAvailable || !Purchases) {
      console.error('[RevenueCat] ❌ RevenueCat not available');
      return false;
    }
    return true;
  }

  /**
   * Get RevenueCat configuration for devotional app
   */
  private getRevenueCatConfig() {
    const iosKey = Constants.expoConfig?.extra?.REVENUECAT_IOS_API_KEY;
    const androidKey = Constants.expoConfig?.extra?.REVENUECAT_ANDROID_API_KEY;
    const entitlementId = Constants.expoConfig?.extra?.REVENUECAT_ENTITLEMENT_ID || 'devotional_premium';

    const selectedKey = Platform.select({
      ios: iosKey,
      android: androidKey,
    });

    console.log('[RevenueCat] 🔑 Configuration loaded:', {
      hasIosKey: !!iosKey,
      hasAndroidKey: !!androidKey,
      platform: Platform.OS,
      hasSelectedKey: !!selectedKey,
      entitlementId,
    });

    return {
      apiKey: selectedKey,
      entitlementId,
      enableDebugLogs: __DEV__,
      attributes: {
        app_version: Constants.expoConfig?.extra?.APP_VERSION || '1.0.0',
        platform: Platform.OS,
        app_type: MONETIZATION_CONFIG.APP_TYPE,
        target_audience: MONETIZATION_CONFIG.TARGET_AUDIENCE,
      }
    };
  }

  /**
   * Configure RevenueCat for devotional app
   */
  public async configure(): Promise<void> {
    if (this.isConfigured) {
      console.log('[RevenueCat] ✅ Already configured');
      return;
    }

    if (!this.checkAvailability()) {
      const error = 'RevenueCat not available';
      this.configurationError = error;
      throw new Error(error);
    }

    try {
      const config = this.getRevenueCatConfig();

      if (!config.apiKey) {
        throw new Error('RevenueCat API Key not configured');
      }

      console.log('[RevenueCat] 🚀 Configuring for devotional app...');

      // Enable debug logs in development
      if (config.enableDebugLogs && LOG_LEVEL) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Configure RevenueCat
      await Purchases.configure({
        apiKey: config.apiKey,
      });

      // Set attributes for better user segmentation
      if (config.attributes) {
        await Purchases.setAttributes(config.attributes);
      }

      // Load engagement metrics
      await this.loadEngagementMetrics();

      // Load offerings and customer info
      await this.loadOfferings();
      await this.refreshCustomerInfo();

      this.isConfigured = true;
      console.log('[RevenueCat] ✅ Configuration complete for devotional app');

    } catch (error: any) {
      console.error('[RevenueCat] ❌ Configuration error:', error);
      this.configurationError = error.message;
      throw error;
    }
  }

  /**
   * Load offerings from RevenueCat dashboard
   */
  public async loadOfferings(): Promise<any> {
    if (!this.isConfigured || !this.checkAvailability()) {
      throw new Error('RevenueCat not configured');
    }

    try {
      console.log('[RevenueCat] 📦 Loading offerings from dashboard...');

      const offerings = await Purchases.getOfferings();
      this.currentOfferings = offerings;

      if (offerings.current) {
        this.availableProducts = Object.values(offerings.current.availablePackages || {});

        console.log('[RevenueCat] ✅ Offerings loaded:', {
          offeringId: offerings.current.identifier,
          totalPackages: this.availableProducts.length,
          packages: this.availableProducts.map(p => ({
            id: p.identifier,
            price: p.product.priceString,
            period: this.getPackagePeriod(p),
          }))
        });
      } else {
        console.warn('[RevenueCat] ⚠️ No current offering configured');
        this.availableProducts = [];
      }

      return offerings;

    } catch (error: any) {
      console.error('[RevenueCat] ❌ Error loading offerings:', error);
      this.availableProducts = [];
      throw error;
    }
  }

  /**
   * Get package period safely
   */
  private getPackagePeriod(packageItem: any): string {
    if (PACKAGE_TYPE) {
      switch (packageItem.packageType) {
        case PACKAGE_TYPE.WEEKLY: return 'weekly';
        case PACKAGE_TYPE.MONTHLY: return 'monthly';
        case PACKAGE_TYPE.ANNUAL: return 'annual';
        default: return 'custom';
      }
    }
    
    // Fallback based on identifier
    const id = packageItem.identifier.toLowerCase();
    if (id.includes('week')) return 'weekly';
    if (id.includes('month')) return 'monthly';
    if (id.includes('year') || id.includes('annual')) return 'annual';
    return 'custom';
  }

  /**
   * Get offerings (compatibility method)
   */
  public async getOfferings(): Promise<any> {
    if (!this.isConfigured) {
      await this.configure();
    }

    if (!this.currentOfferings) {
      await this.loadOfferings();
    }

    return this.currentOfferings;
  }

  /**
   * Get formatted offerings optimized for devotional apps
   */
  public getFormattedOfferings(): FormattedOfferings {
    if (!this.currentOfferings?.current?.availablePackages) {
      return {
        weekly: null,
        monthly: null,
        annual: null,
      };
    }

    const packages = this.currentOfferings.current.availablePackages;

    // Find packages with robust fallback logic
    const weekly = this.findPackageByType(packages, 'weekly');
    const monthly = this.findPackageByType(packages, 'monthly');
    const annual = this.findPackageByType(packages, 'annual');

    return {
      weekly: weekly ? this.formatPackage(weekly, 'weekly') : null,
      monthly: monthly ? this.formatPackage(monthly, 'monthly') : null,
      annual: annual ? this.formatPackage(annual, 'annual') : null,
    };
  }

  /**
   * Find package by type with fallback logic
   */
  private findPackageByType(packages: any[], type: 'weekly' | 'monthly' | 'annual'): any {
    return packages.find((p: any) => {
      const id = p.identifier.toLowerCase();
      const productId = p.product?.identifier?.toLowerCase() || '';
      
      switch (type) {
        case 'weekly':
          return (
            id.includes('weekly') || 
            id.includes('week') || 
            id.includes('$rc_weekly') ||
            productId.includes('weekly') ||
            productId.includes('week') ||
            (PACKAGE_TYPE && p.packageType === PACKAGE_TYPE.WEEKLY)
          );
        
        case 'monthly':
          return (
            id.includes('monthly') || 
            id.includes('month') || 
            id.includes('$rc_monthly') ||
            productId.includes('monthly') ||
            productId.includes('month') ||
            (PACKAGE_TYPE && p.packageType === PACKAGE_TYPE.MONTHLY)
          );
        
        case 'annual':
          return (
            id.includes('annual') || 
            id.includes('yearly') || 
            id.includes('year') || 
            id.includes('$rc_annual') ||
            productId.includes('annual') ||
            productId.includes('yearly') ||
            productId.includes('year') ||
            (PACKAGE_TYPE && p.packageType === PACKAGE_TYPE.ANNUAL)
          );
        
        default:
          return false;
      }
    });
  }

  /**
   * Format package with devotional app enhancements
   */
  private formatPackage(packageItem: any, type: string): any {
    const price = packageItem.product.priceString;
    
    // Calculate savings for annual plans
    let savings = undefined;
    if (type === 'annual' && this.currentOfferings?.current?.availablePackages) {
      const monthly = this.findPackageByType(this.currentOfferings.current.availablePackages, 'monthly');
      if (monthly) {
        const monthlyPrice = monthly.product.price;
        const annualPrice = packageItem.product.price;
        const yearlyFromMonthly = monthlyPrice * 12;
        const savingsAmount = yearlyFromMonthly - annualPrice;
        const savingsPercentage = Math.round((savingsAmount / yearlyFromMonthly) * 100);
        
        if (savingsPercentage > 0) {
          savings = {
            percentage: savingsPercentage,
            amount: `$${savingsAmount.toFixed(2)}`,
          };
        }
      }
    }

    // Check for free trial
    let trial = undefined;
    if (packageItem.product.introductoryPrice?.periodType === 'FREE_TRIAL') {
      const trialPeriod = packageItem.product.introductoryPrice.period;
      trial = {
        duration: `${trialPeriod.numberOfUnits} ${trialPeriod.unit.toLowerCase()}${trialPeriod.numberOfUnits > 1 ? 's' : ''}`,
        price: 'Free',
      };
    }

    return {
      id: packageItem.identifier,
      price,
      title: packageItem.product.title,
      description: packageItem.product.description,
      period: type,
      product: packageItem,
      savings,
      trial,
    };
  }

  /**
   * Check premium status for devotional app
   */
  public async checkPremiumStatus(): Promise<SubscriptionStatus> {
    if (!this.isConfigured) {
      await this.configure();
    }

    if (!this.checkAvailability()) {
      return this.getFreeStatus();
    }

    try {
      await this.refreshCustomerInfo();

      if (!this.customerInfo) {
        return this.getFreeStatus();
      }

      const config = this.getRevenueCatConfig();
      const entitlement = this.customerInfo.entitlements.active[config.entitlementId];

      if (entitlement) {
        const planType = this.determinePlanType(entitlement);
        const features = this.getPremiumFeatures(planType);

        console.log('[RevenueCat] ✅ Premium user detected:', {
          planType,
          productId: entitlement.productIdentifier,
          expirationDate: entitlement.expirationDate,
          willRenew: entitlement.willRenew,
        });

        return {
          isActive: true,
          planType,
          expirationDate: entitlement.expirationDate || null,
          willRenew: entitlement.willRenew,
          features,
        };
      } else {
        return this.getFreeStatus();
      }

    } catch (error) {
      console.error('[RevenueCat] ❌ Error checking premium status:', error);
      return this.getFreeStatus();
    }
  }

  /**
   * Determine plan type from entitlement
   */
  private determinePlanType(entitlement: any): 'weekly' | 'monthly' | 'yearly' | 'free' {
    const productId = entitlement.productIdentifier?.toLowerCase() || '';

    // Check by product identifier first
    if (productId.includes('weekly') || productId.includes('week')) {
      return 'weekly';
    } else if (productId.includes('annual') || productId.includes('year')) {
      return 'yearly';
    } else if (productId.includes('monthly') || productId.includes('month')) {
      return 'monthly';
    }

    // Check by period type if available
    if (PERIOD_TYPE) {
      if (entitlement.periodType === PERIOD_TYPE.WEEKLY) {
        return 'weekly';
      } else if (entitlement.periodType === PERIOD_TYPE.ANNUAL) {
        return 'yearly';
      } else if (entitlement.periodType === PERIOD_TYPE.MONTHLY) {
        return 'monthly';
      }
    }

    console.warn('[RevenueCat] ⚠️ Could not determine plan type:', {
      productId,
      periodType: entitlement.periodType,
    });

    return 'free';
  }

  /**
   * Get premium features optimized for devotional apps
   */
  private getPremiumFeatures(planType: 'weekly' | 'monthly' | 'yearly' | 'free'): PremiumFeatures {
    const defaultFeatures: PremiumFeatures = {
      unlimitedDevotionals: false,
      extendedMensGuide: false,
      allSituations: false,
      noAds: false,
      offlineReading: false,
      personalizedContent: false,
      exportFeatures: false,
      prioritySupport: false,
      mensGroupSharing: false,
      weeklyReflectionPrompts: false,
      scripturalCrossReferences: false,
      dailyPrayerGuides: false,
      fatherhoodContent: false,
      leadershipInsights: false,
    };

    // Feature matrix optimized for Christian men's devotional app
    const featureMatrix: { [key: string]: PremiumFeatures } = {
      weekly: {
        ...defaultFeatures,
        unlimitedDevotionals: true,
        noAds: true,
        offlineReading: true,
        weeklyReflectionPrompts: true,
      },
      monthly: {
        ...defaultFeatures,
        unlimitedDevotionals: true,
        extendedMensGuide: true,
        allSituations: true,
        noAds: true,
        offlineReading: true,
        personalizedContent: true,
        exportFeatures: true,
        mensGroupSharing: true,
        weeklyReflectionPrompts: true,
        scripturalCrossReferences: true,
        dailyPrayerGuides: true,
      },
      yearly: {
        ...defaultFeatures,
        unlimitedDevotionals: true,
        extendedMensGuide: true,
        allSituations: true,
        noAds: true,
        offlineReading: true,
        personalizedContent: true,
        exportFeatures: true,
        prioritySupport: true,
        mensGroupSharing: true,
        weeklyReflectionPrompts: true,
        scripturalCrossReferences: true,
        dailyPrayerGuides: true,
        fatherhoodContent: true,
        leadershipInsights: true,
      },
      free: defaultFeatures,
    };

    return featureMatrix[planType] || defaultFeatures;
  }

  /**
   * Get devotional-specific premium benefits
   */
  public getDevotionalPremiumBenefits(planType: 'weekly' | 'monthly' | 'yearly' | 'free'): DevotionalPremiumBenefits {
    const features = this.getPremiumFeatures(planType);

    return {
      spiritual_content: {
        unlimited_devotionals: features.unlimitedDevotionals,
        extended_mens_guide: features.extendedMensGuide,
        all_life_situations: features.allSituations,
        weekly_reflection_prompts: features.weeklyReflectionPrompts,
        daily_prayer_guides: features.dailyPrayerGuides,
      },
      experience: {
        ad_free_reading: features.noAds,
        offline_devotionals: features.offlineReading,
        personalized_recommendations: features.personalizedContent,
        dark_mode_premium: planType !== 'free',
      },
      community: {
        mens_group_sharing: features.mensGroupSharing,
        export_to_pdf: features.exportFeatures,
        print_weekly_guides: features.exportFeatures,
        priority_support: features.prioritySupport,
      },
      leadership: {
        fatherhood_content: features.fatherhoodContent,
        leadership_insights: features.leadershipInsights,
        biblical_counseling_guides: planType === 'yearly',
        scripture_cross_references: features.scripturalCrossReferences,
      },
    };
  }

  /**
   * Purchase a product with devotional app optimizations
   */
  public async purchaseProduct(productPackage: any): Promise<PurchaseResult> {
    if (!this.isConfigured || !this.checkAvailability()) {
      return {
        success: false,
        error: 'RevenueCat not configured'
      };
    }

    try {
      console.log('[RevenueCat] 💳 Processing purchase for devotional app:', {
        packageId: productPackage.identifier,
        productId: productPackage.product.identifier,
        price: productPackage.product.priceString,
      });

      // Track purchase attempt
      await this.trackEngagementEvent('purchase_attempt', {
        package_type: this.getPackagePeriod(productPackage),
        price: productPackage.product.priceString,
      });

      const { customerInfo } = await Purchases.purchasePackage(productPackage);

      const config = this.getRevenueCatConfig();
      const hasPremiumEntitlement = customerInfo.entitlements.active[config.entitlementId];

      if (hasPremiumEntitlement) {
        console.log('[RevenueCat] ✅ Purchase successful - Premium activated');
        
        this.customerInfo = customerInfo;
        
        // Track successful purchase
        await this.trackEngagementEvent('purchase_success', {
          package_type: this.getPackagePeriod(productPackage),
          plan_type: this.determinePlanType(hasPremiumEntitlement),
        });

        return {
          success: true,
          customerInfo
        };
      } else {
        console.warn('[RevenueCat] ⚠️ Purchase processed but entitlement not active');
        return {
          success: false,
          error: 'Purchase processed but premium not activated'
        };
      }

    } catch (error: any) {
      console.error('[RevenueCat] ❌ Purchase error:', error);

      // Check for user cancellation
      if (PURCHASES_ERROR_CODE && error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        await this.trackEngagementEvent('purchase_cancelled', {
          package_type: this.getPackagePeriod(productPackage),
        });

        return {
          success: false,
          userCancelled: true,
          error: 'Purchase cancelled by user'
        };
      }

      // Track failed purchase
      await this.trackEngagementEvent('purchase_failed', {
        package_type: this.getPackagePeriod(productPackage),
        error: error.message,
      });

      return {
        success: false,
        error: error.message || 'Unknown purchase error'
      };
    }
  }

  /**
   * Restore purchases with devotional app tracking
   */
  public async restorePurchases(): Promise<PurchaseResult> {
    console.log('[RevenueCat] 🔄 Restoring purchases...');

    if (!this.isConfigured || !this.checkAvailability()) {
      return {
        success: false,
        error: 'RevenueCat not configured'
      };
    }

    try {
      const customerInfo = await Purchases.restorePurchases();

      const config = this.getRevenueCatConfig();
      const hasPremiumEntitlement = customerInfo.entitlements.active[config.entitlementId];

      if (hasPremiumEntitlement) {
        console.log('[RevenueCat] ✅ Purchases restored - Premium activated');
        
        this.customerInfo = customerInfo;
        
        // Track successful restore
        await this.trackEngagementEvent('purchases_restored', {
          plan_type: this.determinePlanType(hasPremiumEntitlement),
        });

        return { success: true, customerInfo };
      } else {
        console.log('[RevenueCat] ℹ️ No active purchases found to restore');
        return {
          success: false,
          error: 'No active purchases found'
        };
      }

    } catch (error: any) {
      console.error('[RevenueCat] ❌ Error restoring purchases:', error);
      return {
        success: false,
        error: error.message || 'Error restoring purchases'
      };
    }
  }

  /**
   * Refresh customer info
   */
  public async refreshCustomerInfo(): Promise<void> {
    if (!this.isConfigured || !this.checkAvailability()) return;

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      this.customerInfo = customerInfo;

      // Save to storage
      await AsyncStorage.setItem(CUSTOMER_INFO_KEY, JSON.stringify(customerInfo));
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

      console.log('[RevenueCat] ✅ Customer info refreshed');

    } catch (error) {
      console.error('[RevenueCat] ❌ Error refreshing customer info:', error);
    }
  }

  /**
   * Track spiritual engagement events
   */
  public async trackEngagementEvent(eventType: string, data: any = {}): Promise<void> {
    try {
      // Update local engagement metrics
      switch (eventType) {
        case 'devotional_completed':
          this.engagementMetrics.devotional_streak += 1;
          this.engagementMetrics.weekly_completions += 1;
          this.engagementMetrics.monthly_completions += 1;
          break;
        
        case 'verse_favorited':
          this.engagementMetrics.favorite_verses_count += 1;
          break;
        
        case 'content_shared':
          this.engagementMetrics.shared_content_count += 1;
          break;
        
        case 'reflection_submitted':
          this.engagementMetrics.reflection_responses += 1;
          break;
        
        case 'prayer_request':
          this.engagementMetrics.prayer_requests_submitted += 1;
          break;
        
        case 'community_interaction':
          this.engagementMetrics.community_interactions += 1;
          break;
      }

      // Save metrics
      await this.saveEngagementMetrics();

      // Send to RevenueCat as attributes
      if (this.isConfigured) {
        await Purchases.setAttributes({
          [`${eventType}_count`]: (data.count || 1).toString(),
          'last_engagement': new Date().toISOString(),
          'devotional_streak': this.engagementMetrics.devotional_streak.toString(),
        });
      }

      console.log('[RevenueCat] 📊 Engagement tracked:', { eventType, data });

    } catch (error) {
      console.error('[RevenueCat] ❌ Error tracking engagement:', error);
    }
  }

  /**
   * Get monetization insights for devotional app
   */
  public async getMonetizationInsights(): Promise<MonetizationInsights> {
    const status = await this.checkPremiumStatus();
    
    // Determine user segment based on engagement
    let userSegment: MonetizationInsights['user_segment'] = 'seeker';
    if (this.engagementMetrics.devotional_streak >= 30) {
      userSegment = 'mature_believer';
    } else if (this.engagementMetrics.devotional_streak >= 7) {
      userSegment = 'new_believer';
    } else if (this.engagementMetrics.community_interactions > 10) {
      userSegment = 'leader';
    }

    // Determine engagement level
    const totalEngagement = Object.values(this.engagementMetrics).reduce((sum, value) => sum + value, 0);
    let engagementLevel: MonetizationInsights['engagement_level'] = 'low';
    if (totalEngagement >= 100) engagementLevel = 'very_high';
    else if (totalEngagement >= 50) engagementLevel = 'high';
    else if (totalEngagement >= 20) engagementLevel = 'medium';

    // Calculate conversion probability based on devotional app patterns
    let conversionProbability = 0.05; // Base 5%
    if (userSegment === 'mature_believer') conversionProbability = 0.25;
    else if (userSegment === 'new_believer') conversionProbability = 0.15;
    else if (userSegment === 'leader') conversionProbability = 0.30;
    
    // Adjust based on engagement
    conversionProbability *= (engagementLevel === 'very_high' ? 2 : 
                             engagementLevel === 'high' ? 1.5 : 
                             engagementLevel === 'medium' ? 1.2 : 1);

    return {
      user_segment: userSegment,
      engagement_level: engagementLevel,
      conversion_probability: Math.min(conversionProbability, 0.8), // Cap at 80%
      optimal_upsell_timing: userSegment === 'mature_believer' ? 'immediate' : 
                             userSegment === 'new_believer' ? 'after_week_1' : 
                             'after_month_1',
      recommended_plan: userSegment === 'mature_believer' ? 'annual' : 
                       engagementLevel === 'high' ? 'monthly' : 'weekly',
      price_sensitivity: userSegment === 'mature_believer' ? 'low' : 'medium',
      churn_risk: status.isActive && status.willRenew === false ? 'high' : 'low',
    };
  }

  /**
   * Load engagement metrics from storage
   */
  private async loadEngagementMetrics(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(ENGAGEMENT_METRICS_KEY);
      if (saved) {
        this.engagementMetrics = { ...this.engagementMetrics, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('[RevenueCat] ❌ Error loading engagement metrics:', error);
    }
  }

  /**
   * Save engagement metrics to storage
   */
  private async saveEngagementMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem(ENGAGEMENT_METRICS_KEY, JSON.stringify(this.engagementMetrics));
    } catch (error) {
      console.error('[RevenueCat] ❌ Error saving engagement metrics:', error);
    }
  }

  /**
   * Get free status
   */
  private getFreeStatus(): SubscriptionStatus {
    return {
      isActive: false,
      planType: 'free',
      expirationDate: null,
      willRenew: false,
      features: this.getPremiumFeatures('free'),
    };
  }

  // Compatibility methods with existing implementation
  public async getPremiumStatus(force = false): Promise<boolean> {
    const status = await this.checkPremiumStatus();
    return status.isActive;
  }

  public getCurrentOfferings() {
    return this.currentOfferings;
  }

  public getCustomerInfo() {
    return this.customerInfo;
  }

  public getConfiguration() {
    return {
      isConfigured: this.isConfigured,
      hasError: !!this.configurationError,
      error: this.configurationError,
      isAvailable: isRevenueCatAvailable,
    };
  }

  public getEngagementMetrics(): SpiritualEngagementMetrics {
    return { ...this.engagementMetrics };
  }

  /**
   * Listen for customer info updates
   */
  public listenCustomerUpdates(callback: (info: CustomerInfo) => void): (() => void) | null {
    if (!this.checkAvailability()) {
      return null;
    }

    try {
      return Purchases.addCustomerInfoUpdateListener(callback);
    } catch (error) {
      console.error('[RevenueCat] ❌ Error setting up customer updates listener:', error);
      return null;
    }
  }
}

export default RevenueCatService;
