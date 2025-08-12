import { Tabs } from 'expo-router';
import { Calendar, Book, Heart, Crown, Settings, Sun, Moon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const { resolved, toggleTheme } = useTheme();
  const router = useRouter();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerTitle: '',
        headerRight: () => (
          <View style={{ flexDirection: 'row', paddingRight: 16, gap: 8 }}>
            <Pressable
              onPress={toggleTheme}
              style={{ padding: 8, borderRadius: 24, backgroundColor: resolved === 'dark' ? '#1F2937' : '#F3F4F6' }}
            >
              {resolved === 'dark' ? <Sun size={20} color="#10B981" /> : <Moon size={20} color="#10B981" />}
            </Pressable>
            <Pressable
              onPress={() => router.push('/settings')}
              style={{ padding: 8, borderRadius: 24, backgroundColor: resolved === 'dark' ? '#1F2937' : '#F3F4F6' }}
            >
              <Settings size={20} color="#10B981" />
            </Pressable>
          </View>
        ),
        tabBarStyle: {
          backgroundColor: resolved === 'dark' ? '#1F1F1F' : '#FFFFFF',
          borderTopColor: resolved === 'dark' ? '#333333' : '#E5E7EB',
          borderTopWidth: 1,
          height: 90,
          paddingBottom: 30,
          paddingTop: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: resolved === 'dark' ? '#6B7280' : '#9CA3AF',
        tabBarLabelStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: 11,
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
        name="studies"
        options={{
          title: 'Studies',
          tabBarIcon: ({ size, color }) => (
            <Book size={size} color={color} />
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
  );
}