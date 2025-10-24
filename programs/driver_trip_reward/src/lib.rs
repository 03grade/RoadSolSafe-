use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked};

declare_id!("BknefWnKwdFMsMgXdgN9XWjjo55CRMrsJ2F7iQ4epURx");

// -----------------------------------------------------------------
// Error Enum (from src/error.rs)
// -----------------------------------------------------------------
#[error_code]
pub enum DriverTripRewardError {
    #[msg("Driver account already exists")]
    DriverAlreadyExists,
    #[msg("Trip account not found")]
    TripNotFound,
    #[msg("Invalid trip status")]
    InvalidTripStatus,
    #[msg("Reward pool not found")]
    RewardPoolNotFound,
    #[msg("Validator account already exists")]
    ValidatorAlreadyExists,
    #[msg("Invalid data operation")]
    InvalidDataOperation,
    #[msg("Insufficient rewards in pool")]
    InsufficientRewards,
    #[msg("Trip already verified")]
    TripAlreadyVerified,
    #[msg("Invalid trip hash")]
    InvalidTripHash,
    #[msg("Invalid validator weight")]
    InvalidValidatorWeight,
    #[msg("Validator not found")]
    ValidatorNotFound,
}

// -----------------------------------------------------------------
// State Structs (from src/state/)
// -----------------------------------------------------------------
#[account]
pub struct DriverAccount {
    pub driver_pubkey: Pubkey,
    pub total_trips: u32,
    pub total_earnings: u64, // Corrected from u66
    pub total_distance: u64,
    pub total_time: u64,
    pub rating: f32,
    pub is_active: bool,
    pub bump: u8,
    pub total_score: u64,
    pub completed_trips: u32,
    pub avg_rating: f32,
    pub total_rewards: u64,
    pub validator_pubkey: Pubkey,
    pub last_trip_time: i64,
}

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
    pub vault: Pubkey,
    pub total_trip_rewards: u64,
    pub total_driver_rewards: u64,
    pub reward_cycle: u64,
}

#[account]
pub struct TripAccount {
    pub trip_id: u64,
    pub driver_pubkey: Pubkey,
    pub passenger_pubkey: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
    pub distance: u64,
    pub duration: u64,
    pub fare: u64,
    pub rating: f32,
    pub status: u8,
    pub bump: u8,
    pub score: u32,
    pub trip_hash: [u8; 32],
    pub verification_status: u8,
    pub validator_pubkey: Pubkey,
}

#[account]
pub struct ValidatorAccount {
    pub validator_pubkey: Pubkey,
    pub public_key: String,
    pub private_key: String,
    pub is_active: bool,
    pub bump: u8,
    pub total_validations: u64,
    pub success_rate: f32,
    pub last_validation_time: i64,
    pub validator_weight: f32,
}

// -----------------------------------------------------------------
// Program Logic (#[program])
// -----------------------------------------------------------------
#[program]
pub mod driver_trip_reward {
    use super::*;

    /// Initialize a new driver account
    pub fn initialize_driver(ctx: Context<InitializeDriver>) -> Result<()> {
        if ctx.accounts.driver_account.driver_pubkey != Pubkey::default() {
            return Err(DriverTripRewardError::DriverAlreadyExists.into());
        }
        ctx.accounts.driver_account.driver_pubkey = ctx.accounts.driver_pubkey.key();
        ctx.accounts.driver_account.total_trips = 0;
        ctx.accounts.driver_account.total_earnings = 0;
        ctx.accounts.driver_account.total_distance = 0;
        ctx.accounts.driver_account.total_time = 0;
        ctx.accounts.driver_account.rating = 0.0;
        ctx.accounts.driver_account.is_active = true;
        ctx.accounts.driver_account.bump = ctx.bumps.driver_account;
        ctx.accounts.driver_account.total_score = 0;
        ctx.accounts.driver_account.completed_trips = 0;
        ctx.accounts.driver_account.avg_rating = 0.0;
        ctx.accounts.driver_account.total_rewards = 0;
        ctx.accounts.driver_account.validator_pubkey = Pubkey::default();
        ctx.accounts.driver_account.last_trip_time = 0;
        Ok(())
    }

    /// Submit a new trip for verification
    pub fn submit_trip(ctx: Context<SubmitTrip>, passenger_pubkey: Pubkey, trip_id: u64, start_time: i64, distance: u64, duration: u64, fare: u64) -> Result<()> {
        if start_time <= 0 {
            return Err(DriverTripRewardError::InvalidTripStatus.into());
        }
        if distance == 0 {
            return Err(DriverTripRewardError::InvalidTripStatus.into());
        }
        if duration == 0 {
            return Err(DriverTripRewardError::InvalidTripStatus.into());
        }
        if fare == 0 {
            return Err(DriverTripRewardError::InvalidTripStatus.into());
        }
        ctx.accounts.trip_account.trip_id = trip_id;
        ctx.accounts.trip_account.driver_pubkey = ctx.accounts.driver_pubkey.key();
        ctx.accounts.trip_account.passenger_pubkey = passenger_pubkey;
        ctx.accounts.trip_account.start_time = start_time;
        ctx.accounts.trip_account.end_time = 0;
        ctx.accounts.trip_account.distance = distance;
        ctx.accounts.trip_account.duration = duration;
        ctx.accounts.trip_account.fare = fare;
        ctx.accounts.trip_account.rating = 0.0;
        ctx.accounts.trip_account.status = 0;
        ctx.accounts.trip_account.score = 0;
        ctx.accounts.trip_account.trip_hash = [0u8; 32];
        ctx.accounts.trip_account.verification_status = 0;
        ctx.accounts.trip_account.validator_pubkey = Pubkey::default();
        ctx.accounts.trip_account.bump = ctx.bumps.trip_account;
        Ok(())
    }

    /// Verify a trip and calculate trip score
    pub fn verify_trip(ctx: Context<VerifyTrip>, trip_id: u64, end_time: i64, rating: f32, trip_hash: [u8; 32]) -> Result<()> {
        if ctx.accounts.trip_account.trip_id != trip_id {
            return Err(DriverTripRewardError::TripNotFound.into());
        }
        if ctx.accounts.trip_account.status != 0 {
            return Err(DriverTripRewardError::InvalidTripStatus.into());
        }
        if end_time <= ctx.accounts.trip_account.start_time {
            return Err(DriverTripRewardError::InvalidTripStatus.into());
        }
        if rating < 0.0 || rating > 5.0 {
            return Err(DriverTripRewardError::InvalidTripStatus.into());
        }

        let mut score = 0u32;
        score += (rating * 20.0) as u32;
        if ctx.accounts.trip_account.distance > 1 {
            score += 50;
        }
        if ctx.accounts.trip_account.duration > 60 && ctx.accounts.trip_account.duration < 3600 {
            score += 30;
        }
        if ctx.accounts.trip_account.fare > 100000000 {
            score += 20;
        }
        if score > 100 {
            score = 100;
        }

        ctx.accounts.trip_account.end_time = end_time;
        ctx.accounts.trip_account.rating = rating;
        ctx.accounts.trip_account.score = score;
        ctx.accounts.trip_account.trip_hash = trip_hash;
        ctx.accounts.trip_account.verification_status = 1;
        ctx.accounts.trip_account.status = 1;
        ctx.accounts.trip_account.validator_pubkey = Pubkey::default();

        ctx.accounts.driver_account.total_trips += 1;
        ctx.accounts.driver_account.completed_trips += 1;
        ctx.accounts.driver_account.total_earnings += ctx.accounts.trip_account.fare;
        ctx.accounts.driver_account.total_distance += ctx.accounts.trip_account.distance;
        ctx.accounts.driver_account.total_time += ctx.accounts.trip_account.duration;
        ctx.accounts.driver_account.total_score += score as u64;

        let old_rating = ctx.accounts.driver_account.rating;
        let old_trips = ctx.accounts.driver_account.total_trips - 1;

        if old_trips > 0 {
            let new_rating = (old_rating * (old_trips as f32) + rating) / (old_trips as f32 + 1.0);
            ctx.accounts.driver_account.rating = new_rating;
        } else {
            ctx.accounts.driver_account.rating = rating;
        }

        if ctx.accounts.driver_account.completed_trips > 0 {
            let avg_score = (ctx.accounts.driver_account.total_score as f32) / (ctx.accounts.driver_account.completed_trips as f32);
            ctx.accounts.driver_account.avg_rating = avg_score;
        }

        ctx.accounts.driver_account.last_trip_time = end_time;
        Ok(())
    }

    /// Initialize a new reward pool
    pub fn initialize_reward_pool(ctx: Context<InitializeRewardPool>, pool_id: u64, total_rewards: u64, reward_per_trip: u64, start_time: i64, end_time: i64) -> Result<()> {
        if start_time >= end_time {
            return Err(DriverTripRewardError::RewardPoolNotFound.into());
        }
        if total_rewards == 0 {
            return Err(DriverTripRewardError::RewardPoolNotFound.into());
        }
        ctx.accounts.reward_pool_account.pool_id = pool_id;
        ctx.accounts.reward_pool_account.total_rewards = total_rewards;
        ctx.accounts.reward_pool_account.distributed_rewards = 0;
        ctx.accounts.reward_pool_account.reward_per_trip = reward_per_trip;
        ctx.accounts.reward_pool_account.start_time = start_time;
        ctx.accounts.reward_pool_account.end_time = end_time;
        ctx.accounts.reward_pool_account.is_active = true;
        ctx.accounts.reward_pool_account.bump = ctx.bumps.reward_pool_account;
        ctx.accounts.reward_pool_account.vault = ctx.accounts.vault.key();
        ctx.accounts.reward_pool_account.total_trip_rewards = 0;
        ctx.accounts.reward_pool_account.total_driver_rewards = 0;
        ctx.accounts.reward_pool_account.reward_cycle = 0;

        msg!("✅ Reward pool initialized with vault: {}", ctx.accounts.vault.key());
        Ok(())
    }

    /// Initialize a new validator account
    pub fn initialize_validator(ctx: Context<InitializeValidator>, public_key: String, private_key: String) -> Result<()> {
        if ctx.accounts.validator_account.validator_pubkey != Pubkey::default() {
            return Err(DriverTripRewardError::ValidatorAlreadyExists.into());
        }
        if public_key.len() < 10 || public_key.len() > 1000 {
            return Err(DriverTripRewardError::ValidatorAlreadyExists.into());
        }
        if private_key.len() < 10 || private_key.len() > 1000 {
            return Err(DriverTripRewardError::ValidatorAlreadyExists.into());
        }
        ctx.accounts.validator_account.validator_pubkey = ctx.accounts.validator_pubkey.key();
        ctx.accounts.validator_account.public_key = public_key;
        ctx.accounts.validator_account.private_key = private_key;
        ctx.accounts.validator_account.is_active = true;
        ctx.accounts.validator_account.bump = ctx.bumps.validator_account;
        ctx.accounts.validator_account.total_validations = 0;
        ctx.accounts.validator_account.success_rate = 0.0;
        ctx.accounts.validator_account.last_validation_time = 0;
        ctx.accounts.validator_account.validator_weight = 1.0;
        Ok(())
    }

    /// Process private data
    pub fn process_private_data(ctx: Context<ProcessPrivateData>, data: String, operation: String) -> Result<()> {
        if operation != "encrypt" && operation != "decrypt" && operation != "hash" {
            return Err(DriverTripRewardError::InvalidDataOperation.into());
        }
        if data.len() > 10000 {
            return Err(DriverTripRewardError::InvalidDataOperation.into());
        }
        ctx.accounts.validator_account.total_validations += 1;
        ctx.accounts.validator_account.last_validation_time = Clock::get().unwrap().unix_timestamp;

        msg!("Processing private data with operation: {}", operation);
        msg!("Data length: {}", data.len());
        Ok(())
    }

    /// Claim rewards for completed trips
    pub fn claim_rewards(ctx: Context<ClaimRewards>, pool_id: u64) -> Result<()> {
        if ctx.accounts.reward_pool_account.pool_id != pool_id {
            return Err(DriverTripRewardError::RewardPoolNotFound.into());
        }
        if !ctx.accounts.reward_pool_account.is_active {
            return Err(DriverTripRewardError::RewardPoolNotFound.into());
        }
        if ctx.accounts.reward_pool_account.distributed_rewards >= ctx.accounts.reward_pool_account.total_rewards {
            return Err(DriverTripRewardError::InsufficientRewards.into());
        }
        if ctx.accounts.driver_account.completed_trips == 0 {
            return Err(DriverTripRewardError::RewardPoolNotFound.into());
        }

        let reward_amount = ctx.accounts.reward_pool_account.reward_per_trip;

        if ctx.accounts
			.reward_pool_account
			.distributed_rewards
			.saturating_add(reward_amount)
			> ctx.accounts.reward_pool_account.total_rewards
		{
			return Err(DriverTripRewardError::InsufficientRewards.into());
		}

        let seeds = &[
            b"vault_authority",
            ctx.accounts.reward_pool_account.to_account_info().key.as_ref(),
            &[ctx.bumps.vault_authority],
        ];
		let signer_seeds: &[&[&[u8]]] = &[seeds];

		// decimals needed for transfer_checked
		let decimals = ctx.accounts.reward_mint.decimals;

		// must use TransferChecked and include mint
		let cpi_accounts = TransferChecked {
			from: ctx.accounts.vault.to_account_info(),
			mint: ctx.accounts.reward_mint.to_account_info(),
			to: ctx.accounts.driver_token_account.to_account_info(),
			authority: ctx.accounts.vault_authority.to_account_info(),
		};
		let cpi_program = ctx.accounts.token_program.to_account_info();
		let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

		transfer_checked(cpi_ctx, reward_amount, decimals)?;

		ctx.accounts.reward_pool_account.distributed_rewards =
			ctx.accounts.reward_pool_account.distributed_rewards.saturating_add(reward_amount);
		ctx.accounts.reward_pool_account.total_trip_rewards =
			ctx.accounts.reward_pool_account.total_trip_rewards.saturating_add(reward_amount);
		ctx.accounts.driver_account.total_rewards =
			ctx.accounts.driver_account.total_rewards.saturating_add(reward_amount);

		msg!("✅ Transferred {} tokens to driver {}", reward_amount, ctx.accounts.driver_pubkey.key());
		Ok(())
    }

    /// Update validator weights
    pub fn update_validator_weights(ctx: Context<UpdateValidatorWeights>, new_weights: Vec<u8>) -> Result<()> {
        if new_weights.len() == 0 || new_weights.len() > 10000 {
            return Err(DriverTripRewardError::InvalidDataOperation.into());
        }

        msg!("Validator weights updated with {} bytes", new_weights.len());

        ctx.accounts.validator_account.total_validations += 1;
        ctx.accounts.validator_account.last_validation_time = Clock::get().unwrap().unix_timestamp;
        Ok(())
    }

    /// Complete a trip and update driver statistics
    pub fn complete_trip(ctx: Context<CompleteTrip>, trip_id: u64, end_time: i64, distance: u64, duration: u64, fare: u64, rating: f32) -> Result<()> {
        if ctx.accounts.trip_account.trip_id != trip_id {
            return Err(DriverTripRewardError::TripNotFound.into());
        }
        if ctx.accounts.trip_account.status != 0 {
            return Err(DriverTripRewardError::InvalidTripStatus.into());
        }
        if end_time <= ctx.accounts.trip_account.start_time {
            return Err(DriverTripRewardError::InvalidTripStatus.into());
        }
        if rating < 0.0 || rating > 5.0 {
            return Err(DriverTripRewardError::InvalidTripStatus.into());
        }

        ctx.accounts.trip_account.end_time = end_time;
        ctx.accounts.trip_account.distance = distance;
        ctx.accounts.trip_account.duration = duration;
        ctx.accounts.trip_account.fare = fare;
        ctx.accounts.trip_account.rating = rating;
        ctx.accounts.trip_account.status = 1;

        ctx.accounts.driver_account.total_trips += 1;
        ctx.accounts.driver_account.total_earnings += fare;
        ctx.accounts.driver_account.total_distance += distance;
        ctx.accounts.driver_account.total_time += duration;

        let old_rating = ctx.accounts.driver_account.rating;
        let old_trips = ctx.accounts.driver_account.total_trips - 1;

        if old_trips > 0 {
            let new_rating = (old_rating * (old_trips as f32) + rating) / (old_trips as f32 + 1.0);
            ctx.accounts.driver_account.rating = new_rating;
        } else {
            ctx.accounts.driver_account.rating = rating;
        }

        ctx.accounts.driver_account.last_trip_time = end_time;
        Ok(())
    }

    /// Create a new trip account
    pub fn create_trip(ctx: Context<CreateTrip>, passenger_pubkey: Pubkey, trip_id: u64, start_time: i64) -> Result<()> {
        if ctx.accounts.trip_account.trip_id != 0 {
            return Err(DriverTripRewardError::TripNotFound.into());
        }
        if start_time <= 0 {
            return Err(DriverTripRewardError::InvalidTripStatus.into());
        }

        ctx.accounts.trip_account.trip_id = trip_id;
        ctx.accounts.trip_account.driver_pubkey = ctx.accounts.driver_pubkey.key();
        ctx.accounts.trip_account.passenger_pubkey = passenger_pubkey;
        ctx.accounts.trip_account.start_time = start_time;
        ctx.accounts.trip_account.end_time = 0;
        ctx.accounts.trip_account.distance = 0;
        ctx.accounts.trip_account.duration = 0;
        ctx.accounts.trip_account.fare = 0;
        ctx.accounts.trip_account.rating = 0.0;
        ctx.accounts.trip_account.status = 0;
        ctx.accounts.trip_account.score = 0;
        ctx.accounts.trip_account.trip_hash = [0u8; 32];
        ctx.accounts.trip_account.verification_status = 0;
        ctx.accounts.trip_account.validator_pubkey = Pubkey::default();
        ctx.accounts.trip_account.bump = ctx.bumps.trip_account;
        Ok(())
    }

    /// Distribute rewards to a driver
    pub fn distribute_reward(ctx: Context<DistributeReward>, pool_id: u64) -> Result<()> {
        if ctx.accounts.reward_pool_account.pool_id != pool_id {
            return Err(DriverTripRewardError::RewardPoolNotFound.into());
        }
        if !ctx.accounts.reward_pool_account.is_active {
            return Err(DriverTripRewardError::RewardPoolNotFound.into());
        }
        if ctx.accounts.reward_pool_account.distributed_rewards >= ctx.accounts.reward_pool_account.total_rewards {
            return Err(DriverTripRewardError::InsufficientRewards.into());
        }
        if ctx.accounts.driver_account.total_trips == 0 {
            return Err(DriverTripRewardError::RewardPoolNotFound.into());
        }

        let reward_amount = ctx.accounts.reward_pool_account.reward_per_trip;
        if ctx.accounts.reward_pool_account.distributed_rewards + reward_amount > ctx.accounts.reward_pool_account.total_rewards {
            return Err(DriverTripRewardError::InsufficientRewards.into());
        }

        ctx.accounts.reward_pool_account.distributed_rewards += reward_amount;
        ctx.accounts.reward_pool_account.total_trip_rewards += reward_amount;

        msg!("Distributed {} rewards to driver {}", reward_amount, ctx.accounts.driver_pubkey.key());
        Ok(())
    }
}

// -----------------------------------------------------------------
// Accounts Structs (from src/instructions/)
// -----------------------------------------------------------------
#[derive(Accounts)]
pub struct InitializeDriver<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    #[account(
        init,
        space = 120, // Note: You should recalculate this space
        payer = fee_payer,
        seeds = [
            b"driver",
            driver_pubkey.key().as_ref(),
        ],
        bump,
    )]
    pub driver_account: Account<'info, DriverAccount>,
    pub driver_pubkey: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(trip_id: u64)]
pub struct SubmitTrip<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    #[account(
        init,
        space = 130, // Note: You should recalculate this space
        payer = fee_payer,
        seeds = [
            b"trip",
            driver_pubkey.key().as_ref(),
            &trip_id.to_le_bytes(),
        ],
        bump,
    )]
    pub trip_account: Account<'info, TripAccount>,
    pub driver_pubkey: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(trip_id: u64)]
pub struct VerifyTrip<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    #[account(
        mut,
        seeds = [
            b"trip",
            driver_pubkey.key().as_ref(),
            &trip_id.to_le_bytes(),
        ],
        bump = trip_account.bump,
    )]
    pub trip_account: Account<'info, TripAccount>,
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
}

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct InitializeRewardPool<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    #[account(
        init,
        space = 8 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 1 + 32 + 8 + 8 + 8, // Note: You should recalculate this
        payer = fee_payer,
        seeds = [
            b"reward_pool",
            //&pool_id.to_le_bytes(),
        ],
        bump,
    )]
    pub reward_pool_account: Account<'info, RewardPoolAccount>,
    #[account(
        init,
        payer = fee_payer,
        token::mint = reward_mint,
        token::authority = vault_authority,
        token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: PDA authority for the vault
    #[account(
        seeds = [b"vault_authority", reward_pool_account.key().as_ref()],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,
    #[account(
        mint::token_program = token_program
    )]
    pub reward_mint: InterfaceAccount<'info, Mint>,
    pub admin_pubkey: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct InitializeValidator<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    #[account(
        init,
        space = 1020, // Note: You should recalculate this
        payer = fee_payer,
        seeds = [
            b"validator",
            validator_pubkey.key().as_ref(),
        ],
        bump,
    )]
    pub validator_account: Account<'info, ValidatorAccount>,
    pub validator_pubkey: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessPrivateData<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    #[account(
        mut,
        seeds = [
            b"validator",
            validator_pubkey.key().as_ref(),
        ],
        bump = validator_account.bump,
    )]
    pub validator_account: Account<'info, ValidatorAccount>,
    pub validator_pubkey: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(pool_id: u64)]
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
    
	#[account(mint::token_program = token_program)]
    pub reward_mint: InterfaceAccount<'info, Mint>,

	#[account(
        mut,
        constraint = vault.owner == vault_authority.key(),
		constraint = vault.mint == reward_mint.key(),
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        constraint = driver_token_account.owner == driver_pubkey.key(),
		constraint = driver_token_account.mint == reward_mint.key(),
    )]
    pub driver_token_account: InterfaceAccount<'info, TokenAccount>,

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
    /// CHECK: This is safe because we derive it from seeds
    #[account(
        seeds = [b"vault_authority", reward_pool_account.key().as_ref()],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct UpdateValidatorWeights<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    #[account(
        mut,
        seeds = [
            b"validator",
            validator_pubkey.key().as_ref(),
        ],
        bump = validator_account.bump,
    )]
    pub validator_account: Account<'info, ValidatorAccount>,
    pub validator_pubkey: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(trip_id: u64)]
pub struct CompleteTrip<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    #[account(
        mut,
        seeds = [
            b"trip",
            driver_pubkey.key().as_ref(),
            &trip_id.to_le_bytes(),
        ],
        bump = trip_account.bump,
    )]
    pub trip_account: Account<'info, TripAccount>,
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
}

#[derive(Accounts)]
#[instruction(trip_id: u64)]
pub struct CreateTrip<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    #[account(
        init,
        space = 130, // Note: You should recalculate this
        payer = fee_payer,
        seeds = [
            b"trip",
            driver_pubkey.key().as_ref(),
            &trip_id.to_le_bytes(),
        ],
        bump,
    )]
    pub trip_account: Account<'info, TripAccount>,
    pub driver_pubkey: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct DistributeReward<'info> {
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
}