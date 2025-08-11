import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock, Crown } from 'lucide-react-native';

interface PremiumLockProps {
  onUnlock: () => void;
  title?: string;
}

export function PremiumLock({ onUnlock, title = "Premium Content" }: PremiumLockProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Crown size={32} color="#F59E0B" />
        </View>
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Unlock all devotionals and men's content
        </Text>
        
        <TouchableOpacity style={styles.unlockButton} onPress={onUnlock}>
          <Lock size={16} color="#FFFFFF" />
          <Text style={styles.unlockText}>Unlock Premium</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000AA',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  content: {
    backgroundColor: '#1F1F1F',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 280,
    borderWidth: 1,
    borderColor: '#333333',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F59E0B20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  unlockButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unlockText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});