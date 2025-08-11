export interface DevotionalEntry {
  title: string;
  verse: string;
  text: string;
  category: string;
  isPremium: boolean;
}

export interface TopicEntry {
  verse: string;
  text: string;
  category: string;
  isPremium: boolean;
}

export interface ManhoodEntry {
  title: string;
  verse: string;
  text: string;
  category: string;
  isPremium: boolean;
}

export interface DevotionalContent {
  devotionals: Record<string, DevotionalEntry>;
  topics: Record<string, TopicEntry>;
  manhood: ManhoodEntry[];
}

export type CategoryType = 'daily' | 'family' | 'temptation' | 'leadership' | 'emotions' | 'work' | 'relationships';