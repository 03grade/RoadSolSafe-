// Font utility functions for consistent typography - matching onboarding flow
export const fonts = {
  // Headers
  h1: {
    fontFamily: 'Trebuchet MS Bold',
    fontSize: 40,
    fontWeight: '800',
  },
  h2: {
    fontFamily: 'Trebuchet MS Bold',
    fontSize: 32,
    fontWeight: '600',
  },
  h3: {
    fontFamily: 'Trebuchet MS Bold',
    fontSize: 24,
    fontWeight: '700',
  },
  h4: {
    fontFamily: 'Trebuchet MS Bold',
    fontSize: 20,
    fontWeight: '700',
  },

  // Body text
  body: {
    fontFamily: 'Trebuchet MS',
    fontSize: 16,
    fontWeight: '400',
  },
  bodyLarge: {
    fontFamily: 'Trebuchet MS',
    fontSize: 18,
    fontWeight: '500',
  },
  bodySmall: {
    fontFamily: 'Trebuchet MS',
    fontSize: 15,
    fontWeight: '400',
  },

  // Labels and captions
  label: {
    fontFamily: 'Trebuchet MS',
    fontSize: 14,
    fontWeight: '500',
  },
  caption: {
    fontFamily: 'Trebuchet MS',
    fontSize: 12,
    fontWeight: '400',
  },

  // Buttons
  button: {
    fontFamily: 'Trebuchet MS',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonLarge: {
    fontFamily: 'Trebuchet MS',
    fontSize: 18,
    fontWeight: '500',
  },

  // Special text
  score: {
    fontFamily: 'Trebuchet MS Bold',
    fontSize: 30,
    fontWeight: '800',
  },
  metric: {
    fontFamily: 'Trebuchet MS Bold',
    fontSize: 24,
    fontWeight: '700',
  },
  tab: {
    fontFamily: 'Trebuchet MS',
    fontSize: 14,
    fontWeight: '500',
  },
};

export type FontStyle = keyof typeof fonts;
