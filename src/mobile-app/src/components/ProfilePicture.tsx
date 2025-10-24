import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

export type ProfilePictureType = 'cat' | 'robot' | 'robot2' | 'fox' | 'bear' | 'penguin' | 'fox2' | 'rabbit';

interface ProfilePictureProps {
  type: ProfilePictureType;
  size?: number;
  style?: any;
}

const profilePictures = {
  cat: require('../assets/profile-pictures/cat.png'),
  robot: require('../assets/profile-pictures/robot.png'),
  robot2: require('../assets/profile-pictures/robot2.png'),
  fox: require('../assets/profile-pictures/fox.png'),
  bear: require('../assets/profile-pictures/bear.png'),
  penguin: require('../assets/profile-pictures/penguin.png'),
  fox2: require('../assets/profile-pictures/fox2.png'),
  rabbit: require('../assets/profile-pictures/rabbit.png'),
};

export const ProfilePicture: React.FC<ProfilePictureProps> = ({ 
  type, 
  size = 40, 
  style 
}) => {
  const imageSource = profilePictures[type];
  
  if (!imageSource) {
    // Fallback to default icon if image not found
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <Ionicons name="person" size={size * 0.6} color={theme.colors.text} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image 
        source={imageSource} 
        style={[styles.image, { width: size, height: size }]}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    borderRadius: 50,
  },
});
