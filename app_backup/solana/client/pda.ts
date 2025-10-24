import {PublicKey} from "@solana/web3.js";
import BN from "bn.js";

export type DriverAccountSeeds = {
    driverPubkey: PublicKey, 
};

export const deriveDriverAccountPDA = (
    seeds: DriverAccountSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("driver"),
            seeds.driverPubkey.toBuffer(),
        ],
        programId,
    )
};

export type TripAccountSeeds = {
    tripId: bigint, 
};

export const deriveTripAccountPDA = (
    seeds: TripAccountSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("trip"),
            Buffer.from(BigUint64Array.from([seeds.tripId]).buffer),
        ],
        programId,
    )
};

export type RewardPoolAccountSeeds = {
    poolId: bigint, 
};

export const deriveRewardPoolAccountPDA = (
    seeds: RewardPoolAccountSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("reward_pool"),
            Buffer.from(BigUint64Array.from([seeds.poolId]).buffer),
        ],
        programId,
    )
};

export type ValidatorAccountSeeds = {
    validatorPubkey: PublicKey, 
};

export const deriveValidatorAccountPDA = (
    seeds: ValidatorAccountSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("validator"),
            seeds.validatorPubkey.toBuffer(),
        ],
        programId,
    )
};

