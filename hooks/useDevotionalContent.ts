import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DevotionalContent } from '@/types/devotional';

const CONTENT_URL = 'https://raw.githubusercontent.com/montanojd/men-daily-devotional/main/content.json';
const CACHE_KEY = 'devotional_content';
const LAST_FETCH_KEY = 'last_fetch_timestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Fallback content for offline/error scenarios
const fallbackContent: DevotionalContent = {
  devotionals: {
    [new Date().toISOString().split('T')[0]]: {
      title: "Leading Your Family",
      verse: "Joshua 24:15",
      text: "But as for me and my house, we will serve the Lord. Leadership begins at home. Show your family what it means to follow Christ through your actions, decisions, and daily walk.",
      category: "family",
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
    "anger": {
      verse: "Ephesians 4:26",
      text: "Be angry and do not sin; do not let the sun go down on your anger. Anger can be righteous, but it should never control you. Learn to channel your anger toward justice, not toward sin.",
      category: "emotions",
      isPremium: false
    },
    "loneliness": {
      verse: "Hebrews 13:5",
      text: "Keep your life free from love of money, and be content with what you have, for he has said, 'I will never leave you nor forsake you.' You are never alone. God is with you in every battle and every victory.",
      category: "emotions",
      isPremium: false
    },
    "depression": {
      verse: "Psalm 34:18",
      text: "The Lord is near to the brokenhearted and saves the crushed in spirit. Even in your darkest moments, God is close. His strength is made perfect in your weakness.",
      category: "emotions",
      isPremium: true
    },
    "leadership": {
      verse: "1 Timothy 4:12",
      text: "Let no one despise you for your youth, but set the believers an example in speech, in conduct, in love, in faith, in purity. True leadership starts with personal integrity and godly character.",
      category: "leadership",
      isPremium: true
    },
    "marriage": {
      verse: "Ephesians 5:25",
      text: "Husbands, love your wives, as Christ loved the church and gave himself up for her. Sacrificial love toward your wife is a reflection of Christ's love for the church.",
      category: "family",
      isPremium: true
    },
    "work": {
      verse: "Proverbs 14:23",
      text: "In all toil there is profit, but mere talk tends only to poverty. Honest work is a form of worship. Work with excellence as a testimony of your faith.",
      category: "work",
      isPremium: false
    },
    "temptation": {
      verse: "1 Peter 5:8",
      text: "Be sober-minded; be watchful. Your adversary the devil prowls around like a roaring lion, seeking someone to devour. Stay alert. The enemy looks for weak points. Strengthen yourself in the Word.",
      category: "temptation",
      isPremium: true
    },
    "purpose": {
      verse: "Jeremiah 29:11",
      text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope. God has a specific purpose for your life. Trust His plan.",
      category: "purpose",
      isPremium: true
    },
    "addiction": {
      verse: "1 Corinthians 6:19-20",
      text: "Or do you not know that your body is a temple of the Holy Spirit within you, whom you have from God? You are not your own, for you were bought with a price. So glorify God in your body.",
      category: "temptation",
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
    },
    {
      title: "Family Protector",
      verse: "1 Timothy 5:8",
      text: "But if anyone does not provide for his relatives, and especially for members of his household, he has denied the faith and is worse than an unbeliever. Protection includes physical, emotional, and spiritual provision.",
      category: "family",
      isPremium: false
    },
    {
      title: "Mentor and Disciple",
      verse: "Proverbs 27:17",
      text: "Iron sharpens iron, and one man sharpens another. You need wise mentors and should also mentor others. Growth comes from iron sharpening iron.",
      category: "leadership",
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