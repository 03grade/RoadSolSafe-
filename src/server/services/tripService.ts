// Enhanced trip service with validation and processing
import { logger } from '../utils/logger.js';
import { query } from '../database/index.js';
import { validateSession } from './sessionService.js';
import { submitTripToSolana } from './solanaService.js';
import { magicBlockService } from './magicblockService.js';

// Enhanced trip service
export const submitTrip = async (sessionId: string, tripData: any) => {
  try {
    // Validate session
    const session = await validateSession(sessionId);
    if (!session) {
      throw new Error('Invalid session');
    }
    
    // Validate trip data
    await validateTripData(tripData);
    
    // Process sensitive data with MagicBlock ER if needed
    const processedTripData = await processTripDataWithMagicBlock(tripData);
    
    // Submit trip to Solana program
    const solanaResult = await submitTripToSolana(processedTripData);
    
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
    
    return {
      tripId: result.rows[0].trip_id,
      status: 'pending',
      solanaTxHash: solanaResult.transactionSignature
    };
  } catch (error) {
    logger.error('Failed to submit trip:', error);
    throw error;
  }
};

// Validate trip data
export const validateTripData = async (tripData: any) => {
  const requiredFields = ['tripId', 'passengerId', 'startTime', 'endTime', 'distance', 'duration', 'fare', 'rating'];
  
  for (const field of requiredFields) {
    if (!(field in tripData)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Validate data types and ranges
  if (typeof tripData.startTime !== 'number' || tripData.startTime <= 0) {
    throw new Error('Invalid start time');
  }
  
  if (typeof tripData.endTime !== 'number' || tripData.endTime <= tripData.startTime) {
    throw new Error('End time must be after start time');
  }
  
  if (typeof tripData.distance !== 'number' || tripData.distance <= 0) {
    throw new Error('Invalid distance');
  }
  
  if (typeof tripData.rating !== 'number' || tripData.rating < 0 || tripData.rating > 5) {
    throw new Error('Rating must be between 0 and 5');
  }
};

// Process trip data with MagicBlock
export const processTripDataWithMagicBlock = async (tripData: any) => {
  try {
    // In a real implementation, we would encrypt sensitive trip data
    // For now, we'll just return the original data
    return tripData;
  } catch (error) {
    logger.error('Failed to process trip data with MagicBlock:', error);
    // Return original data if encryption fails
    return tripData;
  }
};

// Get trip status
export const getTripStatus = async (tripId: string) => {
  try {
    const result = await query(
      'SELECT trip_id, status, score, verification_status FROM trips WHERE trip_id = $1',
      [tripId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Trip not found');
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to get trip status:', error);
    throw error;
  }
};

// Update trip verification status
export const updateTripVerification = async (tripId: string, verificationStatus: number, score: number) => {
  try {
    const result = await query(
      'UPDATE trips SET verification_status = $1, score = $2 WHERE trip_id = $3 RETURNING *',
      [verificationStatus, score, tripId]
    );
    
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to update trip verification:', error);
    throw error;
  }
};