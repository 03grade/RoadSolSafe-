// Enhanced telemetry service with validation and processing
import { logger } from '../utils/logger.js';
import { query } from '../database/index.js';
import { validateSession } from './sessionService.js';

// Enhanced telemetry service
export const submitTelemetry = async (sessionId: string, telemetryData: any) => {
  try {
    // Validate session
    const session = await validateSession(sessionId);
    if (!session) {
      throw new Error('Invalid session');
    }
    
    // Validate telemetry data
    await validateTelemetryData(telemetryData);
    
    // Store telemetry data in database
    const result = await query(
      `INSERT INTO sessions (id, session_id, driver_id, telemetry_data) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (session_id) 
       DO UPDATE SET telemetry_data = sessions.telemetry_data || EXCLUDED.telemetry_data`,
      [session.id, session.session_id, session.driver_id, JSON.stringify(telemetryData)]
    );
    
    return {
      success: true,
      telemetryId: session.id
    };
  } catch (error) {
    logger.error('Failed to submit telemetry:', error);
    throw error;
  }
};

// Validate telemetry data
export const validateTelemetryData = async (telemetryData: any) => {
  const requiredFields = ['timestamp', 'location', 'speed'];
  
  for (const field of requiredFields) {
    if (!(field in telemetryData)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Validate location data
  if (!telemetryData.location || !telemetryData.location.lat || !telemetryData.location.lng) {
    throw new Error('Invalid location data');
  }
  
  // Validate timestamp
  if (typeof telemetryData.timestamp !== 'number' || telemetryData.timestamp <= 0) {
    throw new Error('Invalid timestamp');
  }
  
  // Validate speed
  if (typeof telemetryData.speed !== 'number' || telemetryData.speed < 0) {
    throw new Error('Invalid speed');
  }
};

// Get telemetry data
export const getTelemetry = async (driverId: string, from: number, to: number) => {
  try {
    // Get telemetry data from database
    const result = await query(
      'SELECT telemetry_data FROM sessions WHERE driver_id = $1 AND created_at BETWEEN $2 AND $3',
      [driverId, new Date(from * 1000), new Date(to * 1000)]
    );
    
    const telemetryData = result.rows.map(row => row.telemetry_data);
    
    return {
      telemetryData
    };
  } catch (error) {
    logger.error('Failed to get telemetry data:', error);
    throw error;
  }
};

// Process telemetry data for analysis
export const processTelemetryData = async (telemetryData: any) => {
  try {
    // In a real implementation, this would:
    // 1. Analyze driving behavior
    // 2. Detect anomalies
    // 3. Generate insights
    // 4. Store processed results
    
    logger.info('Processing telemetry data for analysis');
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      processed: true,
      insights: {
        avgSpeed: telemetryData.speed,
        location: telemetryData.location,
        timestamp: telemetryData.timestamp
      }
    };
  } catch (error) {
    logger.error('Failed to process telemetry data:', error);
    throw error;
  }
};