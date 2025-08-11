// config/constants.ts - Configuración de la aplicación
import Constants from 'expo-constants';

// ✅ CONFIGURACIÓN DE FIREBASE
export const FIREBASE_CONFIG = {
  apiKey: Constants.expoConfig?.extra?.FIREBASE_API_KEY || '',
  authDomain: Constants.expoConfig?.extra?.FIREBASE_AUTH_DOMAIN || '',
  databaseURL: Constants.expoConfig?.extra?.FIREBASE_DATABASE_URL || '',
  projectId: Constants.expoConfig?.extra?.FIREBASE_PROJECT_ID || '',
  storageBucket: Constants.expoConfig?.extra?.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: Constants.expoConfig?.extra?.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: Constants.expoConfig?.extra?.FIREBASE_APP_ID || '',
};

// ✅ CONFIGURACIÓN DE REVENUECAT
export const REVENUECAT_CONFIG = {
  iosApiKey: Constants.expoConfig?.extra?.REVENUECAT_IOS_API_KEY || '',
  androidApiKey: Constants.expoConfig?.extra?.REVENUECAT_ANDROID_API_KEY || '',
  entitlementId: Constants.expoConfig?.extra?.REVENUECAT_ENTITLEMENT_ID || 'devotional_premium',
};

// ✅ CONFIGURACIÓN DE ADMOB
export const ADMOB_CONFIG = {
  iosAppId: 'ca-app-pub-4385753817888809~5481155216',
  androidAppId: 'ca-app-pub-4385753817888809~8714536250',
  
  // Test Unit IDs (usar solo en desarrollo)
  testIds: {
    banner: __DEV__ ? 'ca-app-pub-3940256099942544/2934735716' : '',
    interstitial: __DEV__ ? 'ca-app-pub-3940256099942544/4411468910' : '',
    appOpen: __DEV__ ? 'ca-app-pub-3940256099942544/9257395921' : '',
  },
  
  // Real Unit IDs (configurar en Firebase Remote Config)
  realIds: {
    banner: 'ca-app-pub-4385753817888809/BANNER_UNIT_ID',
    interstitial: 'ca-app-pub-4385753817888809/INTERSTITIAL_UNIT_ID',
    appOpen: 'ca-app-pub-4385753817888809/APP_OPEN_UNIT_ID',
  }
};

// ✅ CONFIGURACIÓN DE LA APP
export const APP_CONFIG = {
  name: 'Daily Devotional for Men',
  version: Constants.expoConfig?.extra?.APP_VERSION || '1.0.0',
  bundleId: 'com.gpapplica.devotionalformenexpo',
  
  // Configuración de ads
  INTERSTITIAL_FREQUENCY: 3, // Mostrar ad cada 3 interacciones
  BANNER_REFRESH_RATE: 30000, // 30 segundos
  APP_OPEN_COOLDOWN: 120000, // 2 minutos
  
  // Configuración premium
  PREMIUM_PRODUCT_ID: 'devotional_premium_monthly',
  ENTITLEMENT_ID: Constants.expoConfig?.extra?.ENTITLEMENT_ID || 'devotional_premium',
  MAIN_PRODUCT_PRICE: Constants.expoConfig?.extra?.MAIN_PRODUCT_PRICE || '$9.99',
  
  // URLs
  PRIVACY_POLICY_URL: 'https://your-website.com/privacy-policy',
  TERMS_OF_SERVICE_URL: 'https://your-website.com/terms-of-service',
  SUPPORT_EMAIL: 'support@your-app.com',
};

// ✅ CONFIGURACIÓN DE DESARROLLO
export const DEV_CONFIG = {
  enableDebugLogs: __DEV__,
  enableTestAds: __DEV__,
  enableRevenueCatDebug: __DEV__,
  skipATTPrompt: false, // Cambiar a true para saltarse ATT en desarrollo
};

// ✅ COLORES DE LA APP
export const COLORS = {
  primary: '#2E7BD6',
  secondary: '#1A1A1A',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  premium: '#FFD700',
};

// ✅ CONSTANTES DE DEVOTIONAL
export const DEVOTIONAL_CONFIG = {
  dailyDevotionalLimit: 1, // Usuarios gratuitos: 1 devocional por día
  premiumUnlimited: true, // Usuarios premium: acceso ilimitado
  categoriesCount: 8, // Número de categorías disponibles
  situationsCount: 12, // Número de situaciones específicas
};

// ✅ HELPER FUNCTIONS
export const isProduction = () => !__DEV__;
export const isDevelopment = () => __DEV__;

export const getAdUnitId = (adType: 'banner' | 'interstitial' | 'appOpen') => {
  if (__DEV__) {
    return ADMOB_CONFIG.testIds[adType];
  }
  return ADMOB_CONFIG.realIds[adType];
};

export const shouldShowAds = (isPremium: boolean) => {
  return !isPremium;
};

export const getAppVersion = () => {
  return APP_CONFIG.version;
};
