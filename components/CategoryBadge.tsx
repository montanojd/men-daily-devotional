import { View, Text, StyleSheet } from 'react-native';
import { getCategoryColor } from '@/utils/categoryColors';

interface CategoryBadgeProps {
  category: string;
  size?: 'small' | 'medium';
}

export function CategoryBadge({ category, size = 'medium' }: CategoryBadgeProps) {
  const colors = getCategoryColor(category);
  const isSmall = size === 'small';

  return (
    <View style={[
      styles.badge,
      { 
        backgroundColor: colors.bg,
        borderColor: colors.border,
        paddingHorizontal: isSmall ? 8 : 12,
        paddingVertical: isSmall ? 4 : 6
      }
    ]}>
      <Text style={[
        styles.text,
        { 
          color: colors.text,
          fontSize: isSmall ? 12 : 14
        }
      ]}>
        {category.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});