import express from 'express';
import {
  submitTripController,
  finalizeTripController,
  getTripStatusController
} from '../controllers/index.js';

const router = express.Router();

// Trip endpoints
router.post('/submit', submitTripController);
router.post('/finalize', finalizeTripController);
router.get('/status/:tripId', getTripStatusController);

export default router;