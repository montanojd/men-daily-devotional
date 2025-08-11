import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COMPLETED_KEY = 'devotional_completed_dates'; // JSON array of YYYY-MM-DD

function todayKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function calcStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const key = todayKey(cursor);
    if (set.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function useReadingProgress() {
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const today = todayKey();
  const isTodayCompleted = completedDates.includes(today);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const raw = await AsyncStorage.getItem(COMPLETED_KEY);
      if (raw) {
        const arr: string[] = JSON.parse(raw);
        setCompletedDates(arr);
        setStreak(calcStreak(arr));
      } else {
        setCompletedDates([]);
        setStreak(0);
      }
    } catch (e) {
      console.warn('Failed to load reading progress', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const markTodayCompleted = useCallback(async () => {
    try {
      if (isTodayCompleted) return;
      const next = [...completedDates, today];
      await AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify(next));
      setCompletedDates(next);
      setStreak(calcStreak(next));
    } catch (e) {
      console.warn('Failed to mark completed', e);
    }
  }, [completedDates, isTodayCompleted, today]);

  useEffect(() => {
    load();
  }, [load]);

  return { streak, isTodayCompleted, markTodayCompleted, loading };
}
