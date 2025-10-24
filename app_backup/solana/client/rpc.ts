import BN from "bn.js";
import {
  AnchorProvider,
  type IdlAccounts,
  Program,
  web3,
} from "@coral-xyz/anchor";
import { MethodsBuilder } from "@coral-xyz/anchor/dist/cjs/program/namespace/methods";
import type { DriverTripReward } from "../../../target/types/driver_trip_reward";
import idl from "../../../target/idl/driver_trip_reward.json";
import * as pda from "./pda";



let _program: Program<DriverTripReward>;


export const initializeClient = (
    programId: web3.PublicKey,
    anchorProvider = AnchorProvider.env(),
) => {
    _program = new Program<DriverTripReward>(
        idl as DriverTripReward,
        anchorProvider,
    );


};

export type InitializeDriverArgs = {
  feePayer: web3.PublicKey;
  driverPubkey: web3.PublicKey;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Initialize a new driver account
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` driver_account: {@link DriverAccount} The driver account to be initialized
 * 2. `[signer]` driver_pubkey: {@link PublicKey} The public key of the driver
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 */
export const initializeDriverBuilder = (
	args: InitializeDriverArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<DriverTripReward, never> => {
    const [driverAccountPubkey] = pda.deriveDriverAccountPDA({
        driverPubkey: args.driverPubkey,
    }, _program.programId);

  return _program
    .methods
    .initializeDriver(

    )
    .accountsStrict({
      feePayer: args.feePayer,
      driverAccount: driverAccountPubkey,
      driverPubkey: args.driverPubkey,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Initialize a new driver account
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` driver_account: {@link DriverAccount} The driver account to be initialized
 * 2. `[signer]` driver_pubkey: {@link PublicKey} The public key of the driver
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 */
export const initializeDriver = (
	args: InitializeDriverArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    initializeDriverBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Initialize a new driver account
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` driver_account: {@link DriverAccount} The driver account to be initialized
 * 2. `[signer]` driver_pubkey: {@link PublicKey} The public key of the driver
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 */
export const initializeDriverSendAndConfirm = async (
  args: Omit<InitializeDriverArgs, "feePayer" | "driverPubkey"> & {
    signers: {
      feePayer: web3.Signer,
      driverPubkey: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return initializeDriverBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      driverPubkey: args.signers.driverPubkey.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.driverPubkey])
    .rpc();
}

export type CreateTripArgs = {
  feePayer: web3.PublicKey;
  driverPubkey: web3.PublicKey;
  passengerPubkey: web3.PublicKey;
  tripId: bigint;
  startTime: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Create a new trip account
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` trip_account: {@link TripAccount} The trip account to be created
 * 2. `[signer]` driver_pubkey: {@link PublicKey} The public key of the driver
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - passenger_pubkey: {@link PublicKey} The public key of the passenger
 * - trip_id: {@link BigInt} Unique identifier for the trip
 * - start_time: {@link BigInt} Timestamp when trip started
 */
export const createTripBuilder = (
	args: CreateTripArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<DriverTripReward, never> => {
    const [tripAccountPubkey] = pda.deriveTripAccountPDA({
        tripId: args.tripId,
    }, _program.programId);

  return _program
    .methods
    .createTrip(
      args.passengerPubkey,
      new BN(args.tripId.toString()),
      new BN(args.startTime.toString()),
    )
    .accountsStrict({
      feePayer: args.feePayer,
      tripAccount: tripAccountPubkey,
      driverPubkey: args.driverPubkey,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Create a new trip account
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` trip_account: {@link TripAccount} The trip account to be created
 * 2. `[signer]` driver_pubkey: {@link PublicKey} The public key of the driver
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - passenger_pubkey: {@link PublicKey} The public key of the passenger
 * - trip_id: {@link BigInt} Unique identifier for the trip
 * - start_time: {@link BigInt} Timestamp when trip started
 */
export const createTrip = (
	args: CreateTripArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    createTripBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Create a new trip account
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` trip_account: {@link TripAccount} The trip account to be created
 * 2. `[signer]` driver_pubkey: {@link PublicKey} The public key of the driver
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - passenger_pubkey: {@link PublicKey} The public key of the passenger
 * - trip_id: {@link BigInt} Unique identifier for the trip
 * - start_time: {@link BigInt} Timestamp when trip started
 */
export const createTripSendAndConfirm = async (
  args: Omit<CreateTripArgs, "feePayer" | "driverPubkey"> & {
    signers: {
      feePayer: web3.Signer,
      driverPubkey: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return createTripBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      driverPubkey: args.signers.driverPubkey.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.driverPubkey])
    .rpc();
}

export type CompleteTripArgs = {
  feePayer: web3.PublicKey;
  driverPubkey: web3.PublicKey;
  tripId: bigint;
  endTime: bigint;
  distance: bigint;
  duration: bigint;
  fare: bigint;
  rating: number;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Complete a trip and update driver statistics
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` trip_account: {@link TripAccount} The trip account to be completed
 * 2. `[writable]` driver_account: {@link DriverAccount} The driver account to be updated
 * 3. `[signer]` driver_pubkey: {@link PublicKey} The public key of the driver
 *
 * Data:
 * - trip_id: {@link BigInt} Unique identifier for the trip
 * - end_time: {@link BigInt} Timestamp when trip ended
 * - distance: {@link BigInt} Distance traveled in kilometers
 * - duration: {@link BigInt} Duration of trip in seconds
 * - fare: {@link BigInt} Fare amount in lamports
 * - rating: {@link number} Passenger rating for the trip
 */
export const completeTripBuilder = (
	args: CompleteTripArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<DriverTripReward, never> => {
    const [tripAccountPubkey] = pda.deriveTripAccountPDA({
        tripId: args.tripId,
    }, _program.programId);
    const [driverAccountPubkey] = pda.deriveDriverAccountPDA({
        driverPubkey: args.driverPubkey,
    }, _program.programId);

  return _program
    .methods
    .completeTrip(
      new BN(args.tripId.toString()),
      new BN(args.endTime.toString()),
      new BN(args.distance.toString()),
      new BN(args.duration.toString()),
      new BN(args.fare.toString()),
      args.rating,
    )
    .accountsStrict({
      feePayer: args.feePayer,
      tripAccount: tripAccountPubkey,
      driverAccount: driverAccountPubkey,
      driverPubkey: args.driverPubkey,
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Complete a trip and update driver statistics
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` trip_account: {@link TripAccount} The trip account to be completed
 * 2. `[writable]` driver_account: {@link DriverAccount} The driver account to be updated
 * 3. `[signer]` driver_pubkey: {@link PublicKey} The public key of the driver
 *
 * Data:
 * - trip_id: {@link BigInt} Unique identifier for the trip
 * - end_time: {@link BigInt} Timestamp when trip ended
 * - distance: {@link BigInt} Distance traveled in kilometers
 * - duration: {@link BigInt} Duration of trip in seconds
 * - fare: {@link BigInt} Fare amount in lamports
 * - rating: {@link number} Passenger rating for the trip
 */
export const completeTrip = (
	args: CompleteTripArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    completeTripBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Complete a trip and update driver statistics
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` trip_account: {@link TripAccount} The trip account to be completed
 * 2. `[writable]` driver_account: {@link DriverAccount} The driver account to be updated
 * 3. `[signer]` driver_pubkey: {@link PublicKey} The public key of the driver
 *
 * Data:
 * - trip_id: {@link BigInt} Unique identifier for the trip
 * - end_time: {@link BigInt} Timestamp when trip ended
 * - distance: {@link BigInt} Distance traveled in kilometers
 * - duration: {@link BigInt} Duration of trip in seconds
 * - fare: {@link BigInt} Fare amount in lamports
 * - rating: {@link number} Passenger rating for the trip
 */
export const completeTripSendAndConfirm = async (
  args: Omit<CompleteTripArgs, "feePayer" | "driverPubkey"> & {
    signers: {
      feePayer: web3.Signer,
      driverPubkey: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return completeTripBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      driverPubkey: args.signers.driverPubkey.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.driverPubkey])
    .rpc();
}

export type InitializeRewardPoolArgs = {
  feePayer: web3.PublicKey;
  adminPubkey: web3.PublicKey;
  poolId: bigint;
  totalRewards: bigint;
  rewardPerTrip: bigint;
  startTime: bigint;
  endTime: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Initialize a new reward pool
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` reward_pool_account: {@link RewardPoolAccount} The reward pool account to be initialized
 * 2. `[signer]` admin_pubkey: {@link PublicKey} The public key of the admin
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - pool_id: {@link BigInt} Unique identifier for the reward pool
 * - total_rewards: {@link BigInt} Total rewards available in the pool
 * - reward_per_trip: {@link BigInt} Reward amount per trip
 * - start_time: {@link BigInt} Timestamp when rewards started
 * - end_time: {@link BigInt} Timestamp when rewards end
 */
export const initializeRewardPoolBuilder = (
	args: InitializeRewardPoolArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<DriverTripReward, never> => {
    const [rewardPoolAccountPubkey] = pda.deriveRewardPoolAccountPDA({
        poolId: args.poolId,
    }, _program.programId);

  return _program
    .methods
    .initializeRewardPool(
      new BN(args.poolId.toString()),
      new BN(args.totalRewards.toString()),
      new BN(args.rewardPerTrip.toString()),
      new BN(args.startTime.toString()),
      new BN(args.endTime.toString()),
    )
    .accountsStrict({
      feePayer: args.feePayer,
      rewardPoolAccount: rewardPoolAccountPubkey,
      adminPubkey: args.adminPubkey,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Initialize a new reward pool
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` reward_pool_account: {@link RewardPoolAccount} The reward pool account to be initialized
 * 2. `[signer]` admin_pubkey: {@link PublicKey} The public key of the admin
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - pool_id: {@link BigInt} Unique identifier for the reward pool
 * - total_rewards: {@link BigInt} Total rewards available in the pool
 * - reward_per_trip: {@link BigInt} Reward amount per trip
 * - start_time: {@link BigInt} Timestamp when rewards started
 * - end_time: {@link BigInt} Timestamp when rewards end
 */
export const initializeRewardPool = (
	args: InitializeRewardPoolArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    initializeRewardPoolBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Initialize a new reward pool
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` reward_pool_account: {@link RewardPoolAccount} The reward pool account to be initialized
 * 2. `[signer]` admin_pubkey: {@link PublicKey} The public key of the admin
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - pool_id: {@link BigInt} Unique identifier for the reward pool
 * - total_rewards: {@link BigInt} Total rewards available in the pool
 * - reward_per_trip: {@link BigInt} Reward amount per trip
 * - start_time: {@link BigInt} Timestamp when rewards started
 * - end_time: {@link BigInt} Timestamp when rewards end
 */
export const initializeRewardPoolSendAndConfirm = async (
  args: Omit<InitializeRewardPoolArgs, "feePayer" | "adminPubkey"> & {
    signers: {
      feePayer: web3.Signer,
      adminPubkey: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return initializeRewardPoolBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      adminPubkey: args.signers.adminPubkey.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.adminPubkey])
    .rpc();
}

export type InitializeValidatorArgs = {
  feePayer: web3.PublicKey;
  validatorPubkey: web3.PublicKey;
  publicKey: string;
  privateKey: string;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Initialize a new validator account for MagicBlock ER/PER
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` validator_account: {@link ValidatorAccount} The validator account to be initialized
 * 2. `[signer]` validator_pubkey: {@link PublicKey} The public key of the validator
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - public_key: {@link string} Public key for MagicBlock ER/PER
 * - private_key: {@link string} Private key for MagicBlock ER/PER
 */
export const initializeValidatorBuilder = (
	args: InitializeValidatorArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<DriverTripReward, never> => {
    const [validatorAccountPubkey] = pda.deriveValidatorAccountPDA({
        validatorPubkey: args.validatorPubkey,
    }, _program.programId);

  return _program
    .methods
    .initializeValidator(
      args.publicKey,
      args.privateKey,
    )
    .accountsStrict({
      feePayer: args.feePayer,
      validatorAccount: validatorAccountPubkey,
      validatorPubkey: args.validatorPubkey,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Initialize a new validator account for MagicBlock ER/PER
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` validator_account: {@link ValidatorAccount} The validator account to be initialized
 * 2. `[signer]` validator_pubkey: {@link PublicKey} The public key of the validator
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - public_key: {@link string} Public key for MagicBlock ER/PER
 * - private_key: {@link string} Private key for MagicBlock ER/PER
 */
export const initializeValidator = (
	args: InitializeValidatorArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    initializeValidatorBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Initialize a new validator account for MagicBlock ER/PER
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` validator_account: {@link ValidatorAccount} The validator account to be initialized
 * 2. `[signer]` validator_pubkey: {@link PublicKey} The public key of the validator
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - public_key: {@link string} Public key for MagicBlock ER/PER
 * - private_key: {@link string} Private key for MagicBlock ER/PER
 */
export const initializeValidatorSendAndConfirm = async (
  args: Omit<InitializeValidatorArgs, "feePayer" | "validatorPubkey"> & {
    signers: {
      feePayer: web3.Signer,
      validatorPubkey: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return initializeValidatorBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      validatorPubkey: args.signers.validatorPubkey.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.validatorPubkey])
    .rpc();
}

export type ProcessPrivateDataArgs = {
  feePayer: web3.PublicKey;
  validatorPubkey: web3.PublicKey;
  data: string;
  operation: string;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Process private data using MagicBlock ER/PER capabilities
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` validator_account: {@link ValidatorAccount} The validator account for processing
 * 2. `[signer]` validator_pubkey: {@link PublicKey} The public key of the validator
 *
 * Data:
 * - data: {@link string} Private data to be processed
 * - operation: {@link string} Operation to perform on the data
 */
export const processPrivateDataBuilder = (
	args: ProcessPrivateDataArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<DriverTripReward, never> => {
    const [validatorAccountPubkey] = pda.deriveValidatorAccountPDA({
        validatorPubkey: args.validatorPubkey,
    }, _program.programId);

  return _program
    .methods
    .processPrivateData(
      args.data,
      args.operation,
    )
    .accountsStrict({
      feePayer: args.feePayer,
      validatorAccount: validatorAccountPubkey,
      validatorPubkey: args.validatorPubkey,
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Process private data using MagicBlock ER/PER capabilities
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` validator_account: {@link ValidatorAccount} The validator account for processing
 * 2. `[signer]` validator_pubkey: {@link PublicKey} The public key of the validator
 *
 * Data:
 * - data: {@link string} Private data to be processed
 * - operation: {@link string} Operation to perform on the data
 */
export const processPrivateData = (
	args: ProcessPrivateDataArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    processPrivateDataBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Process private data using MagicBlock ER/PER capabilities
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` validator_account: {@link ValidatorAccount} The validator account for processing
 * 2. `[signer]` validator_pubkey: {@link PublicKey} The public key of the validator
 *
 * Data:
 * - data: {@link string} Private data to be processed
 * - operation: {@link string} Operation to perform on the data
 */
export const processPrivateDataSendAndConfirm = async (
  args: Omit<ProcessPrivateDataArgs, "feePayer" | "validatorPubkey"> & {
    signers: {
      feePayer: web3.Signer,
      validatorPubkey: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return processPrivateDataBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      validatorPubkey: args.signers.validatorPubkey.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.validatorPubkey])
    .rpc();
}

// Getters

export const getDriverAccount = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<DriverTripReward>["driverAccount"]> => _program.account.driverAccount.fetch(publicKey, commitment);

export const getTripAccount = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<DriverTripReward>["tripAccount"]> => _program.account.tripAccount.fetch(publicKey, commitment);

export const getRewardPoolAccount = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<DriverTripReward>["rewardPoolAccount"]> => _program.account.rewardPoolAccount.fetch(publicKey, commitment);

export const getValidatorAccount = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<DriverTripReward>["validatorAccount"]> => _program.account.validatorAccount.fetch(publicKey, commitment);
