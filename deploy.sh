#!/bin/bash

# Solana Deployment Helper Script
# This script helps you get SOL and deploy your program

echo "🚀 Solana Deployment Helper"
echo "=========================="

# Check if solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install it first:"
    echo "   sh -c \"\$(curl -sSfL https://release.solana.com/v1.18.4/install)\""
    echo "   export PATH=\"\$HOME/.local/share/solana/install/active_release/bin:\$PATH\""
    exit 1
fi

echo "✅ Solana CLI found"

# Check current balance
echo "💰 Checking current balance..."
BALANCE=$(solana balance --output json | jq -r '.value')
echo "Current balance: $BALANCE SOL"

# Check if we need more SOL
REQUIRED_SOL=3.0
if (( $(echo "$BALANCE < $REQUIRED_SOL" | bc -l) )); then
    echo "⚠️  Insufficient SOL for deployment. Need at least $REQUIRED_SOL SOL"
    echo "🔄 Requesting airdrop..."
    
    # Request airdrop
    solana airdrop 2
    
    # Check balance again
    sleep 5
    NEW_BALANCE=$(solana balance --output json | jq -r '.value')
    echo "New balance: $NEW_BALANCE SOL"
    
    if (( $(echo "$NEW_BALANCE < $REQUIRED_SOL" | bc -l) )); then
        echo "❌ Still insufficient SOL. You may need to:"
        echo "   1. Wait for airdrop to process"
        echo "   2. Request another airdrop: solana airdrop 2"
        echo "   3. Transfer SOL from an exchange"
        exit 1
    fi
fi

echo "✅ Sufficient SOL available"

# Set cluster to devnet
echo "🌐 Setting cluster to devnet..."
solana config set --url devnet

# Build the program
echo "🔨 Building program..."
anchor build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo "✅ Build successful"

# Deploy the program
echo "🚀 Deploying program to devnet..."
anchor deploy --provider.cluster devnet

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Save the program ID that was printed"
    echo "   2. Update your .env file with the program ID"
    echo "   3. Create a test USDT mint"
    echo "   4. Initialize reward pool"
    echo "   5. Test reward claiming"
else
    echo "❌ Deployment failed. Check the errors above."
    exit 1
fi

