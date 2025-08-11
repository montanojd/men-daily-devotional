// services/revenueCatService.ts - Versión Mejorada con Importación Robusta
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import {
  PurchaseResult,
  SubscriptionStatus,
  PremiumFeatures,
  RevenueCatOffering,
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
    console.log('[RevenueCat] ✅ Módulos cargados correctamente');
  }
} catch (error: any) {
  console.warn('[RevenueCat] ⚠️ react-native-purchases no disponible:', error.message);
  isRevenueCatAvailable = false;
}

// ✅ CONFIGURACIÓN CORREGIDA
const getRevenueCatConfig = () => {
  const iosKey = Constants.expoConfig?.extra?.REVENUECAT_IOS_API_KEY;
  const androidKey = Constants.expoConfig?.extra?.REVENUECAT_ANDROID_API_KEY;
  const entitlementId = Constants.expoConfig?.extra?.REVENUECAT_ENTITLEMENT_ID;

  console.log('[RevenueCat] 🔑 Keys detectadas:', {
    hasIosKey: !!iosKey,
    hasAndroidKey: !!androidKey,
    iosKeyLength: iosKey?.length || 0,
    androidKeyLength: androidKey?.length || 0,
    platform: Platform.OS,
    selectedKey: Platform.OS === 'ios' ? iosKey : androidKey,
  });

  const selectedKey = Platform.select({
    ios: iosKey,
    android: androidKey,
  });

  if (!selectedKey) {
    console.error('[RevenueCat] ❌ No API Key encontrada para platform:', Platform.OS);
  }

  return {
    apiKey: selectedKey,
    entitlementId: entitlementId || 'mendevotional_premium',
    enableDebugLogs: __DEV__,
    attributes: {
      app_version: Constants.expoConfig?.extra?.APP_VERSION || '1.0.0',
      platform: Platform.OS,
    }
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
      console.error('[RevenueCat] ❌ RevenueCat no está disponible o no se pudo cargar.');
      return false;
    }
    return true;
  }

  public async configure(): Promise<void> {
    if (this.isConfigured) {
      console.log('[RevenueCat] ✅ Ya configurado, saltando...');
      return;
    }

    if (!this.checkAvailability()) {
      const error = 'RevenueCat no está disponible. Verifique la instalación.';
      this.configurationError = error;
      throw new Error(error);
    }

    try {
      const config = getRevenueCatConfig();

      if (!config.apiKey) {
        throw new Error('API Key de RevenueCat no configurada');
      }

      console.log('[RevenueCat] 🚀 Configurando RevenueCat...', {
        platform: Platform.OS,
        hasApiKey: !!config.apiKey,
        entitlement: config.entitlementId,
      });

      if (config.enableDebugLogs && LOG_LEVEL) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      await Purchases.configure({
        apiKey: config.apiKey,
      });

      if (config.attributes) {
        await Purchases.setAttributes(config.attributes);
      }

      this.isConfigured = true;
      console.log('[RevenueCat] ✅ RevenueCat configurado correctamente');

      await this.loadOfferings();
      await this.refreshCustomerInfo();

    } catch (error: any) {
      console.error('[RevenueCat] ❌ Error configurando RevenueCat:', error);
      this.configurationError = error.message;
      throw error;
    }
  }

  public async loadOfferings(): Promise<any> {
    if (!this.isConfigured || !this.checkAvailability()) {
      throw new Error('RevenueCat no configurado');
    }

    try {
      console.log('[RevenueCat] 📦 Cargando offerings desde dashboard...');

      const offerings = await Purchases.getOfferings();
      this.currentOfferings = offerings;

      if (offerings.current) {
        this.availableProducts = Object.values(offerings.current.availablePackages || {});

        console.log('[RevenueCat] ✅ Offerings cargados:', {
          offeringId: offerings.current.identifier,
          totalPackages: this.availableProducts.length,
          packages: this.availableProducts.map(p => ({
            id: p.identifier,
            price: p.product.priceString,
            period: p.packageType,
          }))
        });
      } else {
        console.warn('[RevenueCat] ⚠️ No hay offering actual configurado en dashboard');
        this.availableProducts = [];
      }

      return offerings;

    } catch (error: any) {
      console.error('[RevenueCat] ❌ Error cargando offerings:', error);
      this.availableProducts = [];
      throw error;
    }
  }

  // ✅ MÉTODO AGREGADO PARA COMPATIBILIDAD CON PREMIUM SCREEN
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

  // ✅ MÉTODO CORREGIDO - OBTENER PRODUCTOS FORMATEADOS SIN DEPENDENCIAS DE PACKAGE_TYPE
  public getFormattedOfferings(): any {
    if (!this.currentOfferings?.current?.availablePackages) {
      return {
        weekly: null,
        monthly: null,
        annual: null,
      };
    }

    const packages = this.currentOfferings.current.availablePackages;

    // ✅ BÚSQUEDA ROBUSTA SIN DEPENDER DE PACKAGE_TYPE (que puede estar undefined)
    const weekly = packages.find((p: any) => {
      const id = p.identifier.toLowerCase();
      const productId = p.product?.identifier?.toLowerCase() || '';
      
      // Verificar por identificadores comunes de weekly
      return (
        id.includes('weekly') || 
        id.includes('week') || 
        id.includes('$rc_weekly') ||
        productId.includes('weekly') ||
        productId.includes('week') ||
        // Solo verificar PACKAGE_TYPE si está disponible
        (PACKAGE_TYPE && p.packageType === PACKAGE_TYPE.WEEKLY)
      );
    });

    const monthly = packages.find((p: any) => {
      const id = p.identifier.toLowerCase();
      const productId = p.product?.identifier?.toLowerCase() || '';
      
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
      const id = p.identifier.toLowerCase();
      const productId = p.product?.identifier?.toLowerCase() || '';
      
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
      weekly: weekly ? {
        id: weekly.identifier,
        price: weekly.product.priceString,
        title: weekly.product.title,
        description: weekly.product.description,
        period: 'week',
        product: weekly,
      } : null,

      monthly: monthly ? {
        id: monthly.identifier,
        price: monthly.product.priceString,
        title: monthly.product.title,
        description: monthly.product.description,
        period: 'month',
        product: monthly,
      } : null,

      annual: annual ? {
        id: annual.identifier,
        price: annual.product.priceString,
        title: annual.product.title,
        description: annual.product.description,
        period: 'year',
        product: annual,
      } : null,
    };
  }

  public async refreshCustomerInfo(): Promise<void> {
    if (!this.isConfigured || !this.checkAvailability()) return;

    try {
      console.log('[RevenueCat] 🔄 Refrescando customer info...');

      const customerInfo = await Purchases.getCustomerInfo();
      this.customerInfo = customerInfo;

      console.log('[RevenueCat] ✅ Customer info actualizada:', {
        userId: customerInfo.originalAppUserId,
        hasActiveEntitlements: Object.keys(customerInfo.entitlements.active).length > 0,
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
      });

    } catch (error) {
      console.error('[RevenueCat] ❌ Error refrescando customer info:', error);
    }
  }

  // ✅ CHECK PREMIUM STATUS CORREGIDO
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
      const entitlement = this.customerInfo.entitlements.active[config.entitlementId];

      if (entitlement) {
        const planType = this.determinePlanType(entitlement);
        const features = this.getPremiumFeatures(planType);

        console.log('[RevenueCat] ✅ Usuario premium detectado:', {
          planType,
          productId: entitlement.productIdentifier,
          expirationDate: entitlement.expirationDate,
          willRenew: entitlement.willRenew,
        });

        return {
          isActive: true,
          planType,
          expirationDate: entitlement.expirationDate,
          willRenew: entitlement.willRenew,
          features,
        };
      } else {
        return this.getFreeStatus();
      }

    } catch (error) {
      console.error('[RevenueCat] ❌ Error verificando premium status:', error);
      return this.getFreeStatus();
    }
  }

  // ✅ DETERMINAR TIPO DE PLAN CORREGIDO - SIN DEPENDENCIAS DE PERIOD_TYPE
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

    console.warn('[RevenueCat] ⚠️ No se pudo determinar el tipo de plan, defaulting a free:', {
      productId,
      periodType: entitlement.periodType,
      hasPeriodType: !!PERIOD_TYPE
    });

    return 'free';
  }

  private getPremiumFeatures(planType: 'weekly' | 'monthly' | 'yearly' | 'free'): PremiumFeatures {
    const defaultFeatures: PremiumFeatures = {
      unlimitedDevotionals: false,
      noAds: false,
      offlineReading: false,
      personalizedContent: false,
      exportFeatures: false,
      prioritySupport: false,
    };

    const featureMatrix: { [key: string]: PremiumFeatures } = {
      weekly: {
        ...defaultFeatures,
        unlimitedDevotionals: true,
        noAds: true,
        offlineReading: true,
      },
      monthly: {
        ...defaultFeatures,
        unlimitedDevotionals: true,
        noAds: true,
        offlineReading: true,
        personalizedContent: true,
        exportFeatures: true,
      },
      yearly: {
        ...defaultFeatures,
        unlimitedDevotionals: true,
        noAds: true,
        offlineReading: true,
        personalizedContent: true,
        exportFeatures: true,
        prioritySupport: true,
      },
      free: defaultFeatures,
    };

    return featureMatrix[planType] || defaultFeatures;
  }

  public async purchaseProduct(productPackage: any): Promise<PurchaseResult> {
    if (!this.isConfigured || !this.checkAvailability()) {
      return {
        success: false,
        error: 'RevenueCat no configurado correctamente'
      };
    }

    try {
      console.log('[RevenueCat] 💳 Iniciando compra:', {
        packageId: productPackage.identifier,
        productId: productPackage.product.identifier,
        price: productPackage.product.priceString,
      });

      const { customerInfo } = await Purchases.purchasePackage(productPackage);

      const config = getRevenueCatConfig();
      const hasPremiumEntitlement = customerInfo.entitlements.active[config.entitlementId];

      if (hasPremiumEntitlement) {
        console.log('[RevenueCat] ✅ Compra exitosa - Premium activado');
        this.customerInfo = customerInfo;
        return {
          success: true,
          customerInfo
        };
      } else {
        console.warn('[RevenueCat] ⚠️ Compra procesada pero entitlement no activo');
        return {
          success: false,
          error: 'Compra procesada pero premium no activado'
        };
      }

    } catch (error: any) {
      console.error('[RevenueCat] ❌ Error en compra:', error);

      // ✅ VERIFICAR ERROR CODE SOLO SI ESTÁ DISPONIBLE
      if (PURCHASES_ERROR_CODE && error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return {
          success: false,
          userCancelled: true,
          error: 'Compra cancelada por el usuario'
        };
      }

      return {
        success: false,
        error: error.message || 'Error desconocido en la compra'
      };
    }
  }

  public async restorePurchases(): Promise<PurchaseResult> {
    console.log('[RevenueCat] 🔄 Restaurando compras...');

    if (!this.isConfigured || !this.checkAvailability()) {
      return {
        success: false,
        error: 'RevenueCat no configurado correctamente'
      };
    }

    try {
      const customerInfo = await Purchases.restorePurchases();

      const config = getRevenueCatConfig();
      const hasPremiumEntitlement = customerInfo.entitlements.active[config.entitlementId];

      if (hasPremiumEntitlement) {
        console.log('[RevenueCat] ✅ Compras restauradas - Premium activado');
        this.customerInfo = customerInfo;
        return { success: true, customerInfo };
      } else {
        console.log('[RevenueCat] ℹ️ No se encontraron compras activas para restaurar');
        return {
          success: false,
          error: 'No se encontraron compras activas para restaurar'
        };
      }

    } catch (error: any) {
      console.error('[RevenueCat] ❌ Error restaurando compras:', error);
      return {
        success: false,
        error: error.message || 'Error restaurando compras'
      };
    }
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

  public getConfiguration() {
    return {
      isConfigured: this.isConfigured,
      hasError: !!this.configurationError,
      error: this.configurationError,
      isAvailable: isRevenueCatAvailable,
    };
  }

  public getCurrentOfferings() {
    return this.currentOfferings;
  }

  public getCustomerInfo() {
    return this.customerInfo;
  }

  // ✅ MÉTODOS DE COMPATIBILIDAD CON LA IMPLEMENTACIÓN ORIGINAL
  public async getPremiumStatus(force = false): Promise<boolean> {
    const status = await this.checkPremiumStatus();
    return status.isActive;
  }

  public async purchasePackageByType(type: 'MONTHLY' | 'ANNUAL') {
    const offerings = await this.getOfferings();
    if (!offerings?.current) throw new Error('No current offering');
    
    const target = offerings.current.availablePackages.find((p: any) => {
      if (PACKAGE_TYPE) {
        return p.packageType === PACKAGE_TYPE[type];
      }
      // Fallback sin PACKAGE_TYPE
      const id = p.identifier.toLowerCase();
      return type === 'MONTHLY' ? id.includes('month') : id.includes('annual') || id.includes('year');
    });
    
    if (!target) throw new Error(`${type} package not found`);
    return this.purchaseProduct(target);
  }

  public listenCustomerUpdates(cb: (info: CustomerInfo) => void) {
    if (!this.checkAvailability()) return () => {};
    return Purchases.addCustomerInfoUpdateListener(cb);
  }
}
