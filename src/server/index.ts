// Enhanced main server entry point
import './database/schema';
import './config/index';
import './utils/logger';
import './services/solanaService';
import './workers/index';
import app from './app';

// Start workers
import { startWorkers } from './workers/index';
startWorkers();

export default app;