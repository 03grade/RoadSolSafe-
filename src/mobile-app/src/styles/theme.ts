export const theme = {
  colors: {
    // Primary automotive colors
    background: '#1F2328', // Deep charcoal
    surface: '#2A2F36', // Darker surface
    primary: '#1E90FF', // Electric blue accent
    secondary: '#3A3F45', // Slate gray
    accent: '#D1D5DB', // Silver
    
    // Safety and rewards
    success: '#32CD32', // Neon green for streaks
    warning: '#FFA500', // Orange for warnings
    error: '#FF4444', // Red for errors
    gold: '#EBCB6C', // Gold for tokens/NFTs
    
    // Text colors
    text: '#FFFFFF', // White text
    textSecondary: '#B0B3B8', // Light gray text
    textMuted: '#6B7280', // Muted text
    
    // Safety score colors
    scoreHigh: '#32CD32', // Green 8-10
    scoreMedium: '#FFA500', // Yellow 5-7
    scoreLow: '#FF4444', // Red 0-4
    
    // UI elements
    border: '#3A3F45',
    divider: '#2A2F36',
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    // Glass morphism
    glass: 'rgba(255, 255, 255, 0.1)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
  },
  
  typography: {
    // Font families (System fonts for better performance and consistency)
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      light: 'System',
    },
    
    // Font sizes
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    
    // Font weights
    fontWeight: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    
    // Line heights
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    glow: {
      shadowColor: '#1E90FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 10,
    },
  },
  
  // Device dimensions
  device: {
    iphone15Pro: {
      width: 390,
      height: 844,
      notch: true,
    },
    pixel8: {
      width: 393,
      height: 851,
      notch: true,
    },
  },
};

export type Theme = typeof theme;
