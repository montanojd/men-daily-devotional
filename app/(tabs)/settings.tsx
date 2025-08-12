import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useTheme } from '@/theme/ThemeProvider';
import { 
  Crown, 
  Bell, 
  Moon, 
  Sun, 
  Star, 
  Share, 
  Mail, 
  Shield, 
  Info,
  ChevronRight,
  Heart
} from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { isPremium } = usePremiumStatus();
  const { resolved, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);

  const handlePremiumPress = () => {
    router.push('/premium');
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate This App',
      'Would you like to rate "Daily Devotional for Men" on the App Store?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Rate App', onPress: () => console.log('Open App Store rating') }
      ]
    );
  };

  const handleShareApp = () => {
    Alert.alert(
      'Share App',
      'Share "Daily Devotional for Men" with other men in your life',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share', onPress: () => console.log('Open share dialog') }
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Need help? We\'re here to assist you.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email Support', onPress: () => console.log('Open email') }
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showChevron = true, 
    rightComponent,
    isPremiumFeature = false 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showChevron?: boolean;
    rightComponent?: React.ReactNode;
    isPremiumFeature?: boolean;
  }) => (
    <TouchableOpacity 
      style={[styles.settingItem, isPremiumFeature && !isPremium && styles.premiumItem]} 
      onPress={onPress}
      disabled={isPremiumFeature && !isPremium}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, isPremiumFeature && !isPremium && styles.premiumIconContainer]}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, isPremiumFeature && !isPremium && styles.disabledText]}>
            {title}
            {isPremiumFeature && !isPremium && ' 👑'}
          </Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showChevron && !rightComponent && (
          <ChevronRight size={20} color="#9CA3AF" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your devotional experience</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Section */}
        {!isPremium && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.premiumBanner} onPress={handlePremiumPress}>
              <Crown size={24} color="#F59E0B" />
              <View style={styles.premiumTextContainer}>
                <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                <Text style={styles.premiumSubtitle}>
                  Unlock all devotionals and remove ads
                </Text>
              </View>
              <ChevronRight size={20} color="#F59E0B" />
            </TouchableOpacity>
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <SettingItem
            icon={<Crown size={20} color={isPremium ? "#F59E0B" : "#9CA3AF"} />}
            title={isPremium ? "Premium Active" : "Upgrade to Premium"}
            subtitle={isPremium ? "Thank you for your support!" : "Unlock all content and features"}
            onPress={handlePremiumPress}
          />
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <SettingItem
            icon={<Bell size={20} color="#10B981" />}
            title="Push Notifications"
            subtitle="Receive daily devotional reminders"
            showChevron={false}
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#E5E7EB", true: "#10B98140" }}
                thumbColor={notificationsEnabled ? "#10B981" : "#9CA3AF"}
              />
            }
            isPremiumFeature={true}
          />
          
          <SettingItem
            icon={<Sun size={20} color="#F59E0B" />}
            title="Daily Reminder"
            subtitle="Get reminded to read your daily devotional"
            showChevron={false}
            rightComponent={
              <Switch
                value={dailyReminder}
                onValueChange={setDailyReminder}
                trackColor={{ false: "#E5E7EB", true: "#F59E0B40" }}
                thumbColor={dailyReminder ? "#F59E0B" : "#9CA3AF"}
                disabled={!notificationsEnabled}
              />
            }
            isPremiumFeature={true}
          />
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <SettingItem
            icon={resolved === 'dark' ? <Moon size={20} color="#6366F1" /> : <Sun size={20} color="#F59E0B" />}
            title="Theme"
            subtitle={resolved === 'dark' ? "Dark mode" : "Light mode"}
            onPress={toggleTheme}
            showChevron={false}
            rightComponent={
              <Switch
                value={resolved === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: "#E5E7EB", true: "#6366F140" }}
                thumbColor={resolved === 'dark' ? "#6366F1" : "#9CA3AF"}
              />
            }
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Feedback</Text>
          
          <SettingItem
            icon={<Star size={20} color="#F59E0B" />}
            title="Rate This App"
            subtitle="Help others discover this app"
            onPress={handleRateApp}
          />
          
          <SettingItem
            icon={<Share size={20} color="#3B82F6" />}
            title="Share App"
            subtitle="Tell your friends about this devotional"
            onPress={handleShareApp}
          />
          
          <SettingItem
            icon={<Mail size={20} color="#EF4444" />}
            title="Contact Support"
            subtitle="Get help or send feedback"
            onPress={handleContactSupport}
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <SettingItem
            icon={<Info size={20} color="#6B7280" />}
            title="Privacy Policy"
            onPress={() => console.log('Open privacy policy')}
          />
          
          <SettingItem
            icon={<Shield size={20} color="#6B7280" />}
            title="Terms of Service"
            onPress={() => console.log('Open terms')}
          />
          
          <SettingItem
            icon={<Heart size={20} color="#EF4444" />}
            title="About"
            subtitle="Daily Devotional for Men v1.0.0"
            showChevron={false}
          />
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    padding: 20,
    paddingTop: 80,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  premiumBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B40',
  },
  premiumTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  premiumTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#92400E',
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#A16207',
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  premiumItem: {
    opacity: 0.6,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  premiumIconContainer: {
    backgroundColor: '#F59E0B20',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 2,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  settingSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
});
