#!/bin/bash

# Deploy Solana Program Script
echo "🚀 Deploying Solana Program..."

# Add Solana and Anchor to PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
export PATH="$HOME/.cargo/bin:$PATH"

# Set cluster to devnet
echo "🌐 Setting cluster to devnet..."
solana config set --url devnet

# Check balance
echo "💰 Current balance:"
solana balance

# Deploy the program
echo "🔨 Deploying program..."
anchor deploy --provider.cluster devnet

echo "✅ Deployment complete!"
