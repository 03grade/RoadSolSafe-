// Enhanced database connection with proper error handling
import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

// Database configuration
export const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'driver_trip_reward',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
};

// Create connection pool
const pool = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection with retry logic
export const connectDB = async (maxRetries = 3): Promise<any> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await pool.connect();
      logger.info('Database connected successfully');
      return pool;
    } catch (error) {
      lastError = error;
      logger.error(`Database connection attempt ${i + 1} failed:`, error);
      
      if (i < maxRetries - 1) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${lastError}`);
};

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Query executed in ${duration}ms: ${text.substring(0, 100)}...`);
    return result;
  } catch (error) {
    logger.error('Database query error:', { text, error });
    throw error;
  }
};

export const getClient = async () => {
  return await pool.connect();
};

// Migration functions
export const createTables = async () => {
  const queries = [
    // Drivers table
    `
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
    `,
    
    // Create indexes for drivers
    `
      CREATE INDEX IF NOT EXISTS idx_drivers_driver_id ON drivers(driver_id);
      CREATE INDEX IF NOT EXISTS idx_drivers_public_key ON drivers(public_key);
      CREATE INDEX IF NOT EXISTS idx_drivers_last_trip_time ON drivers(last_trip_time);
    `,
    
    // Trips table
    `
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `,
    
    // Create indexes for trips
    `
      CREATE INDEX IF NOT EXISTS idx_trips_trip_id ON trips(trip_id);
      CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
      CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
      CREATE INDEX IF NOT EXISTS idx_trips_start_time ON trips(start_time);
    `,
    
    // Sessions table
    `
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
    `,
    
    // Create indexes for sessions
    `
      CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_driver_id ON sessions(driver_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `,
    
    // Rewards table
    `
      CREATE TABLE IF NOT EXISTS rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        driver_id VARCHAR(64) NOT NULL,
        pool_id INTEGER NOT NULL,
        amount BIGINT NOT NULL,
        trip_id VARCHAR(64),
        status VARCHAR(20) DEFAULT 'pending',
        tx_hash VARCHAR(128),
        claimed_at BIGINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `,
    
    // Create indexes for rewards
    `
      CREATE INDEX IF NOT EXISTS idx_rewards_driver_id ON rewards(driver_id);
      CREATE INDEX IF NOT EXISTS idx_rewards_pool_id ON rewards(pool_id);
      CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);
      CREATE INDEX IF NOT EXISTS idx_rewards_claimed_at ON rewards(claimed_at);
    `,
    
    // Validators table
    `
      CREATE TABLE IF NOT EXISTS validators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        validator_id VARCHAR(64) UNIQUE NOT NULL,
        public_key TEXT NOT NULL,
        private_key TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        total_validations BIGINT DEFAULT 0,
        success_rate NUMERIC(5,2) DEFAULT 0.00,
        last_validation_time BIGINT DEFAULT 0,
        validator_weight NUMERIC(5,2) DEFAULT 1.00,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `,
    
    // Create indexes for validators
    `
      CREATE INDEX IF NOT EXISTS idx_validators_validator_id ON validators(validator_id);
      CREATE INDEX IF NOT EXISTS idx_validators_is_active ON validators(is_active);
    `
  ];

  try {
    for (const query of queries) {
      await pool.query(query);
    }
    logger.info('All database tables created successfully');
  } catch (error) {
    logger.error('Failed to create database tables:', error);
    throw error;
  }
};