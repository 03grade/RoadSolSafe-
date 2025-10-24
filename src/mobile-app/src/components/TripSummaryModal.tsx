import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker, Polyline } from "react-native-maps";
import { fonts } from "../styles/fonts";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Score color logic - same as SafetyCluster
const colorByScore = (s: number) =>
  s < 3.5 ? "#FF4D4F" : s < 6.0 ? "#FFA940" : s < 8.0 ? "#FFD45E" : "#52C41A";

// Events color logic - red if >= 2, white otherwise
const colorByEvent = (value: number) =>
  value >= 2 ? "#FF4D4F" : "#FFFFFF";

interface TripData {
  id: string;
  date: string;
  score: number;
  points: number;
  duration: string;
  distance: string;
  origin: {
    address: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    address: string;
    latitude: number;
    longitude: number;
  };
  route: Array<{
    latitude: number;
    longitude: number;
  }>;
  events: {
    hardBrake: number;
    hardAccel: number;
    harshTurn: number;
    speeding: number;
    phoneUse: number;
  };
  recommendation: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  tripData: TripData;
}

export default function TripSummaryModal({ visible, onClose, tripData }: Props) {
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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Summary</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Route Map */}
          <View style={styles.mapSection}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: (tripData.origin.latitude + tripData.destination.latitude) / 2,
                longitude: (tripData.origin.longitude + tripData.destination.longitude) / 2,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={false}
              showsScale={false}
              mapType="standard"
            >
              {/* Origin Marker */}
              <Marker
                coordinate={{
                  latitude: tripData.origin.latitude,
                  longitude: tripData.origin.longitude,
                }}
                title="Origin"
                description={tripData.origin.address}
              >
                <View style={styles.originMarker}>
                  <Ionicons name="location" size={16} color="#FFFFFF" />
                </View>
              </Marker>

              {/* Destination Marker */}
              <Marker
                coordinate={{
                  latitude: tripData.destination.latitude,
                  longitude: tripData.destination.longitude,
                }}
                title="Destination"
                description={tripData.destination.address}
              >
                <View style={styles.destinationMarker}>
                  <Ionicons name="flag" size={16} color="#FFFFFF" />
                </View>
              </Marker>

              {/* Route Polyline */}
              {tripData.route.length > 1 && (
                <Polyline
                  coordinates={tripData.route}
                  strokeColor="#2D82FF"
                  strokeWidth={4}
                  lineDashPattern={[5, 5]}
                />
              )}
            </MapView>
          </View>

          {/* Origin and Destination Addresses */}
          <View style={styles.addressSection}>
            <View style={styles.addressItem}>
              <View style={styles.addressIcon}>
                <View style={styles.originDot} />
              </View>
              <Text style={styles.addressText}>{tripData.origin.address}</Text>
            </View>
            
            <View style={styles.addressConnector} />
            
            <View style={styles.addressItem}>
              <View style={styles.addressIcon}>
                <View style={styles.destinationDot} />
              </View>
              <Text style={styles.addressText}>{tripData.destination.address}</Text>
            </View>
          </View>

          {/* Performance Metrics */}
          <View style={styles.section}>
            <View style={styles.metricsContainer}>
              {/* First Row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="shield-outline" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.metricLabel}>Score</Text>
                  <Text style={styles.metricValue}>
                    <Text style={{ color: colorByScore(tripData.score) }}>
                      {tripData.score}
                    </Text>
                    <Text style={{ color: '#FFFFFF' }}>/10</Text>
                  </Text>
                </View>
                
                <View style={styles.metricItem}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="flash" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.metricLabel}>Points</Text>
                  <Text style={styles.metricValue}>+{tripData.points}</Text>
                </View>
              </View>

              {/* Second Row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="time-outline" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.metricLabel}>Duration</Text>
                  <Text style={styles.metricValue}>{tripData.duration}</Text>
                </View>
                
                <View style={styles.metricItem}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="location-outline" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.metricLabel}>Distance</Text>
                  <Text style={styles.metricValue}>{tripData.distance}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Separator */}
          <View style={styles.separator} />

          {/* Events Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Events</Text>
            
            <View style={styles.eventsContainer}>
              <View style={styles.eventItem}>
                <Text style={[styles.eventValue, { color: colorByEvent(tripData.events.hardBrake) }]}>
                  {tripData.events.hardBrake}
                </Text>
                <Text style={styles.eventLabel}>Hard Brake</Text>
              </View>
              
              <View style={styles.eventItem}>
                <Text style={[styles.eventValue, { color: colorByEvent(tripData.events.hardAccel) }]}>
                  {tripData.events.hardAccel}
                </Text>
                <Text style={styles.eventLabel}>Hard Accel</Text>
              </View>
              
              <View style={styles.eventItem}>
                <Text style={[styles.eventValue, { color: colorByEvent(tripData.events.harshTurn) }]}>
                  {tripData.events.harshTurn}
                </Text>
                <Text style={styles.eventLabel}>Harsh Turn</Text>
              </View>
              
              <View style={styles.eventItem}>
                <Text style={[styles.eventValue, { color: colorByEvent(tripData.events.speeding) }]}>
                  {tripData.events.speeding}%
                </Text>
                <Text style={styles.eventLabel}>Speeding</Text>
              </View>
              
              <View style={styles.eventItem}>
                <Text style={[styles.eventValue, { color: colorByEvent(tripData.events.phoneUse) }]}>
                  {tripData.events.phoneUse}
                </Text>
                <Text style={styles.eventLabel}>Phone Use</Text>
              </View>
            </View>
          </View>

          {/* AI Driving Coach Section */}
          <View style={styles.coachSection}>
            <View style={styles.coachHeader}>
              <View style={styles.coachIcon}>
                <Ionicons name="trending-up" size={20} color="#2D82FF" />
              </View>
              <Text style={styles.coachTitle}>AI Driving Coach</Text>
            </View>
            
            <View style={styles.recommendationContainer}>
              <Text style={styles.recommendationLabel}>Recommendation:</Text>
              <Text style={styles.recommendationText}>{tripData.recommendation}</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerTitle: {
    ...fonts.h4,
    color: '#FFFFFF',
  },
  
  placeholder: {
    width: 40,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  mapSection: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  map: {
    flex: 1,
  },
  
  originMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2D82FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  
  destinationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  
  addressSection: {
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  
  addressIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  originDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666666',
  },
  
  destinationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666666',
  },
  
  addressConnector: {
    width: 1,
    height: 12,
    backgroundColor: '#666666',
    marginLeft: 4,
    marginVertical: 2,
  },
  
  addressText: {
    ...fonts.bodySmall,
    color: '#FFFFFF',
    flex: 1,
  },
  
  section: {
    marginBottom: 24,
  },
  
  sectionTitle: {
    ...fonts.h2,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  
  metricsContainer: {
    gap: 16,
  },
  
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  
  metricItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  
  metricLabel: {
    ...fonts.label,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  
  metricValue: {
    ...fonts.h4,
    color: '#FFFFFF',
  },
  
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 8,
  },
  
  eventsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  
  eventItem: {
    alignItems: 'center',
    minWidth: '18%',
  },
  
  eventValue: {
    ...fonts.h3,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  
  eventLabel: {
    ...fonts.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  
  coachSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 40,
  },
  
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  coachIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(45, 130, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  coachTitle: {
    ...fonts.h3,
    color: '#FFFFFF',
  },
  
  recommendationContainer: {
    gap: 8,
  },
  
  recommendationLabel: {
    ...fonts.button,
    color: '#FFFFFF',
  },
  
  recommendationText: {
    ...fonts.body,
    color: '#FFFFFF',
    lineHeight: 24,
  },
});
