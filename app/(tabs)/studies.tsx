import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useDevotionalContent } from '@/hooks/useDevotionalContent';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { TopicModal } from '@/components/TopicModal';
import { CategoryBadge } from '@/components/CategoryBadge';
import { DevotionalCard } from '@/components/DevotionalCard';
import { BannerAdWrapper } from '@/components/BannerAdWrapper';
import { 
  Lock, 
  Heart, 
  Shield, 
  BookOpen, 
  Brain,
  Briefcase,
  Users,
  Zap,
  Target,
  Star,
  Settings
} from 'lucide-react-native';
import { TopicEntry } from '@/types/devotional';

type TabType = 'categories' | 'manhood';

// Category definitions with icons and colors
const CATEGORIES = [
  { 
    id: 'emotions', 
    title: 'Emotions & Mental Health', 
    icon: Brain, 
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    description: 'Navigate anxiety, anger, and emotional challenges',
    topics: ['anxiety', 'anger', 'loneliness', 'depression']
  },
  { 
    id: 'relationships', 
    title: 'Relationships & Family', 
    icon: Heart, 
    color: '#EF4444',
    bgColor: '#FEF2F2',
    description: 'Marriage, family leadership, and connections',
    topics: ['marriage', 'leadership', 'purpose']
  },
  { 
    id: 'work', 
    title: 'Work & Career', 
    icon: Briefcase, 
    color: '#059669',
    bgColor: '#ECFDF5',
    description: 'Professional integrity and workplace wisdom',
    topics: ['work']
  },
  { 
    id: 'spiritual', 
    title: 'Spiritual Growth', 
    icon: Star, 
    color: '#7C3AED',
    bgColor: '#F3E8FF',
    description: 'Deepen your faith and spiritual disciplines',
    topics: ['temptation', 'purpose'],
    isPremium: true
  },
  { 
    id: 'leadership', 
    title: 'Leadership & Mentorship', 
    icon: Users, 
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    description: 'Leading others and being a godly influence',
    topics: ['leadership'],
    isPremium: true
  },
  { 
    id: 'challenge', 
    title: 'Personal Challenges', 
    icon: Target, 
    color: '#DC2626',
    bgColor: '#FEE2E2',
    description: 'Overcome temptations and build character',
    topics: ['temptation', 'addiction'],
    isPremium: true
  }
];

export default function StudiesScreen() {
  const router = useRouter();
  const { content, loading, refreshContent } = useDevotionalContent();
  const { isPremium } = usePremiumStatus();
  const [selectedTopic, setSelectedTopic] = useState<{ name: string; entry: TopicEntry } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  const handleCategoryPress = (category: any) => {
    if (category.isPremium && !isPremium) {
      // Animate then navigate to premium
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.push('/premium');
      });
      return;
    }
    setSelectedCategory(category.id);
  };

  const topics = Object.entries(content.topics);

  const renderCategories = () => (
    <View style={styles.categoriesContainer}>
      <Text style={styles.sectionTitle}>Explore Topics by Category</Text>
      <Text style={styles.sectionSubtitle}>Choose a category that speaks to your current needs</Text>
      
      <View style={styles.categoriesGrid}>
        {CATEGORIES.map((category) => {
          const isLocked = category.isPremium && !isPremium;
          const IconComponent = category.icon;
          
          return (
            <Animated.View
              key={category.id}
              style={[
                styles.categoryCardWrapper,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.categoryCard,
                  { backgroundColor: category.bgColor },
                  isLocked && styles.lockedCategoryCard
                ]}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}
              >
                {/* Lock overlay for premium categories */}
                {isLocked && (
                  <View style={styles.lockOverlay}>
                    <View style={styles.lockBadge}>
                      <Lock size={16} color="#FFFFFF" />
                    </View>
                  </View>
                )}
                
                <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
                  <IconComponent size={24} color="#FFFFFF" />
                </View>
                
                <Text style={[styles.categoryTitle, isLocked && styles.lockedText]}>
                  {category.title}
                </Text>
                
                <Text style={[styles.categoryDescription, isLocked && styles.lockedText]}>
                  {category.description}
                </Text>
                
                <View style={styles.categoryFooter}>
                  <Text style={[styles.topicCount, isLocked && styles.lockedText]}>
                    {category.topics.length} topics
                  </Text>
                  {isLocked && (
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Selected category topics */}
      {selectedCategory && (
        <View style={styles.selectedCategoryContainer}>
          <View style={styles.selectedCategoryHeader}>
            <Text style={styles.selectedCategoryTitle}>
              {CATEGORIES.find(c => c.id === selectedCategory)?.title}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.topicsGrid}>
            {topics
              .filter(([topicName]) => 
                CATEGORIES.find(c => c.id === selectedCategory)?.topics.includes(topicName)
              )
              .map(([topicName, entry]) => {
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
              })
            }
          </View>
        </View>
      )}
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bible Studies</Text>
        <Text style={styles.subtitle}>Discover biblical wisdom for every area of life</Text>
        
        {/* Tabs horizontales */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'categories' && styles.activeTabButton]}
            onPress={() => setActiveTab('categories')}
          >
            <BookOpen size={18} color={activeTab === 'categories' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>
              Categories
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'manhood' && styles.activeTabButton]}
            onPress={() => setActiveTab('manhood')}
          >
            <Shield size={18} color={activeTab === 'manhood' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'manhood' && styles.activeTabText]}>
              Manhood
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
        {activeTab === 'categories' && renderCategories()}
        {activeTab === 'manhood' && renderManhood()}

        {/* Banner for free users */}
        {!isPremium && (
          <BannerAdWrapper placement="content_bottom" />
        )}

        {/* Bottom spacing for tab bar */}
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
    paddingBottom: 120,
  },
  
  // Categories styles
  categoriesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  categoryCardWrapper: {
    width: '47%',
  },
  categoryCard: {
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  lockedCategoryCard: {
    opacity: 0.8,
  },
  lockOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  lockBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    padding: 6,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  categoryDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicCount: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#9CA3AF',
  },
  premiumBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  lockedText: {
    opacity: 0.6,
  },
  
  // Selected category styles
  selectedCategoryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedCategoryTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#6B7280',
  },
  topicsGrid: {
    gap: 12,
  },
  
  // Content container for manhood
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
  bottomSpacing: {
    height: 100,
  },
});
