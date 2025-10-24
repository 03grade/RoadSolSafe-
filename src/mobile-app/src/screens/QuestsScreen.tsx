import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, ProgressBar, Badge } from '../components/Card';
import { Button } from '../components/Button';
import { theme } from '../styles/theme';
import GradientText from '../components/GradientText';
import { fonts } from '../styles/fonts';

const { width: screenWidth } = Dimensions.get('window');

interface Quest {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  progress: number;
  target: number;
  reward: string;
  rewardType: 'points' | 'multiplier' | 'nft';
  completed: boolean;
  claimed: boolean;
  category: 'daily' | 'weekly';
}

export const QuestsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  const dailyQuests: Quest[] = [
    {
      id: '1',
      title: 'Smooth Operator',
      description: 'Complete 2 trips with safety score ≥ 8.0',
      icon: 'shield',
      progress: 1,
      target: 2,
      reward: '+10',
      rewardType: 'points',
      completed: false,
      claimed: false,
      category: 'daily',
    },
    {
      id: '2',
      title: 'Route Explorer',
      description: '1 trip with ≥ 20% distance on new tiles',
      icon: 'map',
      progress: 1,
      target: 1,
      reward: '+10',
      rewardType: 'points',
      completed: true,
      claimed: false,
      category: 'daily',
    },
    {
      id: '3',
      title: 'Pace Yourself',
      description: 'Maintain speed within ±5 km/h for ≥ 8 minutes',
      icon: 'speedometer',
      progress: 0.6,
      target: 1,
      reward: '+10',
      rewardType: 'points',
      completed: false,
      claimed: false,
      category: 'daily',
    },
  ];

  const weeklyQuests: Quest[] = [
    {
      id: '4',
      title: 'Flow State',
      description: '10 trips with safety score ≥ 8.0',
      icon: 'trophy',
      progress: 7,
      target: 10,
      reward: '+50',
      rewardType: 'points',
      completed: false,
      claimed: false,
      category: 'weekly',
    },
    {
      id: '5',
      title: 'City Explorer',
      description: 'Visit 5 tiles not driven in past 14 days',
      icon: 'location',
      progress: 3,
      target: 5,
      reward: '+50',
      rewardType: 'points',
      completed: false,
      claimed: false,
      category: 'weekly',
    },
    {
      id: '6',
      title: 'Eco Friendly',
      description: 'Complete Pace Yourself ×5',
      icon: 'leaf',
      progress: 2,
      target: 5,
      reward: '+50',
      rewardType: 'points',
      completed: false,
      claimed: false,
      category: 'weekly',
    },
  ];

  const currentQuests = activeTab === 'daily' ? dailyQuests : weeklyQuests;

  const getRewardColor = (rewardType: string) => {
    switch (rewardType) {
      case 'points': return theme.colors.primary;
      case 'multiplier': return theme.colors.gold;
      case 'nft': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  const getProgressColor = (progress: number, target: number) => {
    const percentage = progress / target;
    if (percentage >= 1) return theme.colors.success;
    if (percentage >= 0.7) return theme.colors.warning;
    return theme.colors.primary;
  };

  const QuestCard: React.FC<{ quest: Quest }> = ({ quest }) => {
    const progressPercentage = quest.progress / quest.target;
    const isCompleted = quest.completed;
    const canClaim = isCompleted && !quest.claimed;

    return (
      <View style={[
        styles.questCard,
        isCompleted ? styles.questCardCompleted : styles.questCardIncomplete
      ]}>
        <View style={styles.questHeader}>
          <View style={styles.questIconContainer}>
            <Ionicons 
              name={isCompleted ? 'checkmark-circle' : quest.icon} 
              size={24} 
              color={isCompleted ? '#FFFFFF' : theme.colors.text} 
            />
          </View>
          <View style={styles.questInfo}>
            <Text style={styles.questTitle}>{quest.title}</Text>
            <Text style={styles.questDescription}>{quest.description}</Text>
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={16} color="#FF6B35" />
              <Text style={styles.streakText}>{Math.floor(Math.random() * 5) + 1} day streak</Text>
            </View>
          </View>
          <View style={styles.questReward}>
            <Text style={styles.rewardPoints}>{quest.reward}</Text>
            <Text style={styles.rewardLabel}>points</Text>
          </View>
        </View>

        <View style={styles.questProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressText}>
              {Math.round(quest.progress)}/{quest.target}
            </Text>
          </View>
          {isCompleted && (
            <View style={styles.completedContainer}>
              <Text style={styles.completedText}>Completed!</Text>
            </View>
          )}
          <View style={styles.progressBarContainer}>
            <View style={[
              styles.progressBar,
              { 
                width: `${Math.min((quest.progress / quest.target) * 100, 100)}%`,
              }
            ]}>
              <LinearGradient
                colors={isCompleted ? ['#00FF00', '#32CD32'] : ['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressBarGradient}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Quests</Text>
          <Text style={styles.headerSubtitle}>Complete challenges to earn rewards</Text>
          
          {/* Header with Stats */}
          <View style={styles.headerStats}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="star" size={20} color="#FFD700" />
              </View>
              <GradientText
                colors={['#FFD700', '#FFA500', '#FFD700']}
                textStyle={styles.statValue}
              >
                1,250
              </GradientText>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="flame" size={20} color="#FF6B35" />
              </View>
              <GradientText
                colors={['#FF6B35', '#FF4500', '#FF6B35']}
                textStyle={styles.statValue}
              >
                12
              </GradientText>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'daily' && styles.activeTab
          ]}
          onPress={() => setActiveTab('daily')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'daily' && styles.activeTabText
          ]}>
            Daily
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'weekly' && styles.activeTab
          ]}
          onPress={() => setActiveTab('weekly')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'weekly' && styles.activeTabText
          ]}>
            Weekly
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quests List */}
      <ScrollView 
        style={styles.questsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.questsListContent}
      >
        {currentQuests.map((quest) => (
          <QuestCard key={quest.id} quest={quest} />
        ))}
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Header styles
  headerContent: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  headerTitle: {
    ...fonts.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...fonts.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    ...fonts.score,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...fonts.label,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginTop: -theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xs,
    ...theme.shadows.md,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    ...fonts.button,
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    ...fonts.button,
    color: '#FFFFFF',
  },

  // Quest styles
  questsList: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  questsListContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  questCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  questCardIncomplete: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  questCardCompleted: {
    backgroundColor: 'rgba(50, 205, 50, 0.2)',
    borderColor: 'rgba(50, 205, 50, 0.4)',
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  questIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    ...fonts.button,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  questDescription: {
    ...fonts.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    marginBottom: 6,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    ...fonts.caption,
    color: '#FF6B35',
    marginLeft: 4,
  },
  questReward: {
    alignItems: 'flex-end',
  },
  rewardPoints: {
    ...fonts.label,
    color: '#FFFFFF',
  },
  rewardLabel: {
    ...fonts.caption,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  questProgress: {
    marginTop: theme.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    ...fonts.caption,
    color: '#FFFFFF',
  },
  progressText: {
    ...fonts.caption,
    color: '#FFFFFF',
  },
  completedContainer: {
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  completedText: {
    ...fonts.caption,
    color: '#32CD32',
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressBarGradient: {
    flex: 1,
    borderRadius: 2,
  },

});
