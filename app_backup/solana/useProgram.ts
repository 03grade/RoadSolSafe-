import { AnchorProvider } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  type AccountMeta,
  type TransactionInstruction,
  type TransactionSignature,
} from "@solana/web3.js";
import { useCallback, useState, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import * as programClient from "~/solana/client";

// Props interface for the useProgram hook
export interface UseProgramProps {
  // Optional override for the VITE_SOLANA_PROGRAM_ID env var
  programId?: string;
}

// Error structure returned from sendAndConfirmTx if transaction fails
type SendAndConfirmTxError = {
  message: string;
  logs: string[];
  stack: string | undefined;
};

// Result structure returned from sendAndConfirmTx
type SendAndConfirmTxResult = {
  // Signature of successful transaction
  signature?: string;

  // Error details if transaction fails
  error?: SendAndConfirmTxError;
};

// Helper function to send and confirm a transaction, with error handling
const sendAndConfirmTx = async (
  fn: () => Promise<TransactionSignature>,
): Promise<SendAndConfirmTxResult> => {
  try {
    const signature = await fn();
    return {
      signature,
    };
  } catch (e: any) {
    let message = `An unknown error occurred: ${e}`;
    let logs = [];
    let stack = "";

    if ("logs" in e && e.logs instanceof Array) {
      logs = e.logs;
    }

    if ("stack" in e) {
      stack = e.stack;
    }

    if ("message" in e) {
      message = e.message;
    }

    return {
      error: {
        logs,
        stack,
        message,
      },
    };
  }
};

const useProgram = (props?: UseProgramProps | undefined) => {
  const [programId, setProgramId] = useState<PublicKey|undefined>(undefined)
  const { connection } = useConnection();

  useEffect(() => {
    let prgId = import.meta.env.VITE_SOLANA_PROGRAM_ID as string | undefined;

    if (props?.programId) {
      prgId = props.programId;
    }

    if (!prgId) {
      throw new Error(
        "the program id must be provided either by the useProgram props or the env var VITE_SOLANA_PROGRAM_ID",
      );
    }

    const pid = new PublicKey(prgId)
    setProgramId(pid)
    programClient.initializeClient(pid, new AnchorProvider(connection));
  }, [props?.programId, connection.rpcEndpoint]);

  /**
   * Initialize a new driver account
   *
   * Accounts:
   * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
   * 1. `[writable]` driver_account: {@link DriverAccount} The driver account to be initialized
   * 2. `[signer]` driver_pubkey: {@link PublicKey} The public key of the driver
   * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
   *
   * @returns {@link TransactionInstruction}
   */
  const initializeDriver = useCallback(programClient.initializeDriver, [])

  /**
   * Initialize a new driver account
   *
   * Accounts:
   * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
   * 1. `[writable]` driver_account: {@link DriverAccount} The driver account to be initialized
   * 2. `[signer]` driver_pubkey: {@link PublicKey} The public key of the driver
   * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const initializeDriverSendAndConfirm = useCallback(async (
    args: Omit<programClient.InitializeDriverArgs, "feePayer" | "driverPubkey"> & {
    signers: {
        feePayer: Keypair,
        driverPubkey: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.initializeDriverSendAndConfirm(args, remainingAccounts)), [])

  /**
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
   *
   * @returns {@link TransactionInstruction}
   */
  const createTrip = useCallback(programClient.createTrip, [])

  /**
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
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const createTripSendAndConfirm = useCallback(async (
    args: Omit<programClient.CreateTripArgs, "feePayer" | "driverPubkey"> & {
    signers: {
        feePayer: Keypair,
        driverPubkey: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.createTripSendAndConfirm(args, remainingAccounts)), [])

  /**
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
   *
   * @returns {@link TransactionInstruction}
   */
  const completeTrip = useCallback(programClient.completeTrip, [])

  /**
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
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const completeTripSendAndConfirm = useCallback(async (
    args: Omit<programClient.CompleteTripArgs, "feePayer" | "driverPubkey"> & {
    signers: {
        feePayer: Keypair,
        driverPubkey: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.completeTripSendAndConfirm(args, remainingAccounts)), [])

  /**
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
   *
   * @returns {@link TransactionInstruction}
   */
  const initializeRewardPool = useCallback(programClient.initializeRewardPool, [])

  /**
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
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const initializeRewardPoolSendAndConfirm = useCallback(async (
    args: Omit<programClient.InitializeRewardPoolArgs, "feePayer" | "adminPubkey"> & {
    signers: {
        feePayer: Keypair,
        adminPubkey: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.initializeRewardPoolSendAndConfirm(args, remainingAccounts)), [])

  /**
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
   *
   * @returns {@link TransactionInstruction}
   */
  const initializeValidator = useCallback(programClient.initializeValidator, [])

  /**
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
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const initializeValidatorSendAndConfirm = useCallback(async (
    args: Omit<programClient.InitializeValidatorArgs, "feePayer" | "validatorPubkey"> & {
    signers: {
        feePayer: Keypair,
        validatorPubkey: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.initializeValidatorSendAndConfirm(args, remainingAccounts)), [])

  /**
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
   *
   * @returns {@link TransactionInstruction}
   */
  const processPrivateData = useCallback(programClient.processPrivateData, [])

  /**
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
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const processPrivateDataSendAndConfirm = useCallback(async (
    args: Omit<programClient.ProcessPrivateDataArgs, "feePayer" | "validatorPubkey"> & {
    signers: {
        feePayer: Keypair,
        validatorPubkey: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.processPrivateDataSendAndConfirm(args, remainingAccounts)), [])


  const getDriverAccount = useCallback(programClient.getDriverAccount, [])
  const getTripAccount = useCallback(programClient.getTripAccount, [])
  const getRewardPoolAccount = useCallback(programClient.getRewardPoolAccount, [])
  const getValidatorAccount = useCallback(programClient.getValidatorAccount, [])

  const deriveDriverAccount = useCallback(programClient.deriveDriverAccountPDA,[])
  const deriveTripAccount = useCallback(programClient.deriveTripAccountPDA,[])
  const deriveRewardPoolAccount = useCallback(programClient.deriveRewardPoolAccountPDA,[])
  const deriveValidatorAccount = useCallback(programClient.deriveValidatorAccountPDA,[])

  return {
	programId,
    initializeDriver,
    initializeDriverSendAndConfirm,
    createTrip,
    createTripSendAndConfirm,
    completeTrip,
    completeTripSendAndConfirm,
    initializeRewardPool,
    initializeRewardPoolSendAndConfirm,
    initializeValidator,
    initializeValidatorSendAndConfirm,
    processPrivateData,
    processPrivateDataSendAndConfirm,
    getDriverAccount,
    getTripAccount,
    getRewardPoolAccount,
    getValidatorAccount,
    deriveDriverAccount,
    deriveTripAccount,
    deriveRewardPoolAccount,
    deriveValidatorAccount,
  };
};

export { useProgram };