import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DevotionalEntry, ManhoodEntry } from '@/types/devotional';
import { CategoryBadge } from './CategoryBadge';
import { PremiumLock } from './PremiumLock';
import { Heart } from 'lucide-react-native';
import { useFavorites } from '@/hooks/useFavorites';

interface DevotionalCardProps {
  entry: DevotionalEntry | ManhoodEntry;
  showDate?: boolean;
  date?: string;
  isPremium: boolean;
  onPremiumPress: () => void;
  onPress?: () => void;
  onInteraction?: () => void; // Nueva prop para tracking de interacciones
  favoriteId?: string; // e.g., '2025-08-10' or 'manhood:0' or 'topic:anxiety'
  favoriteType?: 'devotional' | 'manhood' | 'topic';
}

export function DevotionalCard({ 
  entry, 
  showDate, 
  date, 
  isPremium, 
  onPremiumPress,
  onPress,
  onInteraction,
  favoriteId,
  favoriteType = 'devotional'
}: DevotionalCardProps) {
  const isLocked = entry.isPremium && !isPremium;
  const { ids, toggleFavorite } = useFavorites();
  const isFavorited = favoriteId ? ids.includes(favoriteId) : false;

  const handleFavoritePress = () => {
    if (favoriteId) {
      toggleFavorite(favoriteId, favoriteType);
      onInteraction?.(); // Track interaction
    }
  };

  const handleCardPress = () => {
    onPress?.();
    onInteraction?.(); // Track interaction
  };

  return (
    <TouchableOpacity 
      style={[styles.card, isLocked && styles.lockedCard]} 
      onPress={handleCardPress}
      disabled={isLocked}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {showDate && date && (
            <Text style={styles.date}>
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          )}
          <CategoryBadge category={entry.category} />
        </View>
        {favoriteId && (
          <TouchableOpacity onPress={handleFavoritePress} style={styles.favoriteButton}>
            <Heart 
              size={20} 
              color={isFavorited ? '#EF4444' : '#6B7280'} 
              fill={isFavorited ? '#EF4444' : 'transparent'} 
            />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title}>{entry.title}</Text>
      <Text style={styles.verse}>{entry.verse}</Text>
      <Text style={styles.text} numberOfLines={isLocked ? 2 : undefined}>
        {entry.text}
      </Text>

      {isLocked && (
        <PremiumLock onUnlock={onPremiumPress} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
    position: 'relative',
  },
  lockedCard: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginRight: 12,
  },
  favoriteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#374151',
  },
  date: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 8,
  },
  verse: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#F59E0B',
    marginBottom: 12,
  },
  text: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#E5E7EB',
    lineHeight: 24,
  },
});