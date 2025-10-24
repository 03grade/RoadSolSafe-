import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { connectDB, createTables } from './database/index.js';
import { logger } from './utils/logger.js';
import sessionRoutes from './routes/session.js';
import tripRoutes from './routes/trip.js';
import rewardRoutes from './routes/reward.js';
import telemetryRoutes from './routes/telemetry.js';
import validatorRoutes from './routes/validator.js';
import solanaRoutes from './routes/solana.js';
import { initSolana } from './services/solanaService.js';
import { startWorkers } from './workers/index.js';

// Initialize Express app
const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  }
});
app.use(limiter);

// Connect to database
connectDB()
  .then(async () => {
    logger.info('Connected to database');
    // Create tables if they don't exist
    await createTables();
    logger.info('Database tables created/verified');
  })
  .catch((err) => {
    logger.error('Failed to connect to database:', err);
    process.exit(1);
  });

// Initialize Solana connection
initSolana()
  .then(() => logger.info('Solana connection initialized'))
  .catch((err) => {
    logger.error('Failed to initialize Solana connection:', err);
  });

// Routes
app.use('/session', sessionRoutes);
app.use('/trip', tripRoutes);
app.use('/reward', rewardRoutes);
app.use('/telemetry', telemetryRoutes);
app.use('/validator', validatorRoutes);
app.use('/solana', solanaRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'driver-trip-reward-backend'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error:', err);
  
  // Default error response
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
});

const PORT = config.port || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Start workers
  startWorkers();
});

export default app;