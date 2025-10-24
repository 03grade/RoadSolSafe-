// Real Solana Transaction Service for Backend
// Handles actual Solana blockchain transactions

import { Connection, PublicKey, Keypair, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Buffer } from 'buffer';

// Your deployed program ID
const PROGRAM_ID = 'BknefWnKwdFMsMgXdgN9XWjjo55CRMrsJ2F7iQ4epURx';
const RPC_URL = 'https://api.devnet.solana.com';

// Dev2 wallet configuration (for transaction signing)
const DEV2_WALLET = {
  publicKey: '6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2',
  privateKey: '2tqoLKJ632JCPLbSiWvB5n9KDg4mtWEhLHdFGQk5mfeAJsFLRLQa3ag1DH4he8LwjK3BYjzE8XBMhiaNQKY2tGWc'
};

class RealSolanaTransactionService {
  private connection: Connection;
  private program: any; // Program<DriverTripReward>; // Changed to any to bypass import error

  constructor() {
    this.connection = new Connection(RPC_URL, 'confirmed');
    this.initializeProgram();
  }

  private async initializeProgram() {
    try {
      // Create keypair from dev2 private key
      const keypair = Keypair.fromSecretKey(
        Buffer.from(DEV2_WALLET.privateKey, 'base64')
      );

      // Create wallet and provider
      const wallet = new Wallet(keypair);
      const provider = new AnchorProvider(this.connection, wallet, {});

      // Load program (you'll need the IDL)
      // For now, we'll work with raw instructions
      console.log('✅ Real Solana connection established with dev2 wallet');
      console.log(`Wallet address: ${keypair.publicKey.toString()}`);

      // Check wallet balance
      const balance = await this.connection.getBalance(keypair.publicKey);
      console.log(`Wallet balance: ${balance / 1e9} SOL`);

      // Request airdrop if balance is low
      if (balance < 0.1e9) { // Less than 0.1 SOL
        console.log('Requesting SOL airdrop...');
        const signature = await this.connection.requestAirdrop(keypair.publicKey, 2e9); // 2 SOL
        await this.connection.confirmTransaction(signature);
        const newBalance = await this.connection.getBalance(keypair.publicKey);
        console.log(`New wallet balance: ${newBalance / 1e9} SOL`);
      }

    } catch (error) {
      console.error('Failed to initialize Real Solana connection:', error);
      throw error;
    }
  }

  // Submit trip to Solana program with REAL transaction
  async submitTripToSolana(tripData: any): Promise<any> {
    try {
      console.log('🚀 Submitting trip to REAL Solana program...');
      console.log('📊 Trip data:', tripData);

      // Create keypair from dev2 private key
      const keypair = Keypair.fromSecretKey(
        Buffer.from(DEV2_WALLET.privateKey, 'base64')
      );

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      console.log('📦 Recent blockhash obtained');

      // Create instruction data for submit_trip
      // Discriminator: [126, 54, 239, 201, 82, 247, 25, 229]
      const instructionData = Buffer.alloc(8 + 32 + 8 + 8 + 8 + 8 + 8); // discriminator + pubkey + 5 u64/i64
      let offset = 0;

      // Add discriminator
      instructionData.set([126, 54, 239, 201, 82, 247, 25, 229], offset);
      offset += 8;

      // Add passenger_pubkey (32 bytes)
      const passengerPubkey = new PublicKey(tripData.passengerPubkey);
      instructionData.set(passengerPubkey.toBytes(), offset);
      offset += 32;

      // Add trip_id (8 bytes, little-endian)
      const tripIdBuffer = Buffer.alloc(8);
      tripIdBuffer.writeBigUInt64LE(BigInt(tripData.tripIdNumeric || 1), 0);
      instructionData.set(tripIdBuffer, offset);
      offset += 8;

      // Add start_time (8 bytes, little-endian)
      const startTimeBuffer = Buffer.alloc(8);
      startTimeBuffer.writeBigInt64LE(BigInt(tripData.startTime), 0);
      instructionData.set(startTimeBuffer, offset);
      offset += 8;

      // Add distance (8 bytes, little-endian)
      const distanceBuffer = Buffer.alloc(8);
      distanceBuffer.writeBigUInt64LE(BigInt(tripData.distance), 0);
      instructionData.set(distanceBuffer, offset);
      offset += 8;

      // Add duration (8 bytes, little-endian)
      const durationBuffer = Buffer.alloc(8);
      durationBuffer.writeBigUInt64LE(BigInt(tripData.duration), 0);
      instructionData.set(durationBuffer, offset);
      offset += 8;

      // Add fare (8 bytes, little-endian)
      const fareBuffer = Buffer.alloc(8);
      fareBuffer.writeBigUInt64LE(BigInt(tripData.fare), 0);
      instructionData.set(fareBuffer, offset);

      console.log('📊 Instruction data prepared:', instructionData.toString('hex'));

      // Create transaction
      const transaction = new Transaction().add(
        new TransactionInstruction({
          keys: [
            { pubkey: keypair.publicKey, isSigner: true, isWritable: true }, // fee_payer
            { pubkey: new PublicKey(PROGRAM_ID), isSigner: false, isWritable: false }, // program_id
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
          ],
          programId: new PublicKey(PROGRAM_ID),
          data: instructionData
        })
      );

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = keypair.publicKey;

      console.log('🔨 Transaction created, signing...');

      // Sign and send transaction
      const signature = await this.connection.sendTransaction(transaction, [keypair]);
      console.log('✅ Transaction sent:', signature);

      // Confirm transaction
      console.log('⏳ Confirming transaction...');
      const confirmation = await this.connection.confirmTransaction(signature);

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      console.log('🎉 Transaction confirmed on-chain!');
      console.log('🔗 View on Solscan:', `https://solscan.io/tx/${signature}?cluster=devnet`);

      return {
        success: true,
        transactionSignature: signature,
        solscanUrl: `https://solscan.io/tx/${signature}?cluster=devnet`,
        tripId: tripData.tripId,
        status: 'confirmed'
      };

    } catch (error) {
      console.error('❌ Failed to submit trip to REAL Solana:', error);
      throw error;
    }
  }

  // Get account info for verification
  async getAccountInfo(accountId: string): Promise<any> {
    try {
      const accountInfo = await this.connection.getAccountInfo(new PublicKey(accountId));
      return accountInfo;
    } catch (error) {
      console.error('❌ Failed to get account info:', error);
      throw error;
    }
  }

  // Get transaction signature
  async getTransactionSignature(signature: string): Promise<any> {
    try {
      const transaction = await this.connection.getTransaction(signature);
      return transaction;
    } catch (error) {
      console.error('❌ Failed to get transaction:', error);
      throw error;
    }
  }
}

// Export singleton instance
const realSolanaTransactionService = new RealSolanaTransactionService();
export default realSolanaTransactionService;

