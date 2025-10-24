import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { query } from '../database/index.js';
import { validateSession } from '../services/sessionService.js';
import { claimRewardsOnSolana } from '../services/solanaService.js';

// Reward controller
export const getWeeklyTotal = async (req: Request, res: Response) => {
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
    
    // Get driver stats from database
    const driverResult = await query(
      'SELECT total_earnings, total_trips, avg_rating FROM drivers WHERE driver_id = $1',
      [driverId]
    );
    
    if (driverResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'DRIVER_NOT_FOUND',
          message: 'Driver not found'
        }
      });
    }
    
    const driver = driverResult.rows[0];
    
    // Calculate weekly total (simplified for now)
    const totalRewards = driver.total_earnings;
    const tripsCount = driver.total_trips;
    const avgScore = driver.avg_rating;
    
    res.json({
      totalRewards,
      tripsCount,
      avgScore
    });
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

export const getRewardProof = async (req: Request, res: Response) => {
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
    
    // Generate proof data (simplified)
    const proofData = `proof_${driverId}_${period}_${Date.now()}`;
    const signature = `signature_${driverId}_${period}_${Date.now()}`;
    
    res.json({
      proofData,
      signature,
      timestamp: Date.now()
    });
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

export const prepareClaim = async (req: Request, res: Response) => {
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
    
    // Validate session and driver
    // In a real implementation, we'd check session and driver validity
    
    // Claim rewards on Solana
    const claimResult = await claimRewardsOnSolana(driverId, poolId);
    
    // Store claim in database
    const result = await query(
      `INSERT INTO rewards (driver_id, pool_id, amount, status) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [driverId, poolId, claimResult.amount, 'pending']
    );
    
    res.status(201).json({
      claimId: result.rows[0].id,
      amount: claimResult.amount,
      txHash: claimResult.txHash
    });
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