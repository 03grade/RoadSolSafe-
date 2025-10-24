// Enhanced configuration with validation
import { dbConfig } from '../database/index.js';
import { logger } from '../utils/logger.js';

// Configuration
export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    user: process.env.DB_USER || dbConfig.user,
    host: process.env.DB_HOST || dbConfig.host,
    name: process.env.DB_NAME || dbConfig.database,
    password: process.env.DB_PASSWORD || dbConfig.password,
    port: parseInt(process.env.DB_PORT || dbConfig.port.toString()),
  },
  magicblock: {
    apiKey: process.env.MAGICBLOCK_API_KEY || '',
    apiUrl: process.env.MAGICBLOCK_API_URL || 'https://api.magicblock.com',
    erEndpoint: '/er',
    perEndpoint: '/per',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_key_for_depin_rewards',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    programId: process.env.SOLANA_PROGRAM_ID || 'H4BYVfgU4eL2t3Pj761nEaZrnQZQtpTnWqJPkuefPXtX',
  },
  session: {
    timeout: parseInt(process.env.SESSION_TIMEOUT || '86400'), // 24 hours in seconds
  }
};

export const validateConfig = () => {
  // Validate database configuration
  if (!config.db.user || !config.db.name || !config.db.password) {
    logger.error('Database configuration is incomplete');
    process.exit(1);
  }
  
  // Validate Solana configuration
  if (!config.solana.rpcUrl || !config.solana.programId) {
    logger.error('Solana configuration is incomplete');
    process.exit(1);
  }
  
  // Log configuration (without sensitive data)
  logger.info('Configuration loaded successfully');
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Server port: ${config.port}`);
  logger.info(`Database: ${config.db.name} on ${config.db.host}:${config.db.port}`);
};