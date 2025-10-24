// Location Search Configuration
// Replace 'YOUR_GOOGLE_PLACES_API_KEY' with your actual Google Places API key
// To get a Google Places API key:
// 1. Go to Google Cloud Console (https://console.cloud.google.com/)
// 2. Create a new project or select existing one
// 3. Enable the Places API
// 4. Create credentials (API Key)
// 5. Restrict the API key to your app's bundle ID/package name for security

export const LOCATION_SEARCH_CONFIG = {
  // Google Places API Key - Replace with your actual key
  GOOGLE_PLACES_API_KEY: 'YOUR_GOOGLE_PLACES_API_KEY',
  
  // API endpoints
  GOOGLE_PLACES_BASE_URL: 'https://maps.googleapis.com/maps/api/place',
  NOMINATIM_BASE_URL: 'https://nominatim.openstreetmap.org',
  
  // Search settings
  DEFAULT_SEARCH_LIMIT: 5,
  DEBOUNCE_DELAY: 300, // milliseconds
  
  // Cache settings
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_SIZE: 100,
  
  // Fallback settings
  ENABLE_FALLBACK_SUGGESTIONS: true,
  MALAYSIA_COUNTRY_CODE: 'my',
};

// Instructions for setting up Google Places API:
/*
1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Places API
   - Geocoding API
   - Maps JavaScript API (optional, for web)
4. Go to "Credentials" and create an API Key
5. Restrict the API Key:
   - Application restrictions: Select your platform (Android/iOS)
   - API restrictions: Select "Restrict key" and choose:
     * Places API
     * Geocoding API
6. Copy the API key and replace 'YOUR_GOOGLE_PLACES_API_KEY' above

Security Note:
- Never commit your actual API key to version control
- Use environment variables or secure storage for production
- Consider implementing API key rotation
- Monitor your API usage to avoid unexpected charges
*/

