import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../styles/fonts';
import { generateMockTripData } from '../services/TripMockService';
import { getRecommendation } from '../services/DrivingCoach';

interface TripMonitoringModalProps {
  visible: boolean;
  onClose: () => void;
  onEndTrip: () => void;
}

export default function TripMonitoringModal({
  visible,
  onClose,
  onEndTrip,
}: TripMonitoringModalProps) {
  const [showCompletion, setShowCompletion] = useState(false);
  const [tripData, setTripData] = useState({
    score: 10,
    points: 0,
    duration: '0:08',
    distance: '0.1 km',
    events: {
      hardBrake: 0,
      hardAccel: 0,
      harshTurn: 0,
      speeding: 0,
      phoneUse: 0,
    },
    recommendation: 'Excellent driving! Keep maintaining this smooth and safe driving style.',
  });

  const spinValue = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      setShowCompletion(false);
      // Start spinning animation
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();

      return () => {
        spinAnimation.stop();
      };
    }
  }, [visible]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleEndTrip = () => {
    const mock = generateMockTripData();
    const recommendation = getRecommendation(mock.events, mock.score);
    setTripData({
      score: mock.score,
      points: mock.points,
      duration: mock.duration,
      distance: mock.distance,
      events: mock.events,
      recommendation,
    });
    setShowCompletion(true);
  };

  const handleClose = () => {
    setShowCompletion(false);
    onClose();
  };

  if (showCompletion) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <LinearGradient
          colors={['#0F1419', '#1F2A3A', '#0F1419']}
          locations={[0, 0.5, 1]}
          style={styles.container}
        >
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Trip Completed Header */}
            <View style={styles.completionHeader}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.completionTitle}>Trip Completed!</Text>
              <Text style={styles.completionSubtitle}>Great job driving safely</Text>
            </View>

            {/* Trip Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Trip Summary</Text>
              
              {/* Score and Points Row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="shield" size={20} color="#2D82FF" />
                  </View>
                  <Text style={styles.metricLabel}>Score</Text>
                  <Text style={styles.metricValue}>{tripData.score}/10</Text>
                </View>
                
                <View style={styles.metricItem}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="flash" size={20} color="#FFD700" />
                  </View>
                  <Text style={styles.metricLabel}>Points</Text>
                  <Text style={styles.metricValue}>+{tripData.points}</Text>
                </View>
              </View>

              {/* Duration and Distance Row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="time" size={20} color="#2D82FF" />
                  </View>
                  <Text style={styles.metricValue}>{tripData.duration}</Text>
                  <Text style={styles.metricLabel}>Duration</Text>
                </View>
                
                <View style={styles.metricItem}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="location" size={20} color="#2D82FF" />
                  </View>
                  <Text style={styles.metricValue}>{tripData.distance}</Text>
                  <Text style={styles.metricLabel}>Distance</Text>
                </View>
              </View>

              {/* Separator */}
              <View style={styles.separator} />

              {/* Events Section */}
              <View style={styles.eventsSection}>
                <Text style={styles.eventsTitle}>Events</Text>
                <View style={styles.eventsRow}>
                  <Text style={styles.eventItem}>{tripData.events.hardBrake} Hard Brake</Text>
                  <Text style={styles.eventItem}>{tripData.events.hardAccel} Hard Accel</Text>
                  <Text style={styles.eventItem}>{tripData.events.harshTurn} Harsh Turn</Text>
                  <Text style={styles.eventItem}>{tripData.events.speeding}% Speeding</Text>
                  <Text style={styles.eventItem}>{tripData.events.phoneUse} Phone Use</Text>
                </View>
              </View>
            </View>

            {/* AI Driving Coach Card */}
            <View style={styles.coachCard}>
              <View style={styles.coachHeader}>
                <Ionicons name="trending-up" size={20} color="#2D82FF" />
                <Text style={styles.coachTitle}>AI Driving Coach</Text>
              </View>
              <Text style={styles.recommendationLabel}>Recommendation:</Text>
              <Text style={styles.recommendationText}>{tripData.recommendation}</Text>
            </View>

            {/* Close Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#0F1419', '#1F2A3A', '#0F1419']}
        locations={[0, 0.5, 1]}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerCloseButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Monitoring</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Circular Loading Animation */}
          <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
          
          {/* Trip Status Text */}
          <Text style={styles.tripStatusText}>Trip in progress</Text>
          <Text style={styles.tripStatusSubtext}>Drive safely to maximize rewards</Text>
        </View>

        {/* End Trip Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.endButton} onPress={handleEndTrip}>
            <Ionicons name="stop-outline" size={20} color="#FFFFFF" />
            <Text style={styles.endButtonText}>End Trip</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerCloseButton: {
    padding: 8,
  },
  headerTitle: {
    ...fonts.buttonLarge,
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  
  // Trip completion styles
  completionHeader: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  completionTitle: {
    ...fonts.h1,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  completionSubtitle: {
    ...fonts.body,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  
  // Card styles
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    ...fonts.h4,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  
  // Metrics styles
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    marginBottom: 8,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  
  // Separator
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 20,
  },
  
  // Events styles
  eventsSection: {
    marginTop: 10,
  },
  eventsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  eventsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  eventItem: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
    flex: 1,
    minWidth: '30%',
  },
  
  // Coach card styles
  coachCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  coachTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  recommendationLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  recommendationText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  
  // Content styles
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  spinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderTopColor: '#2D82FF',
    marginBottom: 32,
  },
  tripStatusText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  tripStatusSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 60,
  },
  
  // Button styles
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeButton: {
    backgroundColor: '#2D82FF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
