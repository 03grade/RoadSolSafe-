// API Service for fetching real trip data
const BACKEND_URL = process.env.BACKEND_URL || 'http://192.168.1.12:3000';

export interface TripSummary {
  tripId: string;
  driverId: string;
  startTime: number;
  endTime: number;
  distance: number;
  duration: number;
  safetyScore: number;
  rating: number;
  startLocation: { latitude: number; longitude: number };
  endLocation: { latitude: number; longitude: number };
  route: { latitude: number; longitude: number }[];
  metrics: {
    hardBrakes: number;
    hardAccelerations: number;
    harshCorners: number;
    speedingTime: number;
    phoneInteraction: number;
  };
}

export interface TripHistoryItem {
  tripId: string;
  date: string;
  distance: number;
  duration: number;
  safetyScore: number;
  rating: number;
}

class TripDataService {
  // Fetch trip summary for a specific trip
  async getTripSummary(tripId: string): Promise<TripSummary | null> {
    try {
      console.log('📊 Fetching trip summary for:', tripId);
      const response = await fetch(`${BACKEND_URL}/trip/summary/${tripId}`);
      if (!response.ok) {
        console.warn('Trip summary endpoint not available, using mock data');
        return this.getMockTripSummary(tripId);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching trip summary:', error);
      return this.getMockTripSummary(tripId);
    }
  }

  // Fetch trip history for a driver
  async getTripHistory(driverId: string): Promise<TripHistoryItem[]> {
    try {
      console.log('📊 Fetching trip history for:', driverId);
      const response = await fetch(`${BACKEND_URL}/trip/history/${driverId}`);
      if (!response.ok) {
        console.warn('Trip history endpoint not available, using mock data');
        return this.getMockTripHistory();
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching trip history:', error);
      return this.getMockTripHistory();
    }
  }

  // Fetch latest trip for a driver
  async getLatestTrip(driverId: string): Promise<TripSummary | null> {
    try {
      console.log('📊 Fetching latest trip for:', driverId);
      const response = await fetch(`${BACKEND_URL}/trip/latest/${driverId}`);
      if (!response.ok) {
        console.warn('Latest trip endpoint not available, using mock data');
        return this.getMockLatestTrip();
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching latest trip:', error);
      return this.getMockLatestTrip();
    }
  }

  // Mock data methods for development
  private getMockTripSummary(tripId: string): TripSummary {
    return {
      tripId,
      driverId: 'driver_test_001',
      startTime: Date.now() - 1800000, // 30 minutes ago
      endTime: Date.now(),
      distance: 12.5,
      duration: 1800, // 30 minutes
      safetyScore: 8.5,
      rating: 4.2,
      startLocation: { latitude: 37.784278, longitude: -122.401543 },
      endLocation: { latitude: 37.787278, longitude: -122.404543 },
      route: [
        { latitude: 37.784278, longitude: -122.401543 },
        { latitude: 37.785278, longitude: -122.402543 },
        { latitude: 37.786278, longitude: -122.403543 },
        { latitude: 37.787278, longitude: -122.404543 },
      ],
      metrics: {
        hardBrakes: 2,
        hardAccelerations: 1,
        harshCorners: 0,
        speedingTime: 120, // 2 minutes
        phoneInteraction: 30, // 30 seconds
      },
    };
  }

  private getMockTripHistory(): TripHistoryItem[] {
    const now = Date.now();
    return [
      {
        tripId: 'trip_1',
        date: new Date(now - 86400000).toISOString(), // 1 day ago
        distance: 15.2,
        duration: 2100,
        safetyScore: 9.1,
        rating: 4.5,
      },
      {
        tripId: 'trip_2',
        date: new Date(now - 172800000).toISOString(), // 2 days ago
        distance: 8.7,
        duration: 1200,
        safetyScore: 7.8,
        rating: 4.0,
      },
      {
        tripId: 'trip_3',
        date: new Date(now - 259200000).toISOString(), // 3 days ago
        distance: 22.1,
        duration: 2700,
        safetyScore: 8.9,
        rating: 4.3,
      },
    ];
  }

  private getMockLatestTrip(): TripSummary {
    return this.getMockTripSummary('trip_latest');
  }
}

export default new TripDataService();
