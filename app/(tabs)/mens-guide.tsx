import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDevotionalContent } from '@/hooks/useDevotionalContent';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { DevotionalCard } from '@/components/DevotionalCard';
import { BannerAdWrapper } from '@/components/BannerAdWrapper';

export default function MensGuideScreen() {
  const router = useRouter();
  const { content, loading, refreshContent } = useDevotionalContent();
  const { isPremium } = usePremiumStatus();

  const handlePremiumPress = () => {
    router.push('/premium');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={refreshContent}
            tintColor="#F59E0B"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Men's Guide</Text>
          <Text style={styles.subtitle}>
            Biblical principles for godly manhood
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{content.manhood.length}</Text>
            <Text style={styles.statLabel}>Devotionals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {content.manhood.filter(entry => !entry.isPremium).length}
            </Text>
            <Text style={styles.statLabel}>Free</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {content.manhood.filter(entry => entry.isPremium).length}
            </Text>
            <Text style={styles.statLabel}>Premium</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          {content.manhood.map((entry, index) => (
            <DevotionalCard
              key={index}
              entry={entry}
              isPremium={isPremium}
              onPremiumPress={handlePremiumPress}
              favoriteId={`manhood:${index}`}
              favoriteType="manhood"
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            "Be watchful, stand firm in the faith, act like men, be strong." - 1 Corinthians 16:13
          </Text>
        </View>
        
        {/* Banner agresivo para conversión a premium */}
        <BannerAdWrapper placement="screen_bottom" />
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
  scrollContent: { 
    paddingBottom: 120 // Espacio para banner fijo + tab bar
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
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#F59E0B',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 16,
  },
  footer: {
    padding: 24,
    paddingTop: 0,
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});