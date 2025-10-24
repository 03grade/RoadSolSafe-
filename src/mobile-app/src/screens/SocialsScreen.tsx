import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '../components/Card';
import { Button } from '../components/Button';
import { theme } from '../styles/theme';
import { fonts } from '../styles/fonts';
import { ProfilePicture, ProfilePictureType } from '../components/ProfilePicture';

const { width: screenWidth } = Dimensions.get('window');

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  points: number;
  weeklyPoints: number;
  safetyScore: number;
  streakDays: number;
  isOnline: boolean;
  lastActive: string;
  character: ProfilePictureType;
}

interface Activity {
  id: string;
  type: 'trip_completed' | 'achievement' | 'streak' | 'milestone';
  friendName: string;
  description: string;
  points?: number;
  timestamp: string;
}

export const SocialsScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendCode, setFriendCode] = useState('');

  const friends: Friend[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      points: 2847,
      weeklyPoints: 238,
      safetyScore: 9.2,
      streakDays: 45,
      isOnline: true,
      lastActive: '2 min ago',
      character: 'cat',
    },
    {
      id: '2',
      name: 'Mike Rodriguez',
      points: 2653,
      weeklyPoints: 245,
      safetyScore: 9.0,
      streakDays: 38,
      isOnline: true,
      lastActive: '5 min ago',
      character: 'robot',
    },
    {
      id: '3',
      name: 'Emma Thompson',
      points: 2489,
      weeklyPoints: 221,
      safetyScore: 8.9,
      streakDays: 32,
      isOnline: false,
      lastActive: '1 hour ago',
      character: 'robot2',
    },
    {
      id: '4',
      name: 'David Kim',
      points: 1723,
      weeklyPoints: 187,
      safetyScore: 8.5,
      streakDays: 28,
      isOnline: false,
      lastActive: '3 hours ago',
      character: 'fox',
    },
  ];

  const activities: Activity[] = [
    {
      id: '1',
      type: 'trip_completed',
      friendName: 'Sarah Chen',
      description: 'completed a 12.5 km trip with 9.2 safety score',
      points: 15,
      timestamp: '2 minutes ago',
    },
    {
      id: '2',
      type: 'achievement',
      friendName: 'Mike Rodriguez',
      description: 'earned the "Smooth Operator" badge',
      points: 10,
      timestamp: '15 minutes ago',
    },
    {
      id: '3',
      type: 'streak',
      friendName: 'Emma Thompson',
      description: 'reached 30-day safety streak!',
      points: 50,
      timestamp: '1 hour ago',
    },
    {
      id: '4',
      type: 'milestone',
      friendName: 'David Kim',
      description: 'completed 100 total trips',
      points: 25,
      timestamp: '2 hours ago',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'trip_completed': return 'car';
      case 'achievement': return 'trophy';
      case 'streak': return 'flame';
      case 'milestone': return 'star';
      default: return 'notifications';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'trip_completed': return theme.colors.primary;
      case 'achievement': return theme.colors.gold;
      case 'streak': return theme.colors.success;
      case 'milestone': return theme.colors.warning;
      default: return theme.colors.textSecondary;
    }
  };

  const FriendCard: React.FC<{ friend: Friend }> = ({ friend }) => {
    return (
      <Card style={styles.friendCard}>
        <View style={styles.friendHeader}>
          <View style={styles.friendAvatar}>
            <ProfilePicture type={friend.character} size={48} />
            {friend.isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{friend.name}</Text>
            <Text style={styles.friendLastActive}>
              {friend.isOnline ? 'Online' : `Last active ${friend.lastActive}`}
            </Text>
          </View>
          <TouchableOpacity style={styles.messageButton}>
            <Ionicons name="chatbubble" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.friendStats}>
          <View style={styles.friendStat}>
            <Text style={styles.friendStatValue}>{friend.weeklyPoints}</Text>
            <Text style={styles.friendStatLabel}>This Week</Text>
          </View>
          <View style={styles.friendStat}>
            <Text style={styles.friendStatValue}>{friend.safetyScore.toFixed(1)}</Text>
            <Text style={styles.friendStatLabel}>Safety Score</Text>
          </View>
          <View style={styles.friendStat}>
            <Text style={styles.friendStatValue}>{friend.streakDays}</Text>
            <Text style={styles.friendStatLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.friendTotalPoints}>
          <Text style={styles.totalPointsLabel}>Total Points</Text>
          <Text style={styles.totalPointsValue}>{friend.points.toLocaleString()}</Text>
        </View>
      </Card>
    );
  };

  const ActivityItem: React.FC<{ activity: Activity }> = ({ activity }) => {
    return (
      <View style={styles.activityItem}>
        <View style={[
          styles.activityIcon,
          { backgroundColor: getActivityColor(activity.type) }
        ]}>
          <Ionicons
            name={getActivityIcon(activity.type) as any}
            size={16}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityText}>
            <Text style={styles.activityFriendName}>{activity.friendName}</Text>
            {' '}{activity.description}
          </Text>
          <View style={styles.activityFooter}>
            <Text style={styles.activityTimestamp}>{activity.timestamp}</Text>
            {activity.points && (
              <Badge variant="gold" size="sm">
                <Text style={styles.activityPoints}>+{activity.points}</Text>
              </Badge>
            )}
          </View>
        </View>
      </View>
    );
  };

  const handleAddFriend = () => {
    if (friendCode.trim()) {
      // In real app, this would validate and add the friend
      Alert.alert('Friend Added', `Added friend with code: ${friendCode}`);
      setFriendCode('');
      setShowAddFriend(false);
    }
  };

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Socials</Text>
          <View style={styles.headerStats}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{friends.length}</Text>
              <Text style={styles.headerStatLabel}>Friends</Text>
            </View>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>4</Text>
              <Text style={styles.headerStatLabel}>Online</Text>
            </View>
          </View>
        </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Card style={styles.searchCard}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Card>
      </View>

      {/* Add Friend Button */}
      <View style={styles.addFriendContainer}>
        <Button
          title="Add Friend"
          onPress={() => setShowAddFriend(true)}
          variant="secondary"
          icon="person-add"
          style={styles.addFriendButton}
        />
      </View>

      {/* Content Tabs */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Friends Section */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Friends</Text>
            <Text style={styles.sectionSubtitle}>{friends.length} friends</Text>
          </View>
          
          <View style={styles.friendsList}>
            {friends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </View>
        </Card>

        {/* Recent Activity Section */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.sectionSubtitle}>What your friends are up to</Text>
          </View>
          
          <View style={styles.activitiesList}>
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </View>
        </Card>

        {/* Invite Friends Section */}
        <Card style={styles.sectionCard}>
          <View style={styles.inviteContent}>
            <Ionicons name="gift" size={40} color={theme.colors.gold} />
            <Text style={styles.inviteTitle}>Invite Friends</Text>
            <Text style={styles.inviteDescription}>
              Share your friend code and earn bonus points when they join!
            </Text>
            <View style={styles.friendCodeContainer}>
              <Text style={styles.friendCodeLabel}>Your Friend Code</Text>
              <Text style={styles.friendCode}>RSF-ALEX-2024</Text>
            </View>
            <Button
              title="Share Code"
              onPress={() => {}}
              variant="success"
              icon="share"
              style={styles.shareButton}
            />
          </View>
        </Card>
      </ScrollView>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Friend</Text>
              <TouchableOpacity onPress={() => setShowAddFriend(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Enter your friend's code to add them to your network
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter friend code..."
              placeholderTextColor={theme.colors.textSecondary}
              value={friendCode}
              onChangeText={setFriendCode}
              autoCapitalize="characters"
            />
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowAddFriend(false)}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title="Add Friend"
                onPress={handleAddFriend}
                variant="primary"
                style={styles.modalButton}
              />
            </View>
          </Card>
        </View>
      )}
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
    color: theme.colors.text,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: 'bold',
    marginBottom: theme.spacing.lg,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  headerStat: {
    alignItems: 'center',
  },
  headerStatValue: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
  },
  headerStatLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.xs,
  },

  // Search styles
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: -theme.spacing.lg,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.base,
    marginLeft: theme.spacing.sm,
  },

  // Add friend styles
  addFriendContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  addFriendButton: {
    marginBottom: theme.spacing.lg,
  },

  // Content styles
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xl,
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
  },

  // Friends styles
  friendsList: {
    gap: theme.spacing.md,
  },
  friendCard: {
    padding: theme.spacing.md,
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  friendLastActive: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
  },
  messageButton: {
    padding: theme.spacing.sm,
  },
  friendStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  friendStat: {
    alignItems: 'center',
  },
  friendStatValue: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
  },
  friendStatLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  friendTotalPoints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  totalPointsLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  totalPointsValue: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
  },

  // Activity styles
  activitiesList: {
    gap: theme.spacing.lg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.sm,
    minHeight: 60,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
    paddingRight: theme.spacing.sm,
    minHeight: 50,
  },
  activityText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
    flexWrap: 'wrap',
    flex: 1,
  },
  activityFriendName: {
    fontWeight: '600',
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  activityTimestamp: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
    flex: 1,
  },
  activityPoints: {
    color: '#000000',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: 'bold',
  },

  // Invite styles
  inviteContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  inviteTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  inviteDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing.xl,
  },
  friendCodeContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  friendCodeLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.sm,
  },
  friendCode: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shareButton: {
    marginTop: theme.spacing.sm,
  },

  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalCard: {
    margin: theme.spacing.xl,
    padding: theme.spacing.xl,
    maxWidth: screenWidth - theme.spacing.xl * 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
  },
  modalDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing.lg,
  },
  modalInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.base,
    marginBottom: theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
