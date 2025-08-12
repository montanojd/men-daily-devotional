// services/revenuecat.ts - Updated to match working Dog Breed Identifier app
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import {
  PurchaseResult,
  SubscriptionStatus,
  PremiumFeatures,
  CustomerInfo
} from '@/types/subscription';

// ✅ IMPORTACIÓN CONDICIONAL DE REVENUECAT CON VERIFICACIÓN ROBUSTA
let Purchases: any = null;
let LOG_LEVEL: any = null;
let PURCHASE_TYPE: any = null;
let PACKAGE_TYPE: any = null; // ✅ AGREGADO
let PERIOD_TYPE: any = null;  // ✅ AGREGADO
let PURCHASES_ERROR_CODE: any = null; // ✅ AGREGADO

let isRevenueCatAvailable = false;

try {
  const RevenueCatModule = require('react-native-purchases');

  if (RevenueCatModule && RevenueCatModule.default) {
    Purchases = RevenueCatModule.default;
    LOG_LEVEL = RevenueCatModule.LOG_LEVEL;
    PURCHASE_TYPE = RevenueCatModule.PURCHASE_TYPE;
    PACKAGE_TYPE = RevenueCatModule.PACKAGE_TYPE; // ✅ AGREGADO
    PERIOD_TYPE = RevenueCatModule.PERIOD_TYPE;   // ✅ AGREGADO
    PURCHASES_ERROR_CODE = RevenueCatModule.PURCHASES_ERROR_CODE; // ✅ AGREGADO
    
    isRevenueCatAvailable = true;
    console.log('[RevenueCat] ✅ Módulos cargados correctamente (react-native-purchases 8.11.8)');
  }
} catch (error: any) {
  console.warn('[RevenueCat] ⚠️ react-native-purchases no disponible:', error.message);
  isRevenueCatAvailable = false;
}

const getRevenueCatConfig = () => {
  const iosKey = Constants.expoConfig?.extra?.REVENUECAT_IOS_API_KEY;
  const androidKey = Constants.expoConfig?.extra?.REVENUECAT_ANDROID_API_KEY;
  const entitlementId = Constants.expoConfig?.extra?.REVENUECAT_ENTITLEMENT_ID;

  const selectedKey = Platform.select({
    ios: iosKey,
    android: androidKey,
  });

  return {
    apiKey: selectedKey,
    entitlementId: entitlementId || 'devotional_premium',
    enableDebugLogs: __DEV__,
  };
};

export class RevenueCatService {
  private static instance: RevenueCatService;
  private isConfigured: boolean = false;
  private configurationError: string | null = null;
  private currentOfferings: any = null;
  private customerInfo: CustomerInfo | null = null;
  private availableProducts: any[] = [];

  private constructor() {}

  public static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  private checkAvailability(): boolean {
    if (!isRevenueCatAvailable || !Purchases) {
      console.error('[RevenueCat] ❌ No disponible');
      return false;
    }
    return true;
  }

  public getConfiguration() {
    return {
      isConfigured: this.isConfigured,
      isAvailable: isRevenueCatAvailable,
      error: this.configurationError,
      hasOfferings: !!this.currentOfferings,
      productsCount: this.availableProducts.length,
    };
  }

  public async configure(): Promise<void> {
    if (this.isConfigured) {
      console.log('[RevenueCat] ✅ Ya configurado');
      return;
    }

    if (!this.checkAvailability()) {
      const error = 'RevenueCat no disponible';
      this.configurationError = error;
      this.isConfigured = true; // Continuar en modo compatibilidad
      return;
    }

    try {
      const config = getRevenueCatConfig();

      if (!config.apiKey || config.apiKey.includes('YOUR_') || config.apiKey.includes('HERE')) {
        console.warn('[RevenueCat] ⚠️ API Key no configurada - modo compatibilidad');
        this.isConfigured = true;
        return;
      }

      console.log('[RevenueCat] 🚀 Configurando...');

      await Purchases.configure({
        apiKey: config.apiKey,
      });

      this.isConfigured = true;
      console.log('[RevenueCat] ✅ Configurado');

      await this.loadOfferings();
      await this.refreshCustomerInfo();

    } catch (error: any) {
      console.error('[RevenueCat] ❌ Error:', error);
      this.configurationError = error.message;
      this.isConfigured = true; // Continuar en modo compatibilidad
    }
  }

  public async loadOfferings(): Promise<any> {
    if (!this.checkAvailability()) {
      return { current: null };
    }

    try {
      console.log('[RevenueCat] 📦 Cargando offerings...');

      const offerings = await Purchases.getOfferings();
      this.currentOfferings = offerings;

      if (offerings?.current?.availablePackages) {
        this.availableProducts = offerings.current.availablePackages;
        console.log('[RevenueCat] ✅ Offerings cargados:', this.availableProducts.length);
      } else {
        console.warn('[RevenueCat] ⚠️ No hay offerings');
        this.availableProducts = [];
      }

      return offerings;

    } catch (error: any) {
      console.error('[RevenueCat] ❌ Error cargando offerings:', error);
      this.availableProducts = [];
      return { current: null };
    }
  }

  public async getOfferings(): Promise<any> {
    if (!this.isConfigured) {
      await this.configure();
    }

    if (!this.currentOfferings) {
      await this.loadOfferings();
    }

    return this.currentOfferings;
  }

  public getAvailableProducts(): any[] {
    return this.availableProducts;
  }

  public getFormattedOfferings(): any {
    if (!this.currentOfferings?.current?.availablePackages) {
      return {
        monthly: null,
        annual: null,
      };
    }

    const packages = this.currentOfferings.current.availablePackages;

    // ✅ BÚSQUEDA ROBUSTA SIN DEPENDER DE PACKAGE_TYPE (que puede estar undefined)
    const monthly = packages.find((p: any) => {
      const id = (p.identifier || '').toLowerCase();
      const productId = (p.product?.identifier || '').toLowerCase();
      
      return (
        id.includes('monthly') || 
        id.includes('month') || 
        id.includes('$rc_monthly') ||
        productId.includes('monthly') ||
        productId.includes('month') ||
        // Solo verificar PACKAGE_TYPE si está disponible
        (PACKAGE_TYPE && p.packageType === PACKAGE_TYPE.MONTHLY)
      );
    });

    const annual = packages.find((p: any) => {
      const id = (p.identifier || '').toLowerCase();
      const productId = (p.product?.identifier || '').toLowerCase();
      
      return (
        id.includes('annual') || 
        id.includes('yearly') || 
        id.includes('year') || 
        id.includes('$rc_annual') ||
        productId.includes('annual') ||
        productId.includes('yearly') ||
        productId.includes('year') ||
        // Solo verificar PACKAGE_TYPE si está disponible
        (PACKAGE_TYPE && p.packageType === PACKAGE_TYPE.ANNUAL)
      );
    });

    return {
      monthly: monthly ? {
        id: monthly.identifier,
        price: monthly.product?.priceString || '$9.99',
        title: monthly.product?.title || 'Monthly Premium',
        description: monthly.product?.description || 'Premium access',
        period: 'month',
        product: monthly,
      } : null,

      annual: annual ? {
        id: annual.identifier,
        price: annual.product?.priceString || '$59.99',
        title: annual.product?.title || 'Annual Premium',
        description: annual.product?.description || 'Premium access',
        period: 'year',
        product: annual,
      } : null,
    };
  }

  public async refreshCustomerInfo(): Promise<void> {
    if (!this.checkAvailability()) return;

    try {
      console.log('[RevenueCat] 🔄 Refrescando customer info...');
      const customerInfo = await Purchases.getCustomerInfo();
      this.customerInfo = customerInfo;
      console.log('[RevenueCat] ✅ Customer info actualizada');
    } catch (error) {
      console.error('[RevenueCat] ❌ Error refrescando:', error);
    }
  }

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

      const config = getRevenueCatConfig();
      const entitlement = this.customerInfo.entitlements?.active?.[config.entitlementId];

      if (entitlement) {
        const planType = this.determinePlanType(entitlement);
        const features = this.getPremiumFeatures(planType);

        console.log('[RevenueCat] ✅ Usuario premium detectado');

        return {
          isActive: true,
          planType,
          expirationDate: entitlement.expirationDate || null,
          willRenew: entitlement.willRenew || false,
          features,
        };
      } else {
        return this.getFreeStatus();
      }

    } catch (error) {
      console.error('[RevenueCat] ❌ Error verificando premium:', error);
      return this.getFreeStatus();
    }
  }

  private determinePlanType(entitlement: any): 'weekly' | 'monthly' | 'yearly' | 'free' {
    const productId = entitlement.productIdentifier?.toLowerCase() || '';

    // ✅ VERIFICAR POR IDENTIFICADOR DE PRODUCTO PRIMERO (más confiable)
    if (productId.includes('weekly') || productId.includes('week')) {
      return 'weekly';
    } else if (productId.includes('annual') || productId.includes('year')) {
      return 'yearly';
    } else if (productId.includes('monthly') || productId.includes('month')) {
      return 'monthly';
    }

    // ✅ VERIFICAR PERIOD_TYPE SOLO SI ESTÁ DISPONIBLE
    if (PERIOD_TYPE) {
      if (entitlement.periodType === PERIOD_TYPE.WEEKLY) {
        return 'weekly';
      } else if (entitlement.periodType === PERIOD_TYPE.ANNUAL) {
        return 'yearly';
      } else if (entitlement.periodType === PERIOD_TYPE.MONTHLY) {
        return 'monthly';
      }
    }

    console.warn('[RevenueCat] ⚠️ No se pudo determinar el tipo de plan, defaulting a monthly:', {
      productId,
      periodType: entitlement.periodType,
      hasPeriodType: !!PERIOD_TYPE
    });

    return 'monthly'; // Default para devotional app
  }

  private getPremiumFeatures(planType: 'weekly' | 'monthly' | 'yearly' | 'free'): PremiumFeatures {
    const isPremium = planType !== 'free';

    return {
      unlimitedDevotionals: isPremium,
      extendedMensGuide: isPremium,
      allSituations: isPremium,
      noAds: isPremium,
      offlineReading: isPremium,
      personalizedContent: isPremium,
      exportFeatures: isPremium,
      prioritySupport: planType === 'yearly',
      mensGroupSharing: isPremium,
      weeklyReflectionPrompts: isPremium,
      scripturalCrossReferences: isPremium,
      dailyPrayerGuides: isPremium,
      fatherhoodContent: isPremium,
      leadershipInsights: isPremium,
    };
  }

  private getFreeStatus(): SubscriptionStatus {
    return {
      isActive: false,
      planType: 'free',
      expirationDate: null,
      willRenew: false,
      features: this.getPremiumFeatures('free'),
    };
  }

  public async purchaseProduct(productId: string): Promise<PurchaseResult> {
    if (!this.checkAvailability()) {
      return {
        success: false,
        error: 'RevenueCat no disponible',
      };
    }

    try {
      console.log('[RevenueCat] 💳 Iniciando compra:', productId);

      const product = this.availableProducts.find(p => 
        p.identifier === productId || p.product?.identifier === productId
      );

      if (!product) {
        return {
          success: false,
          error: 'Producto no encontrado',
        };
      }

      const result = await Purchases.purchasePackage(product);

      if (result?.customerInfo) {
        this.customerInfo = result.customerInfo;
        
        const config = getRevenueCatConfig();
        const hasEntitlement = result.customerInfo.entitlements?.active?.[config.entitlementId];

        if (hasEntitlement) {
          console.log('[RevenueCat] ✅ Compra exitosa');
          return {
            success: true,
            customerInfo: result.customerInfo,
          };
        }
      }

      return {
        success: false,
        error: 'Compra no completada',
      };

    } catch (error: any) {
      console.error('[RevenueCat] ❌ Error en compra:', error);

      // ✅ VERIFICAR ERROR CODE SOLO SI ESTÁ DISPONIBLE
      if (PURCHASES_ERROR_CODE && error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return {
          success: false,
          userCancelled: true,
        };
      }

      // Verificar también por mensaje de error común
      if (error.userCancelled || error.message?.includes('cancelled')) {
        return {
          success: false,
          userCancelled: true,
        };
      }

      return {
        success: false,
        error: error.message || 'Error desconocido',
      };
    }
  }

  public async restorePurchases(): Promise<PurchaseResult> {
    if (!this.checkAvailability()) {
      return {
        success: false,
        error: 'RevenueCat no disponible',
      };
    }

    try {
      console.log('[RevenueCat] 🔄 Restaurando compras...');

      const result = await Purchases.restorePurchases();
      this.customerInfo = result;

      const config = getRevenueCatConfig();
      const hasEntitlement = result.entitlements?.active?.[config.entitlementId];

      if (hasEntitlement) {
        console.log('[RevenueCat] ✅ Compras restauradas');
        return {
          success: true,
          customerInfo: result,
        };
      } else {
        return {
          success: false,
          error: 'No hay compras para restaurar',
        };
      }

    } catch (error: any) {
      console.error('[RevenueCat] ❌ Error restaurando:', error);
      return {
        success: false,
        error: error.message || 'Error restaurando compras',
      };
    }
  }

  public isAvailable(): boolean {
    return isRevenueCatAvailable;
  }

  public getCurrentCustomerInfo(): CustomerInfo | null {
    return this.customerInfo;
  }
}
