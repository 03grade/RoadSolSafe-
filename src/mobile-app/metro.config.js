// metro.config.js for mobile app
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for TypeScript and React Native
config.resolver.assetExts.push('cjs');

module.exports = config;