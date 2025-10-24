import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, Linking, Alert } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import SafetyCluster from "../components/SafetyCluster";
import StartTripButtonShiny from "../components/StartTripButtonShiny";
import TripMonitoringModal from "../components/TripMonitoringModal";
import TripSummaryModal from "../components/TripSummaryModal";
import LocationSearchService, { LocationSuggestion } from "../services/LocationSearchService";
import { fonts } from "../styles/fonts";
import { theme } from "../styles/theme";
import { getRecommendation } from "../services/DrivingCoach";

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen() {
  // demo data (wire to your store/api)
  const safetyScore = 6.1;
  const totalTripKm = 124.7;
  const dayStreak = 12;
  const [showTripModal, setShowTripModal] = useState(false);
  const [showTripSummary, setShowTripSummary] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [isTripActive, setIsTripActive] = useState(false);
  
  // Map and location states
  const [currentLocation, setCurrentLocation] = useState(null);
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [mapRegion, setMapRegion] = useState({
    latitude: 3.1390, // Kuala Lumpur coordinates as default
    longitude: 101.6869,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Search states
  const [originSuggestions, setOriginSuggestions] = useState<LocationSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<LocationSuggestion | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<LocationSuggestion | null>(null);
  
  // Debouncing and caching
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sample trip data
  const recentTrips = [
    {
      id: "1",
      date: "Today",
      km: 12.3,
      duration: "28 min",
      score: 7.8,
      points: 45,
      distance: "12.3 km",
      origin: {
        address: "41 Jalan Bukit Bintang, Kuala Lumpur 50200",
        latitude: 3.1478,
        longitude: 101.7003,
      },
      destination: {
        address: "300 Jalan Ampang, Kuala Lumpur 50450",
        latitude: 3.1615,
        longitude: 101.7176,
      },
      route: [
        { latitude: 3.1478, longitude: 101.7003 },
        { latitude: 3.1490, longitude: 101.7020 },
        { latitude: 3.1505, longitude: 101.7040 },
        { latitude: 3.1520, longitude: 101.7060 },
        { latitude: 3.1535, longitude: 101.7080 },
        { latitude: 3.1550, longitude: 101.7100 },
        { latitude: 3.1565, longitude: 101.7120 },
        { latitude: 3.1580, longitude: 101.7140 },
        { latitude: 3.1595, longitude: 101.7160 },
        { latitude: 3.1615, longitude: 101.7176 },
      ],
      events: {
        hardBrake: 0,
        hardAccel: 1,
        harshTurn: 0,
        speeding: 0,
        phoneUse: 0,
      },
      recommendation: getRecommendation({ hardBrake: 0, hardAccel: 1, harshTurn: 0, speeding: 0, phoneUse: 0 }, 7.8),
    },
    {
      id: "2",
      date: "Yesterday",
      km: 8.1,
      duration: "22 min",
      score: 6.4,
      points: 32,
      distance: "8.1 km",
      origin: {
        address: "123 Jalan Sultan Ismail, Kuala Lumpur 50200",
        latitude: 3.1390,
        longitude: 101.6869,
      },
      destination: {
        address: "456 Jalan Tun Razak, Kuala Lumpur 50400",
        latitude: 3.1390,
        longitude: 101.6869,
      },
      route: [
        { latitude: 3.1390, longitude: 101.6869 },
        { latitude: 3.1405, longitude: 101.6880 },
        { latitude: 3.1420, longitude: 101.6890 },
        { latitude: 3.1435, longitude: 101.6900 },
        { latitude: 3.1450, longitude: 101.6910 },
        { latitude: 3.1465, longitude: 101.6920 },
        { latitude: 3.1480, longitude: 101.6930 },
        { latitude: 3.1495, longitude: 101.6940 },
      ],
      events: {
        hardBrake: 2,
        hardAccel: 2,
        harshTurn: 0,
        speeding: 2,
        phoneUse: 1,
      },
      recommendation: getRecommendation({ hardBrake: 2, hardAccel: 2, harshTurn: 0, speeding: 2, phoneUse: 1 }, 6.4),
    },
    {
      id: "3",
      date: "2 days ago",
      km: 15.2,
      duration: "35 min",
      score: 8.5,
      points: 52,
      distance: "15.2 km",
      origin: {
        address: "789 Jalan Pudu, Kuala Lumpur 50200",
        latitude: 3.1357,
        longitude: 101.6882,
      },
      destination: {
        address: "321 Jalan Raja Chulan, Kuala Lumpur 50200",
        latitude: 3.1478,
        longitude: 101.7003,
      },
      route: [
        { latitude: 3.1357, longitude: 101.6882 },
        { latitude: 3.1370, longitude: 101.6900 },
        { latitude: 3.1385, longitude: 101.6920 },
        { latitude: 3.1400, longitude: 101.6940 },
        { latitude: 3.1415, longitude: 101.6960 },
        { latitude: 3.1430, longitude: 101.6980 },
        { latitude: 3.1445, longitude: 101.7000 },
        { latitude: 3.1460, longitude: 101.7020 },
        { latitude: 3.1478, longitude: 101.7003 },
      ],
      events: {
        hardBrake: 0,
        hardAccel: 0,
        harshTurn: 0,
        speeding: 1,
        phoneUse: 2,
      },
      recommendation: getRecommendation({ hardBrake: 0, hardAccel: 0, harshTurn: 0, speeding: 1, phoneUse: 2 }, 8.5),
    },
  ];

  // Get current location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Update map when selected origin/destination change
  useEffect(() => {
    if (selectedOrigin && selectedDestination) {
      updateMapWithRoute();
    } else if (currentLocation) {
      // Reset to current location if no route
      setMapRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setRouteCoordinates([]);
      setOriginCoords(null);
      setDestinationCoords(null);
    }
  }, [selectedOrigin, selectedDestination, currentLocation]);

  // Search for location suggestions with debouncing
  const searchLocations = async (query: string, type: 'origin' | 'destination') => {
    if (query.length < 2) {
      if (type === 'origin') {
        setOriginSuggestions([]);
        setShowOriginSuggestions(false);
      } else {
        setDestinationSuggestions([]);
        setShowDestinationSuggestions(false);
      }
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce the search
    searchTimeoutRef.current = setTimeout(async () => {
      if (isSearching) return;
      
      setIsSearching(true);
      
      try {
        const result = await LocationSearchService.searchLocations(query, 5);
        
        if (type === 'origin') {
          setOriginSuggestions(result.suggestions);
          setShowOriginSuggestions(result.suggestions.length > 0);
        } else {
          setDestinationSuggestions(result.suggestions);
          setShowDestinationSuggestions(result.suggestions.length > 0);
        }
      } catch (error) {
        console.error('Error searching locations:', error);
        
        // Show empty suggestions on error
        if (type === 'origin') {
          setOriginSuggestions([]);
          setShowOriginSuggestions(false);
        } else {
          setDestinationSuggestions([]);
          setShowDestinationSuggestions(false);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce
  };


  // Handle origin text change
  const handleOriginChange = (text: string) => {
    setOrigin(text);
    if (text.length >= 2) {
      searchLocations(text, 'origin');
    } else {
      setOriginSuggestions([]);
      setShowOriginSuggestions(false);
    }
  };

  // Handle destination text change
  const handleDestinationChange = (text: string) => {
    setDestination(text);
    if (text.length >= 2) {
      searchLocations(text, 'destination');
    } else {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
    }
  };

  // Select origin from suggestions
  const selectOrigin = (suggestion: LocationSuggestion) => {
    setSelectedOrigin(suggestion);
    setOrigin(suggestion.formattedAddress);
    setOriginCoords(suggestion.coordinates);
    setShowOriginSuggestions(false);
    setOriginSuggestions([]);
  };

  // Select destination from suggestions
  const selectDestination = (suggestion: LocationSuggestion) => {
    setSelectedDestination(suggestion);
    setDestination(suggestion.formattedAddress);
    setDestinationCoords(suggestion.coordinates);
    setShowDestinationSuggestions(false);
    setDestinationSuggestions([]);
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocationSuggestion = await LocationSearchService.getCurrentLocation();
      
      if (currentLocationSuggestion) {
        setCurrentLocation(currentLocationSuggestion.coordinates);
        setMapRegion({
          latitude: currentLocationSuggestion.coordinates.latitude,
          longitude: currentLocationSuggestion.coordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        // Auto-fill origin with current location
        setOrigin(currentLocationSuggestion.formattedAddress);
        setOriginCoords(currentLocationSuggestion.coordinates);
        setSelectedOrigin(currentLocationSuggestion);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Unable to get current location. Please check your location permissions.');
    }
  };

  const updateMapWithRoute = () => {
    if (!selectedOrigin || !selectedDestination) return;

    const lat1 = selectedOrigin.coordinates.latitude;
    const lng1 = selectedOrigin.coordinates.longitude;
    const lat2 = selectedDestination.coordinates.latitude;
    const lng2 = selectedDestination.coordinates.longitude;
    
    // Calculate bounds to fit both points
    const minLat = Math.min(lat1, lat2);
    const maxLat = Math.max(lat1, lat2);
    const minLng = Math.min(lng1, lng2);
    const maxLng = Math.max(lng1, lng2);
    
    // Add padding to the bounds
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;
    
    setMapRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat + latPadding, 0.01),
      longitudeDelta: Math.max(maxLng - minLng + lngPadding, 0.01),
    });

    // Generate route coordinates (simplified - in production, use a routing service)
    const routePoints = generateRoutePoints(
      { latitude: lat1, longitude: lng1 },
      { latitude: lat2, longitude: lng2 }
    );
    
    setRouteCoordinates(routePoints);
  };

  // Generate route points (simplified routing)
  const generateRoutePoints = (start, end) => {
    const points = [];
    const steps = 10; // Number of intermediate points
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const lat = start.latitude + (end.latitude - start.latitude) * ratio;
      const lng = start.longitude + (end.longitude - start.longitude) * ratio;
      
      // Add some curve to make it look more realistic
      const curveOffset = Math.sin(ratio * Math.PI) * 0.001;
      points.push({
        latitude: lat + curveOffset,
        longitude: lng,
      });
    }
    
    return points;
  };

  const handleTripPress = (trip) => {
    setSelectedTrip(trip);
    setShowTripSummary(true);
  };

  const handleStartTrip = () => {
    if (!selectedOrigin || !selectedDestination) {
      Alert.alert('Missing Information', 'Please select both origin and destination from the search suggestions to start your trip.');
      return;
    }
    
    // Show map selection options
    Alert.alert(
      'Choose Navigation App',
      'Select your preferred map app to navigate to your destination:',
      [
        {
          text: 'Google Maps',
          onPress: () => openMapApp('google', selectedDestination.formattedAddress),
        },
        {
          text: 'Apple Maps',
          onPress: () => openMapApp('apple', selectedDestination.formattedAddress),
        },
        {
          text: 'Waze',
          onPress: () => openMapApp('waze', selectedDestination.formattedAddress),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openMapApp = (app: string, destination: string) => {
    let url = '';
    
    switch (app) {
      case 'google':
        url = `https://maps.google.com/maps?daddr=${encodeURIComponent(destination)}`;
        break;
      case 'apple':
        url = `http://maps.apple.com/?daddr=${encodeURIComponent(destination)}`;
        break;
      case 'waze':
        url = `https://waze.com/ul?q=${encodeURIComponent(destination)}`;
        break;
    }
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open the selected map app.');
    });
    
    // Start the trip monitoring
    setIsTripActive(true);
    setShowTripModal(true);
  };

  const handleEndTrip = () => {
    setIsTripActive(false);
    // The TripMonitoringModal will handle showing the completion screen
    // We don't need to close the modal here as it will transition to completion view
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Welcome Message */}
      <View style={styles.welcomeHeader}>
        <Text style={styles.welcomeTitle}>Welcome back!</Text>
        <Text style={styles.welcomeSubtitle}>Ready to drive safely and earn rewards?</Text>
      </View>

      {/* Gauge Card (keeps your base layout) */}
      <View style={styles.gaugeCard}>
        <SafetyCluster
          safetyScore={safetyScore}
          totalTripKm={totalTripKm}
          dayStreak={dayStreak}
          weeklyTripGoal={300}
          streakGoal={20}
        />
      </View>

      {/* Map Card */}
      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Plan Your Trip</Text>
        </View>
        
        <View style={styles.addressFields}>
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={16} color="#FF6B35" style={styles.inputIcon} />
            <TextInput
              style={styles.addressInput}
              placeholder="Origin (auto-filled with current location)"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={origin}
              onChangeText={handleOriginChange}
              onFocus={() => {
                if (originSuggestions.length > 0) {
                  setShowOriginSuggestions(true);
                }
              }}
            />
            {isSearching && origin.length >= 3 && (
              <Ionicons name="hourglass-outline" size={16} color="#FF6B35" style={styles.loadingIcon} />
            )}
          </View>
          
          {/* Origin Suggestions */}
          {showOriginSuggestions && originSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {originSuggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => selectOrigin(item)}
                >
                  <Ionicons name="location-outline" size={16} color="#FF6B35" />
                  <Text style={styles.suggestionText}>{item.formattedAddress}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <Ionicons name="flag" size={16} color="#FF6B35" style={styles.inputIcon} />
            <TextInput
              style={styles.addressInput}
              placeholder="Search destination location..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={destination}
              onChangeText={handleDestinationChange}
              onFocus={() => {
                if (destinationSuggestions.length > 0) {
                  setShowDestinationSuggestions(true);
                }
              }}
            />
            {isSearching && destination.length >= 3 && (
              <Ionicons name="hourglass-outline" size={16} color="#FF6B35" style={styles.loadingIcon} />
            )}
          </View>
          
          {/* Destination Suggestions */}
          {showDestinationSuggestions && destinationSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {destinationSuggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => selectDestination(item)}
                >
                  <Ionicons name="flag-outline" size={16} color="#FF6B35" />
                  <Text style={styles.suggestionText}>{item.formattedAddress}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Map View */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
            showsBuildings={false}
            showsTraffic={false}
            showsIndoors={false}
            mapType="standard"
          >
            {/* Current Location Marker */}
            {currentLocation && !originCoords && (
              <Marker
                coordinate={currentLocation}
                title="Your Location"
                description="Current position"
                pinColor="blue"
              />
            )}

            {/* Origin Marker */}
            {originCoords && (
              <Marker
                coordinate={originCoords}
                title="Origin"
                description={origin}
                pinColor="green"
              />
            )}

            {/* Destination Marker */}
            {destinationCoords && (
              <Marker
                coordinate={destinationCoords}
                title="Destination"
                description={destination}
                pinColor="red"
              />
            )}

            {/* Route Polyline */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#FF6B35"
                strokeWidth={3}
                lineDashPattern={[5, 5]}
              />
            )}
          </MapView>
        </View>
      </View>

      {/* Start Trip button with shiny effects */}
      <View style={styles.ctaContainer}>
        <StartTripButtonShiny
          title="Start Trip"
          subtitle="Safe mode • GPS on"
          onPress={() => handleStartTrip()}
          width={screenWidth - 32}
          height={60}
          iconName="play"
          shinyText={true}
          speed={2.4}
          style={{ marginHorizontal: 16 }}
        />
      </View>

      {/* Recent Trips */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Trips</Text>
          <Text style={styles.link}>View All</Text>
        </View>

        {recentTrips.map((trip, i) => (
          <TouchableOpacity 
            key={trip.id} 
            style={styles.tripRow}
            onPress={() => handleTripPress(trip)}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.tripDate}>{trip.date}</Text>
              <Text style={styles.tripSub}>{trip.km} km • {trip.duration}</Text>
            </View>
            <View style={styles.tripScoreContainer}>
              <Text style={styles.tripScore}>{trip.score.toFixed(1)}</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.5)" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trip Monitoring Modal */}
      <TripMonitoringModal
        visible={showTripModal}
        onClose={() => setShowTripModal(false)}
        onEndTrip={handleEndTrip}
      />

      {/* Trip Summary Modal */}
      {selectedTrip && (
        <TripSummaryModal
          visible={showTripSummary}
          onClose={() => {
            setShowTripSummary(false);
            setSelectedTrip(null);
          }}
          tripData={selectedTrip}
        />
      )}

      {/* bottom nav placeholder to mirror your base */}
      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const BG = "transparent";
const CARD = "#0B111A";
const TEXT = "#E8F0FF";
const MUTED = "rgba(210,225,245,0.8)";
const DIVIDER = "rgba(255,255,255,0.08)";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  
  welcomeHeader: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    alignItems: "center",
  },
  welcomeTitle: { 
    ...fonts.h2,
    color: TEXT, 
    marginBottom: 4,
  },
  welcomeSubtitle: { 
    ...fonts.body,
    color: MUTED, 
    textAlign: "center",
  },

  gaugeCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: 'transparent',
  },

  ctaContainer: {
    marginTop: 24,
  },

  card: {
    marginTop: 18,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: { ...fonts.h4, color: TEXT },
  link: { ...fonts.button, color: "#2D82FF" },

  tripRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  tripDate: { ...fonts.button, color: TEXT },
  tripSub: { ...fonts.bodySmall, color: MUTED, marginTop: 2 },
  tripScoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tripScore: { ...fonts.button, color: TEXT },

  mapCard: {
    marginTop: 18,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mapHeader: {
    marginBottom: 16,
  },
  mapTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "700",
  },
  addressFields: {
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputIcon: {
    marginRight: 8,
  },
  loadingIcon: {
    marginLeft: 8,
  },
  addressInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  mapContainer: {
    height: 200,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  map: {
    flex: 1,
  },
  suggestionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 4,
    maxHeight: 150,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },

  bottomPad: { height: 40 },
});
