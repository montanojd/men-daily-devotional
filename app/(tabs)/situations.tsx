import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useDevotionalContent } from '@/hooks/useDevotionalContent';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { TopicModal } from '@/components/TopicModal';
import { CategoryBadge } from '@/components/CategoryBadge';
import { BannerAdWrapper } from '@/components/BannerAdWrapper';
import { Lock } from 'lucide-react-native';
import { TopicEntry } from '@/types/devotional';

export default function SituationsScreen() {
  const router = useRouter();
  const { content, loading, refreshContent } = useDevotionalContent();
  const { isPremium } = usePremiumStatus();
  const [selectedTopic, setSelectedTopic] = useState<{ name: string; entry: TopicEntry } | null>(null);

  const handleTopicPress = (topicName: string, entry: TopicEntry) => {
    if (entry.isPremium && !isPremium) {
      router.push('/premium');
      return;
    }
    setSelectedTopic({ name: topicName, entry });
  };

  const topics = Object.entries(content.topics);

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
          <Text style={styles.title}>Life Situations</Text>
          <Text style={styles.subtitle}>
            Find biblical guidance for every challenge
          </Text>
        </View>

        <View style={styles.topicsContainer}>
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
                    {topicName.charAt(0).toUpperCase() + topicName.slice(1)}
                  </Text>
                  {isLocked && (
                    <View style={styles.lockIcon}>
                      <Lock size={16} color="#F59E0B" />
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
        
        {/* Banner persistente para maximizar presión hacia premium */}
        <BannerAdWrapper placement="screen_bottom" />
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
  topicsContainer: {
    padding: 24,
    paddingTop: 8,
    gap: 16,
  },
  topicCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  lockedCard: {
    opacity: 0.7,
    borderColor: '#F59E0B30',
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
    color: '#FFFFFF',
    flex: 1,
  },
  lockIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F59E0B20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicVerse: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#F59E0B',
    marginTop: 12,
    marginBottom: 8,
  },
  topicPreview: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
});