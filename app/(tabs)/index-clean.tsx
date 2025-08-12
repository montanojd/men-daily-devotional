import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useDevotionalContent } from '@/hooks/useDevotionalContent';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useInterstitialAds } from '@/hooks/useInterstitialAds';
import { useStrategicAds } from '@/hooks/useStrategicAds';
import { DevotionalCard } from '@/components/DevotionalCard';
import { BannerAdWrapper } from '@/components/BannerAdWrapper';
import { PremiumPressureModal } from '@/components/PremiumPressureModal';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { RefreshCw } from 'lucide-react-native';

export default function TodayScreen() {
  const router = useRouter();
  const { content, loading, error, refreshContent } = useDevotionalContent();
  const { isPremium } = usePremiumStatus();
  const { streak, isTodayCompleted, markTodayCompleted: markCompleted } = useReadingProgress();
  
  // Estado para el modal de presión hacia premium
  const [showPressureModal, setShowPressureModal] = useState(false);
  const [pressureLevel, setPressureLevel] = useState<'soft' | 'medium' | 'aggressive'>('soft');

  // ✅ Hook para intersticiales estratégicos (balanceado)
  const { showDevotionalAd, getSessionStats } = useStrategicAds();

  // ✅ Hook para tracking básico (open ads y banners)
  const { trackInteraction } = useInterstitialAds({
    enabled: !isPremium,
    interactionThreshold: 5, // Solo para banners y open ads
    onAdShown: () => console.log('📱 Basic ad shown'),
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshContent();
    } finally {
      setRefreshing(false);
    }
  };

  // Obtener el devocional de hoy
  const today = new Date().toISOString().split('T')[0];
  const todaysDevotional = content.devotionals[today];

  // 📊 Incrementar presión premium según uso y frecuencia
  const calculatePressureLevel = (): 'soft' | 'medium' | 'aggressive' => {
    const stats = getSessionStats();
    
    if (stats.interstitialsShown >= 2 && !isPremium) {
      return 'aggressive'; // Usuario muy activo sin premium
    } else if (streak >= 3 && !isPremium) {
      return 'medium'; // Usuario consistente sin premium
    }
    return 'soft'; // Usuario nuevo o casual
  };

  // 🎯 Función para completar devocional con anuncios estratégicos
  const handleCompleteDevotional = async () => {
    if (isTodayCompleted) return;

    try {
      // Track interacción básica
      trackInteraction('devotional_completion');

      // Mostrar anuncio estratégico para usuarios free
      if (!isPremium) {
        console.log('📱 Showing strategic ad after devotional completion');
        await showDevotionalAd();
      }

      // Marcar como completado
      markCompleted();

      // Presión premium basada en el comportamiento
      const currentPressure = calculatePressureLevel();
      setPressureLevel(currentPressure);
      
      // Solo mostrar modal si no es premium
      if (!isPremium) {
        setShowPressureModal(true);
      }

    } catch (error) {
      console.error('Error completing devotional:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Cargando devocional de hoy...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error cargando contenido</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <RefreshCw size={16} color="#FFFFFF" />
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!todaysDevotional) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.noContentText}>No hay devocional para hoy</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <RefreshCw size={16} color="#FFFFFF" />
            <Text style={styles.retryText}>Actualizar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
      >
        {/* Header con racha */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Devocional de Hoy</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</Text>
          </View>
          <View style={styles.streakContainer}>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}>días</Text>
          </View>
        </View>

        {/* Banner Ad para usuarios free */}
        {!isPremium && (
          <BannerAdWrapper 
            placement="content_bottom"
          />
        )}

        {/* Devocional Card */}
        <DevotionalCard
          entry={todaysDevotional}
          isPremium={isPremium}
          onPremiumPress={() => router.push('/premium')}
          onPress={() => {
            trackInteraction('devotional_read');
            // Navegar usando router.push simple
            router.push('/premium'); // Temporalmente redirigir a premium hasta crear página de detalle
          }}
          onInteraction={() => trackInteraction('devotional_card')}
          showDate={false}
        />

        {/* Botón para completar */}
        {!isTodayCompleted ? (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleCompleteDevotional}
          >
            <Text style={styles.completeButtonText}>
              ✓ Marcar como Completado
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>
              ✅ Completado hoy
            </Text>
          </View>
        )}

        {/* Banner Ad inferior para usuarios free */}
        {!isPremium && (
          <BannerAdWrapper 
            placement="screen_bottom"
            sticky={true}
          />
        )}

        {/* Espaciado inferior */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal de presión premium */}
      <PremiumPressureModal
        visible={showPressureModal}
        level={pressureLevel}
        onUpgrade={() => {
          setShowPressureModal(false);
          router.push('/premium');
        }}
        onClose={() => setShowPressureModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  streakContainer: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 60,
  },
  streakNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  bannerAdBottom: {
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  completeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  completedBadge: {
    marginTop: 24,
    backgroundColor: '#065F46',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
  },
  completedBadgeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#D1FAE5',
    letterSpacing: 0.5,
  },
  bottomSpacing: {
    height: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  noContentText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  retryText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
