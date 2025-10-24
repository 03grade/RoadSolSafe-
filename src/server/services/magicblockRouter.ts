// MagicBlock Router API Client
import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';

const ROUTER_URL = process.env.MAGICBLOCK_ROUTER_URL || 'https://devnet-router.magicblock.app';

export interface Route {
  identity: string;
  fqdn: string;
  baseFee: number;
  blockTimeMs: number;
  countryCode: string;
}

export interface DelegationStatus {
  isDelegated: boolean;
  delegationRecord?: {
    authority: string;
    owner: string;
    delegationSlot: number;
    lamports: number;
  };
}

export interface BlockhashResult {
  blockhash: string;
  lastValidBlockHeight: number;
}

export class MagicBlockRouterClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: ROUTER_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Get available ER validators/routes
   */
  async getRoutes(): Promise<Route[]> {
    try {
      const response = await this.axiosInstance.post('', {
        jsonrpc: '2.0',
        id: 1,
        method: 'getRoutes',
      });

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      logger.info(`✅ Got ${response.data.result.length} MagicBlock routes`);
      return response.data.result;
    } catch (error) {
      logger.error('Failed to get MagicBlock routes:', error);
      throw new Error('Failed to fetch MagicBlock routes');
    }
  }

  /**
   * Get current validator identity
   */
  async getIdentity(): Promise<{ identity: string; fqdn: string }> {
    try {
      const response = await this.axiosInstance.post('', {
        jsonrpc: '2.0',
        id: 1,
        method: 'getIdentity',
      });

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      return response.data.result;
    } catch (error) {
      logger.error('Failed to get MagicBlock identity:', error);
      throw new Error('Failed to fetch MagicBlock identity');
    }
  }

  /**
   * Get blockhash for specific accounts
   */
  async getBlockhashForAccounts(accounts: string[]): Promise<BlockhashResult> {
    try {
      const response = await this.axiosInstance.post('', {
        jsonrpc: '2.0',
        id: 1,
        method: 'getBlockhashForAccounts',
        params: [accounts],
      });

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      return response.data.result;
    } catch (error) {
      logger.error('Failed to get blockhash for accounts:', error);
      throw new Error('Failed to fetch blockhash');
    }
  }

  /**
   * Get delegation status for an account
   */
  async getDelegationStatus(account: string): Promise<DelegationStatus> {
    try {
      const response = await this.axiosInstance.post('', {
        jsonrpc: '2.0',
        id: 1,
        method: 'getDelegationStatus',
        params: [account],
      });

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      return response.data.result;
    } catch (error) {
      logger.error('Failed to get delegation status:', error);
      throw new Error('Failed to fetch delegation status');
    }
  }

  /**
   * Get signature statuses (transaction monitoring)
   */
  async getSignatureStatuses(signatures: string[]): Promise<any> {
    try {
      const response = await this.axiosInstance.post('', {
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignatureStatuses',
        params: [signatures],
      });

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      return response.data.result;
    } catch (error) {
      logger.error('Failed to get signature statuses:', error);
      throw new Error('Failed to fetch signature statuses');
    }
  }

  /**
   * Get account info from Router
   */
  async getAccountInfo(account: string, encoding: string = 'base64+zstd'): Promise<any> {
    try {
      const response = await this.axiosInstance.post('', {
        jsonrpc: '2.0',
        id: 1,
        method: 'getAccountInfo',
        params: [account, { encoding }],
      });

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      return response.data.result;
    } catch (error) {
      logger.error('Failed to get account info:', error);
      throw new Error('Failed to fetch account info');
    }
  }

  /**
   * Select best validator based on country code
   */
  async selectBestValidator(preferredCountry?: string): Promise<Route> {
    const routes = await this.getRoutes();

    if (routes.length === 0) {
      throw new Error('No MagicBlock routes available');
    }

    // If preferred country specified, try to find it
    if (preferredCountry) {
      const preferredRoute = routes.find((r) => r.countryCode === preferredCountry);
      if (preferredRoute) {
        logger.info(`✅ Selected validator in ${preferredCountry}: ${preferredRoute.identity}`);
        return preferredRoute;
      }
    }

    // Otherwise, select based on lowest latency (assume first is best for now)
    const selected = routes[0];
    logger.info(`✅ Selected validator: ${selected.identity} (${selected.countryCode})`);
    return selected;
  }
}

// Export singleton instance
export const magicBlockRouter = new MagicBlockRouterClient();
export default magicBlockRouter;

