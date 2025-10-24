#!/bin/bash

# Import Phantom Wallet with Proper PATH
echo "🔧 Setting up Solana CLI..."

# Add Solana to PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify Solana is available
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Trying alternative path..."
    export PATH="/home/cyrus/.local/share/solana/install/releases/2.3.13/solana-release/bin:$PATH"
fi

# Check if Solana is now available
if command -v solana &> /dev/null; then
    echo "✅ Solana CLI found"
else
    echo "❌ Solana CLI still not found. Please install it first:"
    echo "sh -c \"\$(curl -sSfL https://release.solana.com/v1.18.4/install)\""
    exit 1
fi

echo "🔑 Importing dev1 Phantom wallet..."

# Create a temporary file with the private key
echo "iUYSbQx3Hyo63aNVwac7MrnRrxVmBHfW5S91YjtrpGKVfTJMEpkyywkSS7K1mEsjNtz6kS9nmeg3RW5NYntvQeo" > /tmp/phantom_private_key.txt

# Import the private key
solana-keygen import /home/cyrus/.config/solana/id.json --force < /tmp/phantom_private_key.txt

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

