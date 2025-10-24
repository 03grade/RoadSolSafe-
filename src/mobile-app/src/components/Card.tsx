import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { fonts } from '../styles/fonts';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'elevated' | 'outlined';
  style?: ViewStyle;
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  padding = 'md',
}) => {
  const getCardStyle = () => {
    const baseStyle = [styles.card, styles[`padding_${padding}`]];
    
    if (variant === 'glass') {
      return [...baseStyle, styles.cardGlass];
    } else if (variant === 'elevated') {
      return [...baseStyle, styles.cardElevated];
    } else if (variant === 'outlined') {
      return [...baseStyle, styles.cardOutlined];
    }
    
    return [...baseStyle, styles.cardDefault];
  };

  if (variant === 'glass') {
    return (
      <View style={[getCardStyle(), style]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
};

interface SafetyScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  style?: ViewStyle;
}

export const SafetyScoreGauge: React.FC<SafetyScoreGaugeProps> = ({
  score,
  size = 120,
  strokeWidth = 12,
  showLabel = true,
  style,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 10;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress * circumference);

  const getScoreColor = (score: number) => {
    if (score >= 8) return theme.colors.scoreHigh;
    if (score >= 5) return theme.colors.scoreMedium;
    return theme.colors.scoreLow;
  };

  return (
    <View style={[styles.gaugeContainer, { width: size, height: size }, style]}>
      <View style={styles.gaugeBackground}>
        <View
          style={[
            styles.gaugeTrack,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
            },
          ]}
        />
        <View
          style={[
            styles.gaugeProgress,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: getScoreColor(score),
              transform: [{ rotate: '-90deg' }],
            },
          ]}
        />
      </View>
      {showLabel && (
        <View style={styles.gaugeLabel}>
          <Text style={[styles.gaugeScore, { fontSize: size * 0.2 }]}>
            {score.toFixed(1)}
          </Text>
          <Text style={[styles.gaugeMax, { fontSize: size * 0.1 }]}>/10</Text>
        </View>
      )}
    </View>
  );
};

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color = theme.colors.primary,
  backgroundColor = theme.colors.surface,
  showPercentage = false,
  style,
}) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  
  return (
    <View style={[styles.progressBarContainer, style]}>
      <View
        style={[
          styles.progressBarTrack,
          {
            height,
            backgroundColor,
          },
        ]}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              height,
              width: `${clampedProgress * 100}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={styles.progressBarText}>
          {Math.round(clampedProgress * 100)}%
        </Text>
      )}
    </View>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  style,
}) => {
  const getBadgeStyle = () => {
    const baseStyle = [styles.badge, styles[`badge_${size}`]];
    
    if (variant === 'success') {
      return [...baseStyle, styles.badgeSuccess];
    } else if (variant === 'warning') {
      return [...baseStyle, styles.badgeWarning];
    } else if (variant === 'error') {
      return [...baseStyle, styles.badgeError];
    } else if (variant === 'gold') {
      return [...baseStyle, styles.badgeGold];
    }
    
    return [...baseStyle, styles.badgeDefault];
  };

  return (
    <View style={[getBadgeStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // Card styles
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardElevated: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  cardOutlined: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  padding_sm: {
    padding: theme.spacing.sm,
  },
  padding_md: {
    padding: theme.spacing.md,
  },
  padding_lg: {
    padding: theme.spacing.lg,
  },

  // Safety Score Gauge styles
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeBackground: {
    position: 'absolute',
  },
  gaugeTrack: {
    borderColor: theme.colors.surface,
    position: 'absolute',
  },
  gaugeProgress: {
    borderColor: theme.colors.primary,
    position: 'absolute',
  },
  gaugeLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeScore: {
    ...fonts.score,
    color: theme.colors.text,
    lineHeight: 1,
  },
  gaugeMax: {
    ...fonts.label,
    color: theme.colors.textSecondary,
    lineHeight: 1,
  },

  // Progress Bar styles
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarTrack: {
    flex: 1,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    borderRadius: theme.borderRadius.sm,
  },
  progressBarText: {
    ...fonts.label,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },

  // Badge styles
  badge: {
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge_sm: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minHeight: 20,
  },
  badge_md: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 24,
  },
  badge_lg: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 32,
  },
  badgeDefault: {
    backgroundColor: theme.colors.secondary,
  },
  badgeSuccess: {
    backgroundColor: theme.colors.success,
  },
  badgeWarning: {
    backgroundColor: theme.colors.warning,
  },
  badgeError: {
    backgroundColor: theme.colors.error,
  },
  badgeGold: {
    backgroundColor: theme.colors.gold,
  },
});
