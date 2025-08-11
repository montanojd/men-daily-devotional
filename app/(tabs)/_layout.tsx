import { Tabs } from 'expo-router';
import { Calendar, Heart, Shield, Crown, Sun, Moon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { StickyBannerAd } from '@/components/StickyBannerAd';

export default function TabLayout() {
  const { resolved, toggleTheme } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerRight: () => (
            <View style={{ paddingRight: 16 }}>
              <Pressable
                onPress={toggleTheme}
                style={{ padding: 8, borderRadius: 24, backgroundColor: resolved === 'dark' ? '#1F2937' : '#F3F4F6' }}
              >
                {resolved === 'dark' ? <Sun size={20} color="#F59E0B" /> : <Moon size={20} color="#F59E0B" />}
              </Pressable>
            </View>
          ),
          tabBarStyle: {
            backgroundColor: resolved === 'dark' ? '#1F1F1F' : '#FFFFFF',
            borderTopColor: resolved === 'dark' ? '#333333' : '#E5E7EB',
            borderTopWidth: 1,
            height: 88,
            paddingBottom: 32,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#F59E0B',
          tabBarInactiveTintColor: resolved === 'dark' ? '#6B7280' : '#9CA3AF',
          tabBarLabelStyle: {
            fontFamily: 'Inter-Medium',
            fontSize: 12,
            marginTop: 4,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ size, color }) => (
              <Calendar size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="situations"
          options={{
            title: 'Situations',
            tabBarIcon: ({ size, color }) => (
              <Heart size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mens-guide"
          options={{
            title: "Men's Guide",
            tabBarIcon: ({ size, color }) => (
              <Shield size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favorites',
            tabBarIcon: ({ size, color }) => (
              <Heart size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="premium"
          options={{
            title: 'Premium',
            tabBarIcon: ({ size, color }) => (
              <Crown size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      
      {/* Banner fijo en todas las pantallas para máxima presión hacia premium */}
      <StickyBannerAd />
    </View>
  );
}