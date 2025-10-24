import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DeviceFrameProps {
  children: React.ReactNode;
  device: 'iphone15pro' | 'pixel8';
  style?: ViewStyle;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  children,
  device,
  style,
}) => {
  const deviceConfig = device === 'iphone15pro' 
    ? theme.device.iphone15Pro 
    : theme.device.pixel8;

  const frameStyle = [
    styles.deviceFrame,
    {
      width: deviceConfig.width,
      height: deviceConfig.height,
    },
    style,
  ];

  return (
    <View style={frameStyle}>
      {/* Device bezel */}
      <View style={styles.deviceBezel}>
        {/* Status bar area */}
        <View style={styles.statusBar}>
          <View style={styles.statusBarLeft}>
            <Text style={styles.statusBarTime}>9:41</Text>
          </View>
          <View style={styles.statusBarRight}>
            <Ionicons name="cellular" size={16} color={theme.colors.text} />
            <Ionicons name="wifi" size={16} color={theme.colors.text} />
            <Ionicons name="battery-full" size={16} color={theme.colors.text} />
          </View>
        </View>
        
        {/* Notch */}
        {deviceConfig.notch && (
          <View style={styles.notch}>
            <View style={styles.notchInner} />
          </View>
        )}
        
        {/* Screen content */}
        <View style={styles.screenContent}>
          {children}
        </View>
        
        {/* Home indicator */}
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
};

interface StartStopButtonProps {
  isActive: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export const StartStopButton: React.FC<StartStopButtonProps> = ({
  isActive,
  onPress,
  style,
}) => {
  return (
    <View style={[styles.startStopContainer, style]}>
      <LinearGradient
        colors={isActive ? ['#FF4444', '#CC0000'] : ['#32CD32', '#228B22']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.startStopButton}
      >
        <View style={styles.startStopInner}>
          <Ionicons
            name={isActive ? 'stop' : 'play'}
            size={32}
            color="#FFFFFF"
          />
        </View>
      </LinearGradient>
      
      {/* Pulse animation ring */}
      <View style={[styles.pulseRing, isActive && styles.pulseRingActive]} />
    </View>
  );
};

interface TripSummaryCardProps {
  score: number;
  distance: number;
  duration: string;
  events: {
    hardBrakes: number;
    hardAccels: number;
    harshCorners: number;
    speedingPercent: number;
    phoneUseMinutes: number;
  };
  recommendation: string;
  onClaim: () => void;
  style?: ViewStyle;
}

export const TripSummaryCard: React.FC<TripSummaryCardProps> = ({
  score,
  distance,
  duration,
  events,
  recommendation,
  onClaim,
  style,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 8) return theme.colors.scoreHigh;
    if (score >= 5) return theme.colors.scoreMedium;
    return theme.colors.scoreLow;
  };

  return (
    <View style={[styles.tripSummaryCard, style]}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tripSummaryGradient}
      >
        {/* Header */}
        <View style={styles.tripSummaryHeader}>
          <Text style={styles.tripSummaryTitle}>Trip Complete</Text>
          <View style={styles.tripSummaryScore}>
            <Text style={[styles.tripSummaryScoreText, { color: getScoreColor(score) }]}>
              {score.toFixed(1)}
            </Text>
            <Text style={styles.tripSummaryScoreLabel}>/10</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.tripSummaryStats}>
          <View style={styles.tripSummaryStat}>
            <Text style={styles.tripSummaryStatValue}>{distance.toFixed(1)} km</Text>
            <Text style={styles.tripSummaryStatLabel}>Distance</Text>
          </View>
          <View style={styles.tripSummaryStat}>
            <Text style={styles.tripSummaryStatValue}>{duration}</Text>
            <Text style={styles.tripSummaryStatLabel}>Duration</Text>
          </View>
        </View>

        {/* Events */}
        <View style={styles.tripSummaryEvents}>
          <Text style={styles.tripSummaryEventsTitle}>Events</Text>
          <View style={styles.tripSummaryEventsList}>
            <Text style={styles.tripSummaryEvent}>
              Hard Brakes: {events.hardBrakes}
            </Text>
            <Text style={styles.tripSummaryEvent}>
              Hard Accels: {events.hardAccels}
            </Text>
            <Text style={styles.tripSummaryEvent}>
              Harsh Corners: {events.harshCorners}
            </Text>
            <Text style={styles.tripSummaryEvent}>
              Speeding: {events.speedingPercent.toFixed(1)}%
            </Text>
            <Text style={styles.tripSummaryEvent}>
              Phone Use: {events.phoneUseMinutes.toFixed(1)} min
            </Text>
          </View>
        </View>

        {/* Recommendation */}
        <View style={styles.tripSummaryRecommendation}>
          <Text style={styles.tripSummaryRecommendationTitle}>Recommendation</Text>
          <Text style={styles.tripSummaryRecommendationText}>{recommendation}</Text>
        </View>

        {/* Claim Button */}
        <LinearGradient
          colors={['#EBCB6C', '#D4AF37']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.claimButton}
        >
          <View style={styles.claimButtonInner}>
            <Ionicons name="trophy" size={20} color="#000000" />
            <Text style={styles.claimButtonText}>Claim Rewards</Text>
          </View>
        </LinearGradient>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  // Device Frame styles
  deviceFrame: {
    backgroundColor: '#000000',
    borderRadius: 25,
    padding: 8,
    ...theme.shadows.lg,
  },
  deviceBezel: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    overflow: 'hidden',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    height: 44,
  },
  statusBarLeft: {
    flex: 1,
  },
  statusBarTime: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: 600,
  },
  statusBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  notch: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -75,
    width: 150,
    height: 30,
    backgroundColor: '#000000',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  notchInner: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  screenContent: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -67,
    width: 134,
    height: 5,
    backgroundColor: theme.colors.textSecondary,
    borderRadius: 2.5,
  },

  // Start/Stop Button styles
  startStopContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  startStopButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
  startStopInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pulseRingActive: {
    borderColor: '#32CD32',
    opacity: 0.6,
  },

  // Trip Summary Card styles
  tripSummaryCard: {
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  tripSummaryGradient: {
    padding: theme.spacing.xl,
  },
  tripSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  tripSummaryTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
  },
  tripSummaryScore: {
    alignItems: 'center',
  },
  tripSummaryScoreText: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: 'bold',
    lineHeight: 1,
  },
  tripSummaryScoreLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: 500,
  },
  tripSummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
  },
  tripSummaryStat: {
    alignItems: 'center',
  },
  tripSummaryStatValue: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
  },
  tripSummaryStatLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: 500,
  },
  tripSummaryEvents: {
    marginBottom: theme.spacing.lg,
  },
  tripSummaryEventsTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.base,
    fontWeight: 600,
    marginBottom: theme.spacing.sm,
  },
  tripSummaryEventsList: {
    gap: theme.spacing.xs,
  },
  tripSummaryEvent: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
  },
  tripSummaryRecommendation: {
    marginBottom: theme.spacing.lg,
  },
  tripSummaryRecommendationTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.base,
    fontWeight: 600,
    marginBottom: theme.spacing.sm,
  },
  tripSummaryRecommendationText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.relaxed,
  },
  claimButton: {
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  claimButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  claimButtonText: {
    color: '#000000',
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
  },
});
