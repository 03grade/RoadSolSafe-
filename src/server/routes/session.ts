import express from 'express';
import {
  startSession,
  heartbeatSession,
  endSessionController
} from '../controllers/index.js';

const router = express.Router();

// Session endpoints
router.post('/start', startSession);
router.post('/heartbeat', heartbeatSession);
router.post('/end', endSessionController);

export default router;