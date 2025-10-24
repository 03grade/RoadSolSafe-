// Map Screen Component with Trip Management
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking, Platform, TextInput, AppState } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import MapView, { Marker, Polyline } from 'react-native-maps';
import telemetryService from '../services/TelemetryService';
import realMagicBlockPERService from '../services/RealMagicBlockPERService';
import pointRewardService from '../services/PointRewardService';
import walletService from '../services/WalletService';
import * as Location from 'expo-location';

const MapScreen = () => {
  const { theme } = useTheme();
  const [isDriving, setIsDriving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tripData, setTripData] = useState({
    startTime: 0,
    endTime: 0,
    distance: 0,
    duration: 0,
    fare: 0,
    rating: 0,
  });
  const [tripStatus, setTripStatus] = useState('ready'); // ready, in-progress, completed
  const [telemetryStatus, setTelemetryStatus] = useState({
    isCollecting: false,
    chunkIndex: 0,
  });

  // Location states
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [originInput, setOriginInput] = useState('Your location');
  const [destinationInput, setDestinationInput] = useState('');
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ address: string; latitude: number; longitude: number }>>([]);
  const [searchingLocation, setSearchingLocation] = useState<'origin' | 'destination' | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.784278,
    longitude: -122.401543,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  
  // Trip lifecycle states
  const [tripId, setTripId] = useState<string | null>(null);
  const [tripStartTime, setTripStartTime] = useState<number | null>(null);
  const [tripEndTime, setTripEndTime] = useState<number | null>(null);
  const [tripDistance, setTripDistance] = useState<number>(0);
  const [tripDuration, setTripDuration] = useState<number>(0);
  const [tripSafetyScore, setTripSafetyScore] = useState<number>(0);
  const [tripMetrics, setTripMetrics] = useState({
    hardBrakes: 0,
    hardAccelerations: 0,
    harshCorners: 0,
    speedingTime: 0,
    phoneInteraction: 0,
  });
  const [locationWatchId, setLocationWatchId] = useState<Location.LocationSubscription | null>(null);
  const [isNearDestination, setIsNearDestination] = useState(false);
  
  // Navigation state
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState<string | null>(null);
  const [nextInstruction, setNextInstruction] = useState<string | null>(null);
  const [distanceToNext, setDistanceToNext] = useState<number | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null);
  const [routeSteps, setRouteSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Get current location on app start
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required to use this app');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);
        
        // Center map on user location
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        
        console.log('📍 Current location:', location.coords.latitude, location.coords.longitude);
      } catch (error) {
        console.error('Error getting current location:', error);
        Alert.alert('Location Error', 'Could not get your current location');
      }
    };

    getCurrentLocation();
  }, []);

  // Cleanup telemetry on unmount
  useEffect(() => {
    return () => {
      if (isDriving) {
        stopTelemetryCollection();
        realMagicBlockPERService.stopSession();
      }
    };
  }, [isDriving]);

  // Monitor app state changes to detect navigation app usage
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (isDriving && tripId) {
        if (nextAppState === 'background') {
          console.log('📱 App went to background - Navigation app opened');
          // Trip continues in background
        } else if (nextAppState === 'active') {
          console.log('📱 App returned to foreground - Navigation app closed');
          // Check if we should end the trip
          if (isNearDestination) {
            console.log('🎯 App returned and near destination - Ending trip');
            handleEndTripComplete();
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isDriving, tripId, isNearDestination]);

  // Mock trip data for demonstration
  const mockTripData = {
    route: [
      { latitude: 37.784278, longitude: -122.401543 },
      { latitude: 37.785278, longitude: -122.402543 },
      { latitude: 37.786278, longitude: -122.403543 },
      { latitude: 37.787278, longitude: -122.404543 },
    ],
    startLocation: { latitude: 37.784278, longitude: -122.401543 },
    endLocation: { latitude: 37.787278, longitude: -122.404543 },
  };

  // Deep link to navigation apps with current location as start
  const openNavigationApp = (app: 'waze' | 'google' | 'apple') => {
    if (!destination) {
      Alert.alert('No Destination', 'Please set a destination first');
      return;
    }
    
    if (!currentLocation) {
      Alert.alert('Location Error', 'Could not get your current location');
      return;
    }
    
    let url = '';
    switch (app) {
      case 'waze':
        url = `waze://?ll=${destination.latitude},${destination.longitude}&navigate=yes`;
        break;
      case 'google':
        url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.coords.latitude},${currentLocation.coords.longitude}&destination=${destination.latitude},${destination.longitude}`;
        break;
      case 'apple':
        url = `http://maps.apple.com/?saddr=${currentLocation.coords.latitude},${currentLocation.coords.longitude}&daddr=${destination.latitude},${destination.longitude}`;
        break;
    }
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Navigation App Not Available', `Please install ${app === 'apple' ? 'Apple Maps' : app === 'google' ? 'Google Maps' : 'Waze'} to use this feature.`);
    });
    
    // Start trip data collection after opening navigation
    setTimeout(() => {
      handleStartTripSimple();
    }, 1000); // Small delay to ensure navigation app opens first
  };

  // Show navigation app selection
  const handleStartTripWithNavigation = async () => {
    try {
      console.log('🚀 Starting trip with navigation...');

      // Generate fallback session ID
      const fallbackSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('📝 Generated fallback session ID:', fallbackSessionId);

      // Try to start backend session (don't fail if backend is down)
      let sessionToUse = fallbackSessionId;
      try {
        const BACKEND_URL = process.env.BACKEND_URL || 'http://192.168.1.12:3000';
        console.log('🌐 Starting backend session...');
        console.log('🌐 Backend URL:', BACKEND_URL);
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const sessionResponse = await fetch(`${BACKEND_URL}/session/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverId: walletService.getPublicKey() || 'driver_test_001',
            publicKey: walletService.getPublicKey() || 'YOUR_WALLET_PUBLIC_KEY',
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!sessionResponse.ok) {
          console.warn('⚠️ Backend session not available, continuing with local session');
          console.warn('⚠️ Response status:', sessionResponse.status, sessionResponse.statusText);
        } else {
          const sessionData = await sessionResponse.json();
          console.log('✅ Backend session started:', sessionData.sessionId);
          sessionToUse = sessionData.sessionId; // Use backend session ID
        }
      } catch (backendError) {
        console.warn('⚠️ Backend not available, continuing with local session:', backendError);
        console.warn('⚠️ Error type:', typeof backendError);
        console.warn('⚠️ Error message:', backendError.message);
      }

      // Start telemetry collection with the correct session ID
      console.log('📡 Starting telemetry collection...');
      const telemetryStarted = await telemetryService.startSession(sessionToUse);
      if (!telemetryStarted) {
        throw new Error('Failed to start telemetry collection');
      }
      console.log('✅ Telemetry collection started');

      // Start REAL MagicBlock PER telemetry
      console.log('🔒 Starting REAL MagicBlock PER telemetry...');
      await realMagicBlockPERService.startSession(`trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      console.log('✅ REAL MagicBlock PER telemetry started');

      // Update trip state
      const newTripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setTripId(newTripId);
      setTripStartTime(Date.now());
      setTripEndTime(null);
      setTripDistance(0);
      setTripDuration(0);
      setTripSafetyScore(0);
      setIsDriving(true);
      setTripStatus('active');
      setSessionId(sessionToUse); // Use the correct session ID
      setIsNearDestination(false);

      // Update telemetry status
      setTelemetryStatus({ isCollecting: true, chunkIndex: 0 });

      console.log('✅ Trip started with ID:', newTripId);
      console.log('🎯 Trip state updated - UI should show End Trip button');

    } catch (error) {
      console.error('Error starting trip:', error);
      Alert.alert('Error', 'Failed to start trip. Please try again.');
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Check if user is near destination (within 100 meters)
  const checkDestinationProximity = (currentLat: number, currentLon: number): boolean => {
    if (!destination) return false;
    const distance = calculateDistance(currentLat, currentLon, destination.latitude, destination.longitude);
    return distance < 0.1; // 100 meters
  };

  // Geocoding function to search for locations
  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      // Use Google Places API or similar for real geocoding
      // For now, we'll use a mock search with some Malaysian locations
      const mockResults = [
        { address: 'Sri Petaling, Kuala Lumpur, Malaysia', latitude: 3.0733, longitude: 101.6865 },
        { address: 'Petaling Jaya, Selangor, Malaysia', latitude: 3.1073, longitude: 101.6085 },
        { address: 'Kuala Lumpur City Centre, Malaysia', latitude: 3.1579, longitude: 101.7116 },
        { address: 'Bangsar, Kuala Lumpur, Malaysia', latitude: 3.1304, longitude: 101.6672 },
        { address: 'Mont Kiara, Kuala Lumpur, Malaysia', latitude: 3.1705, longitude: 101.6658 },
        { address: 'Subang Jaya, Selangor, Malaysia', latitude: 3.0498, longitude: 101.5854 },
        { address: 'Cheras, Kuala Lumpur, Malaysia', latitude: 3.0833, longitude: 101.7500 },
        { address: 'Ampang, Kuala Lumpur, Malaysia', latitude: 3.1500, longitude: 101.7667 },
      ];
      
      // Filter results based on query
      const filteredResults = mockResults.filter(result => 
        result.address.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching location:', error);
      setSearchResults([]);
    }
  };

  // Handle location selection
  const handleLocationSelect = (location: { address: string; latitude: number; longitude: number }, type: 'origin' | 'destination') => {
    if (type === 'origin') {
      setOriginInput(location.address);
      // Update current location if user selects a different origin
      setCurrentLocation({
        coords: {
          latitude: location.latitude,
          longitude: location.longitude,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      setDestinationInput(location.address);
      setDestination(location);
      setMapRegion({
        latitude: (currentLocation?.coords.latitude || location.latitude + location.latitude) / 2,
        longitude: (currentLocation?.coords.longitude || location.longitude + location.longitude) / 2,
        latitudeDelta: Math.abs((currentLocation?.coords.latitude || location.latitude) - location.latitude) * 2,
        longitudeDelta: Math.abs((currentLocation?.coords.longitude || location.longitude) - location.longitude) * 2,
      });
    }
    
    setShowLocationSearch(false);
    setSearchingLocation(null);
    setSearchResults([]);
  };

  // Swap origin and destination
  const handleSwapLocations = () => {
    if (destination) {
      const tempOrigin = originInput;
      const tempDestination = destination;
      
      setOriginInput(destinationInput);
      setDestinationInput(tempOrigin);
      setDestination({
        latitude: currentLocation?.coords.latitude || 0,
        longitude: currentLocation?.coords.longitude || 0,
        address: tempOrigin,
      });
      
      // Update current location to the previous destination
      if (currentLocation) {
        setCurrentLocation({
          coords: {
            latitude: tempDestination.latitude,
            longitude: tempDestination.longitude,
            altitude: null,
            accuracy: 10,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      }
    }
  };

  // Start trip with telemetry collection
  const handleStartTrip = async () => {
    try {
      console.log('🚀 Starting trip...');
      
      // Generate session ID
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('📝 Generated session ID:', newSessionId);
      
      // Start backend session
      const BACKEND_URL = process.env.BACKEND_URL || 'http://192.168.1.12:3000';
      console.log('🌐 Starting backend session...');
      const sessionResponse = await fetch(`${BACKEND_URL}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: walletService.getPublicKey() || 'driver_test_001',
          publicKey: walletService.getPublicKey() || 'YOUR_WALLET_PUBLIC_KEY',
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to start backend session');
      }

      const sessionData = await sessionResponse.json();
      const backendSessionId = sessionData.sessionId;

      // Start telemetry collection
      const started = await telemetryService.startSession(backendSessionId);
      
      if (!started) {
        Alert.alert('Error', 'Failed to start trip. Please check permissions.');
        return;
      }

      setSessionId(backendSessionId);
    setIsDriving(true);
    setTripStatus('in-progress');
    setTripData({
      startTime: Date.now(),
      endTime: 0,
      distance: 0,
      duration: 0,
      fare: 0,
      rating: 0,
    });

      Alert.alert(
        'Trip Started', 
        'Your trip has started. Safe driving data is being collected in the background.',
        [{ text: 'OK' }]
      );

      // Update telemetry status every second
      const statusInterval = setInterval(() => {
        const status = telemetryService.getStatus();
        setTelemetryStatus({
          isCollecting: status.isCollecting,
          chunkIndex: status.chunkIndex,
        });

        if (!status.isCollecting) {
          clearInterval(statusInterval);
        }
      }, 1000);
    } catch (error) {
      console.error('Error starting trip:', error);
      Alert.alert('Error', 'Failed to start trip. Please try again.');
    }
  };

  // Start continuous telemetry data collection
  const startTelemetryCollection = async () => {
    try {
      console.log('📡 Starting continuous telemetry collection...');
      
      // Start location tracking
      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // 1 second
          distanceInterval: 1, // 1 meter
        },
        (location) => {
          if (isDriving && location) {
            // Collect telemetry data
            const telemetryData = {
              timestamp: Date.now(),
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy || 0,
              speed: location.coords.speed || 0,
              acceleration: {
                x: Math.random() * 2 - 1, // Simulate accelerometer data
                y: Math.random() * 2 - 1,
                z: Math.random() * 2 - 1,
              },
              gyroscope: {
                x: Math.random() * 10 - 5, // Simulate gyroscope data
                y: Math.random() * 10 - 5,
                z: Math.random() * 10 - 5,
              },
              deviceFlags: {
                screenOn: true,
                appInForeground: AppState.currentState === 'active',
                phoneInteraction: Math.random() < 0.1, // 10% chance of phone interaction
              },
            };
            
            // Send to REAL MagicBlock PER telemetry service
            realMagicBlockPERService.addTelemetryData(telemetryData);
            
            // Update trip distance
            if (currentLocation) {
              const distance = calculateDistance(
                currentLocation.coords.latitude,
                currentLocation.coords.longitude,
                location.coords.latitude,
                location.coords.longitude
              );
              setTripDistance(prev => prev + distance);
            }
            
            // Update current location
            setCurrentLocation(location);
            
            // Update navigation if active
            updateNavigation(location.coords.latitude, location.coords.longitude);
            
            // Check if near destination
            if (destination) {
              const distanceToDestination = calculateDistance(
                location.coords.latitude,
                location.coords.longitude,
                destination.latitude,
                destination.longitude
              );
              
              if (distanceToDestination < 0.1) { // Within 100 meters
                setIsNearDestination(true);
                console.log('🎯 Near destination!');
                // Stop navigation when arrived
                if (isNavigating) {
                  stopNavigation();
                }
              }
            }
          }
        }
      );
      
      // Store subscription for cleanup
      setLocationWatchId(locationSubscription);
      
      console.log('✅ Telemetry collection started');
    } catch (error) {
      console.error('❌ Error starting telemetry collection:', error);
    }
  };

  // Stop telemetry collection
  const stopTelemetryCollection = () => {
    try {
      if (locationWatchId) {
        locationWatchId.remove();
        setLocationWatchId(null);
        console.log('🛑 Telemetry collection stopped');
      }
    } catch (error) {
      console.error('❌ Error stopping telemetry collection:', error);
    }
  };

  // Simple trip start for immediate UI testing
  const handleStartTripSimple = async () => {
    try {
      // Generate trip ID and start time
      const newTripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startTime = Date.now();
      
      // Set trip state immediately for UI updates
      setTripId(newTripId);
      setTripStartTime(startTime);
      setIsDriving(true);
      setTripStatus('in-progress');
      setTripData({
        startTime: startTime,
        endTime: 0,
        distance: 0,
        duration: 0,
        fare: 0,
        rating: 0,
      });
      
      // Update telemetry status immediately for UI feedback
      setTelemetryStatus({ isCollecting: true, chunkIndex: 0 });
      
      // Start MagicBlock telemetry collection
      const telemetryStarted = await realMagicBlockPERService.startSession(newTripId);
      
      if (telemetryStarted) {
        console.log('✅ MagicBlock telemetry collection started');
        
        // Start continuous telemetry data collection
        startTelemetryCollection();
      }
      
      console.log('✅ Trip started - UI should show End Trip button');
      
      Alert.alert(
        'Trip Started', 
        'Trip started successfully! MagicBlock telemetry data is being collected. You should now see the End Trip button and trip status.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error starting trip:', error);
      Alert.alert('Error', 'Failed to start trip. Please try again.');
    }
  };

  // Complete trip lifecycle with automatic ending detection
  const handleStartTripComplete = async () => {
    try {
      // Generate trip ID and start time
      const newTripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startTime = Date.now();
      
      // Start backend session
      const BACKEND_URL = process.env.BACKEND_URL || 'http://192.168.1.12:3000';
      const sessionResponse = await fetch(`${BACKEND_URL}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: 'driver_test_001',
          publicKey: 'YOUR_WALLET_PUBLIC_KEY',
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to start backend session');
      }

      const sessionData = await sessionResponse.json();
      const backendSessionId = sessionData.sessionId;

      // Start telemetry collection
      const started = await telemetryService.startSession(backendSessionId);
      
      if (!started) {
        Alert.alert('Error', 'Failed to start trip. Please check permissions.');
        return;
      }

      // Set trip state
      setTripId(newTripId);
      setTripStartTime(startTime);
      setSessionId(backendSessionId);
      setIsDriving(true);
      setTripStatus('in-progress');
      setTripData({
        startTime: startTime,
        endTime: 0,
        distance: 0,
        duration: 0,
        fare: 0,
        rating: 0,
      });
      
      // Update telemetry status immediately for UI feedback
      setTelemetryStatus({ isCollecting: true, chunkIndex: 0 });
      
      console.log('✅ Trip state updated - UI should show End Trip button');

      // Start location monitoring for automatic trip ending
      const watchLocation = async () => {
        try {
          const locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 5000, // Check every 5 seconds
              distanceInterval: 10, // Check every 10 meters
            },
            (location) => {
              const { latitude, longitude } = location.coords;
              
              // Update trip distance
              if (currentLocation) {
                const distance = calculateDistance(
                  currentLocation.coords.latitude,
                  currentLocation.coords.longitude,
                  latitude,
                  longitude
                );
                setTripDistance(prev => prev + distance);
              }
              
              // Check if near destination
              const nearDestination = checkDestinationProximity(latitude, longitude);
              setIsNearDestination(nearDestination);
              
              // Auto-end trip if at destination
              if (nearDestination && !isNearDestination) {
                console.log('🎯 Reached destination! Auto-ending trip...');
                handleEndTripComplete();
              }
              
              // Update current location
              setCurrentLocation(location);
            }
          );
          
          setLocationWatchId(locationSubscription);
        } catch (error) {
          console.error('Error watching location:', error);
        }
      };

      // Start location monitoring
      await watchLocation();

      // Update telemetry status every second
      const statusInterval = setInterval(() => {
        const status = telemetryService.getStatus();
        setTelemetryStatus({
          isCollecting: status.isCollecting,
          chunkIndex: status.chunkIndex,
        });

        // Update trip duration
        setTripDuration(Date.now() - startTime);

        if (!status.isCollecting) {
          clearInterval(statusInterval);
        }
      }, 1000);

      Alert.alert(
        'Trip Started', 
        'Your trip has started. Safe driving data is being collected in the background.',
        [{ text: 'OK' }]
      );

      console.log('✅ Trip started with ID:', newTripId);
    } catch (error) {
      console.error('Error starting trip:', error);
      Alert.alert('Error', 'Failed to start trip. Please try again.');
    }
  };

  // Enhanced route calculation with more realistic path
  const calculateSimpleRoute = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    const steps = [];
    const totalDistance = calculateDistance(start.lat, start.lng, end.lat, end.lng);
    
    // Create cleaner waypoints for a smoother route
    const numSteps = Math.max(3, Math.min(6, Math.floor(totalDistance * 2))); // 2 steps per km, max 6 steps
    
    for (let i = 0; i <= numSteps; i++) {
      const ratio = i / numSteps;
      
      // Single, gentle curve for cleaner route
      const curve = Math.sin(ratio * Math.PI) * 0.005; // Much smaller curve
      
      const lat = start.lat + (end.lat - start.lat) * ratio + curve;
      const lng = start.lng + (end.lng - start.lng) * ratio + curve * 0.5;
      
      let instruction = '';
      if (i === 0) {
        instruction = 'Start your journey';
      } else if (i === numSteps) {
        instruction = 'You have arrived at your destination';
      } else {
        // More realistic driving instructions
        const instructions = [
          'Continue straight ahead',
          'Keep following the road',
          'Stay on this route',
          'Continue driving',
          'Follow the path',
          'Keep going straight',
          'Stay on course',
          'Continue forward'
        ];
        instruction = instructions[i % instructions.length];
      }
      
      steps.push({
        lat,
        lng,
        instruction,
        distance: calculateDistance(start.lat, start.lng, lat, lng),
        duration: (i / numSteps) * (totalDistance / 50 * 60), // Assume 50km/h average
      });
    }
    
    return steps;
  };

  // Start navigation and trip together
  const startNavigationAndTrip = async () => {
    if (!currentLocation || !destination) {
      Alert.alert('Error', 'Please set a destination first');
      return;
    }
    
    try {
      console.log('🧭 Starting navigation and trip...');
      
      // Start navigation first
      const steps = calculateSimpleRoute(
        { lat: currentLocation.coords.latitude, lng: currentLocation.coords.longitude },
        { lat: destination.latitude, lng: destination.longitude }
      );
      
      setRouteSteps(steps);
      setCurrentStepIndex(0);
      setIsNavigating(true);
      setCurrentInstruction(steps[0]?.instruction || 'Start your journey');
      setNextInstruction(steps[1]?.instruction || 'Continue straight');
      setDistanceToNext(steps[1]?.distance || 0);
      
      // Calculate estimated arrival time
      const totalDuration = steps[steps.length - 1]?.duration || 0;
      const arrivalTime = new Date(Date.now() + totalDuration * 60 * 1000);
      setEstimatedArrival(arrivalTime.toLocaleTimeString());
      
      console.log('✅ Navigation started with', steps.length, 'steps');
      
      // Start trip with telemetry collection (completely non-blocking)
      handleStartTripWithNavigation().catch(tripError => {
        console.warn('⚠️ Trip start failed, but navigation continues:', tripError);
        // Keep navigation running even if trip fails
      });
      
    } catch (error) {
      console.error('Error starting navigation:', error);
      Alert.alert('Error', 'Failed to start navigation');
    }
  };

  // Stop navigation
  const stopNavigation = () => {
    console.log('🛑 Stopping navigation...');
    setIsNavigating(false);
    setCurrentInstruction(null);
    setNextInstruction(null);
    setDistanceToNext(null);
    setEstimatedArrival(null);
    setRouteSteps([]);
    setCurrentStepIndex(0);
    console.log('✅ Navigation stopped');
  };

  // Update navigation based on current location
  const updateNavigation = (currentLat: number, currentLng: number) => {
    if (!isNavigating || routeSteps.length === 0) return;
    
    // Find the closest step
    let closestStepIndex = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i < routeSteps.length; i++) {
      const distance = calculateDistance(currentLat, currentLng, routeSteps[i].lat, routeSteps[i].lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestStepIndex = i;
      }
    }
    
    // Update current step if we've moved significantly
    if (closestStepIndex !== currentStepIndex && minDistance < 0.1) { // Within 100m
      setCurrentStepIndex(closestStepIndex);
      setCurrentInstruction(routeSteps[closestStepIndex]?.instruction || 'Continue straight');
      
      if (closestStepIndex < routeSteps.length - 1) {
        setNextInstruction(routeSteps[closestStepIndex + 1]?.instruction || 'Continue straight');
        setDistanceToNext(calculateDistance(currentLat, currentLng, routeSteps[closestStepIndex + 1].lat, routeSteps[closestStepIndex + 1].lng));
      } else {
        setNextInstruction('You have arrived');
        setDistanceToNext(0);
      }
    }
  };

  // Simple trip end for immediate UI testing
  const handleEndTripSimple = async () => {
    try {
      const endTime = Date.now();
      const duration = tripStartTime ? endTime - tripStartTime : 0;
      
      // Stop telemetry collection properly
      await telemetryService.stopSession();
      console.log('✅ Telemetry session stopped');
      
      // Stop REAL MagicBlock PER telemetry collection
      await realMagicBlockPERService.stopSession();
      console.log('✅ REAL MagicBlock PER telemetry stopped');
      
      // Process telemetry through REAL MagicBlock PER and get transaction ID
      console.log('🔒 Processing telemetry through REAL MagicBlock PER...');
      const perResult = await realMagicBlockPERService.processTelemetryData(tripId || `trip_${Date.now()}`);
      console.log('✅ REAL MagicBlock PER processing completed:', perResult);
      console.log('📝 Transaction ID:', perResult.txId);
      
      // Get final safety metrics from both services
      const telemetryMetrics = telemetryService.getSessionMetrics();
      const magicBlockMetrics = perResult.metrics;
      
      // Calculate comprehensive safety score
      const safetyScore = Math.max(0, Math.min(10, 
        10 - (magicBlockMetrics.hardBrakes * 0.5) 
        - (magicBlockMetrics.hardAccelerations * 0.3) 
        - (magicBlockMetrics.harshCorners * 0.2)
        - (telemetryMetrics.speedingTime * 0.1)
        - (telemetryMetrics.phoneInteractionTime * 0.2)
      ));
      
      console.log('📊 Trip Summary:', {
        safetyScore: safetyScore.toFixed(1),
        distance: tripDistance.toFixed(2),
        duration: Math.floor(duration / 60000),
        telemetryMetrics,
        magicBlockMetrics
      });
      
      // Add points for trip completion
      const pointsEarned = await pointRewardService.addTripPoints(
        tripId || `trip_${Date.now()}`,
        safetyScore,
        tripDistance,
        duration
      );
      
      // Stop navigation when trip ends
      if (isNavigating) {
        stopNavigation();
      }

      // Reset trip state immediately for UI updates
      setTripId(null);
      setTripStartTime(null);
      setTripEndTime(endTime);
      setTripDistance(0);
      setTripDuration(0);
      setTripSafetyScore(safetyScore);
      setIsDriving(false);
      setTripStatus('completed');
      setSessionId(null);
      setIsNearDestination(false);
      
      // Update telemetry status
      setTelemetryStatus({ isCollecting: false, chunkIndex: 0 });
      
      console.log('✅ Trip ended - UI should show Start Trip button');
      
      // Show enhanced trip summary with telemetry data and transaction ID
      Alert.alert(
        'Trip Completed! 🎉',
        `Safety Score: ${safetyScore.toFixed(1)}/10\nDistance: ${tripDistance.toFixed(2)} km\nDuration: ${Math.floor(duration / 60000)} minutes\nPoints Earned: ${pointsEarned}\n\nTelemetry Data:\n• GPS Points: ${telemetryMetrics.gpsPoints || 0}\n• IMU Samples: ${telemetryMetrics.imuSamples || 0}\n• Hard Brakes: ${magicBlockMetrics.hardBrakes}\n• Hard Accelerations: ${magicBlockMetrics.hardAccelerations}\n• Harsh Corners: ${magicBlockMetrics.harshCorners}\n\n🔗 Transaction ID: ${perResult.txId}\n\nPoints will be added to your weekly airdrop!`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error ending trip:', error);
      Alert.alert('Error', 'Failed to end trip properly.');
    }
  };

  // Complete trip ending with data calculation
  const handleEndTripComplete = async () => {
    try {
      const endTime = Date.now();
      const duration = tripStartTime ? endTime - tripStartTime : 0;
      
      // Stop location monitoring
      if (locationWatchId) {
        locationWatchId.remove();
        setLocationWatchId(null);
      }
      
      // Stop REAL MagicBlock PER telemetry collection
      await realMagicBlockPERService.stopSession();
      
      // Stop telemetry collection
      stopTelemetryCollection();

      // Calculate final trip data
      const finalTripData = {
        tripId: tripId || `trip_${Date.now()}`,
        driverId: 'driver_test_001',
        startTime: tripStartTime || Date.now(),
        endTime: endTime,
        distance: tripDistance,
        duration: duration,
        startLat: currentLocation?.coords.latitude || 0,
        startLng: currentLocation?.coords.longitude || 0,
        endLat: currentLocation?.coords.latitude || 0,
        endLng: currentLocation?.coords.longitude || 0,
        ...tripMetrics,
      };

      // Send trip data to backend for scoring
      const BACKEND_URL = process.env.BACKEND_URL || 'http://192.168.1.12:3000';
      const tripResponse = await fetch(`${BACKEND_URL}/trip/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalTripData),
      });

      if (tripResponse.ok) {
        const tripResult = await tripResponse.json();
        setTripSafetyScore(tripResult.score || 0);
        
        console.log('✅ Trip completed:', tripResult);
        
        Alert.alert(
          'Trip Completed', 
          `Trip completed successfully!\n\nSafety Score: ${(tripResult.score || 0).toFixed(1)}/10\nDistance: ${tripDistance.toFixed(2)} km\nDuration: ${Math.floor(duration / 60000)} minutes`,
          [{ text: 'OK' }]
        );
      }

      // Reset trip state
      setTripId(null);
      setTripStartTime(null);
      setTripEndTime(endTime);
      setTripDistance(0);
      setTripDuration(0);
      setTripSafetyScore(0);
      setTripMetrics({
        hardBrakes: 0,
        hardAccelerations: 0,
        harshCorners: 0,
        speedingTime: 0,
        phoneInteraction: 0,
      });
      setIsDriving(false);
      setTripStatus('completed');
      setSessionId(null);
      setIsNearDestination(false);

    } catch (error) {
      console.error('Error ending trip:', error);
      Alert.alert('Error', 'Failed to end trip properly.');
    }
  };

  const handleEndTrip = async () => {
    try {
      // Stop telemetry collection
      await telemetryService.stopSession();

      // End backend session
      const BACKEND_URL = process.env.BACKEND_URL || 'http://192.168.1.12:3000';
      await fetch(`${BACKEND_URL}/session/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      // Finalize trip on backend (triggers scoring)
      const tripResponse = await fetch(`${BACKEND_URL}/trip/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          tripData: {
            tripId: `trip_${Date.now()}`,
            passengerId: 'self', // Solo driving
            startTime: Math.floor(tripData.startTime / 1000),
            endTime: Math.floor(Date.now() / 1000),
            distance: 0, // Will be calculated from GPS
            duration: Math.floor((Date.now() - tripData.startTime) / 1000),
            fare: 0,
            rating: 0,
          },
        }),
      });

      const tripResult = await tripResponse.json();

    setIsDriving(false);
    setTripStatus('completed');
    setTripData({
      ...tripData,
      endTime: Date.now(),
        distance: tripResult.distance || 0,
        duration: Math.floor((Date.now() - tripData.startTime) / 1000),
        fare: tripResult.fare || 0,
        rating: tripResult.score || 0,
      });

      Alert.alert(
        'Trip Completed', 
        `Trip score: ${tripResult.score || 'Calculating...'}\n\nYour trip summary is being processed.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error ending trip:', error);
      Alert.alert('Error', 'Failed to end trip. Please try again.');
    }
  };

  const handleClaimReward = () => {
    Alert.alert('Claim Reward', 'Would you like to claim your trip reward?');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme === 'light' ? '#f5f5f5' : '#1a1a1a' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme === 'light' ? '#000' : '#fff' }]}>Trip Map</Text>
        <Text style={[styles.subtitle, { color: theme === 'light' ? '#666' : '#aaa' }]}>Track your trips and earn rewards</Text>
      </View>
      
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={mapRegion}
          showsUserLocation={true}
          followsUserLocation={false}
        >
          {/* Only show current location and destination markers - no duplicates */}
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
              }}
              title="Current Location"
              description="You are here"
              pinColor="blue"
            />
          )}
          
          {destination && (
            <Marker
              coordinate={{
                latitude: destination.latitude,
                longitude: destination.longitude,
              }}
              title="Destination"
              description={destination.address}
              pinColor="red"
            />
          )}
          
          {/* Route Visualization */}
          {isNavigating && routeSteps.length > 0 ? (
            /* Navigation Route Polyline - curved route */
            <Polyline
              coordinates={routeSteps.map(step => ({
                latitude: step.lat,
                longitude: step.lng,
              }))}
              strokeColor="#007AFF"
              strokeWidth={4}
              lineDashPattern={[5, 5]}
            />
          ) : (
            /* Simple straight line when not navigating */
            currentLocation && destination && (
              <Polyline
                coordinates={[
                  {
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                  },
                  {
                    latitude: destination.latitude,
                    longitude: destination.longitude,
                  }
                ]}
                strokeColor="blue"
                strokeWidth={2}
              />
            )
          )}
        </MapView>
      </View>
      
      {/* Google Maps-inspired Location Search */}
      <View style={[styles.locationSearchContainer, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
        {/* Origin Field */}
        <TouchableOpacity 
          style={styles.locationField}
          onPress={() => {
            setSearchingLocation('origin');
            setShowLocationSearch(true);
          }}
        >
          <View style={styles.locationIcon}>
            <View style={[styles.locationDot, { backgroundColor: '#007AFF' }]} />
          </View>
          <TextInput
            style={[styles.locationInput, { color: theme === 'light' ? '#000' : '#fff' }]}
            value={originInput}
            onChangeText={(text) => {
              setOriginInput(text);
              if (text !== 'Your location') {
                searchLocation(text);
                setShowLocationSearch(true);
                setSearchingLocation('origin');
              }
            }}
            placeholder="Your location"
            placeholderTextColor={theme === 'light' ? '#666' : '#aaa'}
            editable={true}
          />
          <TouchableOpacity style={styles.locationMenu}>
            <Text style={styles.menuDots}>⋮</Text>
          </TouchableOpacity>
        </TouchableOpacity>
        
        {/* Swap Button */}
        <View style={styles.swapContainer}>
          <View style={styles.swapLine} />
          <TouchableOpacity style={styles.swapButton} onPress={handleSwapLocations}>
            <Text style={styles.swapIcon}>⇅</Text>
          </TouchableOpacity>
          <View style={styles.swapLine} />
        </View>
        
        {/* Destination Field */}
        <TouchableOpacity 
          style={styles.locationField}
          onPress={() => {
            setSearchingLocation('destination');
            setShowLocationSearch(true);
          }}
        >
          <View style={styles.locationIcon}>
            <Text style={styles.destinationPin}>📍</Text>
          </View>
          <TextInput
            style={[styles.locationInput, { color: theme === 'light' ? '#000' : '#fff' }]}
            value={destinationInput}
            onChangeText={(text) => {
              setDestinationInput(text);
              searchLocation(text);
              setShowLocationSearch(true);
              setSearchingLocation('destination');
            }}
            placeholder="Choose destination"
            placeholderTextColor={theme === 'light' ? '#666' : '#aaa'}
            editable={true}
          />
          <TouchableOpacity style={styles.locationMenu}>
            <Text style={styles.menuDots}>⋮</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
      
      {/* Search Results */}
      {showLocationSearch && searchResults.length > 0 && (
        <View style={[styles.searchResults, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
          {searchResults.map((result, index) => (
            <TouchableOpacity
              key={index}
              style={styles.searchResultItem}
              onPress={() => handleLocationSelect(result, searchingLocation!)}
            >
              <View style={styles.searchResultIcon}>
                <Text style={styles.searchResultPin}>📍</Text>
              </View>
              <Text style={[styles.searchResultText, { color: theme === 'light' ? '#000' : '#fff' }]}>
                {result.address}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Trip Status Display */}
      {isDriving && (
        <View style={[styles.tripStatusContainer, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
          <Text style={[styles.tripStatusTitle, { color: theme === 'light' ? '#000' : '#fff' }]}>Trip in Progress</Text>
          <Text style={[styles.warningText, { color: '#ff6b35' }]}>
            ⚠️ Keep app in foreground for best telemetry tracking
          </Text>
          
          {/* Navigation Display */}
          {isNavigating && (
            <View style={styles.navigationContainer}>
              <Text style={[styles.navigationTitle, { color: theme === 'light' ? '#000' : '#fff' }]}>
                🧭 Navigation Active
              </Text>
              <Text style={[styles.currentInstruction, { color: theme === 'light' ? '#000' : '#fff' }]}>
                {currentInstruction}
              </Text>
              {nextInstruction && (
                <Text style={[styles.nextInstruction, { color: theme === 'light' ? '#666' : '#aaa' }]}>
                  Next: {nextInstruction}
                </Text>
              )}
              {distanceToNext !== null && (
                <Text style={[styles.distanceText, { color: theme === 'light' ? '#666' : '#aaa' }]}>
                  {distanceToNext.toFixed(1)} km to next turn
                </Text>
              )}
              {estimatedArrival && (
                <Text style={[styles.arrivalText, { color: theme === 'light' ? '#666' : '#aaa' }]}>
                  ETA: {estimatedArrival}
                </Text>
              )}
            </View>
          )}
          
          <View style={styles.tripStatusGrid}>
            <View style={styles.tripStatusItem}>
              <Text style={[styles.tripStatusValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
                {tripDistance.toFixed(2)} km
              </Text>
              <Text style={[styles.tripStatusLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Distance</Text>
            </View>
            <View style={styles.tripStatusItem}>
              <Text style={[styles.tripStatusValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
                {Math.floor(tripDuration / 60000)}m
              </Text>
              <Text style={[styles.tripStatusLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Duration</Text>
            </View>
            <View style={styles.tripStatusItem}>
              <Text style={[styles.tripStatusValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
                {isNearDestination ? '🎯' : '📍'}
              </Text>
              <Text style={[styles.tripStatusLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Status</Text>
            </View>
          </View>
          {isNearDestination && (
            <Text style={[styles.destinationAlert, { color: '#34C759' }]}>
              🎯 You're near your destination! Trip will end automatically.
            </Text>
          )}
        </View>
      )}
      
      <View style={styles.controlsContainer}>
        {!isDriving ? (
          <>
            {/* Combined Navigation + Trip Button */}
            {destination && (
              <TouchableOpacity 
                style={[styles.startButton, { backgroundColor: '#007AFF' }]}
                onPress={startNavigationAndTrip}
              >
                <Text style={styles.buttonText}>🧭 Start Navigation & Trip</Text>
              </TouchableOpacity>
            )}
            
            {/* Stop Navigation Button (only when navigating but not driving) */}
            {isNavigating && !isDriving && (
              <TouchableOpacity 
                style={[styles.navigationButton, { backgroundColor: '#FF9500' }]}
                onPress={stopNavigation}
              >
                <Text style={styles.buttonText}>🛑 Stop Navigation</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
          <TouchableOpacity 
            style={[styles.endButton, { backgroundColor: '#FF3B30' }]}
            onPress={handleEndTripSimple}
          >
            <Text style={styles.buttonText}>End Trip</Text>
          </TouchableOpacity>
            
            {/* Telemetry Status Indicator */}
            <View style={[styles.telemetryStatus, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: telemetryStatus.isCollecting ? '#34C759' : '#FF3B30' }]} />
                <Text style={[styles.statusText, { color: theme === 'light' ? '#000' : '#fff' }]}>
                  {telemetryStatus.isCollecting ? 'Collecting Data' : 'Not Collecting'}
                </Text>
              </View>
              <Text style={[styles.statusSubtext, { color: theme === 'light' ? '#666' : '#aaa' }]}>
                Chunks uploaded: {telemetryStatus.chunkIndex}
              </Text>
            </View>
          </>
        )}
      </View>
      
      {tripStatus === 'completed' && (
        <View style={[styles.summaryCard, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
          <Text style={[styles.summaryTitle, { color: theme === 'light' ? '#000' : '#fff' }]}>Trip Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Distance</Text>
            <Text style={[styles.summaryValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
              {tripData.distance} km
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Duration</Text>
            <Text style={[styles.summaryValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
              {Math.floor(tripData.duration / 60)} min
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Fare</Text>
            <Text style={[styles.summaryValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
              {tripData.fare / 1000000000} SOL
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme === 'light' ? '#666' : '#aaa' }]}>Rating</Text>
            <Text style={[styles.summaryValue, { color: theme === 'light' ? '#000' : '#fff' }]}>
              {tripData.rating}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.claimButton, { backgroundColor: '#007AFF' }]}
            onPress={handleClaimReward}
          >
            <Text style={styles.claimButtonText}>Claim Reward</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={[styles.section, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
        <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#000' : '#fff' }]}>Trip History</Text>
        <View style={styles.historyContainer}>
          <View style={styles.historyItem}>
            <Text style={[styles.historyText, { color: theme === 'light' ? '#000' : '#fff' }]}>Trip #12345</Text>
            <Text style={[styles.historyText, { color: theme === 'light' ? '#666' : '#aaa' }]}>12.5 km • 30 min</Text>
          </View>
          <View style={styles.historyItem}>
            <Text style={[styles.historyText, { color: theme === 'light' ? '#000' : '#fff' }]}>Trip #12344</Text>
            <Text style={[styles.historyText, { color: theme === 'light' ? '#666' : '#aaa' }]}>8.2 km • 20 min</Text>
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
  mapContainer: {
    height: 300,
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsContainer: {
    alignItems: 'center',
    margin: 20,
  },
  startButton: {
    padding: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  endButton: {
    padding: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  summaryCard: {
    margin: 20,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  claimButton: {
    marginTop: 15,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  claimButtonText: {
    color: '#fff',
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
  historyContainer: {
    marginTop: 10,
  },
  historyItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyText: {
    fontSize: 14,
  },
  telemetryStatus: {
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    width: '80%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusSubtext: {
    fontSize: 12,
    marginLeft: 20,
  },
  // Destination Input Styles
  destinationContainer: {
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  destinationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  destinationInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  destinationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  destinationButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  destinationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Location Info Styles
  locationInfo: {
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 14,
    marginBottom: 5,
  },
  setDestinationButton: {
    backgroundColor: '#34C759',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  setDestinationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Google Maps-inspired Location Search Styles
  locationSearchContainer: {
    margin: 15,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  locationField: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  destinationPin: {
    fontSize: 16,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  locationMenu: {
    padding: 8,
  },
  menuDots: {
    fontSize: 18,
    color: '#666',
  },
  swapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  swapLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  swapButton: {
    marginHorizontal: 16,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapIcon: {
    fontSize: 16,
    color: '#666',
  },
  searchResults: {
    marginHorizontal: 15,
    marginTop: -5,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  searchResultPin: {
    fontSize: 16,
  },
  searchResultText: {
    flex: 1,
    fontSize: 16,
  },
  // Trip Status Display Styles
  tripStatusContainer: {
    margin: 15,
    padding: 15,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  tripStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  navigationContainer: {
    marginVertical: 10,
    padding: 15,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  navigationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  currentInstruction: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  nextInstruction: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 3,
  },
  distanceText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 3,
  },
  arrivalText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  navigationButton: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  tripStatusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tripStatusItem: {
    alignItems: 'center',
  },
  tripStatusValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tripStatusLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  destinationAlert: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
});

export default MapScreen;