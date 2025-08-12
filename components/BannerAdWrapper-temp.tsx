import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props { 
  height?: number;
  placement?: 'content_bottom' | 'screen_bottom' | 'between_content';
  sticky?: boolean;
}

export function BannerAdWrapper({ 
  height = 60, 
  placement = 'content_bottom',
  sticky = false 
}: Props) {
  // Placeholder para compilación - se reemplazará en producción
  return (
    <View style={[
      styles.container,
      { height },
      sticky && styles.sticky
    ]}>
      {/* Banner Ad Placeholder */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sticky: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});
