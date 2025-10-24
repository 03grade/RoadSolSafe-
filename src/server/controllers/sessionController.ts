import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { query } from '../database/index.js';
import { createSession, validateSession, updateSessionHeartbeat, endSession } from '../services/sessionService.js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

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