// hooks/useATT.ts - App Tracking Transparency hook
import { useState, useEffect, useCallback } from 'react';
import { ATTService } from '@/services/attService';

interface ATTState {
  isLoading: boolean;
  isAvailable: boolean;
  hasRequested: boolean;
  currentStatus: string;
  shouldShowAds: boolean;
  canRequestNow: boolean;
  shouldShowPrompt: boolean;
}

export function useATT() {
  const [state, setState] = useState<ATTState>({
    isLoading: true,
    isAvailable: false,
    hasRequested: false,
    currentStatus: 'unknown',
    shouldShowAds: true,
    canRequestNow: false,
    shouldShowPrompt: false,
  });

  /**
   * ✅ CARGAR ESTADO INICIAL
   */
  useEffect(() => {
    const loadATTStatus = async () => {
      try {
        console.log('[useATT] 🔍 Cargando estado de ATT...');
        
        const info = await ATTService.getStatusInfo();
        
        setState({
          isLoading: false,
          isAvailable: info.isAvailable,
          hasRequested: info.hasRequested,
          currentStatus: info.currentStatus,
          shouldShowAds: info.shouldShowAds,
          canRequestNow: info.canRequestNow,
          shouldShowPrompt: info.canRequestNow,
        });
        
        console.log('[useATT] ✅ Estado cargado:', {
          isAvailable: info.isAvailable,
          canRequestNow: info.canRequestNow,
          shouldShowAds: info.shouldShowAds,
        });
        
      } catch (error) {
        console.error('[useATT] ❌ Error cargando estado:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          shouldShowAds: true, // ✅ FALLBACK: permitir ads
        }));
      }
    };

    loadATTStatus();
  }, []);

  /**
   * ✅ SOLICITAR PERMISO
   */
  const requestPermission = useCallback(async () => {
    try {
      console.log('[useATT] 🔔 Solicitando permiso...');
      
      setState(prev => ({ ...prev, isLoading: true }));
      
      const result = await ATTService.requestPermissionNative();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasRequested: true,
        currentStatus: result.status,
        shouldShowAds: result.shouldShowAds,
        canRequestNow: false,
        shouldShowPrompt: false,
      }));
      
      console.log('[useATT] ✅ Permiso solicitado:', result);
      
      return result;
      
    } catch (error) {
      console.error('[useATT] ❌ Error solicitando permiso:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        shouldShowPrompt: false,
      }));
      
      return {
        status: 'error',
        granted: false,
        shouldShowAds: true,
      };
    }
  }, []);

  /**
   * ✅ OCULTAR PROMPT MANUALMENTE
   */
  const hidePrompt = useCallback(() => {
    console.log('[useATT] ❌ Usuario cerró prompt sin responder');
    setState(prev => ({
      ...prev,
      shouldShowPrompt: false,
    }));
  }, []);

  /**
   * ✅ REFRESCAR ESTADO
   */
  const refreshStatus = useCallback(async () => {
    try {
      console.log('[useATT] 🔄 Refrescando estado...');
      
      const info = await ATTService.getStatusInfo();
      
      setState(prev => ({
        ...prev,
        hasRequested: info.hasRequested,
        currentStatus: info.currentStatus,
        shouldShowAds: info.shouldShowAds,
        canRequestNow: info.canRequestNow,
      }));
      
      console.log('[useATT] ✅ Estado refrescado');
      
    } catch (error) {
      console.error('[useATT] ❌ Error refrescando estado:', error);
    }
  }, []);

  /**
   * ✅ RESET PARA TESTING
   */
  const resetForTesting = useCallback(async () => {
    if (!__DEV__) return;
    
    try {
      await ATTService.resetForTesting();
      
      const info = await ATTService.getStatusInfo();
      
      setState({
        isLoading: false,
        isAvailable: info.isAvailable,
        hasRequested: info.hasRequested,
        currentStatus: info.currentStatus,
        shouldShowAds: info.shouldShowAds,
        canRequestNow: info.canRequestNow,
        shouldShowPrompt: info.canRequestNow,
      });
      
      console.log('[useATT] 🔄 Reseteado para testing');
      
    } catch (error) {
      console.error('[useATT] ❌ Error reseteando:', error);
    }
  }, []);

  return {
    // Estado
    isLoading: state.isLoading,
    isAvailable: state.isAvailable,
    hasRequested: state.hasRequested,
    currentStatus: state.currentStatus,
    shouldShowAds: state.shouldShowAds,
    canRequestNow: state.canRequestNow,
    shouldShowPrompt: state.shouldShowPrompt,
    
    // Acciones
    requestPermission,
    hidePrompt,
    refreshStatus,
    resetForTesting,
    
    // Estados derivados
    isGranted: state.currentStatus === 'granted',
    isDenied: state.currentStatus === 'denied',
    isRestricted: state.currentStatus === 'restricted',
    isNotDetermined: state.currentStatus === 'not_determined',
  };
}

export default useATT;
