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
import { theme } from '../styles/theme';
import { fonts } from '../styles/fonts';
import { ProfilePicture, ProfilePictureType } from '../components/ProfilePicture';

const { width: screenWidth } = Dimensions.get('window');

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  username: string;
  points: number;
  isCurrentUser?: boolean;
  character: ProfilePictureType;
}

export const LeaderboardScreen: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'today' | 'weekly'>('today');

  const leaderboardData: LeaderboardEntry[] = [
    {
      id: '1',
      rank: 1,
      name: 'Nolan Culhane',
      username: 'nolan_c',
      points: 12348,
      character: 'cat',
    },
    {
      id: '2',
      rank: 2,
      name: 'Maren Culhane',
      username: 'maren_c',
      points: 11865,
      character: 'robot',
    },
    {
      id: '3',
      rank: 3,
      name: 'Leo Vaccaro',
      username: 'leo_v',
      points: 11129,
      character: 'robot2',
    },
    {
      id: '4',
      rank: 4,
      name: 'Alfonso Saris',
      username: 'alfosa',
      points: 10829,
      character: 'fox',
    },
    {
      id: '5',
      rank: 5,
      name: 'Ashlynn Westervelt',
      username: 'ash_',
      points: 10643,
      character: 'bear',
    },
    {
      id: '6',
      rank: 6,
      name: 'Lindsey Vetrovs',
      username: 'vetrolin',
      points: 10323,
      character: 'penguin',
    },
    {
      id: '7',
      rank: 7,
      name: 'Carter Dorwart',
      username: 'CarRt',
      points: 10063,
      character: 'fox2',
    },
    {
      id: '8',
      rank: 8,
      name: 'Kianna George',
      username: 'KikiGrg',
      points: 9975,
      character: 'rabbit',
    },
    {
      id: '9',
      rank: 9,
      name: 'Brandon Siphron',
      username: 'the_don',
      points: 4657,
      isCurrentUser: true,
      character: 'cat',
    },
    {
      id: '10',
      rank: 10,
      name: 'Kaden Doe',
      username: 'kad_do',
      points: 9234,
      character: 'robot',
    },
  ];

  const topThree = leaderboardData.slice(0, 3);
  const currentUser = leaderboardData.find(entry => entry.isCurrentUser);
  const otherEntries = leaderboardData.slice(3).filter(entry => !entry.isCurrentUser);
  
  // Only show other entries in scrollable list (current user is sticky)
  const remainingEntries = otherEntries;

  const TopThreeDisplay: React.FC = () => {
    return (
      <View style={styles.podiumContainer}>
        {/* 3rd Place (Left) - Shortest */}
        <View style={styles.podiumItem}>
            <View style={styles.playerInfo}>
              <View style={styles.topThreeAvatar}>
                <ProfilePicture type={topThree[2]?.character || 'cat'} size={50} />
              </View>
              <Text style={styles.topThreeName}>{topThree[2]?.name}</Text>
            <View style={styles.topThreePoints}>
              <Ionicons name="star" size={16} color={theme.colors.gold} />
              <Text style={styles.topThreePointsText}>{topThree[2]?.points.toLocaleString()}</Text>
            </View>
          </View>
          <LinearGradient
            colors={['#FFFFFF', '#F0F0F0', '#E0E0E0']}
            style={[styles.podiumBlock, styles.thirdPlaceBlock]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.podiumNumber}>3</Text>
          </LinearGradient>
        </View>

        {/* 1st Place (Center) - Tallest */}
        <View style={styles.podiumItem}>
            <View style={styles.playerInfo}>
              <View style={styles.topThreeAvatar}>
                <ProfilePicture type={topThree[0]?.character || 'cat'} size={50} />
              </View>
              <Text style={styles.topThreeName}>{topThree[0]?.name}</Text>
            <View style={styles.topThreePoints}>
              <Ionicons name="star" size={16} color={theme.colors.gold} />
              <Text style={styles.topThreePointsText}>{topThree[0]?.points.toLocaleString()}</Text>
            </View>
          </View>
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FF8C00']}
            style={[styles.podiumBlock, styles.firstPlaceBlock]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.podiumNumber}>1</Text>
          </LinearGradient>
        </View>

        {/* 2nd Place (Right) - Medium */}
        <View style={styles.podiumItem}>
            <View style={styles.playerInfo}>
              <View style={styles.topThreeAvatar}>
                <ProfilePicture type={topThree[1]?.character || 'cat'} size={50} />
              </View>
              <Text style={styles.topThreeName}>{topThree[1]?.name}</Text>
            <View style={styles.topThreePoints}>
              <Ionicons name="star" size={16} color={theme.colors.gold} />
              <Text style={styles.topThreePointsText}>{topThree[1]?.points.toLocaleString()}</Text>
            </View>
          </View>
          <LinearGradient
            colors={['#C0C0C0', '#A0A0A0', '#808080']}
            style={[styles.podiumBlock, styles.secondPlaceBlock]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.podiumNumber}>2</Text>
          </LinearGradient>
        </View>
      </View>
    );
  };

  const LeaderboardRow: React.FC<{ entry: LeaderboardEntry }> = ({ entry }) => {
    const getRankColor = (rank: number) => {
      if (rank <= 3) return theme.colors.gold;
      if (rank <= 10) return theme.colors.primary;
      return theme.colors.textSecondary;
    };

    return (
      <LinearGradient
        colors={entry.isCurrentUser 
          ? ['rgba(45, 130, 255, 0.2)', 'rgba(45, 130, 255, 0.1)']
          : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']
        }
        style={[
          styles.leaderboardRow,
          entry.isCurrentUser && styles.currentUserRow
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[
          styles.rankNumber,
          { color: getRankColor(entry.rank) }
        ]}>
          {entry.rank}
        </Text>
        <View style={styles.userAvatar}>
          <ProfilePicture type={entry.character} size={40} />
        </View>
        <View style={styles.userInfo}>
          <Text style={[
            styles.userName,
            entry.isCurrentUser && styles.currentUserName
          ]}>
            {entry.name}
          </Text>
          <Text style={[
            styles.userUsername,
            entry.isCurrentUser && styles.currentUserUsername
          ]}>
            {entry.username}
          </Text>
        </View>
        <View style={styles.pointsContainer}>
          <Ionicons name="star" size={16} color={theme.colors.gold} />
          <Text style={[
            styles.pointsText,
            entry.isCurrentUser && styles.currentUserPoints
          ]}>
            {entry.points.toLocaleString()}
          </Text>
        </View>
      </LinearGradient>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>See how you rank against other drivers</Text>
      </View>

      {/* Top Three Display */}
      <View style={styles.topThreeSection}>
        <TopThreeDisplay />
      </View>

      {/* Leaderboard List */}
      <View style={styles.leaderboardSection}>
        {/* Sticky Current User Row */}
        {currentUser && !topThree.includes(currentUser) && (
          <View style={styles.stickyUserContainer}>
            <LeaderboardRow entry={currentUser} />
          </View>
        )}
        
        <ScrollView 
          style={styles.leaderboardScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.leaderboardContent}
        >
          {remainingEntries.map((entry) => (
            <LeaderboardRow key={entry.id} entry={entry} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Header styles
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    alignItems: 'center',
  },
  headerTitle: {
    ...fonts.h3,
    color: theme.colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...fonts.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  // Podium Section
  topThreeSection: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    height: 200,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  playerInfo: {
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 2,
  },
  podiumBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  firstPlaceBlock: {
    width: 80,
    height: 120,
  },
  secondPlaceBlock: {
    width: 70,
    height: 90,
  },
  thirdPlaceBlock: {
    width: 60,
    height: 60,
  },
  podiumNumber: {
    ...fonts.h1,
    color: '#000000',
  },
  topThreeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  topThreeName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  topThreePoints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topThreePointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 4,
  },

  // Leaderboard Section
  leaderboardSection: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  stickyUserContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    zIndex: 10,
    elevation: 5,
  },
  leaderboardScroll: {
    flex: 1,
  },
  leaderboardContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  currentUserRow: {
    backgroundColor: 'rgba(45, 130, 255, 0.15)',
    borderRadius: 16,
    marginHorizontal: -4,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'rgba(45, 130, 255, 0.3)',
    shadowColor: '#2D82FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  currentUserName: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  currentUserUsername: {
    color: theme.colors.primary,
    opacity: 0.8,
  },
  currentUserPoints: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    width: 30,
    textAlign: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: '#B0B3B8',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
});
