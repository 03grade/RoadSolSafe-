import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { query } from '../database/index.js';
import { validateSession } from '../services/sessionService.js';
import { submitTripToSolana } from '../services/solanaService.js';
import { safetyScoreService } from '../services/safetyScoreService.js';

// Trip controller
export const submitTrip = async (req: Request, res: Response) => {
  try {
    const { sessionId, tripData } = req.body;
    
    if (!sessionId || !tripData) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session ID and trip data are required'
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
    
    // Validate trip data
    const requiredFields = ['tripId', 'passengerId', 'startTime', 'endTime', 'distance', 'duration', 'fare', 'rating'];
    for (const field of requiredFields) {
      if (!(field in tripData)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: `Missing required field: ${field}`
          }
        });
      }
    }
    
    // Submit trip to Solana program
    const tripResult = await submitTripToSolana(tripData);
    
    // Store trip in database
    const result = await query(
      `INSERT INTO trips (trip_id, driver_id, passenger_id, start_time, end_time, distance, duration, fare, rating, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        tripData.tripId,
        session.driver_id,
        tripData.passengerId,
        tripData.startTime,
        tripData.endTime,
        tripData.distance,
        tripData.duration,
        tripData.fare,
        tripData.rating,
        'pending'
      ]
    );
    
    res.status(201).json({
      tripId: tripResult.tripId,
      status: 'pending'
    });
  } catch (error) {
    logger.error('Trip submission failed:', error);
    res.status(500).json({
      error: {
        code: 'TRIP_SUBMISSION_FAILED',
        message: 'Failed to submit trip'
      }
    });
  }
};

export const getTripStatus = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    
    if (!tripId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Trip ID is required'
        }
      });
    }
    
    const result = await query(
      'SELECT trip_id, status, score, verification_status FROM trips WHERE trip_id = $1',
      [tripId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'TRIP_NOT_FOUND',
          message: 'Trip not found'
        }
      });
    }
    
    const trip = result.rows[0];
    
    res.json({
      tripId: trip.trip_id,
      status: trip.status,
      score: trip.score,
      verificationStatus: trip.verification_status
    });
  } catch (error) {
    logger.error('Get trip status failed:', error);
    res.status(500).json({
      error: {
        code: 'TRIP_STATUS_FAILED',
        message: 'Failed to get trip status'
      }
    });
  }
};

// Finalize trip with safety score calculation
export const finalizeTrip = async (req: Request, res: Response) => {
  try {
    const { sessionId, tripData } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session ID is required'
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

    // Get telemetry data from session
    const telemetryResult = await query(
      'SELECT telemetry_data FROM sessions WHERE session_id = $1',
      [sessionId]
    );

    if (!telemetryResult.rows[0] || !telemetryResult.rows[0].telemetry_data) {
      return res.status(400).json({
        error: {
          code: 'NO_TELEMETRY_DATA',
          message: 'No telemetry data found for session'
        }
      });
    }

    const telemetryChunks = JSON.parse(telemetryResult.rows[0].telemetry_data);

    // Calculate safety score
    logger.info(`Calculating safety score for session: ${sessionId}`);
    const scoreResult = await safetyScoreService.calculateSafetyScore(telemetryChunks);

    // Generate trip summary
    const { summary, recommendation } = safetyScoreService.generateTripSummary(scoreResult);

    // Check if trip is valid
    if (!scoreResult.isValid) {
      return res.status(400).json({
        error: {
          code: 'TRIP_INVALID',
          message: 'Trip not counted',
          validationErrors: scoreResult.validationErrors,
          summary: summary,
        }
      });
    }

    // Create trip record
    const tripId = tripData.tripId || `trip_${Date.now()}`;
    await query(
      `INSERT INTO trips (
        trip_id, driver_id, passenger_id, start_time, end_time, 
        distance, duration, fare, rating, status, score, verification_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        tripId,
        session.driver_id,
        tripData.passengerId || 'self',
        tripData.startTime,
        tripData.endTime || Math.floor(Date.now() / 1000),
        Math.floor(scoreResult.tripMetrics.distanceKm * 1000), // Convert to meters
        Math.floor(scoreResult.tripMetrics.durationMinutes * 60), // Convert to seconds
        tripData.fare || 0,
        scoreResult.totalScore, // Use safety score as rating
        'completed',
        Math.floor(scoreResult.totalScore * 10), // Store as 0-100
        1, // Verified
      ]
    );

    // Update driver statistics
    await query(
      `UPDATE drivers 
       SET total_trips = total_trips + 1,
           total_distance = total_distance + $1,
           total_score = total_score + $2,
           last_trip_time = $3
       WHERE driver_id = $4`,
      [
        Math.floor(scoreResult.tripMetrics.distanceKm * 1000),
        Math.floor(scoreResult.totalScore * 10),
        Math.floor(Date.now() / 1000),
        session.driver_id,
      ]
    );

    // Submit to Solana (placeholder for now)
    try {
      await submitTripToSolana({
        ...tripData,
        score: scoreResult.totalScore,
        distance: scoreResult.tripMetrics.distanceKm,
      });
    } catch (solanaError) {
      logger.error('Solana submission failed (non-blocking):', solanaError);
    }

    logger.info(`Trip finalized: ${tripId}, Score: ${scoreResult.totalScore}/10`);

    // Return trip result
    res.status(200).json({
      tripId,
      score: scoreResult.totalScore,
      scoreBreakdown: scoreResult.scoreBreakdown,
      events: scoreResult.events,
      tripMetrics: scoreResult.tripMetrics,
      summary,
      recommendation,
      distance: scoreResult.tripMetrics.distanceKm,
      duration: scoreResult.tripMetrics.durationMinutes,
      status: 'completed',
    });
  } catch (error) {
    logger.error('Trip finalization failed:', error);
    res.status(500).json({
      error: {
        code: 'TRIP_FINALIZATION_FAILED',
        message: 'Failed to finalize trip'
      }
    });
  }
};