import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDevotionalContent } from '@/hooks/useDevotionalContent';
import { useFavorites } from '@/hooks/useFavorites';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { DevotionalCard } from '@/components/DevotionalCard';
import { BannerAdWrapper } from '@/components/BannerAdWrapper';
import { useRouter } from 'expo-router';

export default function FavoritesScreen() {
  const { content } = useDevotionalContent();
  const { favorites, ids } = useFavorites();
  const { isPremium } = usePremiumStatus();
  const router = useRouter();

  const devotionalsEntries = Object.entries(content.devotionals);

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

  const handlePremiumPress = () => router.push('/premium');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>Your saved devotional content</Text>
        </View>

        {resolvedFavorites.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyText}>Tap the heart icon on any devotional to save it here.</Text>
          </View>
        )}

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
        
        {/* Banner persistente para presionar hacia premium */}
        <BannerAdWrapper placement="screen_bottom" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120 }, // Espacio para banner fijo + tab bar
  header: { padding: 24, paddingBottom: 16 },
  title: { fontFamily: 'Inter-Bold', fontSize: 28, color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontFamily: 'Inter-Regular', fontSize: 16, color: '#9CA3AF', lineHeight: 24 },
  list: { padding: 24, paddingTop: 8 },
  empty: { margin: 24, marginTop: 8, backgroundColor: '#1F1F1F', padding: 32, borderRadius: 16, borderWidth: 1, borderColor: '#333333', alignItems: 'center' },
  emptyTitle: { fontFamily: 'Inter-SemiBold', fontSize: 18, color: '#FFFFFF', marginBottom: 8 },
  emptyText: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
});
