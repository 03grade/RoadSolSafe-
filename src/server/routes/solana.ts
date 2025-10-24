import { Router, Request, Response } from 'express';
import realSolanaTransactionService from '../services/RealSolanaTransactionService.js';
import { logger } from '../utils/logger.js';

const router = Router();

interface SubmitTripRequest extends Request {
  body: {
    programId: string;
    tripData: {
      programId: string;
      tripId: string;
      driverWallet: string;
      passengerPubkey: string;
      tripIdNumeric: number;
      startTime: number;
      distance: number;
      duration: number;
      fare: number;
      safetyScore: number;
      hardBrakes: number;
      hardAccelerations: number;
      harshCorners: number;
      timestamp: number;
    };
    wallet: {
      publicKey: string;
      privateKey: string;
    };
  };
}

// Submit trip to Solana program
router.post('/submit-trip', async (req: SubmitTripRequest, res: Response) => {
  try {
    const { programId, tripData, wallet } = req.body;
    
    logger.info('🚀 Backend: Received trip submission request');
    logger.info('📊 Program ID:', programId);
    logger.info('📊 Trip data:', tripData);
    logger.info('📊 Wallet:', wallet.publicKey);
    
    // Validate required fields
    if (!programId || !tripData || !wallet) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['programId', 'tripData', 'wallet']
      });
    }
    
    // Validate trip data
    if (!tripData.tripId || tripData.tripIdNumeric === undefined) {
      return res.status(400).json({
        error: 'Invalid trip data',
        message: 'tripId and tripIdNumeric are required'
      });
    }
    
      // Submit trip to REAL Solana
      const result = await realSolanaTransactionService.submitTripToSolana(tripData);
    
    logger.info('✅ Trip submitted successfully:', result.transactionSignature);
    
    return res.json({
      success: true,
      transactionSignature: result.transactionSignature,
      solscanUrl: result.solscanUrl,
      tripId: tripData.tripId,
      status: 'confirmed',
      message: 'Trip successfully submitted to Solana blockchain'
    });
    
  } catch (error) {
    logger.error('❌ Backend Solana error:', error);
    
    return res.status(500).json({
      error: 'Failed to submit trip to Solana',
      message: error.message,
      details: error.stack
    });
  }
});

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  return res.json({
    status: 'healthy',
    programId: 'BknefWnKwdFMsMgXdgN9XWjjo55CRMrsJ2F7iQ4epURx',
    network: 'devnet',
    timestamp: new Date().toISOString()
  });
});

export default router;
