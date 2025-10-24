# 🚀 1-WEEK MVP IMPLEMENTATION GUIDE - DEPIN DRIVING REWARDS

## **PROGRESS UPDATE**

### ✅ **COMPLETED (Days 1-4)**

#### **Day 1-2: Mobile Telemetry Collection** ✅
- ✅ Complete `TelemetryService.ts` with GPS (1Hz) + IMU (50Hz) collection
- ✅ Background location tracking with foreground service
- ✅ Permission management for iOS/Android
- ✅ Chunk upload system (10-second chunks)
- ✅ Offline storage and sync
- ✅ Phone interaction detection
- ✅ MapScreen integration with real telemetry
- ✅ Real-time telemetry status indicator in UI
- ✅ Mobile package.json with all required dependencies
- ✅ app.json with proper iOS/Android permissions

**Files Created:**
- `src/mobile-app/services/TelemetryService.ts` (450+ lines)
- `src/mobile-app/package.json`
- `src/mobile-app/app.json`
- Updated: `src/mobile-app/screens/MapScreen.tsx`

#### **Day 3-4: Safety Scoring Algorithm** ✅
- ✅ Complete `SafetyScoreService.ts` implementing your full spec
- ✅ Hard braking detection (|ax| > 3.5 m/s² for ≥300ms)
- ✅ Hard acceleration detection (|ax| > 3.0 m/s²)
- ✅ Harsh cornering detection (|yaw_rate| > 25°/s)
- ✅ Speeding detection with fallback rules
- ✅ Phone interaction calculation
- ✅ Trip validation (≥2km, ≥8min, ≥12 km/h avg)
- ✅ GPS continuity checks (teleport detection)
- ✅ Haversine distance calculation
- ✅ Trip summary & recommendation generation
- ✅ Score breakdown (0-10 scale)
- ✅ `/trip/finalize` endpoint with full scoring integration

**Files Created:**
- `src/server/services/safetyScoreService.ts` (550+ lines)
- Updated: `src/server/controllers/index.ts` (added finalizeTripController)
- Updated: `src/server/routes/trip.ts`

---

## **🔥 NEXT: Day 5 - SPL Token Rewards (TODAY)**

This is **CRITICAL** - users can't earn rewards without this!

### **Step 1: Update Cargo.toml Dependencies**

```bash
cd programs/driver_trip_reward
```

Edit `Cargo.toml`:
```toml
[dependencies]
anchor-lang = "0.31.1"
anchor-spl = "0.31.1"  # ADD THIS
bumpalo = "=3.14.0"
```

### **Step 2: Add SPL Token Accounts to claim_rewards.rs**

File: `programs/driver_trip_reward/src/instructions/claim_rewards.rs`

**Replace the entire file with:**
```rust
// use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"reward_pool",
            &pool_id.to_le_bytes(),
        ],
        bump = reward_pool_account.bump,
    )]
    pub reward_pool_account: Account<'info, RewardPoolAccount>,

    /// Reward pool's token vault
    #[account(
        mut,
        constraint = vault.owner == reward_pool_account.key(),
    )]
    pub vault: Account<'info, TokenAccount>,

    /// Driver's token account (where rewards go)
    #[account(
        mut,
        constraint = driver_token_account.owner == driver_pubkey.key(),
    )]
    pub driver_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [
            b"driver",
            driver_pubkey.key().as_ref(),
        ],
        bump = driver_account.bump,
    )]
    pub driver_account: Account<'info, DriverAccount>,

    pub driver_pubkey: Signer<'info>,

    /// Vault authority PDA
    /// CHECK: This is safe because we derive it from seeds
    #[account(
        seeds = [b"vault_authority", reward_pool_account.key().as_ref()],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<ClaimRewards>,
    pool_id: u64,
) -> Result<()> {
    // Verify reward pool
    if ctx.accounts.reward_pool_account.pool_id != pool_id {
        return Err(DriverTripRewardError::RewardPoolNotFound.into());
    }
    
    if !ctx.accounts.reward_pool_account.is_active {
        return Err(DriverTripRewardError::RewardPoolNotFound.into());
    }
    
    // Verify driver has completed trips
    if ctx.accounts.driver_account.completed_trips == 0 {
        return Err(DriverTripRewardError::RewardPoolNotFound.into());
    }
    
    // Calculate reward amount
    let reward_amount = ctx.accounts.reward_pool_account.reward_per_trip;
    
    // Check pool has enough funds
    if ctx.accounts.reward_pool_account.distributed_rewards + reward_amount 
        > ctx.accounts.reward_pool_account.total_rewards {
        return Err(DriverTripRewardError::InsufficientRewards.into());
    }
    
    // Transfer tokens from vault to driver
    let seeds = &[
        b"vault_authority",
        ctx.accounts.reward_pool_account.to_account_info().key.as_ref(),
        &[ctx.bumps.vault_authority],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to: ctx.accounts.driver_token_account.to_account_info(),
        authority: ctx.accounts.vault_authority.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    
    token::transfer(cpi_ctx, reward_amount)?;
    
    // Update state
    ctx.accounts.reward_pool_account.distributed_rewards += reward_amount;
    ctx.accounts.reward_pool_account.total_trip_rewards += reward_amount;
    ctx.accounts.driver_account.total_rewards += reward_amount;
    
    msg!("✅ Transferred {} tokens to driver {}", reward_amount, ctx.accounts.driver_pubkey.key());
    
    Ok(())
}
```

### **Step 3: Update RewardPoolAccount State**

File: `programs/driver_trip_reward/src/state/reward_pool_account.rs`

**Add vault field:**
```rust
use anchor_lang::prelude::*;

#[account]
pub struct RewardPoolAccount {
    pub pool_id: u64,
    pub total_rewards: u64,
    pub distributed_rewards: u64,
    pub reward_per_trip: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub is_active: bool,
    pub bump: u8,
    pub vault: Pubkey,  // ADD THIS - token vault address
    pub total_trip_rewards: u64,
    pub total_driver_rewards: u64,
    pub reward_cycle: u64,
}
```

### **Step 4: Update initialize_reward_pool.rs**

Add vault initialization:
```rust
// In the InitializeRewardPool accounts struct, add:
#[account(
    init,
    payer = fee_payer,
    token::mint = reward_mint,
    token::authority = vault_authority,
)]
pub vault: Account<'info, TokenAccount>,

/// CHECK: This is safe
#[account(
    seeds = [b"vault_authority", reward_pool_account.key().as_ref()],
    bump,
)]
pub vault_authority: UncheckedAccount<'info>,

pub reward_mint: Account<'info, Mint>,
pub token_program: Program<'info, Token>,
pub system_program: Program<'info, System>,
```

### **Step 5: Build and Deploy**

```bash
# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Get the program ID
solana address -k target/deploy/driver_trip_reward-keypair.json
```

### **Step 6: Initialize Reward Pool with Tokens**

Create `scripts/initialize_pool.ts`:
```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, createMint, mintTo } from "@solana/spl-token";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Create USDT test mint
  const mint = await createMint(
    provider.connection,
    provider.wallet.payer,
    provider.wallet.publicKey,
    null,
    6 // 6 decimals for USDT
  );

  console.log("✅ Test USDT mint created:", mint.toString());

  // Initialize reward pool with tokens
  // ... (add initialization logic)
}

main();
```

---

## **📅 Day 6: MagicBlock Integration (TOMORROW)**

### **Step 1: Add MagicBlock SDK**

```bash
cd programs/driver_trip_reward
cargo add ephemeral-rollups-sdk --features anchor
```

### **Step 2: Add #[ephemeral] Macro**

File: `programs/driver_trip_reward/src/lib.rs`

```rust
use ephemeral_rollups_sdk::anchor::ephemeral;

#[ephemeral]
#[program]
pub mod driver_trip_reward {
    // existing code...
}
```

### **Step 3: Create MagicBlock Router Client**

File: `src/server/services/magicblockRouter.ts`

```typescript
import axios from 'axios';

const ROUTER_URL = 'https://devnet-router.magicblock.app';

export class MagicBlockRouter {
  async getRoutes() {
    const response = await axios.post(ROUTER_URL + '/getRoutes', {
      jsonrpc: '2.0',
      id: 1,
      method: 'getRoutes'
    });
    return response.data.result;
  }

  async getDelegationStatus(account: string) {
    const response = await axios.post(ROUTER_URL + '/getDelegationStatus', {
      jsonrpc: '2.0',
      id: 1,
      method: 'getDelegationStatus',
      params: [account]
    });
    return response.data.result;
  }
}

export const magicBlockRouter = new MagicBlockRouter();
```

### **Step 4: Update Backend to Use Router**

In `src/server/services/magicblockService.ts`, replace stubs with real API calls.

---

## **📅 Day 7: Testing & Polish (FINAL DAY)**

### **End-to-End Test Flow**

1. **Mobile → Backend → Scoring → Solana**
   - Start trip on mobile
   - Drive for 2+ km, 8+ min
   - End trip
   - Verify score calculation
   - Check Solana trip submission

2. **Reward Claiming**
   - Complete a trip
   - Check weekly totals
   - Claim rewards
   - Verify SPL token transfer

3. **Edge Cases**
   - Trip too short (rejection)
   - GPS teleport (rejection)
   - Hard braking events
   - Speeding detection

### **Polish Checklist**

- [ ] Error handling in mobile app
- [ ] Loading states
- [ ] Trip history display
- [ ] Wallet connection UI
- [ ] Backend environment variables
- [ ] Database migrations
- [ ] API documentation

---

## **📦 QUICK START COMMANDS**

### **Backend**
```bash
cd driver_trip_reward_program
npm install
npm run dev  # Start backend on port 3000
```

### **Mobile App**
```bash
cd src/mobile-app
npm install
npx expo start
# Press 'a' for Android or 'i' for iOS
```

### **Solana Program**
```bash
anchor build
anchor deploy --provider.cluster devnet
anchor test
```

### **Database Setup**
```bash
# Start PostgreSQL (Docker)
docker-compose up -d postgres

# Run migrations
npm run migrate
```

---

## **🎯 CRITICAL MVP FEATURES STATUS**

| Feature | Status | Priority |
|---------|--------|----------|
| **Mobile Telemetry** | ✅ DONE | P0 |
| **Safety Scoring** | ✅ DONE | P0 |
| **SPL Token Rewards** | 🔄 IN PROGRESS | P0 |
| **MagicBlock Integration** | ⏳ PENDING | P1 |
| **Trip Finalization** | ✅ DONE | P0 |
| **Backend API** | ✅ DONE | P0 |
| **Database** | ✅ DONE | P0 |
| **Wallet Connection** | ⏳ PENDING | P1 |
| **Quest System** | ⏳ PENDING | P2 |

---

## **🚨 KNOWN ISSUES & NEXT STEPS**

### **Immediate (Today - Day 5)**
1. ✅ Add SPL token transfers
2. Test reward claiming end-to-end
3. Create test USDT mint
4. Fund reward pool

### **Tomorrow (Day 6)**
1. Add MagicBlock Router API calls
2. Test delegation/commit flow
3. Verify TEE attestation

### **Final Day (Day 7)**
1. Full integration testing
2. Fix any blocking bugs
3. Deploy to production
4. Create demo video

---

## **📞 SUPPORT & RESOURCES**

- **MagicBlock Docs**: https://docs.magicblock.gg
- **Anchor Docs**: https://www.anchor-lang.com
- **Expo Docs**: https://docs.expo.dev
- **SPL Token**: https://spl.solana.com/token

---

## **🎉 YOU'VE GOT THIS!**

**You're already 50% done!** The hardest parts (telemetry + scoring) are complete. SPL tokens are straightforward, and MagicBlock integration is mostly API calls. 

**Lock in and ship this MVP! 🚀**

---

*Last updated: Day 4 Complete - Moving to Day 5 (SPL Tokens)*

