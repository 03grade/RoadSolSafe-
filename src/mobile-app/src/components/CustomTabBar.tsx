import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../styles/fonts';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  
  // Calculate responsive dimensions
  const isSmallScreen = screenWidth < 375; // iPhone SE and smaller
  const isLargeScreen = screenWidth > 414; // iPhone Pro Max and larger
  const tabBarHeight = Platform.OS === 'android' ? Math.max(60, insets.bottom + 50) : 60;
  const horizontalMargin = isSmallScreen ? 8 : 16;
  const iconSize = isSmallScreen ? 20 : 24;
  const fontSize = isSmallScreen ? fonts.caption.fontSize : fonts.label.fontSize;
  
  return (
    <View style={[
      styles.tabBar, 
      { 
        paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 8) : 8,
        height: tabBarHeight,
        marginHorizontal: horizontalMargin,
      }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined 
          ? options.tabBarLabel 
          : options.title !== undefined 
          ? options.title 
          : route.name;

        const labelText = typeof label === 'string' ? label : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const getIconName = (routeName: string, focused: boolean) => {
          switch (routeName) {
            case 'Quests':
              return focused ? 'trophy' : 'trophy-outline';
            case 'Wallet':
              return focused ? 'wallet' : 'wallet-outline';
            case 'Home':
              return focused ? 'home' : 'home-outline';
            case 'Leaderboard':
              return focused ? 'bar-chart' : 'bar-chart-outline';
            case 'Friends':
              return focused ? 'people' : 'people-outline';
            default:
              return 'help-outline';
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[
              styles.tabItem,
              isFocused && styles.tabItemActive,
              { minWidth: isSmallScreen ? 36 : 44 }
            ]}
          >
            <View style={styles.tabContent}>
              <Ionicons 
                name={getIconName(route.name, isFocused)} 
                size={iconSize} 
                color="#FFFFFF" 
                style={[
                  styles.tabIcon,
                  isFocused && styles.tabIconActive
                ]}
              />
              {isFocused && (
                <Text style={[styles.tabLabel, { fontSize }]}>{labelText}</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1F2328',
    borderRadius: 20,
    marginBottom: Platform.OS === 'android' ? 0 : 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: Platform.OS === 'android' ? 8 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000000' : 'transparent',
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: -2 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
    shadowRadius: Platform.OS === 'ios' ? 4 : 0,
    // Ensure minimum height for Android
    minHeight: Platform.OS === 'android' ? 60 : 60,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    minWidth: 44,
    // Ensure touch targets are accessible
    minHeight: 44,
  },
  tabItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flex: 1,
    maxWidth: 120,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    marginRight: 0,
  },
  tabIconActive: {
    marginRight: 6,
  },
  tabLabel: {
    ...fonts.tab,
    color: '#FFFFFF',
    flexShrink: 0,
  },
});
