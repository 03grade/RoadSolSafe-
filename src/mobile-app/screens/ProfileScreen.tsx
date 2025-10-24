// Profile Screen Component
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import TripDataService, { TripSummary, TripHistoryItem } from '../services/TripDataService';
import WalletConnection from '../components/WalletConnection';
import walletService, { WalletInfo } from '../services/WalletService';

const ProfileScreen = () => {
  const { theme } = useTheme();
  const [driverStats, setDriverStats] = useState({
    totalTrips: 0,
    totalEarnings: 0,
    totalDistance: 0,
    avgRating: 0,
    weeklyEarnings: 0,
    badges: 0,
    nfts: 0,
  });
  
  const [latestTrip, setLatestTrip] = useState<TripSummary | null>(null);
  const [tripHistory, setTripHistory] = useState<TripHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        setLoading(true);
        const driverId = 'driver_test_001'; // TODO: Replace with actual driver ID
        
        // Fetch latest trip and trip history
        const [latestTripData, historyData] = await Promise.all([
          TripDataService.getLatestTrip(driverId),
          TripDataService.getTripHistory(driverId)
        ]);
        
        setLatestTrip(latestTripData);
        setTripHistory(historyData);
        
        // Update driver stats based on real data
        if (historyData.length > 0) {
          const totalTrips = historyData.length;
          const totalDistance = historyData.reduce((sum, trip) => sum + trip.distance, 0);
          const avgRating = historyData.reduce((sum, trip) => sum + trip.rating, 0) / totalTrips;
          
          setDriverStats({
            totalTrips,
            totalEarnings: totalTrips * 1000000000, // 1 SOL per trip (placeholder)
            totalDistance,
            avgRating: avgRating || 0,
            weeklyEarnings: Math.min(totalTrips, 7) * 1000000000, // Weekly cap
            badges: Math.floor(totalTrips / 10), // Badge every 10 trips
            nfts: Math.floor(totalTrips / 50), // NFT every 50 trips
          });
        }
      } catch (error) {
        console.error('Error fetching driver data:', error);
        // Fallback to placeholder data
        setDriverStats({
          totalTrips: 125,
          totalEarnings: 125000000000,
          totalDistance: 1250,
          avgRating: 4.8,
          weeklyEarnings: 15000000000,
          badges: 12,
          nfts: 3,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDriverData();
  }, []);

  const handleClaimRewards = () => {
    if (!wallet) {
      Alert.alert('Wallet Required', 'Please connect your wallet first to claim rewards.');
      return;
    }
    Alert.alert('Claim Rewards', 'Would you like to claim your weekly rewards?');
  };

  const handleWalletConnected = (connectedWallet: WalletInfo) => {
    setWallet(connectedWallet);
  };

  const handleWalletDisconnected = () => {
    setWallet(null);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme === 'light' ? '#f5f5f5' : '#1a1a1a' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme === 'light' ? '#000' : '#fff' }]}>Driver Profile</Text>
      </View>
      
      {/* Wallet Connection */}
      <WalletConnection 
        onWalletConnected={handleWalletConnected}
        onWalletDisconnected={handleWalletDisconnected}
      />
      
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
          <Text style={[styles.statValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
            {driverStats.totalTrips}
          </Text>
          <Text style={[styles.statLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Total Trips</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
          <Text style={[styles.statValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
            {driverStats.totalEarnings / 1000000000} SOL
          </Text>
          <Text style={[styles.statLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Total Earnings</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
          <Text style={[styles.statValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
            {driverStats.totalDistance} km
          </Text>
          <Text style={[styles.statLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Distance</Text>
        </View>
      </View>
      
      <View style={[styles.section, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
        <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#000' : '#fff' }]}>Weekly Stats</Text>
        <View style={styles.weeklyStats}>
          <View style={styles.weeklyStat}>
            <Text style={[styles.statValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
              {driverStats.weeklyEarnings / 1000000000} SOL
            </Text>
            <Text style={[styles.statLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Weekly Earnings</Text>
          </View>
          <View style={styles.weeklyStat}>
            <Text style={[styles.statValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
              {driverStats.avgRating.toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Avg Rating</Text>
          </View>
        </View>
      </View>
      
      {/* Trip Summary Section */}
      {latestTrip && (
        <View style={[styles.section, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
          <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#000' : '#fff' }]}>Latest Trip Summary</Text>
          <View style={styles.tripSummary}>
            <View style={styles.tripMetric}>
              <Text style={[styles.metricValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
                {latestTrip.safetyScore.toFixed(1)}/10
              </Text>
              <Text style={[styles.metricLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Safety Score</Text>
            </View>
            <View style={styles.tripMetric}>
              <Text style={[styles.metricValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
                {latestTrip.distance.toFixed(1)} km
              </Text>
              <Text style={[styles.metricLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Distance</Text>
            </View>
            <View style={styles.tripMetric}>
              <Text style={[styles.metricValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
                {Math.floor(latestTrip.duration / 60)}m
              </Text>
              <Text style={[styles.metricLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Duration</Text>
            </View>
          </View>
          
          {/* Trip Metrics */}
          <View style={styles.tripMetrics}>
            <Text style={[styles.metricsTitle, { color: theme === 'light' ? '#000' : '#fff' }]}>Trip Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricItemValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
                  {latestTrip.metrics.hardBrakes}
                </Text>
                <Text style={[styles.metricItemLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Hard Brakes</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricItemValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
                  {latestTrip.metrics.hardAccelerations}
                </Text>
                <Text style={[styles.metricItemLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Hard Accelerations</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricItemValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
                  {latestTrip.metrics.harshCorners}
                </Text>
                <Text style={[styles.metricItemLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Harsh Corners</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricItemValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
                  {latestTrip.metrics.speedingTime}s
                </Text>
                <Text style={[styles.metricItemLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Speeding Time</Text>
              </View>
            </View>
          </View>
        </View>
      )}
      
      {/* Trip History Section */}
      {tripHistory.length > 0 && (
        <View style={[styles.section, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
          <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#000' : '#fff' }]}>Recent Trips</Text>
          {tripHistory.slice(0, 5).map((trip, index) => (
            <View key={trip.tripId} style={styles.tripHistoryItem}>
              <View style={styles.tripHistoryLeft}>
                <Text style={[styles.tripDate, { color: theme === 'light' ? '#000' : '#fff' }]}>
                  {new Date(trip.date).toLocaleDateString()}
                </Text>
                <Text style={[styles.tripDistance, { color: theme === 'light' ? '#666' : '#aaa' }]}>
                  {trip.distance.toFixed(1)} km • {Math.floor(trip.duration / 60)}m
                </Text>
              </View>
              <View style={styles.tripHistoryRight}>
                <Text style={[styles.tripScore, { color: trip.safetyScore >= 8 ? '#34C759' : trip.safetyScore >= 6 ? '#FF9500' : '#FF3B30' }]}>
                  {trip.safetyScore.toFixed(1)}
                </Text>
                <Text style={[styles.tripRating, { color: theme === 'light' ? '#666' : '#aaa' }]}>
                  ⭐ {trip.rating.toFixed(1)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
      
      <View style={[styles.section, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
        <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#000' : '#fff' }]}>Achievements</Text>
        <View style={styles.achievements}>
          <View style={styles.achievement}>
            <Text style={[styles.achievementText, { color: theme === 'light' ? '#000' : '#fff' }]}>12 Badges</Text>
          </View>
          <View style={styles.achievement}>
            <Text style={[styles.achievementText, { color: theme === 'light' ? '#000' : '#fff' }]}>3 NFTs</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.claimButton} 
        onPress={handleClaimRewards}
      >
        <Text style={styles.claimButtonText}>Claim Weekly Rewards</Text>
      </TouchableOpacity>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  statCard: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    width: '30%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 5,
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
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weeklyStat: {
    alignItems: 'center',
  },
  achievements: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  achievement: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  achievementText: {
    fontWeight: 'bold',
  },
  claimButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  claimButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Trip Summary Styles
  tripSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  tripMetric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  tripMetrics: {
    marginTop: 15,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricItemLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  // Trip History Styles
  tripHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tripHistoryLeft: {
    flex: 1,
  },
  tripHistoryRight: {
    alignItems: 'flex-end',
  },
  tripDate: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tripDistance: {
    fontSize: 12,
    marginTop: 2,
  },
  tripScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tripRating: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default ProfileScreen;