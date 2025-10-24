// Unit Tests for RealSolanaTransactionService
import realSolanaTransactionService from '../services/RealSolanaTransactionService';

// Mock Solana web3.js
jest.mock('@solana/web3.js', () => {
  const mockConnection = {
    getLatestBlockhash: jest.fn(),
    sendTransaction: jest.fn(),
    confirmTransaction: jest.fn(),
    getBalance: jest.fn(),
    requestAirdrop: jest.fn(),
    getAccountInfo: jest.fn(),
    getTransaction: jest.fn()
  };

  return {
    Connection: jest.fn().mockImplementation(() => mockConnection),
    PublicKey: jest.fn().mockImplementation((key) => ({ 
      toString: () => key,
      toBytes: () => new Uint8Array(32).fill(0)
    })),
    Keypair: {
      fromSecretKey: jest.fn().mockReturnValue({
        publicKey: { toString: () => '6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2' }
      })
    },
    Transaction: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockReturnThis(),
      recentBlockhash: null,
      feePayer: null
    })),
    TransactionInstruction: jest.fn(),
    SystemProgram: {
      programId: { toString: () => '11111111111111111111111111111111' }
    }
  };
});

// Get the mocked connection
const { Connection } = require('@solana/web3.js');
const mockConnection = new Connection();

describe('RealSolanaTransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitTripToSolana', () => {
    it('should successfully submit trip to Solana', async () => {
      const mockTripData = {
        programId: 'BknefWnKwdFMsMgXdgN9XWjjo55CRMrsJ2F7iQ4epURx',
        tripId: 'trip_1234567890_test',
        driverWallet: '6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2',
        passengerPubkey: '11111111111111111111111111111111',
        tripIdNumeric: 1234567890,
        startTime: 1640995200,
        distance: 5000,
        duration: 1800,
        fare: 8500000,
        safetyScore: 8.5,
        hardBrakes: 2,
        hardAccelerations: 1,
        harshCorners: 0,
        timestamp: Date.now()
      };

      // Mock successful transaction
      mockConnection.getLatestBlockhash.mockResolvedValue({ blockhash: 'test-blockhash' });
      mockConnection.sendTransaction.mockResolvedValue('test-transaction-signature');
      mockConnection.confirmTransaction.mockResolvedValue({ value: { err: null } });

      const result = await realSolanaTransactionService.submitTripToSolana(mockTripData);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('transactionSignature', 'test-transaction-signature');
      expect(result).toHaveProperty('solscanUrl');
      expect(result).toHaveProperty('tripId', mockTripData.tripId);
      expect(result).toHaveProperty('status', 'confirmed');
    });

    it('should handle transaction failure', async () => {
      const mockTripData = {
        programId: 'BknefWnKwdFMsMgXdgN9XWjjo55CRMrsJ2F7iQ4epURx',
        tripId: 'trip_1234567890_test',
        driverWallet: '6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2',
        passengerPubkey: '11111111111111111111111111111111',
        tripIdNumeric: 1234567890,
        startTime: 1640995200,
        distance: 5000,
        duration: 1800,
        fare: 8500000,
        safetyScore: 8.5,
        hardBrakes: 2,
        hardAccelerations: 1,
        harshCorners: 0,
        timestamp: Date.now()
      };

      // Mock transaction failure
      mockConnection.getLatestBlockhash.mockResolvedValue({ blockhash: 'test-blockhash' });
      mockConnection.sendTransaction.mockResolvedValue('test-transaction-signature');
      mockConnection.confirmTransaction.mockResolvedValue({ value: { err: 'Transaction failed' } });

      await expect(realSolanaTransactionService.submitTripToSolana(mockTripData))
        .rejects.toThrow('Transaction failed: Transaction failed');
    });

    it('should handle network errors', async () => {
      const mockTripData = {
        programId: 'BknefWnKwdFMsMgXdgN9XWjjo55CRMrsJ2F7iQ4epURx',
        tripId: 'trip_1234567890_test',
        driverWallet: '6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2',
        passengerPubkey: '11111111111111111111111111111111',
        tripIdNumeric: 1234567890,
        startTime: 1640995200,
        distance: 5000,
        duration: 1800,
        fare: 8500000,
        safetyScore: 8.5,
        hardBrakes: 2,
        hardAccelerations: 1,
        harshCorners: 0,
        timestamp: Date.now()
      };

      // Mock network error
      mockConnection.getLatestBlockhash.mockRejectedValue(new Error('Network error'));

      await expect(realSolanaTransactionService.submitTripToSolana(mockTripData))
        .rejects.toThrow('Network error');
    });
  });

  describe('getAccountInfo', () => {
    it('should get account info successfully', async () => {
      mockConnection.getAccountInfo.mockResolvedValue({ data: 'test-data' });

      const result = await realSolanaTransactionService.getAccountInfo('test-account-id');

      expect(result).toEqual({ data: 'test-data' });
      expect(mockConnection.getAccountInfo).toHaveBeenCalled();
    });

    it('should handle account info errors', async () => {
      mockConnection.getAccountInfo.mockRejectedValue(new Error('Account not found'));

      await expect(realSolanaTransactionService.getAccountInfo('invalid-account'))
        .rejects.toThrow('Account not found');
    });
  });

  describe('getTransactionSignature', () => {
    it('should get transaction successfully', async () => {
      const mockTransaction = { signature: 'test-signature', status: 'confirmed' };
      mockConnection.getTransaction.mockResolvedValue(mockTransaction);

      const result = await realSolanaTransactionService.getTransactionSignature('test-signature');

      expect(result).toEqual(mockTransaction);
      expect(mockConnection.getTransaction).toHaveBeenCalledWith('test-signature');
    });

    it('should handle transaction not found', async () => {
      mockConnection.getTransaction.mockRejectedValue(new Error('Transaction not found'));

      await expect(realSolanaTransactionService.getTransactionSignature('invalid-signature'))
        .rejects.toThrow('Transaction not found');
    });
  });
});
