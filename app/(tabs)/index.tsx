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
  });

  // Modal de presión después de intersticiales (balanceado)
  useEffect(() => {
    if (!isPremium) {
      const stats = getSessionStats();
      const interstitialCount = stats.interstitialsShown;
      
      if (interstitialCount >= 2) {
        setPressureLevel('medium');
        setShowPressureModal(true);
      } else if (interstitialCount >= 1) {
        setPressureLevel('soft');
        setShowPressureModal(true);
      }
    }
  }, [isPremium, getSessionStats]);

  const markTodayCompleted = async () => {
    await markCompleted();
    // Intersticial estratégico al completar devocional
    await showDevotionalAd();
    await trackInteraction('devotional_completed');
  };

  const handleRefresh = async () => {
    await refreshContent();
    // Solo tracking básico para refresh
    await trackInteraction('content_refresh');
  };

  const handlePremiumPress = () => {
    router.push('/premium');
  };

  const today = new Date().toISOString().split('T')[0];
  const todaysDevotional = content.devotionals[today];
import { RefreshCw } from 'lucide-react-native';

export default function TodayScreen() {
  const router = useRouter();
  const { content, loading, error, refreshContent } = useDevotionalContent();
  const { isPremium } = usePremiumStatus();
  const { streak, isTodayCompleted, markTodayCompleted: markCompleted } = useReadingProgress();
  
  // Estado para el modal de presión hacia premium
  const [showPressureModal, setShowPressureModal] = useState(false);
  const [pressureLevel, setPressureLevel] = useState<'soft' | 'medium' | 'aggressive'>('soft');
  
  // ✅ Hooks para anuncios agresivos que fuercen premium
  const { trackInteraction } = useInterstitialAds({
    enabled: !isPremium,
    interactionThreshold: 2, // Mostrar ad cada 2 interacciones
    onAdShown: () => console.log('📱 Interstitial ad shown'),
    onAdClosed: () => console.log('📱 Interstitial ad closed'),
  });

  // � Hook para ads balanceados (no tan molesto)
  const { trackInteraction: trackAggressiveInteraction, forceShowAd, stats } = useAggressiveAds({
    interactionThreshold: 4, // Cada 4 interacciones para intersticiales
    minTimeInterval: 180000, // 3 minutos mínimo entre intersticiales
    maxAdsPerSession: 2, // Máximo 2 intersticiales por sesión
  });

  // Mostrar modal de presión después de ciertos anuncios (menos agresivo)
  useEffect(() => {
    if (!isPremium && stats.sessionAdCount > 0) {
      const adCount = stats.sessionAdCount;
      
      if (adCount >= 3) {
        setPressureLevel('medium');
        setShowPressureModal(true);
      } else if (adCount >= 2) {
        setPressureLevel('soft');
        setShowPressureModal(true);
      }
      // Eliminado el nivel 'aggressive' para ser menos molesto
    }
  }, [stats.sessionAdCount, isPremium]);

  const markTodayCompleted = async () => {
    await markCompleted();
    // Intersticial solo al completar devocional (momento clave)
    await trackAggressiveInteraction('devotional_completed');
    await trackInteraction('devotional_completed');
  };

  const handleRefresh = async () => {
    await refreshContent();
    // Solo track básico para refresh, no intersticial
    await trackInteraction('content_refresh');
  };

  const handlePremiumPress = async () => {
    // Sin ad forzado antes de premium - mejor UX
    router.push('/premium');
  };

  const today = new Date().toISOString().split('T')[0];
  const todaysDevotional = content.devotionals[today];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading today's devotional...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={handleRefresh}
            tintColor="#F59E0B"
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Today's Devotional</Text>
              <Text style={styles.subtitle}>
                Start your day with God's wisdom
              </Text>
            </View>
            <View style={styles.streakPill}>
              <Text style={styles.streakNumber}>{streak}</Text>
              <Text style={styles.streakLabel}>day{streak === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
          {!isTodayCompleted && todaysDevotional && (
            <TouchableOpacity style={styles.completeButton} onPress={markTodayCompleted}>
              <Text style={styles.completeButtonText}>Mark Completed</Text>
            </TouchableOpacity>
          )}
          {isTodayCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>Completed ✔</Text>
            </View>
          )}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <RefreshCw size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {todaysDevotional ? (
          <DevotionalCard
            entry={todaysDevotional}
            showDate
            date={today}
            isPremium={isPremium}
            onPremiumPress={handlePremiumPress}
            favoriteId={today}
            favoriteType="devotional"
            onInteraction={() => trackInteraction('card_interaction')}
          />
        ) : (
          <View style={styles.noContentContainer}>
            <Text style={styles.noContentText}>
              No devotional available for today.
            </Text>
            <Text style={styles.noContentSubtext}>
              Check back tomorrow or explore other content.
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            "Trust in the Lord with all your heart and lean not on your own understanding." - Proverbs 3:5
          </Text>
        </View>

        <BannerAdWrapper placement="content_bottom" />
      </ScrollView>
      
      {/* Modal de presión hacia premium después de varios anuncios */}
      <PremiumPressureModal
        visible={showPressureModal}
        level={pressureLevel}
        onClose={() => setShowPressureModal(false)}
        onUpgrade={() => {
          setShowPressureModal(false);
          router.push('/premium');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#9CA3AF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7F1D1D',
    margin: 24,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FCA5A5',
    flex: 1,
  },
  noContentContainer: {
    margin: 24,
    padding: 32,
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  noContentText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  noContentSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    paddingTop: 32,
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  streakPill: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 64,
  },
  streakNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#F59E0B',
    lineHeight: 20,
  },
  streakLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completeButton: {
    marginTop: 16,
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  completeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  completedBadge: {
    marginTop: 16,
    backgroundColor: '#065F46',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  completedBadgeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#D1FAE5',
    letterSpacing: 0.5,
  },
});