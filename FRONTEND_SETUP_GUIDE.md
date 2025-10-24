# RoadSolSafe Frontend Setup Guide

## Overview
The project frontend has been switched from `src/mobile-app` to `RoadSolSafe - Copy`, which features a more sophisticated design with:
- Onboarding flow
- Custom gradient backgrounds
- Beautiful custom tab bar
- Wallet integration
- Multiple screens (Quests, Wallet, Profile, Leaderboard, Friends)

## Running the Frontend

### From Root Directory

You can now run these commands from the project root:

```bash
# Start Expo development server (interactive menu)
npm run mobile

# Run on web browser
npm run mobile:web

# Run on Android device/emulator
npm run mobile:android

# Run on iOS device/simulator (Mac only)
npm run mobile:ios
```

### Directly from Frontend Directory

Alternatively, you can run commands directly from the frontend folder:

```bash
cd "RoadSolSafe - Copy"

# Start Expo development server
npm start

# Run on specific platform
npm run web
npm run android
npm run ios
```

## How to View the App

### Option 1: Web Browser (Easiest)
1. Run `npm run mobile:web` from the root, or `npm run web` from the frontend directory
2. Your default browser will open with the app

### Option 2: Mobile Device (Expo Go App)
1. Install Expo Go from App Store (iOS) or Play Store (Android)
2. Run `npm run mobile` from the root
3. Scan the QR code with your phone camera (iOS) or Expo Go app (Android)

### Option 3: Emulator/Simulator
1. Set up Android Studio (Android) or Xcode (iOS/Mac)
2. Start your emulator/simulator
3. Run `npm run mobile:android` or `npm run mobile:ios`

## Features of the New Frontend

### Onboarding Flow
- Welcome screens with beautiful animations
- Profile setup with avatar selection
- Driving goals configuration

### Main Screens
1. **Home/Profile** - View your stats, safety score, and recent trips
2. **Quests** - Complete driving challenges for rewards
3. **Wallet** - Manage your SOL tokens and rewards
4. **Leaderboard** - Compete with other safe drivers
5. **Friends/Socials** - Connect with other drivers

### Design Highlights
- Dark theme with gradient backgrounds (#0F1419 → #1F2A3A)
- Custom tab bar with icons
- Smooth animations and transitions
- Modern, clean UI

## Troubleshooting

### If dependencies are missing:
```bash
cd "RoadSolSafe - Copy"
npm install --legacy-peer-deps
```

### If you get webpack-dev-server errors:
This has been fixed! The `package.json` now uses:
- `@expo/webpack-config`: v19.0.0 (compatible with Expo 54)
- `webpack-dev-server`: v4.15.1 (compatible with Expo webpack config)

If you still have issues, reinstall:
```bash
cd "RoadSolSafe - Copy"
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install --legacy-peer-deps
```

### If Expo cache causes issues:
```bash
cd "RoadSolSafe - Copy"
npx expo start -c
```

### If you encounter module errors:
```bash
cd "RoadSolSafe - Copy"
rm -rf node_modules package-lock.json
npm install
```

## Development Notes

- The onboarding is currently set to always show (for testing)
- To restore normal behavior, edit `App.tsx` and uncomment the lines mentioned in the `checkOnboardingStatus` function
- All components are in `src/components/`
- All screens are in `src/screens/`
- Theme configuration is in `src/styles/theme.ts`

## Next Steps

1. ✅ Frontend switched to RoadSolSafe - Copy
2. ✅ Updated root package.json scripts
3. ✅ Expo development server started
4. 📱 View the app in your browser or mobile device
5. 🎨 Customize colors and branding in `src/styles/theme.ts`
6. 🔧 Configure backend endpoints if needed

Enjoy your new beautiful frontend! 🚗💎

