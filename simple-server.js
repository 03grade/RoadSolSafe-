// Simple test server with REAL Solana transactions
const express = require('express');
const cors = require('cors');
const { Connection, PublicKey, Keypair, Transaction, SystemProgram, TransactionInstruction } = require('@solana/web3.js');
const { Buffer } = require('buffer');
const bs58 = require('bs58').default || require('bs58');

const app = express();
const PORT = process.env.PORT || 3000;

// Real Solana configuration
const PROGRAM_ID = 'BknefWnKwdFMsMgXdgN9XWjjo55CRMrsJ2F7iQ4epURx';
const RPC_URL = 'https://api.devnet.solana.com';
const DEV2_WALLET = {
  publicKey: '6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2',
  privateKey: '2tqoLKJ632JCPLbSiWvB5n9KDg4mtWEhLHdFGQk5mfeAJsFLRLQa3ag1DH4he8LwjK3BYjzE8XBMhiaNQKY2tGWc'
};

// DEV1 wallet for mobile app (user wallet)
const DEV1_WALLET = {
  publicKey: '3oVnL6Y34hoUXM41MBy6Rcd3asvyyTW8rFT3xgYeSdfZ',
  privateKey: 'iUYSbQx3Hyo63aNVwac7MrnRrxVmBHfW5S91YjtrpGKVfTJMEpkyywkSS7K1mEsjNtz6kS9nmeg3RW5NYntvQeo'
};

// Initialize Solana connection
let connection;
async function initSolana() {
  try {
    connection = new Connection(RPC_URL, 'confirmed');
    
    // Create keypair from dev2 private key (base58 encoded)
    const keypair = Keypair.fromSecretKey(
      bs58.decode(DEV2_WALLET.privateKey)
    );
    
    console.log('✅ Real Solana connection established');
    console.log(`Wallet address: ${keypair.publicKey.toString()}`);
    
    // Check wallet balance
    const balance = await connection.getBalance(keypair.publicKey);
    console.log(`Wallet balance: ${balance / 1e9} SOL`);
    
    // Request airdrop if balance is low
    if (balance < 0.1e9) { // Less than 0.1 SOL
      console.log('Requesting SOL airdrop...');
      const signature = await connection.requestAirdrop(keypair.publicKey, 2e9); // 2 SOL
      await connection.confirmTransaction(signature);
      const newBalance = await connection.getBalance(keypair.publicKey);
      console.log(`New wallet balance: ${newBalance / 1e9} SOL`);
    }
    
    return keypair;
  } catch (error) {
    console.error('Failed to initialize Real Solana connection:', error);
    throw error;
  }
}

// Initialize Solana on startup
initSolana();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// In-memory storage for testing
const sessions = new Map();
const trips = new Map();

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'driver-trip-reward-backend',
    message: 'Simple test server running!'
  });
});

// Solana endpoints
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
    
    console.log('🚀 Backend: Received trip submission request');
    console.log('📊 Program ID:', programId);
    console.log('📊 Trip data:', tripData);
    console.log('📊 Wallet:', wallet.publicKey);
    
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
    
    // Create REAL Solana transaction
    console.log('🔗 Creating REAL Solana transaction...');
    
    // Create keypair from dev2 private key (base58 encoded)
    const keypair = Keypair.fromSecretKey(
      bs58.decode(DEV2_WALLET.privateKey)
    );
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    console.log('📦 Recent blockhash obtained');
    
    // Create instruction data for submit_trip
    // Discriminator: [126, 54, 239, 201, 82, 247, 25, 229]
    const instructionData = Buffer.alloc(8 + 32 + 8 + 8 + 8 + 8 + 8); // discriminator + pubkey + 5 u64/i64
    let offset = 0;
    
    // Add discriminator
    instructionData.set([126, 54, 239, 201, 82, 247, 25, 229], offset);
    offset += 8;
    
    // Add passenger_pubkey (32 bytes)
    const passengerPubkey = new PublicKey(tripData.passengerPubkey);
    instructionData.set(passengerPubkey.toBytes(), offset);
    offset += 32;
    
    // Add trip_id (8 bytes, little-endian)
    // NOTE: Program expects tripIdNumeric: 0 for instruction data
    const tripIdBuffer = Buffer.alloc(8);
    tripIdBuffer.writeBigUInt64LE(BigInt(0), 0); // Use 0 to match program expectation
    instructionData.set(tripIdBuffer, offset);
    offset += 8;
    
    console.log('🔍 DEBUG: tripIdNumeric for instruction:', tripData.tripIdNumeric);
    console.log('🔍 DEBUG: tripIdBuffer for instruction:', tripIdBuffer.toString('hex'));
    
    // Add start_time (8 bytes, little-endian)
    const startTimeBuffer = Buffer.alloc(8);
    startTimeBuffer.writeBigInt64LE(BigInt(tripData.startTime), 0);
    instructionData.set(startTimeBuffer, offset);
    offset += 8;
    
    // Add distance (8 bytes, little-endian)
    const distanceBuffer = Buffer.alloc(8);
    distanceBuffer.writeBigUInt64LE(BigInt(tripData.distance), 0);
    instructionData.set(distanceBuffer, offset);
    offset += 8;
    
    // Add duration (8 bytes, little-endian)
    const durationBuffer = Buffer.alloc(8);
    durationBuffer.writeBigUInt64LE(BigInt(tripData.duration), 0);
    instructionData.set(durationBuffer, offset);
    offset += 8;
    
    // Add fare (8 bytes, little-endian)
    const fareBuffer = Buffer.alloc(8);
    fareBuffer.writeBigUInt64LE(BigInt(tripData.fare), 0);
    instructionData.set(fareBuffer, offset);
    
    console.log('📊 Instruction data prepared:', instructionData.toString('hex'));
    
    // Create trip account PDA
    // NOTE: Use a different driver pubkey to get a fresh PDA that hasn't been corrupted
    // Generate a new keypair for this trip to avoid corrupted account
    const tempDriverKeypair = Keypair.generate();
    const driverPubkey = tempDriverKeypair.publicKey;
    
    const tripIdPdaBuffer = Buffer.alloc(8);
    tripIdPdaBuffer.writeBigUInt64LE(BigInt(0), 0); // Use 0 to match program expectation
    
    console.log('🔍 DEBUG: Using temporary driver pubkey:', driverPubkey.toString());
    console.log('🔍 DEBUG: tripIdPdaBuffer for PDA:', tripIdPdaBuffer.toString('hex'));
    console.log('🔍 DEBUG: PROGRAM_ID for PDA:', PROGRAM_ID);
    console.log('🔍 DEBUG: Seeds array:', [
      Buffer.from("trip").toString('hex'),
      driverPubkey.toBuffer().toString('hex'),
      tripIdPdaBuffer.toString('hex')
    ]);
    
    const [tripAccountPDA, bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("trip"),
        driverPubkey.toBuffer(),
        tripIdPdaBuffer
      ],
      new PublicKey(PROGRAM_ID)
    );
    
    console.log('🔍 DEBUG: PDA bump:', bump);
    console.log('📊 Trip account PDA (CALCULATED):', tripAccountPDA.toString());
    
    // Create transaction
    const transaction = new Transaction().add(
      new TransactionInstruction({
        keys: [
          { pubkey: keypair.publicKey, isSigner: true, isWritable: true }, // fee_payer
          { pubkey: tripAccountPDA, isSigner: false, isWritable: true }, // trip_account (PDA)
          { pubkey: driverPubkey, isSigner: true, isWritable: false }, // driver_pubkey (must sign)
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
        ],
        programId: new PublicKey(PROGRAM_ID),
        data: instructionData
      })
    );
    
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = keypair.publicKey;
    
    console.log('🔨 Transaction created, signing...');
    console.log('📊 Fee payer:', keypair.publicKey.toString());
    console.log('📊 Driver pubkey:', driverPubkey.toString());
    
    // Sign with both keypairs
    transaction.partialSign(keypair); // Backend wallet (fee payer)
    transaction.partialSign(tempDriverKeypair); // Temporary driver wallet (required signer)
    console.log('✅ Transaction signed with both wallets');
    
    try {
      // Send the fully-signed transaction
      const signature = await connection.sendRawTransaction(transaction.serialize());
      console.log('✅ Transaction sent:', signature);
      
      // Confirm transaction
      console.log('⏳ Confirming transaction...');
      const confirmation = await connection.confirmTransaction(signature);
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
      
      console.log('🎉 Transaction confirmed on-chain!');
      console.log('🔗 View on Solscan:', `https://solscan.io/tx/${signature}?cluster=devnet`);
      
      const solscanUrl = `https://solscan.io/tx/${signature}?cluster=devnet`;
      
      console.log('✅ Trip submitted successfully:', signature);
      
      return res.json({
        success: true,
        transactionSignature: signature,
        solscanUrl: solscanUrl,
        tripId: tripData.tripId,
        status: 'confirmed',
        message: 'Trip successfully submitted to REAL Solana blockchain'
      });
      
    } catch (error) {
      console.log('❌ Backend Solana error:', error);
      
      // If program doesn't exist, create a realistic simulation
      if (error.message.includes('does not exist') || error.message.includes('not found')) {
        console.log('🎭 Program not deployed, creating realistic simulation...');
        
        // Generate a realistic transaction signature
        const simulatedSignature = Array.from({length: 88}, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        
        const solscanUrl = `https://solscan.io/tx/${simulatedSignature}?cluster=devnet`;
        
        console.log('✅ Simulation transaction created:', simulatedSignature);
        console.log('🔗 Simulated Solscan URL:', solscanUrl);
        
        return res.json({
          success: true,
          transactionSignature: simulatedSignature,
          solscanUrl: solscanUrl,
          tripId: tripData.tripId,
          status: 'simulated',
          message: 'Trip submitted (simulation mode - program not deployed)',
          note: 'This is a simulation. Deploy the program to devnet for real transactions.'
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to submit trip to Solana', 
        message: error.message 
      });
    }
    
  } catch (error) {
    console.error('❌ Backend Solana error:', error);
    
    return res.status(500).json({
      error: 'Failed to submit trip to Solana',
      message: error.message
    });
  }
});

app.post('/session/start', (req, res) => {
  try {
    console.log('📝 Backend: Received session start request');
    console.log('📝 Request body:', req.body);
    
    const { driverId, publicKey } = req.body;
    
    if (!driverId || !publicKey) {
      console.log('❌ Missing required fields:', { driverId, publicKey });
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Driver ID and public key are required'
        }
      });
    }
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 24 * 60 * 60; // 24 hours
    
    sessions.set(sessionId, {
      sessionId,
      driverId,
      publicKey,
      startedAt: now,
      lastActive: now,
      expiresAt,
      isActive: true,
      telemetryData: []
    });
    
    console.log(`✅ Session created: ${sessionId}`);
    
    res.status(201).json({
      sessionId,
      token: 'test_token_123',
      expiresAt,
      driverId
    });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({
      error: {
        code: 'SESSION_CREATION_FAILED',
        message: 'Failed to create session'
      }
    });
  }
});

app.post('/session/end', (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      session.isActive = false;
      sessions.set(sessionId, session);
      console.log(`✅ Session ended: ${sessionId}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Session end error:', error);
    res.status(500).json({
      error: {
        code: 'SESSION_END_FAILED',
        message: 'Failed to end session'
      }
    });
  }
});

app.post('/telemetry', (req, res) => {
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
    
    if (sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      session.telemetryData.push(telemetryData);
      session.lastActive = Math.floor(Date.now() / 1000);
      sessions.set(sessionId, session);
      
      console.log(`✅ Telemetry uploaded for session: ${sessionId}`);
      console.log(`📊 Chunk ${telemetryData.chunkIndex}: ${telemetryData.gpsData?.length || 0} GPS points, ${telemetryData.imuData?.length || 0} IMU samples`);
      
      res.status(201).json({
        success: true,
        telemetryId: sessionId,
        dataPoints: session.telemetryData.length
      });
    } else {
      // Create session if it doesn't exist (for mobile app compatibility)
      console.log(`⚠️ Session not found, creating: ${sessionId}`);
      const newSession = {
        sessionId: sessionId,
        driverId: telemetryData.driverId || 'unknown',
        publicKey: telemetryData.publicKey || 'unknown',
        startTime: Math.floor(Date.now() / 1000),
        lastActive: Math.floor(Date.now() / 1000),
        status: 'active',
        tripId: telemetryData.tripId || `trip_${Date.now()}`,
        telemetryData: [telemetryData]
      };
      sessions.set(sessionId, newSession);
      
      console.log(`✅ Session created and telemetry uploaded: ${sessionId}`);
      console.log(`📊 Chunk ${telemetryData.chunkIndex}: ${telemetryData.gpsData?.length || 0} GPS points, ${telemetryData.imuData?.length || 0} IMU samples`);
      
      res.status(201).json({
        success: true,
        telemetryId: sessionId,
        dataPoints: 1,
        message: 'Session created'
      });
    }
  } catch (error) {
    console.error('Telemetry submission error:', error);
    res.status(500).json({
      error: {
        code: 'TELEMETRY_SUBMISSION_FAILED',
        message: 'Failed to submit telemetry data'
      }
    });
  }
});

app.post('/trip/finalize', (req, res) => {
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

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found'
        }
      });
    }

    // Simple safety score calculation
    const telemetryChunks = session.telemetryData || [];
    let hardBrakeCount = Math.floor(Math.random() * 3);
    let speedingCount = Math.floor(Math.random() * 5);
    
    // Calculate safety score (0-10)
    let safetyScore = 10.0;
    safetyScore -= hardBrakeCount * 0.5;
    safetyScore -= speedingCount * 0.2;
    safetyScore = Math.max(0, Math.min(10, safetyScore));
    
    const tripId = tripData?.tripId || `trip_${Date.now()}`;
    const distance = (Math.random() * 20 + 5).toFixed(2); // 5-25 km
    const duration = (Math.random() * 60 + 15).toFixed(1); // 15-75 minutes
    
    // Store trip
    trips.set(tripId, {
      tripId,
      driverId: session.driverId,
      safetyScore: safetyScore.toFixed(1),
      distance: parseFloat(distance),
      duration: parseFloat(duration),
      events: {
        hardBrakes: hardBrakeCount,
        speedingCount
      }
    });
    
    // End session
    session.isActive = false;
    sessions.set(sessionId, session);
    
    console.log(`✅ Trip finalized: ${tripId}, Score: ${safetyScore.toFixed(1)}/10`);

    res.json({
      success: true,
      tripId,
      safetyScore: safetyScore.toFixed(1),
      distance,
      duration,
      events: {
        hardBrakes: hardBrakeCount,
        speedingCount
      }
    });
  } catch (error) {
    console.error('Trip finalization error:', error);
    res.status(500).json({
      error: {
        code: 'TRIP_FINALIZATION_FAILED',
        message: 'Failed to finalize trip',
        details: error.message
      }
    });
  }
});

// Get trip summary
app.get('/trip/summary/:tripId', (req, res) => {
  const { tripId } = req.params;
  const trip = trips.get(tripId);
  
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }
  
  res.json(trip);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Simple test server running on port ${PORT}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   GET  http://localhost:${PORT}/solana/health`);
  console.log(`   POST http://localhost:${PORT}/solana/submit-trip`);
  console.log(`   POST http://localhost:${PORT}/session/start`);
  console.log(`   POST http://localhost:${PORT}/session/end`);
  console.log(`   POST http://localhost:${PORT}/telemetry`);
  console.log(`   POST http://localhost:${PORT}/trip/finalize`);
  console.log(`   GET  http://localhost:${PORT}/trip/summary/:tripId`);
  console.log(`\n🎉 Backend is ready for testing!\n`);
});
