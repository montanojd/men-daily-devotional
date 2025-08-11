import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppTheme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: AppTheme;
  resolved: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (t: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = 'app_theme_preference';

const lightPalette = {
  background: '#FFFFFF',
  surface: '#F3F4F6',
  surfaceAlt: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  border: '#D1D5DB',
  accent: '#F59E0B',
};

const darkPalette = {
  background: '#121212',
  surface: '#1F1F1F',
  surfaceAlt: '#272727',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  border: '#333333',
  accent: '#F59E0B',
};

export type Palette = typeof lightPalette;

export const useThemeColors = (): Palette => {
  const ctx = useTheme();
  return ctx.resolved === 'light' ? lightPalette : darkPalette;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>('system');
  const [system, setSystem] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystem(colorScheme);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setTheme(saved);
        }
      } catch {}
    })();
  }, []);

  const resolved: 'light' | 'dark' = useMemo(() => {
    if (theme === 'system') return (system === 'light' ? 'light' : 'dark');
    return theme;
  }, [theme, system]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(()=>{});
      return next;
    });
  };

  const setThemePersist = (t: AppTheme) => {
    setTheme(t);
    AsyncStorage.setItem(STORAGE_KEY, t).catch(()=>{});
  };

  const value: ThemeContextValue = { theme, resolved, toggleTheme, setTheme: setThemePersist };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
