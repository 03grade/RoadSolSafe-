// Enhanced session management with telemetry handling
import { logger } from '../utils/logger.js';
import { query } from '../database/index.js';
import { v4 as uuidv4 } from 'uuid';

// Enhanced session service with telemetry
export const createSession = async (driverId: string, publicKey: string) => {
  try {
    const sessionId = `session_${uuidv4()}`;
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + (24 * 60 * 60); // 24 hours
    
    // Create session in database
    const result = await query(
      `INSERT INTO sessions (session_id, driver_id, started_at, last_active, expires_at, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [sessionId, driverId, now, now, expiresAt, true]
    );
    
    // Create JWT token (simplified for now)
    const token = `jwt_${sessionId}_${now}`;
    
    return {
      sessionId,
      token,
      expiresAt,
      driverId
    };
  } catch (error) {
    logger.error('Failed to create session:', error);
    throw error;
  }
};

// Validate session with extended checks
export const validateSession = async (sessionId: string) => {
  try {
    const result = await query(
      'SELECT * FROM sessions WHERE session_id = $1 AND is_active = TRUE',
      [sessionId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const session = result.rows[0];
    const now = Math.floor(Date.now() / 1000);
    
    // Check if session has expired
    if (session.expires_at < now) {
      await query('UPDATE sessions SET is_active = FALSE WHERE session_id = $1', [sessionId]);
      return null;
    }
    
    return session;
  } catch (error) {
    logger.error('Failed to validate session:', error);
    return null;
  }
};

// Update session heartbeat with telemetry data
export const updateSessionHeartbeat = async (sessionId: string, telemetryData?: any) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    // Update last active time
    const result = await query(
      'UPDATE sessions SET last_active = $1 WHERE session_id = $2 RETURNING *',
      [now, sessionId]
    );
    
    // If telemetry data is provided, store it
    if (telemetryData) {
      await query(
        'UPDATE sessions SET telemetry_data = $1 WHERE session_id = $2',
        [JSON.stringify(telemetryData), sessionId]
      );
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to update session heartbeat:', error);
    throw error;
  }
};

// End session
export const endSession = async (sessionId: string) => {
  try {
    const result = await query(
      'UPDATE sessions SET is_active = FALSE WHERE session_id = $1 RETURNING *',
      [sessionId]
    );
    
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to end session:', error);
    throw error;
  }
};

// Get session details
export const getSessionDetails = async (sessionId: string) => {
  try {
    const result = await query(
      'SELECT * FROM sessions WHERE session_id = $1',
      [sessionId]
    );
    
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to get session details:', error);
    throw error;
  }
};

// Get active sessions for a driver
export const getActiveSessionsForDriver = async (driverId: string) => {
  try {
    const result = await query(
      'SELECT * FROM sessions WHERE driver_id = $1 AND is_active = TRUE',
      [driverId]
    );
    
    return result.rows;
  } catch (error) {
    logger.error('Failed to get active sessions for driver:', error);
    throw error;
  }
};