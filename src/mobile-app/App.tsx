// Navigation Configuration
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView, StyleSheet } from 'react-native';
import ProfileScreen from './screens/ProfileScreen';
import QuestsScreen from './screens/QuestsScreen';
import MapScreen from './screens/MapScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import SocialsScreen from './screens/SocialsScreen';
import { ThemeProvider } from './context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main App Component
const App = () => {
  return (
    <ThemeProvider>
      <SafeAreaView style={styles.container}>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarActiveTintColor: '#007AFF',
              tabBarInactiveTintColor: 'gray',
            })}
          >
            <Tab.Screen name="Profile" component={ProfileScreen} />
            <Tab.Screen name="Quests" component={QuestsScreen} />
            <Tab.Screen name="Map" component={MapScreen} />
            <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Tab.Screen name="Socials" component={SocialsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default App;