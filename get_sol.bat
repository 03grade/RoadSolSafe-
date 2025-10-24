@echo off
echo 🚀 Solana Setup & SOL Request Helper
echo ====================================
echo.
echo 📋 Your Phantom Wallet Addresses:
echo dev1 (user): 3oVnL6Y34hoUXM41MBy6Rcd3asvyyTW8rFT3xgYeSdfZ
echo dev2 (distributor): 6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2
echo.
echo 💡 To get SOL and deploy:
echo.
echo 1. Open WSL terminal
echo 2. Navigate to project: cd /mnt/c/Users/cyrus/Downloads/driver_trip_reward_program\ \(1\)/
echo 3. Run: bash get_sol.sh
echo.
echo 🔧 If Solana CLI not found, run these commands in WSL:
echo    sh -c "$(curl -sSfL https://release.solana.com/v1.18.4/install)"
echo    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
echo.
echo 🎯 After getting SOL, deploy with:
echo    anchor deploy --provider.cluster devnet
echo.
pause

