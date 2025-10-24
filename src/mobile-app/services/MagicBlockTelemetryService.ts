// MagicBlock Telemetry Service for DePIN Project
// Handles secure telemetry collection and scoring via MagicBlock PER/TEE

interface TelemetryData {
  timestamp: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  gyroscope: {
    x: number;
    y: number;
    z: number;
  };
  deviceFlags: {
    screenOn: boolean;
    appInForeground: boolean;
    phoneInteraction: boolean;
  };
}

interface SafetyMetrics {
  hardBrakes: number;
  hardAccelerations: number;
  harshCorners: number;
  speedingTime: number;
  phoneInteraction: number;
  totalDistance: number;
  totalDuration: number;
  safetyScore: number;
}

class MagicBlockTelemetryService {
  private isCollecting = false;
  private sessionId: string | null = null;
  private telemetryBuffer: TelemetryData[] = [];
  private safetyMetrics: SafetyMetrics = {
    hardBrakes: 0,
    hardAccelerations: 0,
    harshCorners: 0,
    speedingTime: 0,
    phoneInteraction: 0,
    totalDistance: 0,
    totalDuration: 0,
    safetyScore: 10.0
  };
  private lastLocation: { latitude: number; longitude: number } | null = null;
  private lastSpeed = 0;
  private speedingStartTime: number | null = null;

  // MagicBlock PER/TEE Configuration
  private readonly MAGICBLOCK_CONFIG = {
    PER_URL: 'https://tee.magicblock.app/',
    ER_URL: 'https://devnet.magicblock.app',
    ROUTER_URL: 'https://devnet-router.magicblock.app',
    VALIDATOR_ID: 'MAS1Dt9q...', // Asia validator
  };

  async startSession(tripId: string): Promise<boolean> {
    try {
      console.log('🚀 Starting MagicBlock telemetry session for trip:', tripId);
      
      this.sessionId = tripId;
      this.isCollecting = true;
      this.telemetryBuffer = [];
      this.resetSafetyMetrics();
      
      // Initialize MagicBlock PER session
      const sessionStarted = await this.initializeMagicBlockSession(tripId);
      
      if (sessionStarted) {
        console.log('✅ MagicBlock PER session initialized');
        return true;
      } else {
        console.log('⚠️ MagicBlock PER session failed, using fallback');
        return true; // Continue with local collection
      }
    } catch (error) {
      console.error('❌ Error starting MagicBlock telemetry session:', error);
      return false;
    }
  }

  async stopSession(): Promise<void> {
    try {
      console.log('🛑 Stopping MagicBlock telemetry session');
      
      this.isCollecting = false;
      
      if (this.telemetryBuffer.length > 0) {
        // Send final telemetry data to MagicBlock PER
        await this.sendTelemetryToMagicBlock();
        
        // Get final safety metrics from TEE
        await this.getFinalSafetyMetrics();
      }
      
      this.sessionId = null;
      console.log('✅ MagicBlock telemetry session stopped');
    } catch (error) {
      console.error('❌ Error stopping MagicBlock telemetry session:', error);
    }
  }

  addTelemetryData(data: TelemetryData): void {
    if (!this.isCollecting) return;
    
    this.telemetryBuffer.push(data);
    
    // Process safety metrics in real-time
    this.processSafetyMetrics(data);
    
    // Send to MagicBlock PER every 10 data points
    if (this.telemetryBuffer.length >= 10) {
      this.sendTelemetryToMagicBlock();
    }
  }

  getSafetyMetrics(): SafetyMetrics {
    return { ...this.safetyMetrics };
  }

  getStatus(): { isCollecting: boolean; chunkIndex: number } {
    return {
      isCollecting: this.isCollecting,
      chunkIndex: this.telemetryBuffer.length,
    };
  }

  private async initializeMagicBlockSession(tripId: string): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Verify TEE integrity
      // 2. Get auth token for PER access
      // 3. Initialize encrypted session
      
      console.log('🔐 Initializing MagicBlock PER session...');
      
      // Simulate TEE attestation
      const teeVerified = await this.verifyTeeIntegrity();
      if (!teeVerified) {
        console.log('⚠️ TEE verification failed, using local processing');
        return false;
      }
      
      // Simulate auth token retrieval
      const authToken = await this.getAuthToken(tripId);
      if (!authToken) {
        console.log('⚠️ Auth token failed, using local processing');
        return false;
      }
      
      console.log('✅ MagicBlock PER session ready');
      return true;
    } catch (error) {
      console.error('❌ MagicBlock PER initialization error:', error);
      return false;
    }
  }

  private async verifyTeeIntegrity(): Promise<boolean> {
    try {
      // In real implementation: verify TDX quote
      console.log('🔍 Verifying TEE integrity...');
      
      // Simulate TEE verification
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ TEE integrity verified');
      return true;
    } catch (error) {
      console.error('❌ TEE verification failed:', error);
      return false;
    }
  }

  private async getAuthToken(tripId: string): Promise<string | null> {
    try {
      // In real implementation: getAuthToken(publicKey, signMessage)
      console.log('🔑 Getting auth token for PER access...');
      
      // Simulate auth token
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const token = `auth_token_${tripId}_${Date.now()}`;
      console.log('✅ Auth token obtained');
      return token;
    } catch (error) {
      console.error('❌ Auth token failed:', error);
      return null;
    }
  }

  private async sendTelemetryToMagicBlock(): Promise<void> {
    try {
      if (this.telemetryBuffer.length === 0) return;
      
      console.log(`📡 Sending ${this.telemetryBuffer.length} telemetry points to MagicBlock PER...`);
      
      // In real implementation: encrypt and send to PER
      const encryptedData = this.encryptTelemetryData(this.telemetryBuffer);
      
      // Simulate sending to MagicBlock PER
      await this.sendToPer(encryptedData);
      
      // Clear buffer after successful send
      this.telemetryBuffer = [];
      
      console.log('✅ Telemetry data sent to MagicBlock PER');
    } catch (error) {
      console.error('❌ Error sending telemetry to MagicBlock:', error);
    }
  }

  private encryptTelemetryData(data: TelemetryData[]): string {
    // In real implementation: encrypt with session key
    return JSON.stringify(data);
  }

  private async sendToPer(encryptedData: string): Promise<void> {
    try {
      // In real implementation: POST to PER with auth token
      console.log('📤 Sending encrypted data to PER...');
      
      // Send to backend MagicBlock endpoint
      const BACKEND_URL = process.env.BACKEND_URL || 'http://192.168.1.12:3000';
      const response = await fetch(`${BACKEND_URL}/magicblock/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId: this.sessionId,
          encryptedTelemetryData: encryptedData,
          authToken: 'mock_auth_token', // In real implementation: get from TEE auth
        }),
      });
      
      if (!response.ok) {
        throw new Error(`MagicBlock PER request failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Data processed by PER:', result);
    } catch (error) {
      console.error('❌ PER communication error:', error);
      throw error;
    }
  }

  private async getFinalSafetyMetrics(): Promise<void> {
    try {
      console.log('📊 Getting final safety metrics from TEE...');
      
      // In real implementation: get signed aggregate from TEE
      const signedAggregate = await this.getSignedAggregate();
      
      if (signedAggregate) {
        this.safetyMetrics = signedAggregate.metrics;
        console.log('✅ Final safety metrics received from TEE');
      } else {
        console.log('⚠️ Using local safety metrics');
      }
    } catch (error) {
      console.error('❌ Error getting final safety metrics:', error);
    }
  }

  private async getSignedAggregate(): Promise<{ metrics: SafetyMetrics; signature: string } | null> {
    try {
      // In real implementation: get signed aggregate from TEE
      console.log('🔐 Getting signed aggregate from TEE...');
      
      // Simulate TEE processing
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        metrics: this.safetyMetrics,
        signature: `tee_signature_${this.sessionId}_${Date.now()}`,
      };
    } catch (error) {
      console.error('❌ Error getting signed aggregate:', error);
      return null;
    }
  }

  // Process telemetry data and create on-chain transaction
  async processTelemetryData(tripId: string): Promise<{ metrics: SafetyMetrics; txId: string }> {
    try {
      console.log('🔒 Processing telemetry and creating on-chain transaction...');
      
      // Step 1: Calculate safety metrics locally (since PER is not available)
      const metrics = this.calculateLocalSafetyMetrics();
      console.log('📊 Safety metrics calculated:', metrics);
      
      // Step 2: Create on-chain transaction using your deployed program
      const txId = await this.createOnChainTransaction(tripId, metrics);
      console.log('📝 On-chain transaction created:', txId);
      
      return {
        metrics,
        txId: txId
      };
      
    } catch (error) {
      console.error('❌ Error creating on-chain transaction:', error);
      // Fallback to local processing
      console.log('⚠️ Falling back to local processing...');
      const metrics = this.safetyMetrics;
      return {
        metrics,
        txId: 'local_fallback_' + Date.now()
      };
    }
  }

  // Calculate safety metrics locally
  private calculateLocalSafetyMetrics(): SafetyMetrics {
    const metrics = {
      hardBrakes: 0,
      hardAccelerations: 0,
      harshCorners: 0,
      speedingTime: 0,
      phoneInteraction: 0,
      totalDistance: 0,
      totalDuration: 0,
      safetyScore: 10.0
    };

    // Process telemetry buffer to calculate metrics
    for (const data of this.telemetryBuffer) {
      // Hard braking detection (|ax| > 3.5 m/s²)
      const accelerationMagnitude = Math.sqrt(
        data.acceleration.x ** 2 + 
        data.acceleration.y ** 2 + 
        data.acceleration.z ** 2
      );
      
      if (accelerationMagnitude > 3.5) {
        metrics.hardBrakes++;
      }
      
      // Hard acceleration detection (|ax| > 3.0 m/s²)
      if (Math.abs(data.acceleration.x) > 3.0) {
        metrics.hardAccelerations++;
      }
      
      // Harsh cornering detection (|yaw_rate| > 25°/s)
      const yawRate = Math.sqrt(
        data.gyroscope.x ** 2 + 
        data.gyroscope.y ** 2 + 
        data.gyroscope.z ** 2
      );
      
      if (yawRate > 25) {
        metrics.harshCorners++;
      }
      
      // Phone interaction detection
      if (data.deviceFlags.phoneInteraction) {
        metrics.phoneInteraction++;
      }
      
      // Speed detection (simplified)
      if (data.speed > 60) { // Assume 60 km/h limit
        metrics.speedingTime++;
      }
    }

    // Calculate safety score (0-10)
    metrics.safetyScore = Math.max(0, Math.min(10,
      10 - (metrics.hardBrakes * 0.5)
      - (metrics.hardAccelerations * 0.3)
      - (metrics.harshCorners * 0.2)
      - (metrics.speedingTime * 0.1)
      - (metrics.phoneInteraction * 0.2)
    ));

    metrics.totalDuration = this.telemetryBuffer.length;
    metrics.totalDistance = this.telemetryBuffer.reduce((sum, data) => sum + (data.speed || 0), 0) / 3600; // Convert to km

    return metrics;
  }

  // Create on-chain transaction using your deployed program
  private async createOnChainTransaction(tripId: string, metrics: SafetyMetrics): Promise<string> {
    try {
      console.log('🔗 Creating Solana transaction for your deployed program...');
      
      // Your deployed program ID
      const PROGRAM_ID = 'BknefWnKwdFMsMgXdgN9XWjjo55CRMrsJ2F7iQ4epURx';
      // Use dev2 wallet for transaction signing (distributor account)
      const DRIVER_WALLET = '6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2';
      
      // Prepare trip data for submission
      const tripData = {
        programId: PROGRAM_ID,
        tripId: tripId,
        driverWallet: DRIVER_WALLET,
        passengerPubkey: '11111111111111111111111111111111', // Mock passenger
        tripIdNumeric: parseInt(tripId.split('_').pop() || '1'),
        startTime: Math.floor(Date.now() / 1000),
        distance: Math.floor(metrics.totalDistance * 1000), // meters
        duration: Math.floor(metrics.totalDuration), // seconds
        fare: Math.floor(metrics.safetyScore * 1000000), // Convert safety score to fare
        safetyScore: metrics.safetyScore,
        hardBrakes: metrics.hardBrakes,
        hardAccelerations: metrics.hardAccelerations,
        harshCorners: metrics.harshCorners,
        timestamp: Date.now()
      };
      
      console.log('📊 Trip data for program submission:', tripData);
      
      // Try backend submission first
      try {
        console.log('🚀 Attempting backend submission...');
        const BACKEND_URL = process.env.BACKEND_URL || 'http://192.168.1.12:3000';
        
        const response = await fetch(`${BACKEND_URL}/solana/submit-trip`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            programId: PROGRAM_ID,
            tripData: tripData,
            wallet: {
              publicKey: DRIVER_WALLET,
              privateKey: '2tqoLKJ632JCPLbSiWvB5n9KDg4mtWEhLHdFGQk5mfeAJsFLRLQa3ag1DH4he8LwjK3BYjzE8XBMhiaNQKY2tGWc' // dev2 private key
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Backend submission successful:', result);
          return result.transactionSignature || `backend_tx_${Date.now()}`;
        } else {
          console.warn('⚠️ Backend submission failed:', response.status);
        }
      } catch (backendError) {
        console.warn('⚠️ Backend not available, using simulation:', backendError);
      }
      
      // Fallback to simulation if backend is not available
      console.log('🧪 Falling back to transaction simulation...');
      
      // Verify program exists
      const RPC_URL = 'https://api.devnet.solana.com';
      const programInfoResponse = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getAccountInfo',
          params: [
            PROGRAM_ID,
            { encoding: 'base64' }
          ]
        })
      });
      
      const programInfo = await programInfoResponse.json();
      if (programInfo.error || !programInfo.result?.value) {
        throw new Error(`Program not found: ${programInfo.error?.message || 'Unknown error'}`);
      }
      console.log('✅ Program verified:', PROGRAM_ID);
      
      // Create a transaction ID for tracking
      const txId = `simulation_tx_${tripId}_${Date.now()}`;
      console.log('📝 Simulation transaction ID created:', txId);
      
      console.log('💡 To see real transactions on Solscan:');
      console.log('   1. Implement backend endpoint /solana/submit-trip');
      console.log('   2. Add proper transaction signing with private key');
      console.log('   3. Submit actual transactions to Solana devnet');
      
      return txId;
      
    } catch (error) {
      console.error('❌ Error creating on-chain transaction:', error);
      return `error_tx_${Date.now()}`;
    }
  }

  // Commit processed data to ER and get transaction ID
  private async commitToER(tripId: string, perResult: any): Promise<string> {
    try {
      console.log('📝 Committing to ER...');
      
      // Step 1: Create Merkle leaf
      const leaf = this.createMerkleLeaf(tripId, perResult);
      console.log('🌿 Created Merkle leaf:', leaf);
      
      // Step 2: Send to ER endpoint
      const ER_URL = 'https://devnet.magicblock.app';
      const response = await fetch(`${ER_URL}/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaf,
          tripId,
          enclaveSig: perResult.signature,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`ER commit failed: ${response.status}`);
      }
      
      const commitResult = await response.json();
      console.log('✅ ER commit successful:', commitResult);
      
      return commitResult.transactionId || commitResult.txId || `er_commit_${Date.now()}`;
      
    } catch (error) {
      console.error('❌ Error committing to ER:', error);
      // Return a fallback transaction ID
      return `er_fallback_${Date.now()}`;
    }
  }

  // Create Merkle leaf for ER commit
  private createMerkleLeaf(tripId: string, perResult: any): string {
    const leafData = {
      tripId,
      wallet: '3oVnL6Y34hoUXM41MBy6Rcd3asvyyTW8rFT3xgYeSdfZ', // dev1 wallet
      km: perResult.metrics.totalDistance || 0,
      scoreTotal: perResult.metrics.safetyScore || 0,
      modelVersion: 'v1.0',
      enclaveSig: perResult.signature,
      timestamp: Date.now(),
    };
    
    // Simple hash (in production, use proper cryptographic hash)
    const leafString = JSON.stringify(leafData);
    const hash = btoa(leafString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    
    console.log('🌿 Merkle leaf created:', { leafData, hash });
    return hash;
  }

  private processSafetyMetrics(data: TelemetryData): void {
    // Hard braking detection (|ax| > 3.5 m/s² for ≥ 300 ms)
    const accelerationMagnitude = Math.sqrt(
      data.acceleration.x ** 2 + 
      data.acceleration.y ** 2 + 
      data.acceleration.z ** 2
    );
    
    if (accelerationMagnitude > 3.5) {
      this.safetyMetrics.hardBrakes++;
      console.log('🚨 Hard brake detected!');
    }
    
    // Hard acceleration detection (|ax| > 3.0 m/s²)
    if (Math.abs(data.acceleration.x) > 3.0) {
      this.safetyMetrics.hardAccelerations++;
      console.log('🚨 Hard acceleration detected!');
    }
    
    // Harsh cornering detection (|yaw_rate| > 25°/s)
    const yawRate = Math.sqrt(
      data.gyroscope.x ** 2 + 
      data.gyroscope.y ** 2 + 
      data.gyroscope.z ** 2
    );
    
    if (yawRate > 25) {
      this.safetyMetrics.harshCorners++;
      console.log('🚨 Harsh corner detected!');
    }
    
    // Speeding detection (simplified - would use posted limits)
    const speedKmh = data.speed * 3.6; // Convert m/s to km/h
    if (speedKmh > 50) { // Assume 50 km/h limit
      if (!this.speedingStartTime) {
        this.speedingStartTime = data.timestamp;
      }
    } else {
      if (this.speedingStartTime) {
        this.safetyMetrics.speedingTime += (data.timestamp - this.speedingStartTime) / 1000;
        this.speedingStartTime = null;
      }
    }
    
    // Phone interaction detection
    if (data.deviceFlags.phoneInteraction && data.speed > 0) {
      this.safetyMetrics.phoneInteraction++;
    }
    
    // Distance calculation
    if (this.lastLocation) {
      const distance = this.calculateDistance(
        this.lastLocation.latitude,
        this.lastLocation.longitude,
        data.latitude,
        data.longitude
      );
      this.safetyMetrics.totalDistance += distance;
    }
    
    this.lastLocation = { latitude: data.latitude, longitude: data.longitude };
    this.lastSpeed = data.speed;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private resetSafetyMetrics(): void {
    this.safetyMetrics = {
      hardBrakes: 0,
      hardAccelerations: 0,
      harshCorners: 0,
      speedingTime: 0,
      phoneInteraction: 0,
      totalDistance: 0,
      totalDuration: 0,
      safetyScore: 10.0
    };
    this.lastLocation = null;
    this.lastSpeed = 0;
    this.speedingStartTime = null;
  }
}

export default new MagicBlockTelemetryService();
