import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Favorite IDs will be strings: for daily devotionals use date key, for manhood use `manhood:index`, for topics use `topic:name`
const FAVORITES_KEY = 'favorite_entries_v1';

type FavoriteType = 'devotional' | 'manhood' | 'topic';

export interface FavoriteItem {
  id: string; // e.g., '2025-08-10' or 'manhood:0' or 'topic:anxiety'
  type: FavoriteType;
  createdAt: number;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const ids = favorites.map(f => f.id);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      if (raw) setFavorites(JSON.parse(raw));
      else setFavorites([]);
    } catch (e) {
      console.warn('Failed to load favorites', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleFavorite = useCallback(async (id: string, type: FavoriteType) => {
    try {
      setFavorites(prev => {
        const exists = prev.find(f => f.id === id);
        let next: FavoriteItem[];
        if (exists) next = prev.filter(f => f.id !== id);
        else next = [...prev, { id, type, createdAt: Date.now() }];
        AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(()=>{});
        return next;
      });
    } catch (e) {
      console.warn('Failed to toggle favorite', e);
    }
  }, []);

  return { favorites, ids, loading, toggleFavorite };
}
