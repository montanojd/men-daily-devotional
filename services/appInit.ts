import { RevenueCatService } from './revenuecat';
import { AdMobService } from './adMobService';
import { ATTService } from './attService';
import { REVENUECAT_CONFIG, APP_CONFIG } from '@/config/constants';
// Import enhanced monetization from app
import { initializeMonetization } from '@/app/monetization';

let initialized = false;

export async function initializeApp() {
  if (initialized) {
    console.log('[AppInit] ✅ Ya inicializado, saltando...');
    return;
  }
  
  console.log('[AppInit] 🚀 Inicializando servicios de la app...');
  
  try {
    // Use enhanced monetization setup for devotional apps
    console.log('[AppInit] 📿 Configurando monetización optimizada para apps devocionales...');
    await initializeMonetization();
    
    initialized = true;
    console.log('[AppInit] ✅ Monetización optimizada configurada correctamente');
    
  } catch (error) {
    console.error('[AppInit] ❌ Error configurando monetización optimizada:', error);
    console.log('[AppInit] 🔄 Fallback a inicialización básica...');
    
    // Fallback to basic initialization
    await basicInitialization();
    initialized = true;
  }
}

// Fallback basic initialization
async function basicInitialization() {
  try {
    // 1. Initialize RevenueCat first
    console.log('[AppInit] 📱 Inicializando RevenueCat...');
    const revenueCatService = RevenueCatService.getInstance();
    
    // Configure with API key from constants
    if (REVENUECAT_CONFIG.iosApiKey && REVENUECAT_CONFIG.iosApiKey !== 'appl_YOUR_IOS_REVENUECAT_API_KEY_HERE') {
      // Store the key in a temporary way for the service to pick up
      (global as any).__REVENUECAT_API_KEY = REVENUECAT_CONFIG.iosApiKey;
    }
    
    await revenueCatService.configure();
    console.log('[AppInit] ✅ RevenueCat configurado');
    
    // 2. Initialize ATT (iOS only)
    console.log('[AppInit] 🔔 Inicializando ATT...');
    const attResult = await ATTService.initializeATT();
    console.log('[AppInit] ✅ ATT inicializado:', attResult);
    
    // 3. Initialize AdMob
    console.log('[AppInit] 📺 Inicializando AdMob...');
    const adMobResult = await AdMobService.initialize();
    console.log('[AppInit] ✅ AdMob inicializado:', adMobResult);
    
    // 4. Set app ready for ads
    AdMobService.setAppReadyForAds();
    
    console.log('[AppInit] ✅ Inicialización básica completada');
    
  } catch (error) {
    console.error('[AppInit] ❌ Error en inicialización básica:', error);
  }
}

export async function updatePremiumStatusForAds(isPremium: boolean) {
  console.log('[AppInit] 🔄 Actualizando status premium para ads:', isPremium);
  
  try {
    await AdMobService.updatePremiumStatus();
    console.log('[AppInit] ✅ Status premium actualizado para ads');
  } catch (error) {
    console.error('[AppInit] ❌ Error actualizando status premium:', error);
  }
}

export async function showInterstitialAd(): Promise<boolean> {
  try {
    return await AdMobService.showInterstitialAd();
  } catch (error) {
    console.error('[AppInit] ❌ Error mostrando interstitial:', error);
    return false;
  }
}

export async function showAppOpenAd(): Promise<boolean> {
  try {
    return await AdMobService.showAppOpenAd();
  } catch (error) {
    console.error('[AppInit] ❌ Error mostrando app open ad:', error);
    return false;
  }
}

export async function getBannerAdUnitId(): Promise<string | null> {
  try {
    return await AdMobService.getBannerAdUnitId();
  } catch (error) {
    console.error('[AppInit] ❌ Error obteniendo banner ad unit ID:', error);
    return null;
  }
}

// ✅ DEBUG FUNCTION para desarrollo
async function debugServicesStatus() {
  if (!__DEV__) return;
  
  console.log('\n🔍 [AppInit] DEBUG - Estado de servicios:');
  
  try {
    // RevenueCat status
    const revenueCatService = RevenueCatService.getInstance();
    const rcConfig = revenueCatService.getConfiguration();
    console.log('   📱 RevenueCat:', rcConfig);
    
    // AdMob status
    const adsStatus = await AdMobService.getAdsStatus();
    console.log('   📺 AdMob:', adsStatus);
    
    // ATT status
    const attStatus = await AdMobService.getATTStatus();
    console.log('   🔔 ATT:', attStatus);
    
  } catch (error) {
    console.log('   ❌ Error obteniendo debug info:', error);
  }
  
  console.log('');
}

// Export services for direct access if needed
export { RevenueCatService, AdMobService, ATTService };
