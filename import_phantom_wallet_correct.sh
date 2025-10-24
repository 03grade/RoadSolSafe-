#!/bin/bash

# Import Phantom Wallet with Correct Syntax
echo "🔧 Setting up Solana CLI..."

# Add Solana to PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

echo "🔑 Importing dev1 Phantom wallet..."

# Create a temporary file with the private key
echo "iUYSbQx3Hyo63aNVwac7MrnRrxVmBHfW5S91YjtrpGKVfTJMEpkyywkSS7K1mEsjNtz6kS9nmeg3RW5NYntvQeo" > /tmp/phantom_private_key.txt

# Import the private key using correct syntax
solana-keygen import /home/cyrus/.config/solana/id.json < /tmp/phantom_private_key.txt

# Clean up
rm /tmp/phantom_private_key.txt

# Verify the import
echo "✅ Wallet imported. Current address:"
solana address

echo "💰 Current balance:"
solana balance

echo "🌐 Setting cluster to devnet..."
solana config set --url devnet

echo "🔄 Requesting SOL airdrop..."
solana airdrop 2

echo "💰 New balance:"
solana balance

echo "🎯 Ready to deploy!"
echo "Run: anchor deploy --provider.cluster devnet"

