# Environment Variables Setup Guide

Create a `.env` file in the root directory with these values:

```bash
# Backend Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://depin_user:depin_password@localhost:5432/depin_rewards
DB_HOST=localhost
DB_PORT=5432
DB_NAME=depin_rewards
DB_USER=depin_user
DB_PASSWORD=depin_password

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
PROGRAM_ID=H4BYVfgU4eL2t3Pj761nEaZrnQZQtpTnWqJPkuefPXtX

# MagicBlock Configuration  
MAGICBLOCK_API_KEY=your_magicblock_api_key_here
MAGICBLOCK_API_URL=https://api.magicblock.com
MAGICBLOCK_ROUTER_URL=https://devnet-router.magicblock.app
MAGICBLOCK_ER_URL=https://devnet.magicblock.app
MAGICBLOCK_TEE_URL=https://tee.magicblock.app

# JWT Configuration
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRES_IN=7d

# Reward Configuration
REWARD_TOKEN_MINT=YOUR_USDT_MINT_ADDRESS_HERE
REWARD_POOL_ID=1

# CORS Configuration
CORS_ORIGIN=*

# Logging
LOG_LEVEL=debug
```

## Quick Setup

```bash
# Copy this into your .env file
cp ENV_SETUP_GUIDE.md .env

# Or create manually:
nano .env
# Then paste the configuration above
```

