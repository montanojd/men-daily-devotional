import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown, Check, Unlock, RotateCcw, Star, Shield, Heart, BookOpen, Zap, X } from 'lucide-react-native';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { RevenueCatService } from '@/services/revenuecat';
import { useEffect, useState } from 'react';
import { FormattedOfferings } from '@/types/subscription';

export default function PremiumScreen() {
  // Use local premium status hook only
  const { isPremium, subscriptionStatus, refreshStatus } = usePremiumStatus();
  
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [offerings, setOfferings] = useState<FormattedOfferings>({
    weekly: null,
    monthly: null,
    annual: null,
  });
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      setLoadingOfferings(true);
      
      // Use existing method for compatibility
      const revenueCatService = RevenueCatService.getInstance();
      await revenueCatService.configure();
      const formattedOfferings = revenueCatService.getFormattedOfferings();
      setOfferings(formattedOfferings);
      
      console.log('[Premium Screen] ✅ Offerings cargados:', formattedOfferings);
      
    } catch (error) {
      console.error('[Premium Screen] ❌ Error cargando offerings:', error);
      Alert.alert('Error', 'No se pudieron cargar los planes. Inténtalo más tarde.');
    } finally {
      setLoadingOfferings(false);
    }
  };

  const handlePurchase = async (planType: 'weekly' | 'monthly' | 'annual') => {
    const plan = offerings[planType];
    if (!plan) {
      Alert.alert('Error', 'Plan no disponible');
      return;
    }

    try {
      setPurchasing(planType);
      console.log(`[Premium Screen] 💳 Iniciando compra: ${planType}`);
      
      const revenueCatService = RevenueCatService.getInstance();
      const result = await revenueCatService.purchaseProduct(plan.product);

      if (result.success) {
        console.log('[Premium Screen] ✅ Compra exitosa');
        await refreshStatus();
        Alert.alert('¡Éxito!', `Plan ${planType} activado correctamente`);
      } else if (result.userCancelled) {
        console.log('[Premium Screen] ℹ️ Compra cancelada por el usuario');
        // No mostrar alert para cancelación
      } else {
        console.error('[Premium Screen] ❌ Error en compra:', result.error);
        Alert.alert('Error de Compra', result.error || 'No se pudo completar la compra');
      }
      
    } catch (error: any) {
      console.error('[Premium Screen] ❌ Error en compra:', error);
      Alert.alert('Error', error.message || 'Error desconocido en la compra');
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    try {
      console.log('[Premium Screen] 🔄 Restaurando compras...');
      
  const revenueCatService = RevenueCatService.getInstance();
  const result = await revenueCatService.restorePurchases();
  const restored = result.success;

      if (restored) {
        console.log('[Premium Screen] ✅ Compras restauradas');
        await refreshStatus();
        Alert.alert('Restaurado', 'Tus compras han sido restauradas.');
      } else {
        console.log('[Premium Screen] ℹ️ No hay compras para restaurar');
        Alert.alert('Sin compras', 'No se encontraron compras anteriores para restaurar.');
      }
      
    } catch (error: any) {
      console.error('[Premium Screen] ❌ Error restaurando:', error);
      Alert.alert('Error', error.message || 'No se pudieron restaurar las compras');
    }
  };

  const features = [
    {
      icon: BookOpen,
      title: 'Unlimited Devotionals',
      description: 'Access all daily devotionals and biblical studies',
      color: '#3B82F6'
    },
    {
      icon: Unlock,
      title: 'Premium Content',
      description: 'Unlock deep topics like temptation, leadership, and marriage',
      color: '#10B981'
    },
    {
      icon: Shield,
      title: 'Ad-Free Experience',
      description: 'Focus on your spiritual growth without distractions',
      color: '#8B5CF6'
    },
    {
      icon: Star,
      title: 'Offline Access',
      description: 'Read devotionals anywhere, even without internet',
      color: '#F59E0B'
    },
    {
      icon: Heart,
      title: 'Advanced Features',
      description: 'Favorites, notifications, and progress tracking',
      color: '#EF4444'
    },
    {
      icon: Zap,
      title: 'Priority Support',
      description: 'Get help faster with dedicated premium support',
      color: '#06B6D4'
    }
  ];

  if (isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.premiumHeader}>
            <View style={styles.crownContainer}>
              <Crown size={48} color="#F59E0B" />
            </View>
            <Text style={styles.premiumTitle}>Premium Activo</Text>
            <Text style={styles.premiumSubtitle}>
              Tienes acceso completo a todo el contenido devocional
            </Text>
            {subscriptionStatus && (
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                  Plan: {subscriptionStatus.planType.toUpperCase()}
                </Text>
                {subscriptionStatus.expirationDate && (
                  <Text style={styles.statusText}>
                    Expira: {new Date(subscriptionStatus.expirationDate).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Your Premium Benefits</Text>
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <View key={index} style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                    <IconComponent size={20} color={feature.color} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.supportContainer}>
            <Text style={styles.supportTitle}>Thank You!</Text>
            <Text style={styles.supportText}>
              Your support helps us create more inspiring content for Christian men everywhere.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.heroSection}>
            <View style={styles.crownContainer}>
              <Crown size={56} color="#F59E0B" />
            </View>
            <Text style={styles.title}>Unlock Premium</Text>
            <Text style={styles.subtitle}>
              Get complete access to all devotional content and spiritual guidance for Christian men
            </Text>
            <View style={styles.benefitsBadge}>
              <Text style={styles.benefitsBadgeText}>Start Your Spiritual Journey Today</Text>
            </View>
          </View>
        </View>

        <View style={styles.plansContainer}>
          <Text style={styles.plansTitle}>Choose Your Plan</Text>
          <Text style={styles.plansSubtitle}>All plans include full access to premium content</Text>
          
          {loadingOfferings ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F59E0B" />
              <Text style={styles.loadingText}>Loading plans...</Text>
            </View>
          ) : (
            <View style={styles.plansList}>
              {offerings.monthly && (
                <TouchableOpacity 
                  style={styles.planCard} 
                  onPress={() => handlePurchase('monthly')}
                  disabled={purchasing === 'monthly'}
                >
                  <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>Mensual</Text>
                    <Text style={styles.planPrice}>{offerings.monthly.price}</Text>
                  </View>
                  <Text style={styles.planDescription}>Facturación mensual</Text>
                  {purchasing === 'monthly' && (
                    <ActivityIndicator size="small" color="#F59E0B" style={styles.planLoading} />
                  )}
                </TouchableOpacity>
              )}

              {offerings.annual && (
                <TouchableOpacity 
                  style={[styles.planCard, styles.planCardPopular]} 
                  onPress={() => handlePurchase('annual')}
                  disabled={purchasing === 'annual'}
                >
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>POPULAR</Text>
                  </View>
                  <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>Anual</Text>
                    <Text style={styles.planPrice}>{offerings.annual.price}</Text>
                  </View>
                  <Text style={styles.planDescription}>Facturación anual - ¡Ahorra más!</Text>
                  {purchasing === 'annual' && (
                    <ActivityIndicator size="small" color="#F59E0B" style={styles.planLoading} />
                  )}
                </TouchableOpacity>
              )}

              {offerings.weekly && (
                <TouchableOpacity 
                  style={styles.planCard} 
                  onPress={() => handlePurchase('weekly')}
                  disabled={purchasing === 'weekly'}
                >
                  <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>Semanal</Text>
                    <Text style={styles.planPrice}>{offerings.weekly.price}</Text>
                  </View>
                  <Text style={styles.planDescription}>Facturación semanal</Text>
                  {purchasing === 'weekly' && (
                    <ActivityIndicator size="small" color="#F59E0B" style={styles.planLoading} />
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What You Get</Text>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <View key={index} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                  <IconComponent size={20} color={feature.color} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
            <RotateCcw size={16} color="#9CA3AF" />
            <Text style={styles.restoreButtonText}>Restaurar Compras</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            • El pago se cargará a tu cuenta de App Store o Google Play
          </Text>
          <Text style={styles.noteText}>
            • Cancela en cualquier momento desde la configuración de tu cuenta
          </Text>
          <Text style={styles.noteText}>
            • Apoya el desarrollo de contenido cristiano
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    paddingTop: 40,
  },
  premiumHeader: {
    padding: 24,
    alignItems: 'center',
    paddingTop: 40,
  },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F59E0B20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroSection: {
    alignItems: 'center',
  },
  benefitsBadge: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  benefitsBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#10B981',
    textAlign: 'center',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  premiumTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  premiumSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  statusContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  plansContainer: {
    padding: 24,
  },
  plansTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  plansSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  plansList: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#333333',
    position: 'relative',
  },
  planCardPopular: {
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B10',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  planPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#F59E0B',
  },
  planDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#9CA3AF',
  },
  planLoading: {
    position: 'absolute',
    right: 20,
    top: 20,
  },
  featuresContainer: {
    padding: 24,
    paddingTop: 0,
  },
  featuresTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 20,
  },
  featureText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#E5E7EB',
    flex: 1,
    lineHeight: 24,
  },
  buttonContainer: {
    padding: 24,
    gap: 16,
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  restoreButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#9CA3AF',
  },
  noteContainer: {
    padding: 24,
    paddingTop: 0,
  },
  noteText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  supportContainer: {
    padding: 24,
    backgroundColor: '#1F1F1F',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  supportTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#10B981',
    marginBottom: 12,
  },
  supportText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});