import { CategoryType } from '@/types/devotional';

export const categoryColors: Record<CategoryType, { bg: string; text: string; border: string }> = {
  daily: {
    bg: '#1E3A8A20',
    text: '#3B82F6',
    border: '#3B82F610'
  },
  family: {
    bg: '#166F3620',
    text: '#10B981',
    border: '#10B98110'
  },
  temptation: {
    bg: '#DC262620',
    text: '#EF4444',
    border: '#EF444410'
  },
  leadership: {
    bg: '#7C2D9220',
    text: '#A855F7',
    border: '#A855F710'
  },
  emotions: {
    bg: '#EA580C20',
    text: '#F97316',
    border: '#F9731610'
  },
  work: {
    bg: '#0F766E20',
    text: '#14B8A6',
    border: '#14B8A610'
  },
  relationships: {
    bg: '#BE185D20',
    text: '#EC4899',
    border: '#EC489910'
  }
};

export function getCategoryColor(category: string) {
  return categoryColors[category as CategoryType] || categoryColors.daily;
}