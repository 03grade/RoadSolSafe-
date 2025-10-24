// Quests Screen Component
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const QuestsScreen = () => {
  const { theme } = useTheme();
  const [quests, setQuests] = useState([
    {
      id: 1,
      title: 'Complete 5 Trips',
      description: 'Drive 5 trips this week',
      progress: 3,
      target: 5,
      reward: 1000000000, // 1 SOL in lamports
      completed: false,
    },
    {
      id: 2,
      title: 'Drive 100km',
      description: 'Complete 100km this week',
      progress: 65,
      target: 100,
      reward: 500000000, // 0.5 SOL in lamports
      completed: false,
    },
    {
      id: 3,
      title: '5-Star Rating',
      description: 'Get 5-star rating from passengers',
      progress: 1,
      target: 1,
      reward: 2000000000, // 2 SOL in lamports
      completed: false,
    },
  ]);

  const handleQuestComplete = (id: number) => {
    Alert.alert('Quest Complete', 'Congratulations! You completed a quest!');
    setQuests(quests.map(quest => 
      quest.id === id ? { ...quest, completed: true } : quest
    ));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme === 'light' ? '#f5f5f5' : '#1a1a1a' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme === 'light' ? '#000' : '#fff' }]}>Quests & Goals</Text>
        <Text style={[styles.subtitle, { color: theme === 'light' ? '#666' : '#aaa' }]}>Complete quests to earn rewards</Text>
      </View>
      
      <View style={styles.questsContainer}>
        {quests.map((quest) => (
          <View 
            key={quest.id} 
            style={[styles.questCard, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}
          >
            <View style={styles.questHeader}>
              <Text style={[styles.questTitle, { color: theme === 'light' ? '#000' : '#fff' }]}>
                {quest.title}
              </Text>
              <Text style={[styles.questReward, { color: theme === 'light' ? '#007AFF' : '#4DA6FF' }]}>
                {quest.reward / 1000000000} SOL
              </Text>
            </View>
            
            <Text style={[styles.questDescription, { color: theme === 'light' ? '#666' : '#aaa' }]}>
              {quest.description}
            </Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${(quest.progress / quest.target) * 100}%`,
                      backgroundColor: quest.completed ? '#34C759' : '#007AFF'
                    }
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: theme === 'light' ? '#666' : '#aaa' }]}>
                {quest.progress}/{quest.target}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.completeButton, 
                { 
                  backgroundColor: quest.completed ? '#34C759' : '#007AFF',
                  opacity: quest.completed ? 0.7 : 1
                }
              ]}
              onPress={() => !quest.completed && handleQuestComplete(quest.id)}
              disabled={quest.completed}
            >
              <Text style={styles.completeButtonText}>
                {quest.completed ? 'Completed' : 'Complete Quest'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      
      <View style={[styles.section, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
        <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#000' : '#fff' }]}>Weekly Goals</Text>
        <View style={styles.goalsContainer}>
          <View style={styles.goalItem}>
            <Text style={[styles.goalText, { color: theme === 'light' ? '#000' : '#fff' }]}>50 Trips</Text>
            <Text style={[styles.goalProgress, { color: theme === 'light' ? '#666' : '#aaa' }]}>32/50</Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={[styles.goalText, { color: theme === 'light' ? '#000' : '#fff' }]}>500km</Text>
            <Text style={[styles.goalProgress, { color: theme === 'light' ? '#666' : '#aaa' }]}>280/500</Text>
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
  questsContainer: {
    padding: 20,
  },
  questCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  questReward: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  questDescription: {
    fontSize: 14,
    marginBottom: 15,
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  completeButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
    marginBottom: 10,
  },
  goalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  goalItem: {
    alignItems: 'center',
  },
  goalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalProgress: {
    fontSize: 12,
    marginTop: 5,
  },
});

export default QuestsScreen;