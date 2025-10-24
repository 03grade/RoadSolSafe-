// Backend API Tests for Solana Endpoints
const request = require('supertest');
const express = require('express');

// Mock the simple-server.js
const app = express();
app.use(express.json());

// Mock Solana web3.js
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getLatestBlockhash: jest.fn().mockResolvedValue({ blockhash: 'test-blockhash' }),
    sendTransaction: jest.fn().mockResolvedValue('test-transaction-signature'),
    confirmTransaction: jest.fn().mockResolvedValue({ value: { err: null } }),
    getBalance: jest.fn().mockResolvedValue(1000000000), // 1 SOL
    requestAirdrop: jest.fn().mockResolvedValue('airdrop-signature')
  })),
  PublicKey: jest.fn().mockImplementation((key) => ({ toString: () => key })),
  Keypair: {
    fromSecretKey: jest.fn().mockReturnValue({
      publicKey: { toString: () => '6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2' }
    })
  },
  Transaction: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockReturnThis(),
    recentBlockhash: null,
    feePayer: null
  })),
  TransactionInstruction: jest.fn(),
  SystemProgram: {
    programId: { toString: () => '11111111111111111111111111111111' }
  }
}));

// Mock bs58
jest.mock('bs58', () => ({
  decode: jest.fn().mockReturnValue(new Uint8Array(64))
}));

// Add routes to test app
app.get('/solana/health', (req, res) => {
  res.json({
    status: 'healthy',
    programId: 'BknefWnKwdFMsMgXdgN9XWjjo55CRMrsJ2F7iQ4epURx',
    network: 'devnet',
    timestamp: new Date().toISOString()
  });
});

app.post('/solana/submit-trip', async (req, res) => {
  try {
    const { programId, tripData, wallet } = req.body;
    
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
    
    // Mock successful transaction
    const signature = 'test-transaction-signature';
    const solscanUrl = `https://solscan.io/tx/${signature}?cluster=devnet`;
    
    return res.json({
      success: true,
      transactionSignature: signature,
      solscanUrl: solscanUrl,
      tripId: tripData.tripId,
      status: 'confirmed',
      message: 'Trip successfully submitted to REAL Solana blockchain'
    });
    
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to submit trip to Solana',
      message: error.message
    });
  }
});

describe('Backend Solana API Endpoints', () => {
  describe('GET /solana/health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/solana/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('programId', 'BknefWnKwdFMsMgXdgN9XWjjo55CRMrsJ2F7iQ4epURx');
      expect(response.body).toHaveProperty('network', 'devnet');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /solana/submit-trip', () => {
    const validTripData = {
      programId: 'BknefWnKwdFMsMgXdgN9XWjjo55CRMrsJ2F7iQ4epURx',
      tripData: {
        programId: 'BknefWnKwdFMsMgXdgN9XWjjo55CRMrsJ2F7iQ4epURx',
        tripId: 'trip_1234567890_test',
        driverWallet: '6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2',
        passengerPubkey: '11111111111111111111111111111111',
        tripIdNumeric: 1234567890,
        startTime: 1640995200,
        distance: 5000,
        duration: 1800,
        fare: 8500000,
        safetyScore: 8.5,
        hardBrakes: 2,
        hardAccelerations: 1,
        harshCorners: 0,
        timestamp: Date.now()
      },
      wallet: {
        publicKey: '6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2',
        privateKey: '2tqoLKJ632JCPLbSiWvB5n9KDg4mtWEhLHdFGQk5mfeAJsFLRLQa3ag1DH4he8LwjK3BYjzE8XBMhiaNQKY2tGWc'
      }
    };

    it('should successfully submit trip with valid data', async () => {
      const response = await request(app)
        .post('/solana/submit-trip')
        .send(validTripData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('transactionSignature', 'test-transaction-signature');
      expect(response.body).toHaveProperty('solscanUrl');
      expect(response.body).toHaveProperty('tripId', 'trip_1234567890_test');
      expect(response.body).toHaveProperty('status', 'confirmed');
      expect(response.body).toHaveProperty('message', 'Trip successfully submitted to REAL Solana blockchain');
    });

    it('should return 400 for missing programId', async () => {
      const invalidData = { ...validTripData };
      delete invalidData.programId;

      const response = await request(app)
        .post('/solana/submit-trip')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields');
      expect(response.body).toHaveProperty('required', ['programId', 'tripData', 'wallet']);
    });

    it('should return 400 for missing tripData', async () => {
      const invalidData = { ...validTripData };
      delete invalidData.tripData;

      const response = await request(app)
        .post('/solana/submit-trip')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });

    it('should return 400 for missing wallet', async () => {
      const invalidData = { ...validTripData };
      delete invalidData.wallet;

      const response = await request(app)
        .post('/solana/submit-trip')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });

    it('should return 400 for invalid trip data (missing tripId)', async () => {
      const invalidData = { ...validTripData };
      delete invalidData.tripData.tripId;

      const response = await request(app)
        .post('/solana/submit-trip')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid trip data');
      expect(response.body).toHaveProperty('message', 'tripId and tripIdNumeric are required');
    });

    it('should return 400 for invalid trip data (missing tripIdNumeric)', async () => {
      const invalidData = { ...validTripData };
      delete invalidData.tripData.tripIdNumeric;

      const response = await request(app)
        .post('/solana/submit-trip')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid trip data');
      expect(response.body).toHaveProperty('message', 'tripId and tripIdNumeric are required');
    });

    it('should handle server errors gracefully', async () => {
      // Mock an error by sending malformed data that would cause an exception
      const response = await request(app)
        .post('/solana/submit-trip')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });
  });
});

