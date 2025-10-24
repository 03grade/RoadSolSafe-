# Development Build Setup for Full Background Location Support

## 🚨 IMPORTANT: Expo Go Limitations

**Expo Go does NOT support background location on Android.** This breaks the core functionality of your DePIN app.

## ✅ Solution: Development Build

You need to create a **development build** to get full background location support.

### **Step 1: Install EAS CLI**

```bash
npm install -g @expo/eas-cli
```

### **Step 2: Configure EAS**

```bash
# In your project root
eas build:configure
```

This creates `eas.json` with build configuration.

### **Step 3: Update eas.json**

```json
{
  "cli": {
    "version": ">= 5.9.1"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug"
      },
      "ios": {
        "buildConfiguration": "Debug"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

### **Step 4: Add Background Location Permissions**

Update `app.json`:

```json
{
  "expo": {
    "name": "RoadSolSafe",
    "slug": "roadsolsafe",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "This app needs location access to track your driving trips and calculate safety scores.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "This app needs location access to track your driving trips and calculate safety scores.",
        "NSLocationAlwaysUsageDescription": "This app needs location access to track your driving trips and calculate safety scores.",
        "UIBackgroundModes": ["location"]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION",
        "POST_NOTIFICATIONS"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "This app needs location access to track your driving trips and calculate safety scores.",
          "locationAlwaysPermission": "This app needs location access to track your driving trips and calculate safety scores.",
          "locationWhenInUsePermission": "This app needs location access to track your driving trips and calculate safety scores.",
          "isAndroidBackgroundLocationEnabled": true,
          "isAndroidForegroundServiceEnabled": true
        }
      ],
      [
        "expo-task-manager",
        {
          "android": {
            "foregroundService": {
              "enabled": true
            }
          }
        }
      ]
    ]
  }
}
```

### **Step 5: Build Development Build**

```bash
# For Android
eas build --platform android --profile development

# For iOS (if you have Apple Developer account)
eas build --platform ios --profile development
```

### **Step 6: Install Development Build**

1. Download the APK/IPA from EAS dashboard
2. Install on your device
3. Run `npx expo start --dev-client` instead of `npx expo start`

## 🔄 Alternative: Quick Test with Foreground Tracking

If you want to test immediately without building:

1. **Keep the app in foreground** while driving
2. **Don't minimize** the app during trips
3. **Use navigation apps** in split-screen mode

## 📱 Testing Instructions

### **With Development Build:**
1. Start trip → App can run in background
2. Switch to navigation app → Telemetry continues
3. End trip → Full telemetry data collected

### **With Expo Go (Limited):**
1. Start trip → Keep app in foreground
2. Use split-screen with navigation app
3. End trip → Limited telemetry data

## 🎯 Next Steps

1. **Immediate**: Test with foreground tracking (current setup)
2. **Short-term**: Build development build for full functionality
3. **Long-term**: Deploy to app stores with production build

## 📞 Support

If you need help with the development build setup, I can guide you through each step!

