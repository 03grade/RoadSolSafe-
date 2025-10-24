import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { query } from '../database/index.js';

// Validator controller
export const getValidatorStatus = async (req: Request, res: Response) => {
  try {
    const { validatorId } = req.params;
    
    if (!validatorId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validator ID is required'
        }
      });
    }
    
    const result = await query(
      'SELECT * FROM validators WHERE validator_id = $1',
      [validatorId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'VALIDATOR_NOT_FOUND',
          message: 'Validator not found'
        }
      });
    }
    
    const validator = result.rows[0];
    
    res.json({
      validatorId: validator.validator_id,
      isActive: validator.is_active,
      totalValidations: validator.total_validations,
      successRate: validator.success_rate,
      validatorWeight: validator.validator_weight
    });
  } catch (error) {
    logger.error('Get validator status failed:', error);
    res.status(500).json({
      error: {
        code: 'VALIDATOR_STATUS_FAILED',
        message: 'Failed to get validator status'
      }
    });
  }
};

export const updateValidatorWeights = async (req: Request, res: Response) => {
  try {
    const { validatorId, newWeights } = req.body;
    
    if (!validatorId || !newWeights) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validator ID and new weights are required'
        }
      });
    }
    
    // Update validator weights in database
    const result = await query(
      'UPDATE validators SET validator_weight = $1 WHERE validator_id = $2 RETURNING *',
      [newWeights, validatorId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'VALIDATOR_NOT_FOUND',
          message: 'Validator not found'
        }
      });
    }
    
    res.json({
      success: true,
      validatorId: result.rows[0].validator_id,
      validatorWeight: result.rows[0].validator_weight
    });
  } catch (error) {
    logger.error('Update validator weights failed:', error);
    res.status(500).json({
      error: {
        code: 'VALIDATOR_WEIGHT_UPDATE_FAILED',
        message: 'Failed to update validator weights'
      }
    });
  }
};