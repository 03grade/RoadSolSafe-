import express from 'express';
import {
  getWeeklyTotalController,
  getRewardProofController,
  prepareClaimController
} from '../controllers/index.js';

const router = express.Router();

// Reward endpoints
router.get('/weekly_total', getWeeklyTotalController);
router.get('/proof', getRewardProofController);
router.post('/claims/prepare', prepareClaimController);

export default router;