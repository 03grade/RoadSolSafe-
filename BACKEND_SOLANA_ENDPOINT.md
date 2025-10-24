# Backend Solana Transaction Endpoint

## Quick Implementation Guide

Add this endpoint to your backend server (`src/server/routes/solana.ts` or similar):

```typescript
import { FastifyInstance } from 'fastify';
import { Connection, Keypair, Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';

// Your deployed program ID
const PROGRAM_ID = 'BknefWnKwdFMsMgXdgN9XWjjo55CRMrsJ2F7iQ4epURx';
const RPC_URL = 'https://api.devnet.solana.com';

export async function solanaRoutes(fastify: FastifyInstance) {
  // Submit trip to Solana program
  fastify.post('/solana/submit-trip', async (request, reply) => {
    try {
      const { programId, tripData, wallet } = request.body;
      
      console.log('🚀 Backend: Submitting trip to Solana...');
      console.log('📊 Trip data:', tripData);
      
      // Create Solana connection
      const connection = new Connection(RPC_URL, 'confirmed');
      
      // Create keypair from private key
      const keypair = Keypair.fromSecretKey(
        Buffer.from(wallet.privateKey, 'base64')
      );
      
      // Create wallet
      const walletObj = new Wallet(keypair);
      
      // Create provider
      const provider = new AnchorProvider(connection, walletObj, {});
      
      // Load your program (you'll need the IDL)
      const program = new Program(idl, new PublicKey(programId), provider);
      
      // Create submit_trip instruction
      const tx = await program.methods
        .submitTrip(
          new PublicKey(tripData.passengerPubkey),
          tripData.tripIdNumeric,
          tripData.startTime,
          tripData.distance,
          tripData.duration,
          tripData.fare
        )
        .accounts({
          feePayer: keypair.publicKey,
          tripAccount: // PDA for trip account
          driverPubkey: keypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log('✅ Transaction successful:', tx);
      
      return {
        success: true,
        transactionSignature: tx,
        solscanUrl: `https://solscan.io/tx/${tx}?cluster=devnet`
      };
      
    } catch (error) {
      console.error('❌ Backend Solana error:', error);
      return reply.status(500).send({
        error: 'Failed to submit trip to Solana',
        details: error.message
      });
    }
  });
}
```

## Alternative: Simple RPC Approach

If you don't want to use Anchor, here's a simpler approach:

```typescript
fastify.post('/solana/submit-trip', async (request, reply) => {
  try {
    const { tripData, wallet } = request.body;
    
    // Create connection
    const connection = new Connection(RPC_URL, 'confirmed');
    
    // Create keypair
    const keypair = Keypair.fromSecretKey(
      Buffer.from(wallet.privateKey, 'base64')
    );
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    
    // Create transaction
    const transaction = new Transaction().add(
      new TransactionInstruction({
        keys: [
          { pubkey: keypair.publicKey, isSigner: true, isWritable: true },
          { pubkey: new PublicKey(PROGRAM_ID), isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: new PublicKey(PROGRAM_ID),
        data: Buffer.from([
          // submit_trip discriminator: [126, 54, 239, 201, 82, 247, 25, 229]
          126, 54, 239, 201, 82, 247, 25, 229,
          // Add your trip data here...
        ])
      })
    );
    
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = keypair.publicKey;
    
    // Sign and send
    const signature = await connection.sendTransaction(transaction, [keypair]);
    
    // Confirm transaction
    await connection.confirmTransaction(signature);
    
    return {
      success: true,
      transactionSignature: signature,
      solscanUrl: `https://solscan.io/tx/${signature}?cluster=devnet`
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return reply.status(500).send({ error: error.message });
  }
});
```

## What This Does:

1. **Receives trip data** from mobile app
2. **Creates Solana transaction** with submit_trip instruction
3. **Signs transaction** with driver's private key
4. **Submits to Solana devnet**
5. **Returns transaction signature** for Solscan viewing

## Testing:

Once implemented, your mobile app will:
- ✅ Send trip data to backend
- ✅ Backend creates real Solana transaction
- ✅ Transaction appears on Solscan
- ✅ Mobile app receives transaction signature

## Current Status:

- ✅ **Mobile app ready** - Will try backend first, fallback to simulation
- ⏳ **Backend endpoint needed** - Implement the endpoint above
- ✅ **Program deployed** - Your program is ready on devnet
- ✅ **Wallet configured** - dev1 wallet ready for signing

**You can start testing now! The mobile app will work with simulation, and once you add the backend endpoint, you'll see real transactions on Solscan! 🚀**

