// Integration Tests for Complete MagicBlock PER + Solana Flow
import realMagicBlockPERService from '../services/RealMagicBlockPERService';

// Mock fetch for MagicBlock endpoints
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Solana web3.js
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getLatestBlockhash: jest.fn(),
    sendTransaction: jest.fn(),
    confirmTransaction: jest.fn(),
    getAccountInfo: jest.fn()
  })),
  PublicKey: jest.fn().mockImplementation((key) => ({ toString: () => key })),
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
}));

describe('Complete MagicBlock PER + Solana Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('End-to-End Trip Processing', () => {
    it('should complete full trip flow with real MagicBlock PER and Solana', async () => {
      const tripId = 'trip_integration_test_1234567890';
      
      // Step 1: Mock MagicBlock PER initialization
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ verified: true })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ challenge: 'integration-challenge' })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'integration-token' })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessionId: tripId })
      });

      // Step 2: Start MagicBlock PER session
      const sessionStarted = await realMagicBlockPERService.startSession(tripId);
      expect(sessionStarted).toBe(true);

      // Step 3: Add telemetry data
      const telemetryData = {
        timestamp: Date.now(),
        latitude: 3.0845667,
        longitude: 101.7035633,
        accuracy: 5,
        speed: 60,
        acceleration: { x: 0.1, y: 0.2, z: 9.8 },
        gyroscope: { x: 0.01, y: 0.02, z: 0.03 },
        deviceFlags: {
          screenOn: true,
          appInForeground: true,
          phoneInteraction: false
        }
      };

      // Add multiple telemetry points to trigger PER submission
      for (let i = 0; i < 12; i++) {
        realMagicBlockPERService.addTelemetryData({
          ...telemetryData,
          timestamp: Date.now() + i * 1000
        });
      }

      // Step 4: Mock PER data processing
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ processed: true, metrics: { safetyScore: 8.5 } })
      });

      // Step 5: Mock backend Solana submission
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          transactionSignature: 'integration-tx-signature',
          solscanUrl: 'https://solscan.io/tx/integration-tx-signature?cluster=devnet'
        })
      });

      // Step 6: Process telemetry and create on-chain transaction
      const result = await realMagicBlockPERService.processTelemetryData(tripId);

      // Verify complete flow
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('txId');
      expect(result.txId).toBe('integration-tx-signature');
      expect(result.metrics.safetyScore).toBe(8.5);

      // Verify all MagicBlock PER calls were made
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/attestation/verify'),
        expect.objectContaining({ method: 'GET' })
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/challenge'),
        expect.objectContaining({ method: 'GET' })
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({ 
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' })
        })
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/session/initialize'),
        expect.objectContaining({ 
          method: 'POST',
          headers: expect.objectContaining({ 'Authorization': 'Bearer integration-token' })
        })
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/per/process'),
        expect.objectContaining({ 
          method: 'POST',
          headers: expect.objectContaining({ 'Authorization': 'Bearer integration-token' })
        })
      );
    });

    it('should handle MagicBlock PER failure and fallback to simulation', async () => {
      const tripId = 'trip_fallback_test_1234567890';
      
      // Mock TEE verification failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      // Start session (should fail)
      const sessionStarted = await realMagicBlockPERService.startSession(tripId);
      expect(sessionStarted).toBe(false);

      // Add telemetry data anyway
      const telemetryData = {
        timestamp: Date.now(),
        latitude: 3.0845667,
        longitude: 101.7035633,
        accuracy: 5,
        speed: 60,
        acceleration: { x: 0.1, y: 0.2, z: 9.8 },
        gyroscope: { x: 0.01, y: 0.02, z: 0.03 },
        deviceFlags: {
          screenOn: true,
          appInForeground: true,
          phoneInteraction: false
        }
      };

      realMagicBlockPERService.addTelemetryData(telemetryData);

      // Mock program verification for fallback
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          result: { value: { data: ['test-data'] } }
        })
      });

      // Process telemetry (should fallback to simulation)
      const result = await realMagicBlockPERService.processTelemetryData(tripId);

      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('txId');
      expect(result.txId).toContain('simulation_tx_');
    });

    it('should handle backend submission failure and fallback to simulation', async () => {
      const tripId = 'trip_backend_failure_test_1234567890';
      
      // Mock successful MagicBlock PER initialization
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ verified: true })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ challenge: 'backend-failure-challenge' })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'backend-failure-token' })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessionId: tripId })
      });

      await realMagicBlockPERService.startSession(tripId);

      // Mock PER processing success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ processed: true })
      });

      // Mock backend submission failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      // Mock program verification for fallback
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          result: { value: { data: ['test-data'] } }
        })
      });

      const result = await realMagicBlockPERService.processTelemetryData(tripId);

      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('txId');
      expect(result.txId).toContain('simulation_tx_');
    });
  });

  describe('Safety Metrics Processing', () => {
    it('should correctly calculate safety metrics from telemetry data', async () => {
      const tripId = 'trip_safety_metrics_test_1234567890';
      
      // Mock successful MagicBlock PER initialization
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ verified: true })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ challenge: 'safety-challenge' })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'safety-token' })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessionId: tripId })
      });

      await realMagicBlockPERService.startSession(tripId);

      // Add telemetry data with various safety events
      const safeTelemetryData = {
        timestamp: Date.now(),
        latitude: 3.0845667,
        longitude: 101.7035633,
        accuracy: 5,
        speed: 50,
        acceleration: { x: 0.1, y: 0.2, z: 9.8 },
        gyroscope: { x: 0.01, y: 0.02, z: 0.03 },
        deviceFlags: {
          screenOn: true,
          appInForeground: true,
          phoneInteraction: false
        }
      };

      const unsafeTelemetryData = {
        timestamp: Date.now(),
        latitude: 3.0845667,
        longitude: 101.7035633,
        accuracy: 5,
        speed: 80,
        acceleration: { x: 3.0, y: 2.0, z: 9.8 }, // Hard acceleration
        gyroscope: { x: 0.5, y: 0.3, z: 0.03 }, // Harsh corner
        deviceFlags: {
          screenOn: true,
          appInForeground: true,
          phoneInteraction: true // Phone interaction
        }
      };

      // Add mix of safe and unsafe data
      for (let i = 0; i < 5; i++) {
        realMagicBlockPERService.addTelemetryData(safeTelemetryData);
        realMagicBlockPERService.addTelemetryData(unsafeTelemetryData);
      }

      const metrics = realMagicBlockPERService.getSafetyMetrics();

      expect(metrics.hardAccelerations).toBeGreaterThan(0);
      expect(metrics.harshCorners).toBeGreaterThan(0);
      expect(metrics.phoneInteraction).toBeGreaterThan(0);
      expect(metrics.safetyScore).toBeLessThan(10.0);
    });
  });
});
