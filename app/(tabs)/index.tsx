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
import { RefreshCw, Calendar, Check, Crown, CheckCircle, Circle } from 'lucide-react-native';
import { useReadingProgress } from '@/hooks/useReadingProgress';

export default function TodayScreen() {
  const router = useRouter();
  const { content, loading, error, refreshContent } = useDevotionalContent();
  const { isPremium } = usePremiumStatus();
  const { streak, isTodayCompleted, markTodayCompleted: markCompleted } = useReadingProgress();
  
  // Estado para el modal de presión hacia premium
  const [showPressureModal, setShowPressureModal] = useState(false);
  const [pressureLevel, setPressureLevel] = useState<'soft' | 'medium' | 'aggressive'>('soft');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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

  // Obtener el devocional del día seleccionado
  const selectedDevotional = content.devotionals[selectedDate];
  const today = new Date().toISOString().split('T')[0];

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
    if (isTodayCompleted || selectedDate !== today) return;

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

  // Generar calendario simple para los últimos 7 días
  const generateCalendarDays = () => {
    const days = [];
    const todayDate = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(todayDate);
      date.setDate(todayDate.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const hasContent = !!content.devotionals[dateStr];
      const isToday = dateStr === today;
      const isSelected = dateStr === selectedDate;
      
      days.push({
        date: dateStr,
        day: date.getDate(),
        dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        hasContent,
        isToday,
        isSelected,
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading devotional...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error loading content</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <RefreshCw size={16} color="#FFFFFF" />
            <Text style={styles.retryText}>Retry</Text>
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>
                {selectedDate === today ? 'Today\'s Devotional' : 'Daily Devotional'}
              </Text>
              <Text style={styles.date}>
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
            <View style={styles.headerRight}>
              {!isPremium && (
                <TouchableOpacity 
                  style={styles.premiumButton}
                  onPress={() => router.push('/premium')}
                >
                  <Crown size={16} color="#FFFFFF" />
                  <Text style={styles.premiumButtonText}>Premium</Text>
                </TouchableOpacity>
              )}
              <View style={styles.streakContainer}>
                <Text style={styles.streakNumber}>{streak}</Text>
                <Text style={styles.streakLabel}>day streak</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Calendario horizontal */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <Calendar size={20} color="#10B981" />
            <Text style={styles.calendarTitle}>Recent Devotionals</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarScroll}>
            <View style={styles.calendarDays}>
              {calendarDays.map((day) => (
                <TouchableOpacity
                  key={day.date}
                  style={[
                    styles.dayButton,
                    day.isSelected && styles.selectedDayButton,
                    day.isToday && !day.isSelected && styles.todayDayButton,
                    !day.hasContent && styles.disabledDayButton,
                  ]}
                  onPress={() => day.hasContent && setSelectedDate(day.date)}
                  disabled={!day.hasContent}
                >
                  <Text style={[
                    styles.dayName,
                    day.isSelected && styles.selectedDayText,
                    day.isToday && !day.isSelected && styles.todayDayText,
                    !day.hasContent && styles.disabledDayText,
                  ]}>
                    {day.dayName}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    day.isSelected && styles.selectedDayText,
                    day.isToday && !day.isSelected && styles.todayDayText,
                    !day.hasContent && styles.disabledDayText,
                  ]}>
                    {day.day}
                  </Text>
                  
                  {day.hasContent ? (
                    <CheckCircle size={12} color={day.isSelected ? '#FFFFFF' : '#10B981'} />
                  ) : (
                    <Circle size={12} color="#D1D5DB" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Banner Ad para usuarios free */}
        {!isPremium && (
          <BannerAdWrapper placement="content_bottom" />
        )}

        {/* Devocional Card */}
        {selectedDevotional ? (
          <>
            <DevotionalCard
              entry={selectedDevotional}
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

            {/* Botón para completar (solo para hoy) */}
            {selectedDate === today && (
              !isTodayCompleted ? (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={handleCompleteDevotional}
                >
                  <CheckCircle size={20} color="#FFFFFF" />
                  <Text style={styles.completeButtonText}>
                    Mark as Complete
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.completedBadge}>
                  <CheckCircle size={16} color="#D1FAE5" />
                  <Text style={styles.completedBadgeText}>
                    Completed today
                  </Text>
                </View>
              )
            )}
          </>
        ) : (
          <View style={styles.noContentContainer}>
            <Calendar size={48} color="#D1D5DB" />
            <Text style={styles.noContentTitle}>No devotional available</Text>
            <Text style={styles.noContentText}>
              No content available for this date
            </Text>
          </View>
        )}

        {/* Espaciado inferior para tab bar */}
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
    paddingTop: 80,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  header: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 12,
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
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  premiumButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  calendarTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  calendarScroll: {
    marginHorizontal: -4,
  },
  calendarDays: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    gap: 8,
  },
  dayButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 60,
    gap: 4,
  },
  selectedDayButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  todayDayButton: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  disabledDayButton: {
    opacity: 0.4,
    backgroundColor: '#F3F4F6',
  },
  dayName: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  todayDayText: {
    color: '#10B981',
  },
  disabledDayText: {
    color: '#D1D5DB',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  completeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    backgroundColor: '#065F46',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
    gap: 8,
  },
  completedBadgeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#D1FAE5',
    letterSpacing: 0.5,
  },
  noContentContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 20,
  },
  noContentTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noContentText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 120,
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
