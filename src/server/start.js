// Simple JavaScript server - no TypeScript complications
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'depin_rewards',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Test database connection
async function testDatabase() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        driver_id VARCHAR(64) UNIQUE NOT NULL,
        public_key VARCHAR(128) NOT NULL,
        total_trips INTEGER DEFAULT 0,
        total_earnings BIGINT DEFAULT 0,
        total_distance BIGINT DEFAULT 0,
        total_score BIGINT DEFAULT 0,
        avg_rating NUMERIC(3,2) DEFAULT 0.00,
        last_trip_time BIGINT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        validator_pubkey VARCHAR(128),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id VARCHAR(64) UNIQUE NOT NULL,
        driver_id VARCHAR(64) NOT NULL,
        passenger_id VARCHAR(64) NOT NULL,
        start_time BIGINT NOT NULL,
        end_time BIGINT DEFAULT 0,
        distance BIGINT DEFAULT 0,
        duration BIGINT DEFAULT 0,
        fare BIGINT DEFAULT 0,
        rating NUMERIC(3,2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'pending',
        score INTEGER DEFAULT 0,
        trip_hash BYTEA,
        verification_status INTEGER DEFAULT 0,
        validator_pubkey VARCHAR(128),
        start_lat DECIMAL(10,8),
        start_lng DECIMAL(11,8),
        end_lat DECIMAL(10,8),
        end_lng DECIMAL(11,8),
        hard_brakes INTEGER DEFAULT 0,
        hard_accelerations INTEGER DEFAULT 0,
        harsh_corners INTEGER DEFAULT 0,
        speeding_time INTEGER DEFAULT 0,
        phone_interaction INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(64) UNIQUE NOT NULL,
        driver_id VARCHAR(64) NOT NULL,
        started_at BIGINT NOT NULL,
        last_active BIGINT NOT NULL,
        expires_at BIGINT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        telemetry_data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create trip_tee_results table for MagicBlock TEE processing results
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trip_tee_results (
      id SERIAL PRIMARY KEY,
      trip_id VARCHAR(255) UNIQUE NOT NULL,
      safety_metrics JSONB NOT NULL,
      safety_score DECIMAL(3,1) NOT NULL,
      tee_signature VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('✅ Database tables created/verified');
    
    // Insert test driver if not exists
    const result = await client.query(
      "SELECT * FROM drivers WHERE driver_id = 'driver_test_001'"
    );
    
    if (result.rows.length === 0) {
      await client.query(
        `INSERT INTO drivers (driver_id, public_key) VALUES ($1, $2)`,
        ['driver_test_001', 'test_public_key_123']
      );
      console.log('✅ Created test driver: driver_test_001');
    }
    
    // Add missing columns to existing trips table
    const alterQueries = [
      'ALTER TABLE trips ADD COLUMN IF NOT EXISTS start_lat DECIMAL(10,8)',
      'ALTER TABLE trips ADD COLUMN IF NOT EXISTS start_lng DECIMAL(11,8)',
      'ALTER TABLE trips ADD COLUMN IF NOT EXISTS end_lat DECIMAL(10,8)',
      'ALTER TABLE trips ADD COLUMN IF NOT EXISTS end_lng DECIMAL(11,8)',
      'ALTER TABLE trips ADD COLUMN IF NOT EXISTS hard_brakes INTEGER DEFAULT 0',
      'ALTER TABLE trips ADD COLUMN IF NOT EXISTS hard_accelerations INTEGER DEFAULT 0',
      'ALTER TABLE trips ADD COLUMN IF NOT EXISTS harsh_corners INTEGER DEFAULT 0',
      'ALTER TABLE trips ADD COLUMN IF NOT EXISTS speeding_time INTEGER DEFAULT 0',
      'ALTER TABLE trips ADD COLUMN IF NOT EXISTS phone_interaction INTEGER DEFAULT 0'
    ];
    
    for (const query of alterQueries) {
      try {
        await client.query(query);
        console.log(`✅ Added column: ${query.split(' ')[5]}`);
      } catch (err) {
        console.log(`ℹ️  Column already exists: ${query.split(' ')[5]}`);
      }
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }
}

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'driver-trip-reward-backend'
  });
});

app.post('/session/start', async (req, res) => {
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
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 24 * 60 * 60; // 24 hours
    
    await pool.query(
      `INSERT INTO sessions (session_id, driver_id, started_at, last_active, expires_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [sessionId, driverId, now, now, expiresAt, true]
    );
    
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

app.post('/session/end', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    await pool.query(
      `UPDATE sessions SET is_active = FALSE WHERE session_id = $1`,
      [sessionId]
    );
    
    console.log(`✅ Session ended: ${sessionId}`);
    
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

app.post('/telemetry', async (req, res) => {
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
    
    const now = Math.floor(Date.now() / 1000);
    
    await pool.query(
      `UPDATE sessions 
       SET telemetry_data = COALESCE(telemetry_data, '[]'::jsonb) || $1::jsonb,
           last_active = $2
       WHERE session_id = $3`,
      [JSON.stringify([telemetryData]), now, sessionId]
    );
    
    console.log(`✅ Telemetry uploaded for session: ${sessionId}`);
    
    res.status(201).json({
      success: true,
      telemetryId: sessionId
    });
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

// MagicBlock PER/TEE telemetry processing endpoint
app.post('/magicblock/telemetry', async (req, res) => {
  try {
    const { tripId, encryptedTelemetryData, authToken } = req.body;
    
    if (!tripId || !encryptedTelemetryData) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Trip ID and encrypted telemetry data are required'
        }
      });
    }
    
    console.log(`🔐 Processing MagicBlock telemetry for trip: ${tripId}`);
    
    // In real implementation: send to MagicBlock PER/TEE
    // For now, simulate TEE processing
    const simulatedTeeResult = {
      tripId,
      safetyMetrics: {
        hardBrakes: Math.floor(Math.random() * 3),
        hardAccelerations: Math.floor(Math.random() * 2),
        harshCorners: Math.floor(Math.random() * 2),
        speedingTime: Math.floor(Math.random() * 30),
        phoneInteraction: Math.floor(Math.random() * 5),
      },
      safetyScore: Math.max(0, Math.min(10, 10 - Math.random() * 2)),
      signature: `tee_signature_${tripId}_${Date.now()}`,
      timestamp: Date.now(),
    };
    
    // Store TEE result in database
    await pool.query(
      `INSERT INTO trip_tee_results (trip_id, safety_metrics, safety_score, tee_signature, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (trip_id) 
       DO UPDATE SET safety_metrics = EXCLUDED.safety_metrics,
                     safety_score = EXCLUDED.safety_score,
                     tee_signature = EXCLUDED.tee_signature,
                     created_at = EXCLUDED.created_at`,
      [
        tripId,
        JSON.stringify(simulatedTeeResult.safetyMetrics),
        simulatedTeeResult.safetyScore,
        simulatedTeeResult.signature,
        new Date()
      ]
    );
    
    console.log(`✅ MagicBlock TEE processing completed for trip: ${tripId}`);
    
    res.status(201).json({
      success: true,
      teeResult: simulatedTeeResult
    });
  } catch (error) {
    console.error('MagicBlock telemetry processing error:', error);
    res.status(500).json({
      error: {
        code: 'MAGICBLOCK_PROCESSING_FAILED',
        message: 'Failed to process telemetry with MagicBlock TEE'
      }
    });
  }
});

app.post('/trip/finalize', async (req, res) => {
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

    // Get session and telemetry data
    const sessionResult = await pool.query(
      'SELECT * FROM sessions WHERE session_id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found'
        }
      });
    }

    const session = sessionResult.rows[0];
    const telemetryChunks = session.telemetry_data || [];

    if (telemetryChunks.length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_TELEMETRY_DATA',
          message: 'No telemetry data found for session'
        }
      });
    }

    // Basic safety score calculation (simplified for MVP)
    // In production, this would use the full SafetyScoreService
    let totalDistance = 0;
    let totalDuration = 0;
    let hardBrakeCount = 0;
    let speedingCount = 0;
    
    // Simple analysis of telemetry chunks
    for (const chunk of telemetryChunks) {
      if (chunk.gpsData && chunk.gpsData.length > 0) {
        // Calculate distance from GPS points
        for (let i = 1; i < chunk.gpsData.length; i++) {
          const p1 = chunk.gpsData[i - 1];
          const p2 = chunk.gpsData[i];
          
          // Haversine formula for distance
          const R = 6371; // Earth's radius in km
          const dLat = (p2.lat - p1.lat) * Math.PI / 180;
          const dLon = (p2.lon - p1.lon) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          totalDistance += R * c;
        }
      }
      
      // Check for hard braking in IMU data
      if (chunk.imuData && chunk.imuData.length > 0) {
        for (const imu of chunk.imuData) {
          // Simple threshold check for hard braking (deceleration)
          if (imu.accX < -3.5) hardBrakeCount++;
          
          // Check for speeding (speed > 80 km/h)
          if (chunk.gpsData && chunk.gpsData.length > 0) {
            const avgSpeed = chunk.gpsData.reduce((sum, p) => sum + (p.speed || 0), 0) / chunk.gpsData.length;
            if (avgSpeed > 22.2) speedingCount++; // 22.2 m/s = 80 km/h
          }
        }
      }
    }
    
    // Calculate duration from timestamps
    if (telemetryChunks.length > 0 && telemetryChunks[0].gpsData && telemetryChunks[0].gpsData.length > 0) {
      const firstTimestamp = telemetryChunks[0].gpsData[0].timestamp;
      const lastChunk = telemetryChunks[telemetryChunks.length - 1];
      const lastTimestamp = lastChunk.gpsData[lastChunk.gpsData.length - 1].timestamp;
      totalDuration = (lastTimestamp - firstTimestamp) / (1000 * 60); // minutes
    }
    
    // Calculate safety score (0-10)
    let safetyScore = 10.0;
    safetyScore -= hardBrakeCount * 0.5; // -0.5 per hard brake
    safetyScore -= (speedingCount / 100) * 2.0; // -2 per 100 speeding samples
    safetyScore = Math.max(0, Math.min(10, safetyScore)); // Clamp between 0-10
    
    console.log(`📊 Trip Analysis:`);
    console.log(`   Distance: ${totalDistance.toFixed(2)} km`);
    console.log(`   Duration: ${totalDuration.toFixed(1)} min`);
    console.log(`   Hard Brakes: ${hardBrakeCount}`);
    console.log(`   Safety Score: ${safetyScore.toFixed(1)}/10`);

    // Create trip record
    const tripId = tripData?.tripId || `trip_${Date.now()}`;
    const nowUnix = Math.floor(Date.now() / 1000);
    const startTimeUnix = nowUnix - Math.floor(totalDuration * 60);
    
    await pool.query(
      `INSERT INTO trips (
        trip_id, driver_id, passenger_id, start_time, end_time, 
        distance, duration, fare, rating, status, score, verification_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        tripId,
        session.driver_id,
        tripData?.passengerId || 'self',
        startTimeUnix,
        nowUnix,
        Math.floor(totalDistance * 1000), // meters
        Math.floor(totalDuration * 60), // seconds
        tripData?.fare || 0,
        parseFloat(safetyScore.toFixed(2)), // rating as NUMERIC(3,2)
        'completed',
        Math.floor(safetyScore * 10), // score as INTEGER (0-100)
        1
      ]
    );
    
    // End session
    await pool.query(
      'UPDATE sessions SET is_active = FALSE WHERE session_id = $1',
      [sessionId]
    );
    
    console.log(`✅ Trip finalized: ${tripId}, Score: ${safetyScore.toFixed(1)}/10`);

    res.json({
      success: true,
      tripId,
      safetyScore: safetyScore.toFixed(1),
      distance: totalDistance.toFixed(2),
      duration: totalDuration.toFixed(1),
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

// Get trip summary by trip ID
app.get('/trip/summary/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM trips WHERE trip_id = $1',
      [tripId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    const trip = result.rows[0];
    
    res.json({
      tripId: trip.trip_id,
      driverId: trip.driver_id,
      startTime: trip.start_time,
      endTime: trip.end_time,
      distance: trip.distance,
      duration: trip.duration,
      safetyScore: trip.score / 10, // Convert from 0-100 to 0-10
      rating: trip.rating,
      startLocation: { latitude: trip.start_lat, longitude: trip.start_lng },
      endLocation: { latitude: trip.end_lat, longitude: trip.end_lng },
      route: [], // TODO: Add route data
      metrics: {
        hardBrakes: trip.hard_brakes || 0,
        hardAccelerations: trip.hard_accelerations || 0,
        harshCorners: trip.harsh_corners || 0,
        speedingTime: trip.speeding_time || 0,
        phoneInteraction: trip.phone_interaction || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching trip summary:', error);
    res.status(500).json({ error: 'Failed to fetch trip summary' });
  }
});

// Get trip history for a driver
app.get('/trip/history/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const result = await pool.query(
      'SELECT trip_id, start_time, distance, duration, score, rating FROM trips WHERE driver_id = $1 ORDER BY start_time DESC LIMIT 20',
      [driverId]
    );
    
    const trips = result.rows.map(trip => ({
      tripId: trip.trip_id,
      date: new Date(trip.start_time).toISOString(),
      distance: trip.distance,
      duration: trip.duration,
      safetyScore: trip.score / 10, // Convert from 0-100 to 0-10
      rating: trip.rating,
    }));
    
    res.json(trips);
  } catch (error) {
    console.error('Error fetching trip history:', error);
    res.status(500).json({ error: 'Failed to fetch trip history' });
  }
});

// Get latest trip for a driver
app.get('/trip/latest/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM trips WHERE driver_id = $1 ORDER BY start_time DESC LIMIT 1',
      [driverId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No trips found' });
    }
    
    const trip = result.rows[0];
    
    res.json({
      tripId: trip.trip_id,
      driverId: trip.driver_id,
      startTime: trip.start_time,
      endTime: trip.end_time,
      distance: trip.distance,
      duration: trip.duration,
      safetyScore: trip.score / 10, // Convert from 0-100 to 0-10
      rating: trip.rating,
      startLocation: { latitude: trip.start_lat, longitude: trip.start_lng },
      endLocation: { latitude: trip.end_lat, longitude: trip.end_lng },
      route: [], // TODO: Add route data
      metrics: {
        hardBrakes: trip.hard_brakes || 0,
        hardAccelerations: trip.hard_accelerations || 0,
        harshCorners: trip.harsh_corners || 0,
        speedingTime: trip.speeding_time || 0,
        phoneInteraction: trip.phone_interaction || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching latest trip:', error);
    res.status(500).json({ error: 'Failed to fetch latest trip' });
  }
});

// Start server
async function start() {
  await testDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   GET  http://localhost:${PORT}/health`);
    console.log(`   POST http://localhost:${PORT}/session/start`);
    console.log(`   POST http://localhost:${PORT}/session/end`);
    console.log(`   POST http://localhost:${PORT}/telemetry`);
    console.log(`   POST http://localhost:${PORT}/trip/finalize`);
    console.log(`\n🎉 Backend is ready for testing!\n`);
  });
}

start();

