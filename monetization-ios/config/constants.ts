// monetization-ios/config/constants.ts
// Optimized monetization configuration for "Devotional for Men" app

export const MONETIZATION_CONFIG = {
  // 🎯 DEVOTIONAL APP SPECIFIC SETTINGS
  APP_TYPE: 'devotional' as const,
  TARGET_AUDIENCE: 'christian_men' as const,
  
  // 📱 AD TIMING STRATEGY FOR SPIRITUAL APPS
  ADS: {
    // Banner ads - Only on non-spiritual screens
    BANNER: {
      ENABLED: true,
      LOCATIONS: {
        // ✅ Good locations for devotional apps
        FAVORITES: true,        // After user gets value
        SITUATIONS: true,       // Natural browsing context
        MENS_GUIDE: true,      // Secondary content
        // ❌ Never show on spiritual content
        INDEX: false,          // Daily devotional (sacred space)
        PREMIUM: false,        // Premium upsell screen
        READING: false,        // During devotional reading
      },
      REFRESH_INTERVAL: 60000, // 1 minute (longer for respectful UX)
    },
    
    // Interstitial ads - After spiritual value is delivered
    INTERSTITIAL: {
      ENABLED: true,
      // 🙏 Respectful timing for Christian apps
      MIN_INTERACTION_THRESHOLD: 2,  // Show after 2 devotional completions
      COOLDOWN_PERIOD: 180000,       // 3 minutes between ads (respectful)
      MAX_PER_DAY: 4,                // Maximum 4 interstitials per day
      
      // Triggers optimized for devotional engagement
      TRIGGERS: {
        DEVOTIONAL_COMPLETED: {
          enabled: true,
          weight: 1.0,           // Primary trigger
          delay: 2000,           // 2 seconds after completion
        },
        FAVORITE_ADDED: {
          enabled: true,
          weight: 0.5,           // Secondary trigger
          delay: 1000,
        },
        CONTENT_SHARED: {
          enabled: true,
          weight: 0.3,           // Light trigger
          delay: 1500,
        },
        WEEKLY_STREAK: {
          enabled: true,
          weight: 0.8,           // Celebration moment
          delay: 3000,
        },
      },
    },
    
    // App Open ads - Gentle for morning devotions
    APP_OPEN: {
      ENABLED: true,
      MIN_INTERVAL: 300000,    // 5 minutes minimum between shows
      MAX_SHOW_INTERVAL: 14400000, // 4 hours max interval
      TIMEOUT: 4000,           // 4 seconds timeout
      // Don't show during typical devotional hours
      QUIET_HOURS: {
        enabled: true,
        start: 6,              // 6 AM
        end: 9,                // 9 AM (morning devotion time)
      },
    },
  },
  
  // 💎 PREMIUM STRATEGY FOR CHRISTIAN APPS
  PREMIUM: {
    // Freemium model optimized for devotional apps
    FREE_TIER: {
      DAILY_DEVOTIONALS: true,     // Core value always free
      WEEKLY_DEVOTIONALS: 3,       // Limited past devotionals
      MENS_GUIDE: 'limited',       // Some guidance content
      SITUATIONS: 'limited',       // Basic situational guidance
      OFFLINE_READING: false,      // Premium feature
      AD_FREE: false,              // Premium benefit
    },
    
    PREMIUM_TIER: {
      UNLIMITED_DEVOTIONALS: true,  // Full access to archive
      EXTENDED_MENS_GUIDE: true,    // Complete guidance library
      ALL_SITUATIONS: true,         // Full situational wisdom
      OFFLINE_READING: true,        // Download for quiet time
      AD_FREE_EXPERIENCE: true,     // Distraction-free spirituality
      PRIORITY_SUPPORT: true,       // Christian community support
      EXPORT_FEATURES: true,        // Share with men's groups
    },
    
    // Pricing strategy for Christian market
    PRICING_PSYCHOLOGY: {
      ANNUAL_DISCOUNT: 0.4,        // 40% off annual (strong incentive)
      FREE_TRIAL: 7,               // 7-day trial (enough for habit)
      GRACE_PERIOD: 3,             // 3 days grace period
      FAMILY_SHARING: true,        // Support Christian families
    },
  },
  
  // 🛡️ PRIVACY & CHRISTIAN VALUES
  PRIVACY: {
    ATT_MESSAGE: {
      title: 'Support Our Christian Ministry',
      message: 'Daily Devotional for Men would like to show you personalized content and relevant ads that align with your faith and interests. This helps keep the app free and supports our Christian ministry. You maintain full control and can opt out anytime.',
      tone: 'respectful_ministry',
    },
    
    DATA_COLLECTION: {
      minimal: true,               // Minimal data collection
      transparent: true,           // Clear about what we collect
      opt_out_easy: true,         // Easy opt-out mechanisms
    },
  },
  
  // 📊 ANALYTICS FOR OPTIMIZATION
  TRACKING: {
    // Key metrics for devotional apps
    SPIRITUAL_ENGAGEMENT: {
      devotional_completion_rate: true,
      reading_streak_tracking: true,
      favorite_verse_patterns: true,
      morning_vs_evening_usage: true,
    },
    
    MONETIZATION_EVENTS: {
      ad_revenue_per_user: true,
      premium_conversion_funnel: true,
      churn_prediction: true,
      lifetime_value_tracking: true,
    },
  },
  
  // 🎨 UX CONSIDERATIONS FOR SPIRITUAL APPS
  USER_EXPERIENCE: {
    AD_PLACEMENT: {
      never_interrupt_reading: true,    // Sacred reading time
      natural_break_points: true,      // After completion, not during
      contextual_relevance: true,      // Faith-appropriate ads when possible
      quick_dismiss: true,             // Easy to close
    },
    
    PREMIUM_UPSELL: {
      gentle_messaging: true,          // Non-aggressive upselling
      value_focused: true,             // Focus on spiritual benefits
      social_proof: true,              // Testimonials from Christian men
      timing_respectful: true,         // Not during devotional reading
    },
  },
};

// 🏷️ AD UNIT CONFIGURATIONS
export const AD_UNITS = {
  // Test ads for development
  TEST: {
    BANNER: 'ca-app-pub-3940256099942544/2934735716',
    INTERSTITIAL: 'ca-app-pub-3940256099942544/4411468910',
    APP_OPEN: 'ca-app-pub-3940256099942544/5662855259',
  },
  
  // Production ad units (to be configured)
  PRODUCTION: {
    IOS: {
      BANNER: 'ca-app-pub-4385753817888809/BANNER_ID',
      INTERSTITIAL: 'ca-app-pub-4385753817888809/INTERSTITIAL_ID', 
      APP_OPEN: 'ca-app-pub-4385753817888809/APP_OPEN_ID',
    },
    ANDROID: {
      BANNER: 'ca-app-pub-4385753817888809/BANNER_ID_ANDROID',
      INTERSTITIAL: 'ca-app-pub-4385753817888809/INTERSTITIAL_ID_ANDROID',
      APP_OPEN: 'ca-app-pub-4385753817888809/APP_OPEN_ID_ANDROID',
    },
  },
};

// 📱 PLATFORM SPECIFIC SETTINGS
export const PLATFORM_CONFIG = {
  IOS: {
    ATT_REQUIRED: true,
    MIN_VERSION: '14.5',
    STORE_REVIEW_PROMPT: {
      after_devotionals: 10,        // After 10 devotionals completed
      after_premium_trial: 3,       // 3 days into trial
    },
  },
  
  ANDROID: {
    CONSENT_FRAMEWORK: 'google_ump',
    STORE_REVIEW_PROMPT: {
      after_devotionals: 10,
      after_premium_trial: 3,
    },
  },
};

// 🎯 AUDIENCE SEGMENTATION FOR DEVOTIONAL APPS
export const AUDIENCE_SEGMENTS = {
  NEW_BELIEVER: {
    name: 'New Christian Men',
    characteristics: ['low_streak', 'high_engagement', 'seeks_guidance'],
    monetization: {
      ads_tolerance: 'medium',
      premium_conversion: 'high',
      upsell_timing: 'after_week_1',
    },
  },
  
  MATURE_BELIEVER: {
    name: 'Mature Christian Men',
    characteristics: ['consistent_usage', 'values_depth', 'family_focused'],
    monetization: {
      ads_tolerance: 'low',
      premium_conversion: 'very_high',
      upsell_timing: 'immediate',
    },
  },
  
  SEEKER: {
    name: 'Spiritual Seekers',
    characteristics: ['irregular_usage', 'exploring_faith', 'question_oriented'],
    monetization: {
      ads_tolerance: 'high',
      premium_conversion: 'medium',
      upsell_timing: 'after_month_1',
    },
  },
};

// 📈 PERFORMANCE BENCHMARKS FOR DEVOTIONAL APPS
export const PERFORMANCE_TARGETS = {
  // Based on successful Christian apps
  RETENTION: {
    day_1: 0.85,    // High D1 retention for devotional apps
    day_7: 0.45,    // Good weekly habit formation  
    day_30: 0.25,   // Strong monthly retention
  },
  
  MONETIZATION: {
    ad_revenue_per_user_monthly: 2.50,  // $2.50 ARPU from ads
    premium_conversion_rate: 0.08,      // 8% conversion to premium
    average_revenue_per_premium: 35.00, // $35 ARPPU annually
  },
  
  ENGAGEMENT: {
    daily_active_users: 0.35,           // 35% daily usage
    avg_session_duration: 180,          // 3 minutes (devotional reading)
    devotional_completion_rate: 0.75,   // 75% completion rate
  },
};

export default MONETIZATION_CONFIG;
