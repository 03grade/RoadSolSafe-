#!/bin/bash

# Script to check dev2 wallet balance and request airdrop if needed
# This ensures dev2 wallet has SOL for transaction fees

echo "🔍 Checking dev2 wallet balance..."

# Dev2 wallet address
DEV2_WALLET="6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2"

# Check balance
echo "📊 Checking balance for dev2 wallet: $DEV2_WALLET"
solana balance $DEV2_WALLET --url devnet

# Get current balance in SOL
BALANCE=$(solana balance $DEV2_WALLET --url devnet | grep -o '[0-9.]*' | head -1)

echo "💰 Current balance: $BALANCE SOL"

# Check if balance is less than 1 SOL
if (( $(echo "$BALANCE < 1.0" | bc -l) )); then
    echo "⚠️ Balance is low, requesting airdrop..."
    solana airdrop 2 $DEV2_WALLET --url devnet
    echo "✅ Airdrop completed"
    
    # Check new balance
    echo "📊 New balance:"
    solana balance $DEV2_WALLET --url devnet
else
    echo "✅ Balance is sufficient for transactions"
fi

echo "🎉 Dev2 wallet is ready for Solana transactions!"

