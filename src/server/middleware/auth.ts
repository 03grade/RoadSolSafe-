// Enhanced validation middleware
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header missing or invalid'
        }
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // In a real implementation, you would verify the JWT token
    // For now, we'll just check if it exists
    if (!token) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authentication token'
        }
      });
    }
    
    // Add token to request object for use in controllers
    (req as any).token = token;
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid authentication token'
      }
    });
  }
};

// Session validation middleware
export const validateSessionId = (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Session ID is required'
      }
    });
  }
  
  next();
};

// Trip data validation middleware
export const validateTripData = (req: Request, res: Response, next: NextFunction) => {
  const { tripData } = req.body;
  
  if (!tripData) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Trip data is required'
      }
    });
  }
  
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
  
  // Validate data types
  if (typeof tripData.startTime !== 'number' || tripData.startTime <= 0) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid start time'
      }
    });
  }
  
  if (typeof tripData.endTime !== 'number' || tripData.endTime <= tripData.startTime) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'End time must be after start time'
      }
    });
  }
  
  if (typeof tripData.distance !== 'number' || tripData.distance <= 0) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid distance'
      }
    });
  }
  
  if (typeof tripData.rating !== 'number' || tripData.rating < 0 || tripData.rating > 5) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Rating must be between 0 and 5'
      }
    });
  }
  
  next();
};

// Reward data validation middleware
export const validateRewardData = (req: Request, res: Response, next: NextFunction) => {
  const { driverId, poolId } = req.body;
  
  if (!driverId) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Driver ID is required'
      }
    });
  }
  
  if (!poolId) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Pool ID is required'
      }
    });
  }
  
  next();
};

// Telemetry data validation middleware
export const validateTelemetryData = (req: Request, res: Response, next: NextFunction) => {
  const { telemetryData } = req.body;
  
  if (!telemetryData) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Telemetry data is required'
      }
    });
  }
  
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
  
  // Validate location data
  if (!telemetryData.location || !telemetryData.location.lat || !telemetryData.location.lng) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid location data'
      }
    });
  }
  
  // Validate timestamp
  if (typeof telemetryData.timestamp !== 'number' || telemetryData.timestamp <= 0) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid timestamp'
      }
    });
  }
  
  next();
};

// Rate limiting middleware
export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  // This is a simplified version - in production, you'd use express-rate-limit
  next();
};