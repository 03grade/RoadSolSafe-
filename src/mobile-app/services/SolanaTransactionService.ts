import { PHANTOM_WALLETS } from '../config/walletConfig';

export interface TripData {
  tripId: string;
  driverWallet: string;
  passengerPubkey: string;
  tripIdNumeric: number;
  startTime: number;
  distance: number;
  duration: number;
  fare: number;
  safetyScore: number;
  hardBrakes: number;
  hardAccelerations: number;
  harshCorners: number;
}

export class SolanaTransactionService {
  private readonly PROGRAM_ID = 'BknefWnKwdFMsMgXdgN9XWjjo55CRMrsJ2F7iQ4epURx';
  private readonly RPC_URL = 'https://api.devnet.solana.com';

  async submitTripToBackend(tripData: TripData): Promise<string> {
    try {
      console.log('🚀 Submitting trip to backend for Solana transaction...');
      
      const BACKEND_URL = process.env.BACKEND_URL || 'http://192.168.1.12:3000';
      
      const response = await fetch(`${BACKEND_URL}/solana/submit-trip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programId: this.PROGRAM_ID,
          tripData: tripData,
          wallet: PHANTOM_WALLETS[0] // dev1 wallet
        })
      });

      if (!response.ok) {
        throw new Error(`Backend submission failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Backend submission successful:', result);
      
      return result.transactionSignature || `backend_tx_${Date.now()}`;
      
    } catch (error) {
      console.error('❌ Error submitting to backend:', error);
      return `error_tx_${Date.now()}`;
    }
  }

  async submitTripDirect(tripData: TripData): Promise<string> {
    try {
      console.log('🔗 Creating direct Solana transaction...');
      
      // This would require proper transaction construction and signing
      // For now, return a mock signature
      const mockSignature = `direct_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('📝 Mock transaction signature:', mockSignature);
      console.log('💡 To implement real transactions, you need:');
      console.log('   1. Proper transaction construction');
      console.log('   2. Wallet signing with private key');
      console.log('   3. Transaction submission to Solana');
      
      return mockSignature;
      
    } catch (error) {
      console.error('❌ Error creating direct transaction:', error);
      return `error_tx_${Date.now()}`;
    }
  }
}
