import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { query } from '../database/index.js';
import { validateSession } from '../services/sessionService.js';

// Telemetry controller
export const submitTelemetry = async (req: Request, res: Response) => {
  try {
    const { sessionId, telemetryData } = req.body;
    
    if (!sessionId || !telemetryData) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session ID and telemetry data are required'
        }
      });
    }
    
    // Validate session
    const session = await validateSession(sessionId);
    if (!session) {
      return res.status(401).json({
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session not found or expired'
        }
      });
    }
    
    // Validate telemetry data
    const requiredFields = ['timestamp', 'location', 'speed'];
    for (const field of requiredFields) {
      if (!(field in telemetryData)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: `Missing required field: ${field}`
          }
        });
      }
    }
    
    // Store telemetry data in database
    const result = await query(
      `INSERT INTO sessions (id, session_id, driver_id, telemetry_data) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (session_id) 
       DO UPDATE SET telemetry_data = sessions.telemetry_data || EXCLUDED.telemetry_data`,
      [session.id, session.session_id, session.driver_id, JSON.stringify(telemetryData)]
    );
    
    res.status(201).json({
      success: true,
      telemetryId: session.id
    });
  } catch (error) {
    logger.error('Telemetry submission failed:', error);
    res.status(500).json({
      error: {
        code: 'TELEMETRY_SUBMISSION_FAILED',
        message: 'Failed to submit telemetry data'
      }
    });
  }
};

export const getTelemetry = async (req: Request, res: Response) => {
  try {
    const { driverId, from, to } = req.query;
    
    if (!driverId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Driver ID is required'
        }
      });
    }
    
    // Get telemetry data from database
    const result = await query(
      'SELECT telemetry_data FROM sessions WHERE driver_id = $1 AND created_at BETWEEN $2 AND $3',
      [driverId, from, to]
    );
    
    const telemetryData = result.rows.map(row => row.telemetry_data);
    
    res.json({
      telemetryData
    });
  } catch (error) {
    logger.error('Get telemetry failed:', error);
    res.status(500).json({
      error: {
        code: 'TELEMETRY_FETCH_FAILED',
        message: 'Failed to fetch telemetry data'
      }
    });
  }
};