// Enhanced validator service with management
import { logger } from '../utils/logger.js';
import { query } from '../database/index.js';

// Enhanced validator service
export const getValidatorStatus = async (validatorId: string) => {
  try {
    const result = await query(
      'SELECT * FROM validators WHERE validator_id = $1',
      [validatorId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Validator not found');
    }
    
    const validator = result.rows[0];
    
    return {
      validatorId: validator.validator_id,
      isActive: validator.is_active,
      totalValidations: validator.total_validations,
      successRate: validator.success_rate,
      validatorWeight: validator.validator_weight
    };
  } catch (error) {
    logger.error('Failed to get validator status:', error);
    throw error;
  }
};

export const updateValidatorWeights = async (validatorId: string, newWeights: number) => {
  try {
    // Update validator weights in database
    const result = await query(
      'UPDATE validators SET validator_weight = $1 WHERE validator_id = $2 RETURNING *',
      [newWeights, validatorId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Validator not found');
    }
    
    return {
      success: true,
      validatorId: result.rows[0].validator_id,
      validatorWeight: result.rows[0].validator_weight
    };
  } catch (error) {
    logger.error('Failed to update validator weights:', error);
    throw error;
  }
};

export const createValidator = async (validatorId: string, publicKey: string, privateKey: string) => {
  try {
    const result = await query(
      `INSERT INTO validators (validator_id, public_key, private_key, is_active, validator_weight) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [validatorId, publicKey, privateKey, true, 1.0]
    );
    
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to create validator:', error);
    throw error;
  }
};

export const validateValidator = async (validatorId: string) => {
  try {
    const result = await query(
      'SELECT * FROM validators WHERE validator_id = $1 AND is_active = TRUE',
      [validatorId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Failed to validate validator:', error);
    return false;
  }
};