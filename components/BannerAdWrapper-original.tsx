import React from 'react';
import { View, StyleSheet } from 'react-native';
// Import enhanced banner ad from monetization module
// Local no-op banner to avoid external dependency during build
const BannerAdComponent = ({ placement }: { placement?: string }) => null;

interface Props { 
  height?: number;
  placement?: 'content_bottom' | 'screen_bottom' | 'between_content';
  sticky?: boolean; // Para banners que se pegan al fondo
}

export function BannerAdWrapper({ 
  height = 60, 
  placement = 'content_bottom',
  sticky = false 
}: Props) {
  // Si es screen_bottom, aplicamos sticky por defecto para máxima presión
  const isSticky = sticky || placement === 'screen_bottom';
  
  return (
    <View style={[
      styles.container, 
      { height },
      isSticky && styles.stickyContainer
    ]}> 
      <BannerAdComponent placement={placement} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    width: '100%', 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  stickyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8, // Para Android
  }
});
