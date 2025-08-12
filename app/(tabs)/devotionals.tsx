import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useDevotionalContent } from '@/hooks/useDevotionalContent';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useFavorites } from '@/hooks/useFavorites';
import { TopicModal } from '@/components/TopicModal';
import { CategoryBadge } from '@/components/CategoryBadge';
import { DevotionalCard } from '@/components/DevotionalCard';
import { BannerAdWrapper } from '@/components/BannerAdWrapper';
import { Lock, Heart, Shield, BookOpen } from 'lucide-react-native';
import { TopicEntry } from '@/types/devotional';

type TabType = 'situations' | 'manhood' | 'favorites';

export default function DevotionalsScreen() {
  const router = useRouter();
  const { content, loading, refreshContent } = useDevotionalContent();
  const { isPremium } = usePremiumStatus();
  const { favorites } = useFavorites();
  const [selectedTopic, setSelectedTopic] = useState<{ name: string; entry: TopicEntry } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('situations');

  const handleTopicPress = (topicName: string, entry: TopicEntry) => {
    if (entry.isPremium && !isPremium) {
      router.push('/premium');
      return;
    }
    setSelectedTopic({ name: topicName, entry });
  };

  const handlePremiumPress = () => {
    router.push('/premium');
  };

  const topics = Object.entries(content.topics);

  // Obtener favoritos resueltos
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

  const renderSituations = () => (
    <View style={styles.contentContainer}>
      {topics.map(([topicName, entry]) => {
        const isLocked = entry.isPremium && !isPremium;
        
        return (
          <TouchableOpacity
            key={topicName}
            style={[styles.topicCard, isLocked && styles.lockedCard]}
            onPress={() => handleTopicPress(topicName, entry)}
          >
            <View style={styles.topicHeader}>
              <Text style={styles.topicTitle}>
                {topicName.charAt(0).toUpperCase() + topicName.slice(1).replace(/-/g, ' ')}
              </Text>
              {isLocked && (
                <View style={styles.lockIcon}>
                  <Lock size={16} color="#10B981" />
                </View>
              )}
            </View>

            <CategoryBadge category={entry.category} size="small" />
            
            <Text style={styles.topicVerse}>{entry.verse}</Text>
            <Text style={styles.topicPreview} numberOfLines={2}>
              {entry.text}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderManhood = () => (
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
  );

  const renderFavorites = () => (
    <View style={styles.contentContainer}>
      {resolvedFavorites.length === 0 ? (
        <View style={styles.empty}>
          <Heart size={48} color="#6B7280" />
          <Text style={styles.emptyTitle}>No tienes favoritos</Text>
          <Text style={styles.emptyText}>Toca el corazón en cualquier devocional para guardarlo aquí.</Text>
        </View>
      ) : (
        resolvedFavorites.map(item => (
          <DevotionalCard
            key={item.key}
            entry={item.entry}
            isPremium={isPremium}
            onPremiumPress={handlePremiumPress}
          />
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Devocionales</Text>
        <Text style={styles.subtitle}>Guía espiritual para cada situación</Text>
        
        {/* Tabs horizontales */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'situations' && styles.activeTabButton]}
            onPress={() => setActiveTab('situations')}
          >
            <BookOpen size={18} color={activeTab === 'situations' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'situations' && styles.activeTabText]}>
              Situaciones
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'manhood' && styles.activeTabButton]}
            onPress={() => setActiveTab('manhood')}
          >
            <Shield size={18} color={activeTab === 'manhood' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'manhood' && styles.activeTabText]}>
              Hombría
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'favorites' && styles.activeTabButton]}
            onPress={() => setActiveTab('favorites')}
          >
            <Heart size={18} color={activeTab === 'favorites' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>
              Favoritos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={refreshContent}
            tintColor="#10B981"
          />
        }
      >
        {activeTab === 'situations' && renderSituations()}
        {activeTab === 'manhood' && renderManhood()}
        {activeTab === 'favorites' && renderFavorites()}

        {/* Banner para usuarios free */}
        {!isPremium && (
          <BannerAdWrapper placement="content_bottom" />
        )}

        {/* Espaciado para tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {selectedTopic && (
        <TopicModal
          visible={!!selectedTopic}
          onClose={() => setSelectedTopic(null)}
          topic={selectedTopic.name}
          entry={selectedTopic.entry}
        />
      )}
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
    marginBottom: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTabButton: {
    backgroundColor: '#10B981',
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Espacio para tab bar
  },
  contentContainer: {
    padding: 20,
  },
  topicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lockedCard: {
    opacity: 0.7,
    borderColor: '#10B98120',
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    flex: 1,
  },
  lockIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B98120',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicVerse: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#10B981',
    marginTop: 12,
    marginBottom: 8,
  },
  topicPreview: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  empty: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 20,
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
