import { AnchorProvider, BN, setProvider, web3 } from "@coral-xyz/anchor";
import * as driverTripRewardClient from "../app/program_client";
import chai from "chai";
import { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Program } from "@coral-xyz/anchor";
import { DriverTripReward } from "../target/types/driver_trip_reward";

chai.use(chaiAsPromised);

const programId = new web3.PublicKey("H4BYVfgU4eL2t3Pj761nEaZrnQZQtpTnWqJPkuefPXtX");

describe("driver_trip_reward tests", () => {
  // Configure the client to use the local cluster
  const provider = AnchorProvider.env();
  setProvider(provider);

  const systemWallet = (provider.wallet as NodeWallet).payer;
  const program = new Program<DriverTripReward>(
    driverTripRewardClient.IDL,
    programId,
    provider
  );

  let driverPubkey: web3.PublicKey;
  let passengerPubkey: web3.PublicKey;
  let validatorPubkey: web3.PublicKey;
  let poolId: number = 1;

  beforeEach(async () => {
    driverPubkey = web3.Keypair.generate().publicKey;
    passengerPubkey = web3.Keypair.generate().publicKey;
    validatorPubkey = web3.Keypair.generate().publicKey;
  });

  it("Initializes a driver account", async () => {
    const tx = await program.methods
      .initializeDriver()
      .accounts({
        feePayer: systemWallet.publicKey,
        driverPubkey: driverPubkey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([systemWallet])
      .rpc();

    console.log("Driver account initialized with tx:", tx);

    // Verify the account was created
    const driverAccount = await program.account.driverAccount.fetch(
      driverPubkey
    );
    expect(driverAccount.driverPubkey).to.eql(driverPubkey);
    expect(driverAccount.totalTrips).to.eql(new BN(0));
    expect(driverAccount.totalEarnings).to.eql(new BN(0));
    expect(driverAccount.totalDistance).to.eql(new BN(0));
    expect(driverAccount.totalTime).to.eql(new BN(0));
    expect(driverAccount.rating).to.eql(0.0);
    expect(driverAccount.isActive).to.eql(true);
  });

  it("Creates a trip account", async () => {
    const tripId = 12345;
    const startTime = Math.floor(Date.now() / 1000);

    // First initialize driver
    await program.methods
      .initializeDriver()
      .accounts({
        feePayer: systemWallet.publicKey,
        driverPubkey: driverPubkey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([systemWallet])
      .rpc();

    // Then create trip
    const tx = await program.methods
      .submitTrip(
        passengerPubkey,
        new BN(tripId),
        new BN(startTime),
        new BN(10), // 10 km
        new BN(3600), // 1 hour
        new BN(2000000000) // 2 SOL
      )
      .accounts({
        feePayer: systemWallet.publicKey,
        driverPubkey: driverPubkey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([systemWallet])
      .rpc();

    console.log("Trip account created with tx:", tx);

    // Verify the account was created
    const tripAccount = await program.account.tripAccount.fetch(
      web3.PublicKey.findProgramAddressSync(
        [Buffer.from("trip"), driverPubkey.toBuffer(), new BN(tripId).toBuffer("le", 8)],
        programId
      )[0]
    );
    expect(tripAccount.tripId).to.eql(new BN(tripId));
    expect(tripAccount.driverPubkey).to.eql(driverPubkey);
    expect(tripAccount.passengerPubkey).to.eql(passengerPubkey);
    expect(tripAccount.startTime).to.eql(new BN(startTime));
    expect(tripAccount.status).to.eql(new BN(0)); // Pending
  });

  it("Verifies a trip and updates driver stats", async () => {
    const tripId = 12345;
    const startTime = Math.floor(Date.now() / 1000);
    const endTime = startTime + 3600; // 1 hour later
    const tripHash = new Uint8Array(32).fill(1); // Mock hash

    // First initialize driver
    await program.methods
      .initializeDriver()
      .accounts({
        feePayer: systemWallet.publicKey,
        driverPubkey: driverPubkey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([systemWallet])
      .rpc();

    // Then create trip
    await program.methods
      .submitTrip(
        passengerPubkey,
        new BN(tripId),
        new BN(startTime),
        new BN(10), // 10 km
        new BN(3600), // 1 hour
        new BN(2000000000) // 2 SOL
      )
      .accounts({
        feePayer: systemWallet.publicKey,
        driverPubkey: driverPubkey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([systemWallet])
      .rpc();

    // Verify the trip
    const tx = await program.methods
      .verifyTrip(
        new BN(tripId),
        new BN(endTime),
        4.5, // 4.5 rating
        tripHash
      )
      .accounts({
        feePayer: systemWallet.publicKey,
        driverPubkey: driverPubkey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([systemWallet])
      .rpc();

    console.log("Trip verified with tx:", tx);

    // Verify the trip was verified
    const tripAccount = await program.account.tripAccount.fetch(
      web3.PublicKey.findProgramAddressSync(
        [Buffer.from("trip"), driverPubkey.toBuffer(), new BN(tripId).toBuffer("le", 8)],
        programId
      )[0]
    );
    expect(tripAccount.endTime).to.eql(new BN(endTime));
    expect(tripAccount.distance).to.eql(new BN(10));
    expect(tripAccount.duration).to.eql(new BN(3600));
    expect(tripAccount.fare).to.eql(new BN(2000000000));
    expect(tripAccount.rating).to.eql(4.5);
    expect(tripAccount.status).to.eql(new BN(1)); // Completed
    expect(tripAccount.verificationStatus).to.eql(new BN(1)); // Verified

    // Verify driver stats were updated
    const driverAccount = await program.account.driverAccount.fetch(
      driverPubkey
    );
    expect(driverAccount.totalTrips).to.eql(new BN(1));
    expect(driverAccount.totalEarnings).to.eql(new BN(2000000000));
    expect(driverAccount.totalDistance).to.eql(new BN(10));
    expect(driverAccount.totalTime).to.eql(new BN(3600));
    expect(driverAccount.rating).to.eql(4.5);
  });

  it("Initializes a reward pool", async () => {
    const totalRewards = 1000000000000; // 1000 SOL
    const rewardPerTrip = 1000000000; // 1 SOL per trip
    const startTime = Math.floor(Date.now() / 1000);
    const endTime = startTime + 86400; // 1 day later

    const tx = await program.methods
      .initializeRewardPool(
        new BN(poolId),
        new BN(totalRewards),
        new BN(rewardPerTrip),
        new BN(startTime),
        new BN(endTime)
      )
      .accounts({
        feePayer: systemWallet.publicKey,
        adminPubkey: systemWallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([systemWallet])
      .rpc();

    console.log("Reward pool initialized with tx:", tx);

    // Verify the account was created
    const rewardPoolAccount = await program.account.rewardPoolAccount.fetch(
      web3.PublicKey.findProgramAddressSync(
        [Buffer.from("reward_pool"), new BN(poolId).toBuffer("le", 8)],
        programId
      )[0]
    );
    expect(rewardPoolAccount.poolId).to.eql(new BN(poolId));
    expect(rewardPoolAccount.totalRewards).to.eql(new BN(totalRewards));
    expect(rewardPoolAccount.distributedRewards).to.eql(new BN(0));
    expect(rewardPoolAccount.rewardPerTrip).to.eql(new BN(rewardPerTrip));
    expect(rewardPoolAccount.startTime).to.eql(new BN(startTime));
    expect(rewardPoolAccount.endTime).to.eql(new BN(endTime));
    expect(rewardPoolAccount.isActive).to.eql(true);
  });

  it("Initializes a validator account", async () => {
    const publicKey = "validator_public_key_123";
    const privateKey = "validator_private_key_456";

    const tx = await program.methods
      .initializeValidator(publicKey, privateKey)
      .accounts({
        feePayer: systemWallet.publicKey,
        validatorPubkey: validatorPubkey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([systemWallet])
      .rpc();

    console.log("Validator account initialized with tx:", tx);

    // Verify the account was created
    const validatorAccount = await program.account.validatorAccount.fetch(
      web3.PublicKey.findProgramAddressSync(
        [Buffer.from("validator"), validatorPubkey.toBuffer()],
        programId
      )[0]
    );
    expect(validatorAccount.validatorPubkey).to.eql(validatorPubkey);
    expect(validatorAccount.publicKey).to.eql(publicKey);
    expect(validatorAccount.privateKey).to.eql(privateKey);
    expect(validatorAccount.isActive).to.eql(true);
  });

  it("Processes private data", async () => {
    const data = "sensitive_data_123";
    const operation = "encrypt";

    // First initialize validator
    await program.methods
      .initializeValidator("validator_public_key", "validator_private_key")
      .accounts({
        feePayer: systemWallet.publicKey,
        validatorPubkey: validatorPubkey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([systemWallet])
      .rpc();

    // Process private data
    const tx = await program.methods
      .processPrivateData(data, operation)
      .accounts({
        feePayer: systemWallet.publicKey,
        validatorPubkey: validatorPubkey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([systemWallet])
      .rpc();

    console.log("Private data processed with tx:", tx);
    // This test just verifies the instruction executes without error
  });

  it("Claims rewards", async () => {
    const totalRewards = 1000000000000; // 1000 SOL
    const rewardPerTrip = 1000000000; // 1 SOL per trip
    const startTime = Math.floor(Date.now() / 1000);
    const endTime = startTime + 86400; // 1 day later

    // Initialize reward pool
    await program.methods
      .initializeRewardPool(
        new BN(poolId),
        new BN(totalRewards),
        new BN(rewardPerTrip),
        new BN(startTime),
        new BN(endTime)
      )
      .accounts({
        feePayer: systemWallet.publicKey,
        adminPubkey: systemWallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([systemWallet])
      .rpc();

    // Initialize driver
    await program.methods
      .initializeDriver()
      .accounts({
        feePayer: systemWallet.publicKey,
        driverPubkey: driverPubkey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([systemWallet])
      .rpc();

    // Claim rewards
    const tx = await program.methods
      .claimRewards(new BN(poolId))
      .accounts({
        feePayer: systemWallet.publicKey,
        driverPubkey: driverPubkey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([systemWallet])
      .rpc();

    console.log("Rewards claimed with tx:", tx);
    // This test just verifies the instruction executes without error
  });
});