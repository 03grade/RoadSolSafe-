// Enhanced controllers with service integration
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { 
  createSession, 
  validateSession, 
  updateSessionHeartbeat, 
  endSession 
} from '../services/sessionService.js';
import { 
  submitTrip, 
  getTripStatus 
} from '../services/tripService.js';
import { 
  getWeeklyTotal, 
  getRewardProof, 
  prepareClaim 
} from '../services/rewardService.js';
import { 
  submitTelemetry, 
  getTelemetry 
} from '../services/telemetryService.js';
import { 
  getValidatorStatus, 
  updateValidatorWeights 
} from '../services/validatorService.js';
import { safetyScoreService } from '../services/safetyScoreService.js';
import { query } from '../database/index.js';
import { submitTripToSolana } from '../services/solanaService.js';

// Session controller
export const startSession = async (req: Request, res: Response) => {
  try {
    const { driverId, publicKey } = req.body;
    
    if (!driverId || !publicKey) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Driver ID and public key are required'
        }
      });
    }
    
    // Create session
    const sessionData = await createSession(driverId, publicKey);
    
    res.status(201).json({
      sessionId: sessionData.sessionId,
      token: sessionData.token,
      expiresAt: sessionData.expiresAt,
      driverId: sessionData.driverId
    });
  } catch (error) {
    logger.error('Failed to start session:', error);
    res.status(500).json({
      error: {
        code: 'SESSION_CREATION_FAILED',
        message: 'Failed to create session'
      }
    });
  }
};

export const heartbeatSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    
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
    
    // Update heartbeat
    await updateSessionHeartbeat(sessionId);
    
    res.json({
      success: true,
      expiresAt: session.expires_at
    });
  } catch (error) {
    logger.error('Session heartbeat failed:', error);
    res.status(500).json({
      error: {
        code: 'SESSION_HEARTBEAT_FAILED',
        message: 'Failed to update session heartbeat'
      }
    });
  }
};

export const endSessionController = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session ID is required'
        }
      });
    }
    
    // End session
    await endSession(sessionId);
    
    res.json({
      success: true
    });
  } catch (error) {
    logger.error('Session end failed:', error);
    res.status(500).json({
      error: {
        code: 'SESSION_END_FAILED',
        message: 'Failed to end session'
      }
    });
  }
};

// Trip controller
export const submitTripController = async (req: Request, res: Response) => {
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
    
    // Submit trip
    const tripResult = await submitTrip(sessionId, tripData);
    
    res.status(201).json({
      tripId: tripResult.tripId,
      status: tripResult.status
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

// Finalize trip with safety score calculation
export const finalizeTripController = async (req: Request, res: Response) => {
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
    const tripId = tripData?.tripId || `trip_${Date.now()}`;
    await query(
      `INSERT INTO trips (
        trip_id, driver_id, passenger_id, start_time, end_time, 
        distance, duration, fare, rating, status, score, verification_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        tripId,
        session.driver_id,
        tripData?.passengerId || 'self',
        tripData?.startTime || Math.floor(Date.now() / 1000) - 600,
        tripData?.endTime || Math.floor(Date.now() / 1000),
        Math.floor(scoreResult.tripMetrics.distanceKm * 1000),
        Math.floor(scoreResult.tripMetrics.durationMinutes * 60),
        tripData?.fare || 0,
        scoreResult.totalScore,
        'completed',
        Math.floor(scoreResult.totalScore * 10),
        1,
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

export const getTripStatusController = async (req: Request, res: Response) => {
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
    
    const tripStatus = await getTripStatus(tripId);
    
    res.json({
      tripId: tripStatus.trip_id,
      status: tripStatus.status,
      score: tripStatus.score,
      verificationStatus: tripStatus.verification_status
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

// Reward controller
export const getWeeklyTotalController = async (req: Request, res: Response) => {
  try {
    const { driverId, week } = req.query;
    
    if (!driverId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Driver ID is required'
        }
      });
    }
    
    const weeklyTotal = await getWeeklyTotal(driverId as string, parseInt(week as string) || 0);
    
    res.json(weeklyTotal);
  } catch (error) {
    logger.error('Get weekly total failed:', error);
    res.status(500).json({
      error: {
        code: 'WEEKLY_TOTAL_FAILED',
        message: 'Failed to get weekly total'
      }
    });
  }
};

export const getRewardProofController = async (req: Request, res: Response) => {
  try {
    const { driverId, period } = req.query;
    
    if (!driverId || !period) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Driver ID and period are required'
        }
      });
    }
    
    const rewardProof = await getRewardProof(driverId as string, period as string);
    
    res.json(rewardProof);
  } catch (error) {
    logger.error('Get reward proof failed:', error);
    res.status(500).json({
      error: {
        code: 'REWARD_PROOF_FAILED',
        message: 'Failed to get reward proof'
      }
    });
  }
};

export const prepareClaimController = async (req: Request, res: Response) => {
  try {
    const { driverId, poolId } = req.body;
    
    if (!driverId || !poolId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Driver ID and pool ID are required'
        }
      });
    }
    
    const claimResult = await prepareClaim(driverId, parseInt(poolId as string));
    
    res.status(201).json(claimResult);
  } catch (error) {
    logger.error('Prepare claim failed:', error);
    res.status(500).json({
      error: {
        code: 'CLAIM_PREPARATION_FAILED',
        message: 'Failed to prepare claim'
      }
    });
  }
};

// Telemetry controller
export const submitTelemetryController = async (req: Request, res: Response) => {
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
    
    const telemetryResult = await submitTelemetry(sessionId, telemetryData);
    
    res.status(201).json(telemetryResult);
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

export const getTelemetryController = async (req: Request, res: Response) => {
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
    
    const telemetryData = await getTelemetry(driverId as string, parseInt(from as string) || 0, parseInt(to as string) || 0);
    
    res.json(telemetryData);
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

// Validator controller
export const getValidatorStatusController = async (req: Request, res: Response) => {
  try {
    const { validatorId } = req.params;
    
    if (!validatorId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validator ID is required'
        }
      });
    }
    
    const validatorStatus = await getValidatorStatus(validatorId);
    
    res.json(validatorStatus);
  } catch (error) {
    logger.error('Get validator status failed:', error);
    res.status(500).json({
      error: {
        code: 'VALIDATOR_STATUS_FAILED',
        message: 'Failed to get validator status'
      }
    });
  }
};

export const updateValidatorWeightsController = async (req: Request, res: Response) => {
  try {
    const { validatorId, newWeights } = req.body;
    
    if (!validatorId || !newWeights) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validator ID and new weights are required'
        }
      });
    }
    
    const weightsResult = await updateValidatorWeights(validatorId, parseFloat(newWeights as string));
    
    res.json(weightsResult);
  } catch (error) {
    logger.error('Update validator weights failed:', error);
    res.status(500).json({
      error: {
        code: 'VALIDATOR_WEIGHT_UPDATE_FAILED',
        message: 'Failed to update validator weights'
      }
    });
  }
};