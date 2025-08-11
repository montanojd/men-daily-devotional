import { useState, useEffect } from 'react';
import { RevenueCatService } from '@/services/revenuecat';
import * as SecureStore from 'expo-secure-store';
import { SubscriptionStatus } from '@/types/subscription';

const CACHE_KEY = 'premium_status_cache_v3';

export function usePremiumStatus() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  const updatePremiumStatus = async (force = false) => {
    try {
      const revenueCatService = RevenueCatService.getInstance();
      const status = await revenueCatService.checkPremiumStatus();
      
      setIsPremium(status.isActive);
      setSubscriptionStatus(status);
      
      await SecureStore.setItemAsync(CACHE_KEY, status.isActive.toString());
      console.log('[usePremiumStatus] ✅ Status actualizado:', {
        isPremium: status.isActive,
        planType: status.planType,
        expirationDate: status.expirationDate,
      });
      
    } catch (error) {
      console.warn('[usePremiumStatus] ❌ Error actualizando status:', error);
      // Fallback to cache
      const cached = await SecureStore.getItemAsync(CACHE_KEY);
      if (cached) {
        const cachedValue = cached === 'true';
        setIsPremium(cachedValue);
        console.log('[usePremiumStatus] 🔄 Usando cache:', cachedValue);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await updatePremiumStatus();
      setLoading(false);
    };
    init();

    // Listen to RevenueCat updates
    const revenueCatService = RevenueCatService.getInstance();
    const subscription = revenueCatService.listenCustomerUpdates(async () => {
      console.log('[usePremiumStatus] 🔄 Customer info actualizada, refrescando...');
      await updatePremiumStatus(true);
    });

    return () => {
      subscription?.remove?.();
    };
  }, []);

  // Legacy method for compatibility
  const setPremiumStatus = async (status: boolean) => {
    setIsPremium(status);
    await SecureStore.setItemAsync(CACHE_KEY, status.toString());
  };

  return {
    isPremium,
    loading,
    subscriptionStatus,
    setPremiumStatus,
    refreshStatus: () => updatePremiumStatus(true)
  };
}