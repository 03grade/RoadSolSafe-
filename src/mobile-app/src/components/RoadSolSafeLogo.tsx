import React from 'react';
import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';

interface RoadSolSafeLogoProps {
  /** logo size in pixels */
  size?: number;
  /** image source: require('./logo.png') or { uri: 'https://...' } */
  source?: ImageSourcePropType;
  /** optional corner radius */
  borderRadius?: number;
}

const RoadSolSafeLogo: React.FC<RoadSolSafeLogoProps> = ({
  size = 60,
  source = require('../../assets/logo.png'), // Path from src/components to mobile-app/assets
  borderRadius = 0,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={source}
        style={{
          width: size,
          height: size,
          resizeMode: 'contain',
          borderRadius,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RoadSolSafeLogo;
