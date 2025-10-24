// React Native Compatible Wallet Service for Solana Devnet
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PHANTOM_WALLETS, ACTIVE_WALLET, PhantomWallet } from '../config/walletConfig';

export interface WalletInfo {
  publicKey: string;
  secretKey?: number[];
  isConnected: boolean;
  balance: number;
  walletName?: string; // dev1, dev2, etc.
}

class WalletService {
  private wallet: WalletInfo | null = null;
  private readonly DEVNET_RPC_URL = 'https://api.devnet.solana.com';

  constructor() {
    // React Native compatible wallet service
  }

  /**
   * Connect to a Phantom wallet by name (dev1, dev2, etc.)
   */
  async connectPhantomWallet(walletName: string = 'dev1'): Promise<WalletInfo> {
    try {
      const phantomWallet = PHANTOM_WALLETS.find(w => w.name === walletName);
      if (!phantomWallet) {
        throw new Error(`Wallet ${walletName} not found`);
      }

      const wallet: WalletInfo = {
        publicKey: phantomWallet.publicKey,
        secretKey: phantomWallet.privateKey ? this.privateKeyToArray(phantomWallet.privateKey) : undefined,
        isConnected: true,
        balance: 0,
        walletName: phantomWallet.name,
      };

      // Store wallet locally
      await AsyncStorage.setItem('wallet', JSON.stringify(wallet));
      
      // Get initial balance
      await this.updateBalance(wallet.publicKey);
      
      this.wallet = wallet;
      console.log(`✅ Connected to ${phantomWallet.name}:`, wallet.publicKey);
      console.log(`💰 Balance: ${wallet.balance.toFixed(4)} SOL (devnet)`);
      
      return wallet;
    } catch (error) {
      console.error('Error connecting to Phantom wallet:', error);
      throw error;
    }
  }

  /**
   * Convert private key string to number array (for compatibility)
   */
  private privateKeyToArray(privateKey: string): number[] {
    // Simplified conversion for React Native compatibility
    // In production, you'd use proper base58 decoding
    try {
      // Convert base58 string to byte array (simplified)
      const bytes = [];
      for (let i = 0; i < privateKey.length; i += 2) {
        bytes.push(parseInt(privateKey.substr(i, 2), 16));
      }
      return bytes;
    } catch (error) {
      console.warn('Error converting private key:', error);
      return [];
    }
  }

  /**
   * Load existing wallet from storage
   */
  async loadWallet(): Promise<WalletInfo | null> {
    try {
      const walletJson = await AsyncStorage.getItem('wallet');
      if (walletJson) {
        const wallet = JSON.parse(walletJson) as WalletInfo;
        await this.updateBalance(wallet.publicKey);
        this.wallet = wallet;
        console.log('✅ Wallet loaded:', wallet.publicKey);
        return wallet;
      }
      return null;
    } catch (error) {
      console.error('Error loading wallet:', error);
      return null;
    }
  }

  /**
   * Connect to existing wallet or connect to default Phantom wallet
   */
  async connectWallet(): Promise<WalletInfo> {
    try {
      // Try to load existing wallet first
      const existingWallet = await this.loadWallet();
      if (existingWallet) {
        return existingWallet;
      }

      // Connect to default Phantom wallet (dev1 - user wallet)
      return await this.connectPhantomWallet('dev1 (user)');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  /**
   * Switch between Phantom wallets (dev1, dev2)
   */
  async switchWallet(walletName: string): Promise<WalletInfo> {
    try {
      return await this.connectPhantomWallet(walletName);
    } catch (error) {
      console.error('Error switching wallet:', error);
      throw error;
    }
  }

  /**
   * Get available Phantom wallets
   */
  getAvailableWallets(): PhantomWallet[] {
    return PHANTOM_WALLETS;
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    try {
      console.log('🔌 Disconnecting wallet...');
      await AsyncStorage.removeItem('wallet');
      this.wallet = null;
      console.log('✅ Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }

  /**
   * Update wallet balance using Solana RPC
   */
  async updateBalance(publicKey: string): Promise<number> {
    try {
      // Use Solana RPC directly for React Native compatibility
      const response = await fetch(this.DEVNET_RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [publicKey],
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const balance = data.result?.value || 0;
      const solBalance = balance / 1e9; // Convert lamports to SOL
      
      if (this.wallet) {
        this.wallet.balance = solBalance;
        await AsyncStorage.setItem('wallet', JSON.stringify(this.wallet));
      }
      
      return solBalance;
    } catch (error) {
      console.error('Error updating balance:', error);
      return 0;
    }
  }

  /**
   * Get current wallet info
   */
  getWallet(): WalletInfo | null {
    return this.wallet;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.wallet?.isConnected || false;
  }

  /**
   * Get wallet public key
   */
  getPublicKey(): string | null {
    return this.wallet?.publicKey || null;
  }

  /**
   * Request SOL airdrop using Solana RPC
   */
  async requestAirdrop(amount: number = 2): Promise<string> {
    try {
      if (!this.wallet) {
        throw new Error('No wallet connected');
      }

      // Use Solana RPC directly for React Native compatibility
      const response = await fetch(this.DEVNET_RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'requestAirdrop',
          params: [this.wallet.publicKey, amount * 1e9],
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const signature = data.result;
      
      // Wait for confirmation (simplified)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update balance
      await this.updateBalance(this.wallet.publicKey);
      
      console.log('✅ Airdrop received:', signature);
      console.log(`💰 New balance: ${this.wallet?.balance.toFixed(4)} SOL (devnet)`);
      return signature;
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      throw error;
    }
  }

  /**
   * Get transaction history using Solana RPC
   */
  async getTransactionHistory(limit: number = 10): Promise<any[]> {
    try {
      if (!this.wallet) {
        return [];
      }

      // Use Solana RPC directly for React Native compatibility
      const response = await fetch(this.DEVNET_RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [this.wallet.publicKey, { limit }],
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.result || [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const walletService = new WalletService();
export default walletService;
