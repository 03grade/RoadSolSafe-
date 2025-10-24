// Complete Telemetry Collection Service for DePIN Platform
import * as Location from 'expo-location';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { AppState, Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Background task name
const BACKGROUND_LOCATION_TASK = 'background-location-task';

// Telemetry data types
interface GPSData {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: number;
}

interface IMUData {
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
  timestamp: number;
}

interface TelemetryChunk {
  sessionId: string;
  chunkIndex: number;
  startTime: number;
  endTime: number;
  gpsData: GPSData[];
  imuData: IMUData[];
  phoneInteractionDetected: boolean;
  deviceFlags: {
    isScreenOn: boolean;
    batteryLevel: number;
    networkType: string;
  };
}

class TelemetryService {
  private sessionId: string | null = null;
  private isCollecting: boolean = false;
  private chunkIndex: number = 0;
  private appStateSubscription: any = null;
  
  // Data buffers
  private gpsBuffer: GPSData[] = [];
  private imuBuffer: IMUData[] = [];
  
  // Total session metrics (accumulated)
  private totalGpsPoints: number = 0;
  private totalImuSamples: number = 0;
  private sessionStartTime: number = 0;
  
  // Sensor subscriptions
  private accelerometerSubscription: any = null;
  private gyroscopeSubscription: any = null;
  private locationSubscription: any = null;
  
  // Chunk settings
  private readonly CHUNK_DURATION_MS = 10000; // 10 seconds
  private readonly GPS_FREQUENCY_HZ = 1; // 1 Hz
  private readonly IMU_FREQUENCY_HZ = 50; // 50 Hz
  
  // Phone interaction tracking
  private appState: string = 'active';
  private lastInteractionTime: number = 0;

  constructor() {
    // Register background location task
    this.registerBackgroundTask();
    
    // Monitor app state for phone interaction detection
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  // ==================== PERMISSION REQUESTS ====================
  
  async requestPermissions(): Promise<boolean> {
    try {
      // Request location permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.error('Foreground location permission denied');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.error('Background location permission denied');
        return false;
      }

      console.log('✅ All permissions granted');
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  // ==================== SESSION MANAGEMENT ====================
  
  async startSession(sessionId: string): Promise<boolean> {
    try {
      console.log('📡 Starting telemetry session:', sessionId);
      
      if (this.isCollecting) {
        console.warn('⚠️ Session already active');
        return false;
      }

      // Check permissions
      console.log('🔐 Checking permissions...');
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.error('❌ Missing required permissions');
        throw new Error('Missing required permissions');
      }
      console.log('✅ Permissions granted');

      this.sessionId = sessionId;
      this.isCollecting = true;
      this.chunkIndex = 0;
      this.gpsBuffer = [];
      this.imuBuffer = [];
      this.totalGpsPoints = 0;
      this.totalImuSamples = 0;
      this.sessionStartTime = Date.now();

      // Start GPS collection
      console.log('📍 Starting GPS collection...');
      await this.startGPSCollection();
      console.log('✅ GPS collection started');
      
      // Start IMU collection
      console.log('📱 Starting IMU collection...');
      this.startIMUCollection();
      console.log('✅ IMU collection started');
      
      // Skip background location tracking in Expo Go (not supported on Android)
      console.log('⚠️ Skipping background location tracking (Expo Go limitation)');
      
      // Start chunk upload scheduler
      console.log('📤 Starting chunk upload scheduler...');
      this.scheduleChunkUploads();
      console.log('✅ Chunk upload scheduler started');

      // Start app state monitoring for foreground tracking
      console.log('📱 Starting app state monitoring...');
      this.startAppStateMonitoring();
      console.log('✅ App state monitoring started');

      console.log('🎉 Telemetry session fully started:', sessionId);
      return true;
    } catch (error) {
      console.error('❌ Failed to start session:', error);
      this.isCollecting = false;
      this.sessionId = null;
      return false;
    }
  }

  async stopSession(): Promise<void> {
    try {
      console.log('🛑 Stopping telemetry session...');
      this.isCollecting = false;

      // Stop all subscriptions
      console.log('📱 Stopping sensor subscriptions...');
      if (this.accelerometerSubscription) {
        this.accelerometerSubscription.remove();
        this.accelerometerSubscription = null;
        console.log('✅ Accelerometer subscription stopped');
      }

      if (this.gyroscopeSubscription) {
        this.gyroscopeSubscription.remove();
        this.gyroscopeSubscription = null;
        console.log('✅ Gyroscope subscription stopped');
      }

      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
        console.log('✅ Location subscription stopped');
      }

      // Skip background location cleanup (not used in Expo Go)
      console.log('⚠️ Skipping background location cleanup (Expo Go limitation)');

      // Stop app state monitoring
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
        console.log('✅ App state monitoring stopped');
      }

      // Upload remaining data
      console.log('📤 Uploading final chunk...');
      await this.uploadFinalChunk();

      console.log('✅ Telemetry session stopped');
      
      this.sessionId = null;
      this.gpsBuffer = [];
      this.imuBuffer = [];
      this.totalGpsPoints = 0;
      this.totalImuSamples = 0;
      this.sessionStartTime = 0;
    } catch (error) {
      console.error('❌ Error stopping session:', error);
    }
  }

  // ==================== APP STATE MONITORING ====================
  
  private startAppStateMonitoring(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (this.isCollecting) {
        if (nextAppState === 'active') {
          console.log('📱 App became active - telemetry continues');
        } else if (nextAppState === 'background') {
          console.log('⚠️ App went to background - telemetry may be limited in Expo Go');
        } else if (nextAppState === 'inactive') {
          console.log('⚠️ App became inactive - telemetry paused');
        }
      }
    });
  }

  // ==================== GPS COLLECTION ====================
  
  private async startGPSCollection(): Promise<void> {
    try {
      // High-accuracy GPS with 1Hz updates
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000 / this.GPS_FREQUENCY_HZ, // 1000ms for 1Hz
          distanceInterval: 0, // Collect all updates
        },
        (location) => {
          const gpsData: GPSData = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            speed: location.coords.speed || 0,
            heading: location.coords.heading || 0,
            accuracy: location.coords.accuracy || 0,
            timestamp: location.timestamp,
          };

          this.gpsBuffer.push(gpsData);
          
          // Optional: Log for debugging
          // console.log('GPS:', gpsData);
        }
      );

      console.log('✅ GPS collection started at 1Hz');
    } catch (error) {
      console.error('GPS collection error:', error);
    }
  }

  // ==================== IMU COLLECTION ====================
  
  private startIMUCollection(): void {
    try {
      // Set sensor update interval
      Accelerometer.setUpdateInterval(1000 / this.IMU_FREQUENCY_HZ); // 20ms for 50Hz
      Gyroscope.setUpdateInterval(1000 / this.IMU_FREQUENCY_HZ);

      // Subscribe to accelerometer
      this.accelerometerSubscription = Accelerometer.addListener((accelData) => {
        const timestamp = Date.now();
        
        // Store with corresponding gyroscope data
        const existingEntry = this.imuBuffer.find(
          (entry) => Math.abs(entry.timestamp - timestamp) < 10
        );

        if (existingEntry) {
          existingEntry.accelerometer = {
            x: accelData.x,
            y: accelData.y,
            z: accelData.z,
          };
        } else {
          this.imuBuffer.push({
            accelerometer: {
              x: accelData.x,
              y: accelData.y,
              z: accelData.z,
            },
            gyroscope: { x: 0, y: 0, z: 0 },
            timestamp,
          });
        }
      });

      // Subscribe to gyroscope
      this.gyroscopeSubscription = Gyroscope.addListener((gyroData) => {
        const timestamp = Date.now();
        
        const existingEntry = this.imuBuffer.find(
          (entry) => Math.abs(entry.timestamp - timestamp) < 10
        );

        if (existingEntry) {
          existingEntry.gyroscope = {
            x: gyroData.x,
            y: gyroData.y,
            z: gyroData.z,
          };
        } else {
          this.imuBuffer.push({
            accelerometer: { x: 0, y: 0, z: 0 },
            gyroscope: {
              x: gyroData.x,
              y: gyroData.y,
              z: gyroData.z,
            },
            timestamp,
          });
        }
      });

      console.log('✅ IMU collection started at 50Hz');
    } catch (error) {
      console.error('IMU collection error:', error);
    }
  }

  // ==================== BACKGROUND TRACKING ====================
  
  private async startBackgroundLocationTracking(): Promise<void> {
    try {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000, // 1 second
        distanceInterval: 0,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'RoadSolSafe - Trip in Progress',
          notificationBody: 'Collecting safe driving data...',
          notificationColor: '#007AFF',
        },
      });

      console.log('✅ Background location tracking started');
    } catch (error) {
      console.error('Background tracking error:', error);
    }
  }

  private registerBackgroundTask(): void {
    TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
      if (error) {
        console.error('Background task error:', error);
        return;
      }

      if (data) {
        const { locations } = data;
        
        // Store locations for later processing
        await AsyncStorage.setItem(
          'background_locations',
          JSON.stringify(locations)
        );
      }
    });
  }

  // ==================== CHUNK UPLOAD ====================
  
  private scheduleChunkUploads(): void {
    setInterval(async () => {
      if (this.isCollecting && this.sessionId) {
        await this.createAndUploadChunk();
      }
    }, this.CHUNK_DURATION_MS);
  }

  private async createAndUploadChunk(): Promise<void> {
    try {
      if (this.gpsBuffer.length === 0 && this.imuBuffer.length === 0) {
        return; // No data to upload
      }

      const now = Date.now();
      const chunk: TelemetryChunk = {
        sessionId: this.sessionId!,
        chunkIndex: this.chunkIndex++,
        startTime: now - this.CHUNK_DURATION_MS,
        endTime: now,
        gpsData: [...this.gpsBuffer],
        imuData: [...this.imuBuffer],
        phoneInteractionDetected: this.detectPhoneInteraction(),
        deviceFlags: await this.getDeviceFlags(),
      };

      // Accumulate totals before clearing buffers
      this.totalGpsPoints += this.gpsBuffer.length;
      this.totalImuSamples += this.imuBuffer.length;

      // Clear buffers
      this.gpsBuffer = [];
      this.imuBuffer = [];

      // Upload chunk to backend
      await this.uploadChunk(chunk);

      console.log(`✅ Uploaded chunk ${chunk.chunkIndex} with ${chunk.gpsData.length} GPS points and ${chunk.imuData.length} IMU samples`);
    } catch (error) {
      console.error('Chunk creation/upload error:', error);
    }
  }

  private async uploadChunk(chunk: TelemetryChunk): Promise<void> {
    try {
      console.log(`📤 Uploading chunk ${chunk.chunkIndex} to backend...`);
      
      // TODO: Replace with your actual backend URL
      const BACKEND_URL = process.env.BACKEND_URL || 'http://192.168.1.12:3000';
      console.log('🌐 Backend URL:', BACKEND_URL);

      const response = await fetch(`${BACKEND_URL}/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: chunk.sessionId,
          telemetryData: chunk,
        }),
      });

      if (!response.ok) {
        console.error(`❌ Upload failed: ${response.status} ${response.statusText}`);
        throw new Error(`Upload failed: ${response.status}`);
      }

      console.log(`✅ Chunk ${chunk.chunkIndex} uploaded successfully`);

      // Store offline if upload fails
    } catch (error) {
      console.error('❌ Error uploading chunk:', error);
      await this.storeChunkOffline(chunk);
    }
  }

  private async uploadFinalChunk(): Promise<void> {
    if (this.gpsBuffer.length > 0 || this.imuBuffer.length > 0) {
      await this.createAndUploadChunk();
    }
  }

  // ==================== PHONE INTERACTION DETECTION ====================
  
  private handleAppStateChange = (nextAppState: string) => {
    if (this.appState === 'active' && nextAppState.match(/inactive|background/)) {
      // App went to background
      this.lastInteractionTime = Date.now();
    }
    this.appState = nextAppState;
  };

  private detectPhoneInteraction(): boolean {
    // Detect if phone was used in last chunk duration
    const timeSinceInteraction = Date.now() - this.lastInteractionTime;
    return timeSinceInteraction < this.CHUNK_DURATION_MS;
  }

  // ==================== DEVICE FLAGS ====================
  
  private async getDeviceFlags(): Promise<TelemetryChunk['deviceFlags']> {
    try {
      // Get battery level (requires expo-battery)
      // For now, return mock data
      return {
        isScreenOn: this.appState === 'active',
        batteryLevel: 100, // TODO: Implement battery level detection
        networkType: 'wifi', // TODO: Implement network type detection
      };
    } catch (error) {
      console.error('Error getting device flags:', error);
      return {
        isScreenOn: false,
        batteryLevel: 100,
        networkType: 'unknown',
      };
    }
  }

  // ==================== OFFLINE STORAGE ====================
  
  private async storeChunkOffline(chunk: TelemetryChunk): Promise<void> {
    try {
      const key = `offline_chunk_${chunk.sessionId}_${chunk.chunkIndex}`;
      await AsyncStorage.setItem(key, JSON.stringify(chunk));
      console.log('Stored chunk offline:', key);
    } catch (error) {
      console.error('Error storing chunk offline:', error);
    }
  }

  async syncOfflineChunks(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter((key) => key.startsWith('offline_chunk_'));

      for (const key of offlineKeys) {
        const chunkJson = await AsyncStorage.getItem(key);
        if (chunkJson) {
          const chunk = JSON.parse(chunkJson) as TelemetryChunk;
          await this.uploadChunk(chunk);
          await AsyncStorage.removeItem(key);
        }
      }

      console.log('✅ Synced all offline chunks');
    } catch (error) {
      console.error('Error syncing offline chunks:', error);
    }
  }

  // ==================== STATUS ====================
  
  getStatus(): { isCollecting: boolean; sessionId: string | null; chunkIndex: number } {
    return {
      isCollecting: this.isCollecting,
      sessionId: this.sessionId,
      chunkIndex: this.chunkIndex,
    };
  }

  // Get session metrics for trip summary
  getSessionMetrics(): {
    gpsPoints: number;
    imuSamples: number;
    speedingTime: number;
    phoneInteractionTime: number;
    sessionDuration: number;
  } {
    return {
      gpsPoints: this.totalGpsPoints + this.gpsBuffer.length, // Include current buffer
      imuSamples: this.totalImuSamples + this.imuBuffer.length, // Include current buffer
      speedingTime: 0, // TODO: Calculate from GPS data
      phoneInteractionTime: 0, // TODO: Calculate from device flags
      sessionDuration: this.sessionStartTime ? Math.floor((Date.now() - this.sessionStartTime) / 1000) : 0,
    };
  }
}

// Export singleton instance
export const telemetryService = new TelemetryService();
export default telemetryService;

