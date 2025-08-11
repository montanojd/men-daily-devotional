import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { BannerAdComponent } from '../../monetization-ios/components/ads/BannerAd';

interface Props {
  placement?: 'content_bottom' | 'screen_bottom' | 'between_content';
}

/**
 * Banner fijo que se pega al fondo de la pantalla para máxima presión hacia premium
 * Solo se muestra si el usuario NO es premium
 */
export function StickyBannerAd({ placement = 'screen_bottom' }: Props) {
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremiumStatus();

  // No mostrar si es premium
  if (isPremium) {
    return null;
  }

  return (
    <View style={[
      styles.container,
      { paddingBottom: insets.bottom }
    ]}>
      <BannerAdComponent placement={placement} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 12, // Para Android - máxima elevación
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
