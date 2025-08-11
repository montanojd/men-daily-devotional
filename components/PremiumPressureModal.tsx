import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Crown, X } from 'lucide-react-native';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';

interface Props {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  message?: string;
  level?: 'soft' | 'medium' | 'aggressive';
}

const MESSAGES = {
  soft: {
    title: "¿Cansado de los anuncios?",
    subtitle: "Únete a Premium y disfruta sin interrupciones",
    buttonText: "Probar Premium",
  },
  medium: {
    title: "Interrupciones constantes, ¿verdad?",
    subtitle: "Premium elimina TODOS los anuncios para siempre",
    buttonText: "¡Quiero Premium YA!",
  },
  aggressive: {
    title: "¡Suficientes anuncios por hoy!",
    subtitle: "Libérate de esta molestia constante con Premium",
    buttonText: "¡ELIMINAR ANUNCIOS!",
  }
};

/**
 * Modal que aparece después de mostrar varios anuncios para presionar hacia premium
 * Diseñado para ser molesto e insistente para maximizar conversiones
 */
export function PremiumPressureModal({
  visible,
  onClose,
  onUpgrade,
  level = 'medium'
}: Props) {
  const { isPremium } = usePremiumStatus();
  const [scaleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 7,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  // No mostrar si ya es premium
  if (isPremium) {
    return null;
  }

  const messages = MESSAGES[level];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.modal,
            level === 'aggressive' && styles.aggressiveModal,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Crown size={48} color="#F59E0B" />
          </View>

          <Text style={[
            styles.title,
            level === 'aggressive' && styles.aggressiveTitle
          ]}>
            {messages.title}
          </Text>

          <Text style={styles.subtitle}>
            {messages.subtitle}
          </Text>

          <View style={styles.benefits}>
            <Text style={styles.benefit}>✓ Sin anuncios molestos</Text>
            <Text style={styles.benefit}>✓ Acceso completo al contenido</Text>
            <Text style={styles.benefit}>✓ Experiencia espiritual sin interrupciones</Text>
          </View>

          <TouchableOpacity 
            style={[
              styles.upgradeButton,
              level === 'aggressive' && styles.aggressiveButton
            ]} 
            onPress={onUpgrade}
          >
            <Text style={[
              styles.upgradeButtonText,
              level === 'aggressive' && styles.aggressiveButtonText
            ]}>
              {messages.buttonText}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterButton} onPress={onClose}>
            <Text style={styles.laterButtonText}>
              {level === 'aggressive' ? 'Seguir sufriendo anuncios' : 'Tal vez más tarde'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1F1F1F',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  aggressiveModal: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F59E0B20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  aggressiveTitle: {
    fontSize: 22,
    color: '#F59E0B',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  benefits: {
    width: '100%',
    marginBottom: 24,
  },
  benefit: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#10B981',
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  aggressiveButton: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  upgradeButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  aggressiveButtonText: {
    fontSize: 18,
    letterSpacing: 0.5,
  },
  laterButton: {
    paddingVertical: 8,
  },
  laterButtonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
