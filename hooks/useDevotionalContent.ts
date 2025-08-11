import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DevotionalContent } from '@/types/devotional';

const CONTENT_URL = 'https://raw.githubusercontent.com/devotional-content/men-daily/main/content.json';
const CACHE_KEY = 'devotional_content';
const LAST_FETCH_KEY = 'last_fetch_timestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Fallback content for offline/error scenarios
const fallbackContent: DevotionalContent = {
  devotionals: {
    [new Date().toISOString().split('T')[0]]: {
      title: "Trust in His Plan",
      verse: "Jeremiah 29:11",
      text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope. Trust that God's timing is perfect, even when we cannot see the path ahead.",
      category: "daily",
      isPremium: false
    }
  },
  topics: {
    "anxiety": {
      verse: "Philippians 4:6-7",
      text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.",
      category: "emotions",
      isPremium: false
    },
    "leadership": {
      verse: "1 Timothy 4:12",
      text: "Let no one despise you for your youth, but set the believers an example in speech, in conduct, in love, in faith, in purity. True leadership starts with personal integrity and godly character.",
      category: "leadership",
      isPremium: true
    }
  },
  manhood: [
    {
      title: "Lead with Integrity",
      verse: "Proverbs 20:7",
      text: "The righteous man walks in his integrity; his children are blessed after him. Your character today shapes the legacy you leave tomorrow. Lead by example in every aspect of life.",
      category: "family",
      isPremium: false
    },
    {
      title: "Spiritual Warrior",
      verse: "Ephesians 6:11",
      text: "Put on the whole armor of God, that you may be able to stand against the schemes of the devil. Every man faces spiritual battles daily. Equip yourself with prayer, scripture, and fellowship.",
      category: "temptation",
      isPremium: true
    }
  ]
};

export function useDevotionalContent() {
  const [content, setContent] = useState<DevotionalContent>(fallbackContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedContent = await AsyncStorage.getItem(CACHE_KEY);
        const lastFetch = await AsyncStorage.getItem(LAST_FETCH_KEY);
        
        if (cachedContent && lastFetch) {
          const timeSinceLastFetch = Date.now() - parseInt(lastFetch);
          
          if (timeSinceLastFetch < CACHE_DURATION) {
            setContent(JSON.parse(cachedContent));
            setLoading(false);
            return;
          }
        }
      }

      // Fetch fresh content
      const response = await fetch(CONTENT_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const freshContent: DevotionalContent = await response.json();
      
      // Validate content structure
      if (!freshContent.devotionals || !freshContent.topics || !freshContent.manhood) {
        throw new Error('Invalid content structure');
      }

      // Cache the fresh content
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(freshContent));
      await AsyncStorage.setItem(LAST_FETCH_KEY, Date.now().toString());
      
      setContent(freshContent);
    } catch (err) {
      console.warn('Failed to fetch devotional content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
      
      // Try to use cached content as fallback
      const cachedContent = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedContent) {
        setContent(JSON.parse(cachedContent));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  return {
    content,
    loading,
    error,
    refreshContent: () => fetchContent(true)
  };
}