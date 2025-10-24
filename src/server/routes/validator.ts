import express from 'express';
import {
  getValidatorStatusController,
  updateValidatorWeightsController
} from '../controllers/index.js';

const router = express.Router();

// Validator endpoints
router.get('/status/:validatorId', getValidatorStatusController);
router.post('/weights', updateValidatorWeightsController);

export default router;