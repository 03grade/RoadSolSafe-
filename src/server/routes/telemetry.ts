import express from 'express';
import {
  submitTelemetryController,
  getTelemetryController
} from '../controllers/index.js';

const router = express.Router();

// Telemetry endpoints
router.post('/', submitTelemetryController);
router.get('/:driverId', getTelemetryController);

export default router;