import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { X, Heart } from 'lucide-react-native';
import { TopicEntry } from '@/types/devotional';
import { CategoryBadge } from './CategoryBadge';
import { useFavorites } from '@/hooks/useFavorites';

interface TopicModalProps {
  visible: boolean;
  onClose: () => void;
  topic: string;
  entry: TopicEntry;
}

export function TopicModal({ visible, onClose, topic, entry }: TopicModalProps) {
  const { ids, toggleFavorite } = useFavorites();
  const favoriteId = `topic:${topic}`;
  const isFavorited = ids.includes(favoriteId);

  const handleFavoritePress = () => {
    toggleFavorite(favoriteId, 'topic');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{topic.charAt(0).toUpperCase() + topic.slice(1)}</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleFavoritePress} style={styles.favoriteButton}>
                <Heart 
                  size={20} 
                  color={isFavorited ? '#EF4444' : '#9CA3AF'} 
                  fill={isFavorited ? '#EF4444' : 'transparent'} 
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <CategoryBadge category={entry.category} />

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.verse}>{entry.verse}</Text>
            <Text style={styles.text}>{entry.text}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000CC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  favoriteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#374151',
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#FFFFFF',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    marginTop: 16,
  },
  verse: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#F59E0B',
    marginBottom: 16,
  },
  text: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#E5E7EB',
    lineHeight: 24,
  },
});