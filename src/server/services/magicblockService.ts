// Enhanced MagicBlock integration service
import { logger } from '../utils/logger.js';
import axios from 'axios';

// MagicBlock service configuration
export interface MagicBlockConfig {
  apiKey: string;
  apiUrl: string;
  erEndpoint: string;
  perEndpoint: string;
}

export class MagicBlockService {
  private config: MagicBlockConfig;
  private axiosInstance: any;

  constructor(config: MagicBlockConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });
  }

  // Encrypt data using MagicBlock ER
  async encryptData(data: string, key?: string): Promise<string> {
    try {
      const response = await this.axiosInstance.post(this.config.erEndpoint, {
        data,
        operation: 'encrypt',
        ...(key && { key })
      });
      
      return response.data.encryptedData;
    } catch (error) {
      logger.error('MagicBlock encryption failed:', error);
      throw new Error('Failed to encrypt data with MagicBlock');
    }
  }

  // Decrypt data using MagicBlock PER
  async decryptData(encryptedData: string, key?: string): Promise<string> {
    try {
      const response = await this.axiosInstance.post(this.config.perEndpoint, {
        data: encryptedData,
        operation: 'decrypt',
        ...(key && { key })
      });
      
      return response.data.decryptedData;
    } catch (error) {
      logger.error('MagicBlock decryption failed:', error);
      throw new Error('Failed to decrypt data with MagicBlock');
    }
  }

  // Hash data using MagicBlock
  async hashData(data: string): Promise<string> {
    try {
      const response = await this.axiosInstance.post(this.config.erEndpoint, {
        data,
        operation: 'hash'
      });
      
      return response.data.hash;
    } catch (error) {
      logger.error('MagicBlock hashing failed:', error);
      throw new Error('Failed to hash data with MagicBlock');
    }
  }

  // Validate data integrity
  async validateDataIntegrity(data: string, expectedHash: string): Promise<boolean> {
    try {
      const calculatedHash = await this.hashData(data);
      return calculatedHash === expectedHash;
    } catch (error) {
      logger.error('Data integrity validation failed:', error);
      return false;
    }
  }

  // Update validator weights
  async updateValidatorWeights(validatorId: string, weights: any): Promise<any> {
    try {
      const response = await this.axiosInstance.put(`/validators/${validatorId}/weights`, {
        weights
      });
      
      return response.data;
    } catch (error) {
      logger.error('Validator weights update failed:', error);
      throw new Error('Failed to update validator weights');
    }
  }
}

// Initialize MagicBlock service
export const magicBlockService = new MagicBlockService({
  apiKey: process.env.MAGICBLOCK_API_KEY || '',
  apiUrl: process.env.MAGICBLOCK_API_URL || 'https://api.magicblock.com',
  erEndpoint: '/er',
  perEndpoint: '/per'
});