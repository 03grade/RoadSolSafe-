// Socials Screen Component
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const SocialsScreen = () => {
  const { theme } = useTheme();
  const [friends, setFriends] = useState([
    { id: 1, name: 'Alex Johnson', points: 1250, isOnline: true },
    { id: 2, name: 'Maria Garcia', points: 980, isOnline: true },
    { id: 3, name: 'Sam Wilson', points: 870, isOnline: false },
    { id: 4, name: 'Emma Davis', points: 750, isOnline: true },
    { id: 5, name: 'James Brown', points: 620, isOnline: false },
  ]);

  const [groups, setGroups] = useState([
    { id: 1, name: 'Top Drivers', members: 12, points: 12500 },
    { id: 2, name: 'Safe Riders', members: 8, points: 8500 },
    { id: 3, name: 'Fast Travelers', members: 15, points: 15200 },
  ]);

  const handleFriendAction = (id: number, action: string) => {
    const friend = friends.find(f => f.id === id);
    if (friend) {
      Alert.alert(
        action === 'message' ? 'Message' : 'Invite',
        action === 'message' 
          ? `Send message to ${friend.name}?` 
          : `Invite ${friend.name} to a group?`
      );
    }
  };

  const handleGroupAction = (id: number) => {
    const group = groups.find(g => g.id === id);
    if (group) {
      Alert.alert('Join Group', `Join the ${group.name} group?`);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme === 'light' ? '#f5f5f5' : '#1a1a1a' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme === 'light' ? '#000' : '#fff' }]}>Socials</Text>
        <Text style={[styles.subtitle, { color: theme === 'light' ? '#666' : '#aaa' }]}>Connect with other drivers</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#000' : '#fff' }]}>Friends</Text>
        <View style={styles.friendsContainer}>
          {friends.map((friend) => (
            <View 
              key={friend.id} 
              style={[styles.friendCard, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}
            >
              <View style={styles.friendInfo}>
                <Text style={[styles.friendName, { color: theme === 'light' ? '#000' : '#fff' }]}>
                  {friend.name}
                </Text>
                <Text style={[styles.friendPoints, { color: theme === 'light' ? '#666' : '#aaa' }]}>
                  {friend.points} points
                </Text>
              </View>
              
              <View style={styles.friendStatus}>
                <View style={[
                  styles.statusIndicator, 
                  { backgroundColor: friend.isOnline ? '#34C759' : '#888' }
                ]} />
                <Text style={[styles.statusText, { color: theme === 'light' ? '#666' : '#aaa' }]}>
                  {friend.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
              
              <View style={styles.friendActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
                  onPress={() => handleFriendAction(friend.id, 'message')}
                >
                  <Text style={styles.actionButtonText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#34C759' }]}
                  onPress={() => handleFriendAction(friend.id, 'invite')}
                >
                  <Text style={styles.actionButtonText}>Invite</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#000' : '#fff' }]}>Groups</Text>
        <View style={styles.groupsContainer}>
          {groups.map((group) => (
            <TouchableOpacity 
              key={group.id} 
              style={[styles.groupCard, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}
              onPress={() => handleGroupAction(group.id)}
            >
              <Text style={[styles.groupName, { color: theme === 'light' ? '#000' : '#fff' }]}>
                {group.name}
              </Text>
              <View style={styles.groupStats}>
                <Text style={[styles.groupStat, { color: theme === 'light' ? '#666' : '#aaa' }]}>
                  {group.members} members
                </Text>
                <Text style={[styles.groupStat, { color: theme === 'light' ? '#666' : '#aaa' }]}>
                  {group.points} points
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.joinButton, { backgroundColor: '#007AFF' }]}
              >
                <Text style={styles.joinButtonText}>Join Group</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={[styles.section, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
        <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#000' : '#fff' }]}>Achievement Groups</Text>
        <View style={styles.achievementsContainer}>
          <View style={styles.achievementItem}>
            <Text style={[styles.achievementText, { color: theme === 'light' ? '#000' : '#fff' }]}>Top 10 Drivers</Text>
            <Text style={[styles.achievementCount, { color: theme === 'light' ? '#666' : '#aaa' }]}>12/10</Text>
          </View>
          <View style={styles.achievementItem}>
            <Text style={[styles.achievementText, { color: theme === 'light' ? '#000' : '#fff' }]}>Safe Driver</Text>
            <Text style={[styles.achievementCount, { color: theme === 'light' ? '#666' : '#aaa' }]}>8/5</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 5,
  },
  section: {
    margin: 20,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  friendsContainer: {
    marginBottom: 10,
  },
  friendCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  friendInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendPoints: {
    fontSize: 14,
    color: '#666',
  },
  friendStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
  },
  friendActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginRight: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  groupsContainer: {
    marginBottom: 10,
  },
  groupCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  groupStat: {
    fontSize: 12,
  },
  joinButton: {
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  achievementsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  achievementItem: {
    alignItems: 'center',
  },
  achievementText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  achievementCount: {
    fontSize: 12,
    marginTop: 5,
  },
});

export default SocialsScreen;