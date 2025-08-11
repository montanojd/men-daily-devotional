// monetization-ios/types/subscription.ts
// Enhanced types for "Devotional for Men" monetization

export interface SubscriptionStatus {
  isActive: boolean;
  planType: 'free' | 'weekly' | 'monthly' | 'yearly';
  expirationDate: string | null;
  willRenew: boolean;
  features: PremiumFeatures;
  grace_period?: {
    active: boolean;
    ends_at: string;
  };
  family_sharing?: {
    enabled: boolean;
    members: number;
  };
}

export interface PremiumFeatures {
  // Core devotional features
  unlimitedDevotionals: boolean;
  extendedMensGuide: boolean;
  allSituations: boolean;
  
  // Experience features
  noAds: boolean;
  offlineReading: boolean;
  personalizedContent: boolean;
  
  // Community features
  exportFeatures: boolean;
  prioritySupport: boolean;
  mensGroupSharing: boolean;
  
  // Advanced features for Christian men
  weeklyReflectionPrompts: boolean;
  scripturalCrossReferences: boolean;
  dailyPrayerGuides: boolean;
  fatherhoodContent: boolean;
  leadershipInsights: boolean;
}

export interface PurchaseResult {
  success: boolean;
  userCancelled?: boolean;
  error?: string;
  customerInfo?: CustomerInfo;
  transaction_id?: string;
  receipt_data?: string;
}

export interface CustomerInfo {
  originalAppUserId: string;
  entitlements: {
    active: { [key: string]: EntitlementInfo };
    all: { [key: string]: EntitlementInfo };
  };
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  nonSubscriptionTransactions: TransactionInfo[];
  firstSeen: string;
  latestExpirationDate?: string;
  managementURL?: string;
}

export interface EntitlementInfo {
  identifier: string;
  productIdentifier: string;
  isActive: boolean;
  willRenew: boolean;
  periodType: 'NORMAL' | 'TRIAL' | 'INTRO';
  latestPurchaseDate: string;
  originalPurchaseDate: string;
  expirationDate?: string;
  store: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL';
  isSandbox: boolean;
  unsubscribeDetectedAt?: string;
  billingIssueDetectedAt?: string;
}

export interface TransactionInfo {
  transactionIdentifier: string;
  productIdentifier: string;
  purchaseDate: string;
}

export interface RevenueCatOffering {
  identifier: string;
  serverDescription: string;
  availablePackages: RevenueCatPackage[];
  current?: RevenueCatPackage;
  weekly?: RevenueCatPackage;
  monthly?: RevenueCatPackage;
  annual?: RevenueCatPackage;
}

export interface RevenueCatPackage {
  identifier: string;
  packageType: 'WEEKLY' | 'MONTHLY' | 'ANNUAL' | 'CUSTOM';
  product: ProductInfo;
  offeringIdentifier: string;
}

export interface ProductInfo {
  identifier: string;
  description: string;
  title: string;
  price: number;
  priceString: string;
  currencyCode: string;
  subscriptionPeriod?: {
    unit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
    numberOfUnits: number;
  };
  introductoryPrice?: {
    price: number;
    priceString: string;
    period: {
      unit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
      numberOfUnits: number;
    };
    cycles: number;
    periodType: 'FREE_TRIAL' | 'PAY_AS_YOU_GO' | 'PAY_UP_FRONT';
  };
}

export interface FormattedOfferings {
  weekly: FormattedPackage | null;
  monthly: FormattedPackage | null;
  annual: FormattedPackage | null;
}

export interface FormattedPackage {
  id: string;
  price: string;
  title: string;
  description: string;
  period: string;
  product: RevenueCatPackage;
  savings?: {
    percentage: number;
    amount: string;
  };
  trial?: {
    duration: string;
    price: string;
  };
}

// 🎯 Devotional App Specific Types

export interface DevotionalPremiumBenefits {
  spiritual_content: {
    unlimited_devotionals: boolean;
    extended_mens_guide: boolean;
    all_life_situations: boolean;
    weekly_reflection_prompts: boolean;
    daily_prayer_guides: boolean;
  };
  experience: {
    ad_free_reading: boolean;
    offline_devotionals: boolean;
    personalized_recommendations: boolean;
    dark_mode_premium: boolean;
  };
  community: {
    mens_group_sharing: boolean;
    export_to_pdf: boolean;
    print_weekly_guides: boolean;
    priority_support: boolean;
  };
  leadership: {
    fatherhood_content: boolean;
    leadership_insights: boolean;
    biblical_counseling_guides: boolean;
    scripture_cross_references: boolean;
  };
}

export interface SpiritualEngagementMetrics {
  devotional_streak: number;
  weekly_completions: number;
  monthly_completions: number;
  favorite_verses_count: number;
  shared_content_count: number;
  reflection_responses: number;
  prayer_requests_submitted: number;
  community_interactions: number;
}

export interface MonetizationInsights {
  user_segment: 'new_believer' | 'mature_believer' | 'seeker' | 'leader';
  engagement_level: 'low' | 'medium' | 'high' | 'very_high';
  conversion_probability: number; // 0-1 scale
  optimal_upsell_timing: 'immediate' | 'after_week_1' | 'after_month_1' | 'seasonal';
  recommended_plan: 'weekly' | 'monthly' | 'annual';
  price_sensitivity: 'low' | 'medium' | 'high';
  churn_risk: 'low' | 'medium' | 'high';
}

// ATT (App Tracking Transparency) Types
export interface ATTStatus {
  status: 'authorized' | 'denied' | 'not-determined' | 'restricted';
  isLoading: boolean;
  shouldShowAds: boolean;
  canTrack: boolean;
  requestedAt?: string;
  lastChecked: string;
}

export interface ATTConfiguration {
  message: {
    title: string;
    description: string;
    tone: 'respectful_ministry' | 'value_focused' | 'transparent';
  };
  timing: {
    show_after_onboarding: boolean;
    delay_seconds: number;
    respect_spiritual_context: boolean;
  };
  fallback: {
    limited_ads: boolean;
    contextual_only: boolean;
    no_personalization: boolean;
  };
}

// Ad Configuration Types
export interface AdConfiguration {
  bannerAds: BannerAdConfig;
  interstitialAds: InterstitialAdConfig;
  appOpenAds: AppOpenAdConfig;
  rewardedAds?: RewardedAdConfig;
  nativeAds?: NativeAdConfig;
}

export interface BannerAdConfig {
  enabled: boolean;
  adUnitIdIOS: string;
  adUnitIdAndroid: string;
  refreshIntervalMs: number;
  autoShow: boolean;
  locations: {
    [screenName: string]: boolean;
  };
  size: 'BANNER' | 'LARGE_BANNER' | 'RECTANGLE' | 'ADAPTIVE';
  respectful_placement: boolean;
}

export interface InterstitialAdConfig {
  enabled: boolean;
  adUnitIdIOS: string;
  adUnitIdAndroid: string;
  minIntervalMs: number;
  cooldownMs: number;
  maxPerDay: number;
  triggers: {
    [triggerName: string]: {
      enabled: boolean;
      weight: number;
      delay: number;
    };
  };
  respectful_timing: boolean;
}

export interface AppOpenAdConfig {
  enabled: boolean;
  adUnitIdIOS: string;
  adUnitIdAndroid: string;
  timeoutMs: number;
  maxShowIntervalMs: number;
  quiet_hours?: {
    enabled: boolean;
    start: number; // Hour (0-23)
    end: number;   // Hour (0-23)
  };
}

export interface RewardedAdConfig {
  enabled: boolean;
  adUnitIdIOS: string;
  adUnitIdAndroid: string;
  rewards: {
    [rewardType: string]: {
      amount: number;
      description: string;
    };
  };
}

export interface NativeAdConfig {
  enabled: boolean;
  adUnitIdIOS: string;
  adUnitIdAndroid: string;
  template: 'small' | 'medium' | 'custom';
  placement: 'in_feed' | 'content' | 'exit_intent';
}

// Revenue Analytics Types
export interface RevenueAnalytics {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  ad_revenue: {
    total: number;
    banner: number;
    interstitial: number;
    app_open: number;
    rewarded?: number;
  };
  subscription_revenue: {
    total: number;
    new_subscriptions: number;
    renewals: number;
    upgrades: number;
  };
  metrics: {
    arpu: number; // Average Revenue Per User
    arppu: number; // Average Revenue Per Paying User
    ltv: number; // Lifetime Value
    conversion_rate: number;
    churn_rate: number;
  };
  user_segments: {
    [segment: string]: {
      count: number;
      revenue: number;
      conversion_rate: number;
    };
  };
}

export interface DevotionalMonetizationConfig {
  att: ATTConfiguration;
  ads: AdConfiguration;
  subscriptions: {
    revenuecat: {
      iosApiKey: string;
      androidApiKey: string;
      entitlementId: string;
      enableDebugLogs: boolean;
    };
  };
  analytics: {
    spiritual_engagement: boolean;
    revenue_tracking: boolean;
    user_segmentation: boolean;
    a_b_testing: boolean;
  };
  user_experience: {
    respectful_monetization: boolean;
    spiritual_context_aware: boolean;
    family_friendly: boolean;
    christian_values_aligned: boolean;
  };
}


