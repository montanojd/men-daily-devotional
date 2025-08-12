import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDevotionalContent } from '@/hooks/useDevotionalContent';
import { useFavorites } from '@/hooks/useFavorites';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { DevotionalCard } from '@/components/DevotionalCard';
import { BannerAdWrapper } from '@/components/BannerAdWrapper';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';

export default function FavoritesScreen() {
  const { content } = useDevotionalContent();
  const { favorites } = useFavorites();
  const { isPremium } = usePremiumStatus();
  const router = useRouter();

  const handlePremiumPress = () => router.push('/premium');

  // Resolve favorites
  const resolvedFavorites = favorites
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(fav => {
      if (fav.type === 'devotional') {
        const entry = content.devotionals[fav.id];
        if (entry) return { key: fav.id, entry };
      } else if (fav.type === 'manhood') {
        const idx = parseInt(fav.id.split(':')[1], 10);
        const entry = content.manhood[idx];
        if (entry) return { key: fav.id, entry };
      } else if (fav.type === 'topic') {
        const name = fav.id.split(':')[1];
        const entry = content.topics[name];
        if (entry) return { key: fav.id, entry: { ...entry, title: name.charAt(0).toUpperCase()+name.slice(1) } };
      }
      return null;
    })
    .filter(Boolean) as { key: string; entry: any }[];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>Your saved devotional content</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {resolvedFavorites.length === 0 ? (
          <View style={styles.empty}>
            <Heart size={48} color="#6B7280" />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyText}>
              Tap the heart icon on any devotional to save it here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {resolvedFavorites.map(item => (
              <DevotionalCard
                key={item.key}
                entry={item.entry}
                isPremium={isPremium}
                onPremiumPress={handlePremiumPress}
              />
            ))}
          </View>
        )}
        
        {/* Banner for free users */}
        {!isPremium && (
          <BannerAdWrapper placement="content_bottom" />
        )}

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    padding: 20,
    paddingTop: 80,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Space for tab bar
  },
  list: {
    padding: 20,
  },
  empty: {
    alignItems: 'center',
    padding: 40,
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
});
