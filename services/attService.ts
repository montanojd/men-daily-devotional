// services/attService.ts - App Tracking Transparency for Devotional for Men
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ IMPORTACIÓN CONDICIONAL DE ATT
let trackingTransparency: any = null;
let PermissionStatus: any = null;

try {
  if (Platform.OS === 'ios') {
    const attModule = require('expo-tracking-transparency');
    trackingTransparency = attModule;
    PermissionStatus = attModule.PermissionStatus;
    console.log('[ATT] ✅ expo-tracking-transparency disponible');
  }
} catch (error) {
  console.warn('[ATT] ⚠️ expo-tracking-transparency no disponible:', error);
}

const ATT_STORAGE_KEY = '@devotional_att_permission_requested';
const ATT_STATUS_KEY = '@devotional_att_permission_status';

export class ATTService {
  
  /**
   * ✅ VERIFICAR SI ATT ESTÁ DISPONIBLE
   */
  static isAvailable(): boolean {
    return Platform.OS === 'ios' && !!trackingTransparency;
  }

  /**
   * ✅ VERIFICAR SI YA SE SOLICITÓ EL PERMISO
   */
  static async hasRequestedPermission(): Promise<boolean> {
    try {
      const requested = await AsyncStorage.getItem(ATT_STORAGE_KEY);
      const hasRequested = requested === 'true';
      console.log(`[ATT] 🔍 ¿Ya solicitado? ${hasRequested}`);
      return hasRequested;
    } catch (error) {
      console.error('[ATT] Error verificando si se solicitó permiso:', error);
      return false;
    }
  }

  /**
   * ✅ OBTENER ESTADO ACTUAL DEL PERMISO
   */
  static async getCurrentStatus(): Promise<string> {
    if (!this.isAvailable()) {
      return 'not_available';
    }

    try {
      const status = await trackingTransparency.getTrackingPermissionsAsync();
      console.log(`[ATT] 📊 Estado actual desde iOS: ${status.status}`);
      
      // ✅ GUARDAR ESTADO
      await AsyncStorage.setItem(ATT_STATUS_KEY, status.status);
      
      return status.status;
    } catch (error) {
      console.error('[ATT] Error obteniendo estado:', error);
      return 'unknown';
    }
  }

  /**
   * ✅ SOLICITAR PERMISO DE TRACKING - SOLO NATIVO
   */
  static async requestPermissionNative(): Promise<{
    status: string;
    granted: boolean;
    shouldShowAds: boolean;
  }> {
    console.log('[ATT] 🔔 Solicitando permiso nativo de iOS...');

    if (!this.isAvailable()) {
      console.log('[ATT] ⚠️ ATT no disponible en esta plataforma');
      return {
        status: 'not_available',
        granted: false,
        shouldShowAds: true, // ✅ Android siempre puede mostrar ads
      };
    }

    try {
      // ✅ MARCAR COMO SOLICITADO ANTES DE SOLICITAR
      await AsyncStorage.setItem(ATT_STORAGE_KEY, 'true');
      console.log('[ATT] ✅ Marcado como solicitado');
      
      // ✅ MOSTRAR PROMPT NATIVO DE iOS
      const result = await trackingTransparency.requestTrackingPermissionsAsync();
      const status = result.status;
      
      // ✅ GUARDAR RESULTADO
      await AsyncStorage.setItem(ATT_STATUS_KEY, status);
      
      const granted = status === PermissionStatus.GRANTED;
      
      console.log(`[ATT] 📋 Resultado nativo: ${status} (granted: ${granted})`);
      
      // ✅ DETERMINAR SI MOSTRAR ADS
      const shouldShowAds = this.shouldShowAds(status);
      
      return {
        status,
        granted,
        shouldShowAds,
      };
      
    } catch (error) {
      console.error('[ATT] ❌ Error solicitando permiso nativo:', error);
      
      return {
        status: 'error',
        granted: false,
        shouldShowAds: true, // ✅ En caso de error, mostrar ads
      };
    }
  }

  /**
   * ✅ DETERMINAR SI MOSTRAR ADS BASADO EN ATT
   */
  static shouldShowAds(status?: string): boolean {
    if (!this.isAvailable()) {
      console.log('[ATT] ✅ Android - siempre mostrar ads');
      return true; // ✅ Android siempre puede mostrar ads
    }

    if (!status) {
      console.log('[ATT] ⚠️ No status provided - mostrar ads por defecto');
      return true;
    }

    console.log(`[ATT] 🔍 Evaluando shouldShowAds para status: ${status}`);

    switch (status) {
      case PermissionStatus?.GRANTED:
        console.log('[ATT] ✅ Tracking permitido - ads personalizados OK');
        return true;
        
      case PermissionStatus?.DENIED:
        console.log('[ATT] ❌ Tracking denegado - ads no personalizados OK');
        return true; // ✅ PUEDES MOSTRAR ADS NO PERSONALIZADOS
        
      case PermissionStatus?.RESTRICTED:
        console.log('[ATT] 🔒 Tracking restringido - ads no personalizados OK');
        return true; // ✅ PUEDES MOSTRAR ADS NO PERSONALIZADOS
        
      case PermissionStatus?.UNDETERMINED:
        console.log('[ATT] ❓ Tracking no determinado - mostrar ads mientras decide');
        return true; // ✅ Mostrar ads no personalizados mientras decide
        
      default:
        console.log('[ATT] ❓ Estado desconocido - mostrar ads');
        return true; // ✅ FALLBACK
    }
  }

  /**
   * ✅ VERIFICAR SI DEBERÍA SOLICITAR PERMISO - AUTOMÁTICO
   */
  static async shouldRequestPermissionAutomatically(): Promise<boolean> {
    if (!this.isAvailable()) {
      console.log('[ATT] ℹ️ No disponible en Android - no solicitar');
      return false;
    }

    try {
      // ✅ VERIFICAR SI YA SE SOLICITÓ
      const alreadyRequested = await this.hasRequestedPermission();
      if (alreadyRequested) {
        console.log('[ATT] ℹ️ Permiso ya solicitado anteriormente');
        return false;
      }

      // ✅ VERIFICAR ESTADO ACTUAL
      const currentStatus = await this.getCurrentStatus();
      
      // ✅ SOLICITAR SOLO SI ESTÁ UNDETERMINED Y NO SE HA SOLICITADO
      const shouldRequest = currentStatus === PermissionStatus?.UNDETERMINED && !alreadyRequested;
      
      console.log(`[ATT] 🤔 ¿Solicitar permiso automáticamente? ${shouldRequest} (estado: ${currentStatus})`);
      
      return shouldRequest;
      
    } catch (error) {
      console.error('[ATT] Error verificando si solicitar permiso:', error);
      return false;
    }
  }

  /**
   * ✅ INICIALIZAR ATT AUTOMÁTICAMENTE
   */
  static async initializeATT(): Promise<{
    shouldShowAds: boolean;
    status: string;
    requestedAutomatically: boolean;
  }> {
    console.log('[ATT] 🚀 Inicializando ATT automáticamente...');

    if (!this.isAvailable()) {
      return {
        shouldShowAds: true,
        status: 'not_available',
        requestedAutomatically: false,
      };
    }

    try {
      // ✅ VERIFICAR SI NECESITA SOLICITAR AUTOMÁTICAMENTE
      const shouldRequest = await this.shouldRequestPermissionAutomatically();
      let currentStatus = await this.getCurrentStatus();
      let requestedAutomatically = false;

      if (shouldRequest) {
        console.log('[ATT] 🔔 Solicitando permiso automáticamente...');
        
        // ✅ DELAY PARA QUE LA APP SE CARGUE COMPLETAMENTE
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 segundos
        
        const result = await this.requestPermissionNative();
        currentStatus = result.status;
        requestedAutomatically = true;
        
        console.log('[ATT] ✅ Permiso solicitado automáticamente:', result);
      } else {
        console.log('[ATT] ℹ️ No se requiere solicitar permiso automáticamente');
      }

      const shouldShowAds = this.shouldShowAds(currentStatus);

      return {
        shouldShowAds,
        status: currentStatus,
        requestedAutomatically,
      };

    } catch (error) {
      console.error('[ATT] ❌ Error inicializando ATT:', error);
      return {
        shouldShowAds: true,
        status: 'error',
        requestedAutomatically: false,
      };
    }
  }

  /**
   * ✅ OBTENER INFO COMPLETA PARA LA APP
   */
  static async getStatusInfo(): Promise<{
    isAvailable: boolean;
    hasRequested: boolean;
    currentStatus: string;
    shouldShowAds: boolean;
    canRequestNow: boolean;
  }> {
    const isAvailable = this.isAvailable();
    const hasRequested = await this.hasRequestedPermission();
    const currentStatus = await this.getCurrentStatus();
    const shouldShowAds = this.shouldShowAds(currentStatus);
    
    // ✅ NO PERMITIR SOLICITUD MANUAL - SOLO AUTOMÁTICA
    const canRequestNow = false;

    console.log('[ATT] 📊 Status Info:', {
      isAvailable,
      hasRequested,
      currentStatus,
      shouldShowAds,
      canRequestNow,
    });

    return {
      isAvailable,
      hasRequested,
      currentStatus,
      shouldShowAds,
      canRequestNow,
    };
  }

  /**
   * ✅ RESET PARA TESTING (solo desarrollo)
   */
  static async resetForTesting(): Promise<void> {
    if (!__DEV__) {
      console.warn('[ATT] resetForTesting solo disponible en desarrollo');
      return;
    }

    try {
      await AsyncStorage.removeItem(ATT_STORAGE_KEY);
      await AsyncStorage.removeItem(ATT_STATUS_KEY);
      console.log('[ATT] 🔄 Estado reseteado para testing');
    } catch (error) {
      console.error('[ATT] Error reseteando:', error);
    }
  }

  /**
   * ✅ DEBUG INFO (solo desarrollo)
   */
  static async debugInfo(): Promise<void> {
    if (!__DEV__) return;

    console.log('\n🔍 [ATT] DEBUG INFO:');
    console.log(`   Plataforma: ${Platform.OS}`);
    console.log(`   ATT disponible: ${this.isAvailable()}`);
    
    if (this.isAvailable()) {
      const info = await this.getStatusInfo();
      console.log('   Estado completo:', info);
      
      if (PermissionStatus) {
        console.log('   Estados disponibles:', {
          GRANTED: PermissionStatus.GRANTED,
          DENIED: PermissionStatus.DENIED,
          RESTRICTED: PermissionStatus.RESTRICTED,
          UNDETERMINED: PermissionStatus.UNDETERMINED,
        });
      }

      console.log('   🎯 MODO: Solo prompt nativo de iOS');
      console.log('   🚫 Modal personalizado: DESHABILITADO');
    }
    console.log('');
  }
}

// ✅ HACER DISPONIBLE GLOBALMENTE EN DESARROLLO
if (__DEV__) {
  (global as any).ATTService = ATTService;
  console.log('🔔 ATTService disponible globalmente en desarrollo');
}
