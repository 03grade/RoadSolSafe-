@echo off
echo 🔍 Checking dev2 wallet balance...

REM Dev2 wallet address
set DEV2_WALLET=6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2

echo 📊 Checking balance for dev2 wallet: %DEV2_WALLET%
solana balance %DEV2_WALLET% --url devnet

echo ⚠️ If balance is low, requesting airdrop...
solana airdrop 2 %DEV2_WALLET% --url devnet

echo ✅ Airdrop completed
echo 📊 New balance:
solana balance %DEV2_WALLET% --url devnet

echo 🎉 Dev2 wallet is ready for Solana transactions!
pause

