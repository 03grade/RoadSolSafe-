// Database migrations and initialization
import { query } from './index.js';
import { logger } from '../utils/logger.js';
import { createTables } from './schema.js';

/**
 * Run all database migrations
 */
export async function runMigrations() {
  try {
    logger.info('Starting database migrations...');

    // Create tables
    const tableQueries = await createTables();
    for (const sql of tableQueries) {
      await query(sql);
    }

    logger.info('✅ Tables created/verified');

    // Insert initial data
    await seedInitialData();

    logger.info('✅ Database migrations completed');
  } catch (error) {
    logger.error('Database migration failed:', error);
    throw error;
  }
}

/**
 * Seed initial data for testing
 */
async function seedInitialData() {
  try {
    // Check if test driver exists
    const existingDriver = await query(
      'SELECT * FROM drivers WHERE driver_id = $1',
      ['driver_test_001']
    );

    if (existingDriver.rows.length === 0) {
      // Insert test driver
      await query(
        `INSERT INTO drivers (
          driver_id, 
          public_key, 
          total_trips, 
          total_earnings, 
          total_distance, 
          total_score, 
          avg_rating, 
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          'driver_test_001',
          'YOUR_WALLET_PUBLIC_KEY', // Will be replaced when wallet connects
          0,
          0,
          0,
          0,
          0.0,
          true,
        ]
      );

      logger.info('✅ Created test driver: driver_test_001');
    }

    // Check if reward pool table exists (for post-MVP)
    try {
      await query(
        `CREATE TABLE IF NOT EXISTS reward_pools (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          pool_id INTEGER UNIQUE NOT NULL,
          total_rewards BIGINT NOT NULL,
          distributed_rewards BIGINT DEFAULT 0,
          reward_per_trip BIGINT NOT NULL,
          start_time BIGINT NOT NULL,
          end_time BIGINT NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          vault_address VARCHAR(128),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )`
      );

      logger.info('✅ Reward pools table created');
    } catch (error) {
      logger.warn('Reward pools table already exists');
    }

  } catch (error) {
    logger.error('Failed to seed initial data:', error);
    throw error;
  }
}

/**
 * Reset database (DANGEROUS - only for development)
 */
export async function resetDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot reset database in production!');
  }

  try {
    logger.warn('⚠️  Resetting database...');

    // Drop all tables
    const tables = ['rewards', 'trips', 'sessions', 'drivers', 'validators', 'reward_pools'];
    
    for (const table of tables) {
      await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }

    logger.warn('⚠️  All tables dropped');

    // Recreate tables
    await runMigrations();

    logger.info('✅ Database reset complete');
  } catch (error) {
    logger.error('Database reset failed:', error);
    throw error;
  }
}

