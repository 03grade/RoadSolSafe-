import { query } from '../database/index.js';
import { logger } from '../utils/logger.js';
import { Connection, PublicKey, Keypair, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
// import { DriverTripReward } from '../../target/types/driver_trip_reward.js';

// Solana connection
let connection: Connection;
let provider: AnchorProvider;
let program: any; // Program<DriverTripReward>;

// Your deployed program ID
const PROGRAM_ID = 'BknefWnKwdFMsMgXdgN9XWjjo55CRMrsJ2F7iQ4epURx';
const RPC_URL = 'https://api.devnet.solana.com';

// Dev2 wallet configuration (for transaction signing)
const DEV2_WALLET = {
  publicKey: '6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2',
  privateKey: '2tqoLKJ632JCPLbSiWvB5n9KDg4mtWEhLHdFGQk5mfeAJsFLRLQa3ag1DH4he8LwjK3BYjzE8XBMhiaNQKY2tGWc'
};

export const initSolana = async () => {
  try {
    connection = new Connection(RPC_URL, 'confirmed');
    
    // Create keypair from dev2 private key
    const keypair = Keypair.fromSecretKey(
      Buffer.from(DEV2_WALLET.privateKey, 'base64')
    );
    
    // Create wallet and provider
    const wallet = new Wallet(keypair);
    provider = new AnchorProvider(connection, wallet, {});
    
    // Load program (you'll need the IDL)
    // program = new Program(idl, new PublicKey(PROGRAM_ID), provider);
    
    logger.info('Solana connection established with dev2 wallet');
    logger.info(`Wallet address: ${keypair.publicKey.toString()}`);
    
    // Check wallet balance
    const balance = await connection.getBalance(keypair.publicKey);
    logger.info(`Wallet balance: ${balance / 1e9} SOL`);
    
    // Request airdrop if balance is low
    if (balance < 0.1e9) { // Less than 0.1 SOL
      logger.info('Requesting SOL airdrop...');
      const signature = await connection.requestAirdrop(keypair.publicKey, 2e9); // 2 SOL
      await connection.confirmTransaction(signature);
      const newBalance = await connection.getBalance(keypair.publicKey);
      logger.info(`New wallet balance: ${newBalance / 1e9} SOL`);
    }
    
  } catch (error) {
    logger.error('Failed to initialize Solana connection:', error);
    throw error;
  }
};

// Submit trip to Solana program
export const submitTripToSolana = async (tripData: any) => {
  try {
    logger.info('🚀 Submitting trip to Solana program...');
    logger.info('📊 Trip data:', tripData);
    
    // Create keypair from dev2 private key
    const keypair = Keypair.fromSecretKey(
      Buffer.from(DEV2_WALLET.privateKey, 'base64')
    );
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    logger.info('📦 Recent blockhash obtained');
    
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
    
    logger.info('📊 Instruction data prepared:', instructionData.toString('hex'));
    
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
    
    logger.info('🔨 Transaction created, signing...');
    
    // Sign and send transaction
    const signature = await connection.sendTransaction(transaction, [keypair]);
    logger.info('✅ Transaction sent:', signature);
    
    // Confirm transaction
    logger.info('⏳ Confirming transaction...');
    const confirmation = await connection.confirmTransaction(signature);
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }
    
    logger.info('🎉 Transaction confirmed on-chain!');
    logger.info('🔗 View on Solscan:', `https://solscan.io/tx/${signature}?cluster=devnet`);
    
    return {
      success: true,
      transactionSignature: signature,
      solscanUrl: `https://solscan.io/tx/${signature}?cluster=devnet`,
      tripId: tripData.tripId,
      status: 'confirmed'
    };
    
  } catch (error) {
    logger.error('❌ Failed to submit trip to Solana:', error);
    throw error;
  }
};

// Claim rewards on Solana
export const claimRewardsOnSolana = async (driverId: string, poolId: number) => {
  try {
    // In a real implementation, this would interact with the Solana program
    // For now, we'll simulate the interaction
    
    // Simulate Solana transaction
    const amount = 1000000000; // 1 SOL in lamports
    
    logger.info(`Rewards claimed on Solana for driver: ${driverId}`);
    
    return {
      amount,
      txHash: `solana_tx_${Date.now()}`
    };
  } catch (error) {
    logger.error('Failed to claim rewards on Solana:', error);
    throw error;
  }
};

// Process private data with MagicBlock
export const processPrivateDataWithMagicBlock = async (data: string, operation: string) => {
  try {
    // In a real implementation, this would interact with MagicBlock ER/PER
    // For now, we'll simulate the interaction
    
    logger.info(`Private data processed with MagicBlock: ${operation}`);
    
    return {
      processedData: `processed_${data}`,
      operation,
      timestamp: Date.now()
    };
  } catch (error) {
    logger.error('Failed to process private data with MagicBlock:', error);
    throw error;
  }
};