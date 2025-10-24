@echo off
echo 🚀 Solana Deployment Helper
echo ==========================

echo ✅ Solana CLI should be available in WSL
echo.
echo 📋 Manual steps to deploy:
echo.
echo 1. Open WSL terminal
echo 2. Navigate to your project: cd /mnt/c/Users/cyrus/Downloads/driver_trip_reward_program\ \(1\)/
echo 3. Check balance: solana balance
echo 4. Get SOL: solana airdrop 2
echo 5. Build: anchor build
echo 6. Deploy: anchor deploy --provider.cluster devnet
echo.
echo 💡 If you get insufficient funds error:
echo    - Run: solana airdrop 2 (multiple times if needed)
echo    - Check balance: solana balance
echo    - Make sure you have at least 3 SOL
echo.
echo 🎯 After successful deployment:
echo    - Save the program ID
echo    - Update .env file
echo    - Test mobile app with wallet connection
echo.
pause

