// Leaderboard Screen Component
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const LeaderboardScreen = () => {
  const { theme } = useTheme();
  const [leaderboardData, setLeaderboardData] = useState([
    { id: 1, name: 'DriverPro', earnings: 125000000000, trips: 125, rating: 4.9, isCurrentUser: false },
    { id: 2, name: 'SpeedDriver', earnings: 98000000000, trips: 98, rating: 4.8, isCurrentUser: false },
    { id: 3, name: 'SafeRider', earnings: 87000000000, trips: 87, rating: 4.7, isCurrentUser: false },
    { id: 4, name: 'You', earnings: 75000000000, trips: 75, rating: 4.6, isCurrentUser: true },
    { id: 5, name: 'FastFare', earnings: 68000000000, trips: 68, rating: 4.5, isCurrentUser: false },
    { id: 6, name: 'EcoDriver', earnings: 59000000000, trips: 59, rating: 4.4, isCurrentUser: false },
    { id: 7, name: 'TopTrip', earnings: 52000000000, trips: 52, rating: 4.3, isCurrentUser: false },
    { id: 8, name: 'BestRating', earnings: 48000000000, trips: 48, rating: 4.9, isCurrentUser: false },
  ]);

  const handleViewProfile = (id: number) => {
    const driver = leaderboardData.find(d => d.id === id);
    if (driver) {
      Alert.alert('View Profile', `Viewing profile for ${driver.name}`);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme === 'light' ? '#f5f5f5' : '#1a1a1a' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme === 'light' ? '#000' : '#fff' }]}>Leaderboard</Text>
        <Text style={[styles.subtitle, { color: theme === 'light' ? '#666' : '#aaa' }]}>Top drivers in the network</Text>
      </View>
      
      <View style={styles.leaderboardContainer}>
        {leaderboardData.map((driver, index) => (
          <TouchableOpacity 
            key={driver.id} 
            style={[
              styles.leaderboardItem, 
              { 
                backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d',
                borderColor: driver.isCurrentUser ? '#007AFF' : 'transparent',
                borderWidth: driver.isCurrentUser ? 2 : 0,
              }
            ]}
            onPress={() => handleViewProfile(driver.id)}
          >
            <View style={styles.rankContainer}>
              <Text style={[styles.rank, { color: index < 3 ? '#FFD700' : theme === 'light' ? '#000' : '#fff' }]}>
                #{index + 1}
              </Text>
            </View>
            
            <View style={styles.driverInfo}>
              <Text style={[styles.driverName, { color: theme === 'light' ? '#000' : '#fff' }]}>
                {driver.name}
              </Text>
              <View style={styles.driverStats}>
                <Text style={[styles.stat, { color: theme === 'light' ? '#666' : '#aaa' }]}>
                  {driver.trips} trips
                </Text>
                <Text style={[styles.stat, { color: theme === 'light' ? '#666' : '#aaa' }]}>
                  {driver.rating}★
                </Text>
              </View>
            </View>
            
            <View style={styles.earningsContainer}>
              <Text style={[styles.earnings, { color: theme === 'light' ? '#000' : '#fff' }]}>
                {driver.earnings / 1000000000} SOL
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={[styles.section, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
        <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#000' : '#fff' }]}>Weekly Rankings</Text>
        <View style={styles.rankingsContainer}>
          <View style={styles.rankItem}>
            <Text style={[styles.rankText, { color: theme === 'light' ? '#000' : '#fff' }]}>Top 10 Drivers</Text>
            <Text style={[styles.rankValue, { color: theme === 'light' ? '#666' : '#aaa' }]}>1250+ trips</Text>
          </View>
          <View style={styles.rankItem}>
            <Text style={[styles.rankText, { color: theme === 'light' ? '#000' : '#fff' }]}>Top 50 Drivers</Text>
            <Text style={[styles.rankValue, { color: theme === 'light' ? '#666' : '#aaa' }]}>500+ trips</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 5,
  },
  leaderboardContainer: {
    padding: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rankContainer: {
    marginRight: 15,
  },
  rank: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  driverStats: {
    flexDirection: 'row',
    marginTop: 5,
  },
  stat: {
    fontSize: 12,
    marginRight: 10,
  },
  earningsContainer: {
    alignItems: 'flex-end',
  },
  earnings: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    margin: 20,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  rankingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rankItem: {
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  rankValue: {
    fontSize: 12,
    marginTop: 5,
  },
});

export default LeaderboardScreen;