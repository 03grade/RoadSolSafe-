#!/bin/bash

# Solana Setup and SOL Request Script
# This script helps you configure Solana CLI and get SOL for deployment

echo "🚀 Solana Setup & SOL Request Helper"
echo "===================================="

# Check if solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found in PATH"
    echo "📋 Please run these commands in WSL:"
    echo ""
    echo "# Install Solana CLI:"
    echo "sh -c \"\$(curl -sSfL https://release.solana.com/v1.18.4/install)\""
    echo ""
    echo "# Add to PATH:"
    echo "export PATH=\"\$HOME/.local/share/solana/install/active_release/bin:\$PATH\""
    echo ""
    echo "# Then run this script again"
    exit 1
fi

echo "✅ Solana CLI found"

# Set cluster to devnet
echo "🌐 Setting cluster to devnet..."
solana config set --url devnet

# Show current configuration
echo "📋 Current Solana configuration:"
echo "Cluster: $(solana config get | grep 'RPC URL' | cut -d' ' -f3)"
echo "Keypair: $(solana config get | grep 'Keypair Path' | cut -d' ' -f3)"

# Get current address and balance
CURRENT_ADDRESS=$(solana address)
CURRENT_BALANCE=$(solana balance --output json | jq -r '.value')

echo ""
echo "💰 Current wallet info:"
echo "Address: $CURRENT_ADDRESS"
echo "Balance: $CURRENT_BALANCE SOL"

# Check if this matches your Phantom addresses
echo ""
echo "🔍 Checking against your Phantom addresses:"
echo "dev1: 3oVnL6Y34hoUXM41MBy6Rcd3asvyyTW8rFT3xgYeSdfZ"
echo "dev2: 6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2"

if [ "$CURRENT_ADDRESS" = "3oVnL6Y34hoUXM41MBy6Rcd3asvyyTW8rFT3xgYeSdfZ" ]; then
    echo "✅ Using dev1 wallet (user wallet)"
elif [ "$CURRENT_ADDRESS" = "6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2" ]; then
    echo "✅ Using dev2 wallet (distributor wallet)"
else
    echo "⚠️  Current address doesn't match your Phantom wallets"
    echo "💡 You may want to import one of your Phantom wallets"
fi

# Check if we need more SOL
REQUIRED_SOL=3.0
if (( $(echo "$CURRENT_BALANCE < $REQUIRED_SOL" | bc -l) )); then
    echo ""
    echo "⚠️  Insufficient SOL for deployment. Need at least $REQUIRED_SOL SOL"
    echo "🔄 Requesting airdrop..."
    
    # Request airdrop
    solana airdrop 2
    
    # Wait a moment
    sleep 3
    
    # Check balance again
    NEW_BALANCE=$(solana balance --output json | jq -r '.value')
    echo "New balance: $NEW_BALANCE SOL"
    
    if (( $(echo "$NEW_BALANCE < $REQUIRED_SOL" | bc -l) )); then
        echo "❌ Still insufficient SOL. You may need to:"
        echo "   1. Wait for airdrop to process"
        echo "   2. Request another airdrop: solana airdrop 2"
        echo "   3. Transfer SOL from an exchange"
        exit 1
    fi
else
    echo "✅ Sufficient SOL available for deployment"
fi

echo ""
echo "🎯 Ready to deploy! Run:"
echo "anchor deploy --provider.cluster devnet"

