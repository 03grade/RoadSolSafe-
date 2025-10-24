import * as Location from 'expo-location';
import { LOCATION_SEARCH_CONFIG } from '../config/locationSearchConfig';

export interface LocationSuggestion {
  id: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  formattedAddress: string;
  placeId?: string;
  type?: string;
}

export interface SearchResult {
  suggestions: LocationSuggestion[];
  source: 'google' | 'nominatim' | 'expo' | 'fallback';
}

class LocationSearchService {
  private cache: Map<string, SearchResult> = new Map();
  private readonly CACHE_DURATION = LOCATION_SEARCH_CONFIG.CACHE_DURATION;
  private readonly MAX_CACHE_SIZE = LOCATION_SEARCH_CONFIG.MAX_CACHE_SIZE;

  // API configuration from config file
  private readonly GOOGLE_PLACES_API_KEY = LOCATION_SEARCH_CONFIG.GOOGLE_PLACES_API_KEY;
  private readonly GOOGLE_PLACES_BASE_URL = LOCATION_SEARCH_CONFIG.GOOGLE_PLACES_BASE_URL;
  private readonly NOMINATIM_BASE_URL = LOCATION_SEARCH_CONFIG.NOMINATIM_BASE_URL;

  /**
   * Search for locations using multiple APIs with fallback
   */
  async searchLocations(query: string, limit: number = 5): Promise<SearchResult> {
    if (!query || query.length < 2) {
      return { suggestions: [], source: 'fallback' };
    }

    const cacheKey = query.toLowerCase().trim();
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Try Google Places API first (most accurate)
      if (this.GOOGLE_PLACES_API_KEY && this.GOOGLE_PLACES_API_KEY !== 'YOUR_GOOGLE_PLACES_API_KEY') {
        const googleResults = await this.searchGooglePlaces(query, limit);
        if (googleResults.suggestions.length > 0) {
          this.setCache(cacheKey, googleResults);
          return googleResults;
        }
      }

      // Fallback to Nominatim (OpenStreetMap)
      const nominatimResults = await this.searchNominatim(query, limit);
      if (nominatimResults.suggestions.length > 0) {
        this.setCache(cacheKey, nominatimResults);
        return nominatimResults;
      }

      // Fallback to Expo Location
      const expoResults = await this.searchExpoLocation(query, limit);
      this.setCache(cacheKey, expoResults);
      return expoResults;

    } catch (error) {
      console.error('Location search error:', error);
      
      // Return fallback suggestions
      const fallbackResults = this.getFallbackSuggestions(query, limit);
      this.setCache(cacheKey, fallbackResults);
      return fallbackResults;
    }
  }

  /**
   * Search using Google Places API
   */
  private async searchGooglePlaces(query: string, limit: number): Promise<SearchResult> {
    try {
      const url = `${this.GOOGLE_PLACES_BASE_URL}/autocomplete/json?input=${encodeURIComponent(query)}&key=${this.GOOGLE_PLACES_API_KEY}&types=geocode&components=country:${LOCATION_SEARCH_CONFIG.MALAYSIA_COUNTRY_CODE}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${data.status}`);
      }

      const suggestions: LocationSuggestion[] = [];

      for (const prediction of data.predictions.slice(0, limit)) {
        try {
          // Get place details for coordinates
          const detailsUrl = `${this.GOOGLE_PLACES_BASE_URL}/details/json?place_id=${prediction.place_id}&key=${this.GOOGLE_PLACES_API_KEY}&fields=geometry,formatted_address`;
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();

          if (detailsData.status === 'OK' && detailsData.result.geometry) {
            suggestions.push({
              id: prediction.place_id,
              address: prediction.description,
              coordinates: {
                latitude: detailsData.result.geometry.location.lat,
                longitude: detailsData.result.geometry.location.lng,
              },
              formattedAddress: detailsData.result.formatted_address,
              placeId: prediction.place_id,
              type: 'google',
            });
          }
        } catch (detailError) {
          console.warn('Error getting place details:', detailError);
        }
      }

      return { suggestions, source: 'google' };
    } catch (error) {
      console.error('Google Places API error:', error);
      throw error;
    }
  }

  /**
   * Search using OpenStreetMap Nominatim API
   */
  private async searchNominatim(query: string, limit: number): Promise<SearchResult> {
    try {
      const url = `${this.NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&countrycodes=${LOCATION_SEARCH_CONFIG.MALAYSIA_COUNTRY_CODE}&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RoadSolSafe/1.0', // Required by Nominatim
        },
      });
      
      const data = await response.json();

      const suggestions: LocationSuggestion[] = data.map((item: any, index: number) => ({
        id: `nominatim-${item.place_id || index}`,
        address: item.display_name,
        coordinates: {
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        },
        formattedAddress: item.display_name,
        type: 'nominatim',
      }));

      return { suggestions, source: 'nominatim' };
    } catch (error) {
      console.error('Nominatim API error:', error);
      throw error;
    }
  }

  /**
   * Search using Expo Location API
   */
  private async searchExpoLocation(query: string, limit: number): Promise<SearchResult> {
    try {
      const results = await Location.geocodeAsync(query);
      
      const suggestions: LocationSuggestion[] = await Promise.all(
        results.slice(0, limit).map(async (result, index) => {
          try {
            const reverseGeocode = await Location.reverseGeocodeAsync(result);
            const address = reverseGeocode[0];
            const formattedAddress = `${address.street || ''} ${address.city || ''} ${address.region || ''} ${address.country || ''}`.trim();
            
            return {
              id: `expo-${index}`,
              address: query,
              coordinates: result,
              formattedAddress: formattedAddress || query,
              type: 'expo',
            };
          } catch (reverseError) {
            return {
              id: `expo-${index}`,
              address: query,
              coordinates: result,
              formattedAddress: query,
              type: 'expo',
            };
          }
        })
      );

      return { suggestions, source: 'expo' };
    } catch (error) {
      console.error('Expo Location API error:', error);
      throw error;
    }
  }

  /**
   * Get fallback suggestions for common locations in Malaysia
   */
  private getFallbackSuggestions(query: string, limit: number): SearchResult {
    const malaysiaLocations = [
      { name: 'Kuala Lumpur City Centre', lat: 3.1390, lng: 101.6869 },
      { name: 'Petaling Jaya', lat: 3.1073, lng: 101.6085 },
      { name: 'Subang Jaya', lat: 3.0438, lng: 101.5806 },
      { name: 'Shah Alam', lat: 3.0733, lng: 101.5185 },
      { name: 'Klang', lat: 3.0333, lng: 101.4500 },
      { name: 'Kajang', lat: 2.9927, lng: 101.7909 },
      { name: 'Ampang', lat: 3.1478, lng: 101.7003 },
      { name: 'Cheras', lat: 3.0833, lng: 101.7500 },
      { name: 'Kepong', lat: 3.2100, lng: 101.6400 },
      { name: 'Wangsa Maju', lat: 3.2000, lng: 101.7300 },
      { name: 'Setapak', lat: 3.2000, lng: 101.7000 },
      { name: 'Gombak', lat: 3.2500, lng: 101.6500 },
      { name: 'Batu Caves', lat: 3.2386, lng: 101.6839 },
      { name: 'Selayang', lat: 3.2500, lng: 101.6500 },
      { name: 'Rawang', lat: 3.3167, lng: 101.5833 },
    ];

    const filtered = malaysiaLocations.filter(location =>
      location.name.toLowerCase().includes(query.toLowerCase())
    );

    const suggestions: LocationSuggestion[] = filtered.slice(0, limit).map((location, index) => ({
      id: `fallback-${index}`,
      address: location.name,
      coordinates: {
        latitude: location.lat,
        longitude: location.lng,
      },
      formattedAddress: location.name,
      type: 'fallback',
    }));

    return { suggestions, source: 'fallback' };
  }

  /**
   * Get current location and reverse geocode it
   */
  async getCurrentLocation(): Promise<LocationSuggestion | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      try {
        const reverseGeocode = await Location.reverseGeocodeAsync(coords);
        const address = reverseGeocode[0];
        const formattedAddress = `${address.street || ''} ${address.city || ''} ${address.region || ''} ${address.country || ''}`.trim();

        return {
          id: 'current-location',
          address: formattedAddress,
          coordinates: coords,
          formattedAddress: formattedAddress,
          type: 'current',
        };
      } catch (reverseError) {
        return {
          id: 'current-location',
          address: 'Current Location',
          coordinates: coords,
          formattedAddress: 'Current Location',
          type: 'current',
        };
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): SearchResult | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - (cached as any).timestamp < this.CACHE_DURATION) {
      return cached;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, result: SearchResult): void {
    // Clean up cache if it's too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      ...result,
      timestamp: Date.now(),
    } as any);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export default new LocationSearchService();

