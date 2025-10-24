import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IridescentBackgroundNative } from '../components/IridescentBackgroundNative';

interface DrivingGoal {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const drivingGoals: DrivingGoal[] = [
  { id: 'safe', label: 'Safe', icon: 'shield-checkmark' },
  { id: 'speed-control', label: 'Speed Control', icon: 'speedometer' },
  { id: 'fuel', label: 'Fuel', icon: 'car' },
  { id: 'eco-friendly', label: 'Eco-friendly', icon: 'leaf' },
  { id: 'awareness', label: 'Awareness', icon: 'eye' },
  { id: 'rewards', label: 'Rewards', icon: 'diamond' },
  { id: 'achievement', label: 'Achievement', icon: 'trophy' },
  { id: 'traffic', label: 'Traffic', icon: 'trail-sign' },
  { id: 'skill', label: 'Skill', icon: 'star' },
  { id: 'insights', label: 'Insights', icon: 'bulb' },
];

interface DrivingGoalsScreenProps {
  onNext: (selectedGoals: string[]) => void;
  onSkip: () => void;
}

export const DrivingGoalsScreen: React.FC<DrivingGoalsScreenProps> = ({ onNext, onSkip }) => {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleNext = () => {
    onNext(selectedGoals);
  };

  return (
    <IridescentBackgroundNative 
      color={[0.04, 0.14, 0.2]} 
      speed={0.8} 
      amplitude={0.1} 
      mouseReact={false}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Choose your driving goals:</Text>
        </View>

        {/* Goals Grid */}
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.goalsGrid}>
            {drivingGoals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalButton,
                  selectedGoals.includes(goal.id) && styles.goalButtonSelected
                ]}
                onPress={() => toggleGoal(goal.id)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={goal.icon} 
                  size={20} 
                  color={selectedGoals.includes(goal.id) ? '#FFFFFF' : '#B0B3B8'} 
                />
                <Text style={[
                  styles.goalText,
                  selectedGoals.includes(goal.id) && styles.goalTextSelected
                ]}>
                  {goal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Instruction */}
          <Text style={styles.instruction}>*select one or more</Text>
        </ScrollView>

        {/* Next Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              selectedGoals.length === 0 && styles.nextButtonDisabled
            ]}
            onPress={handleNext}
            disabled={selectedGoals.length === 0}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </IridescentBackgroundNative>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 40,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'Trebuchet MS',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    fontFamily: 'Trebuchet MS Bold',
  },
  scrollContainer: {
    flex: 1,
    marginBottom: 20,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  goalButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 12,
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 60,
  },
  goalButtonSelected: {
    backgroundColor: '#1E90FF',
    borderColor: '#1E90FF',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  goalText: {
    fontSize: 14,
    color: '#B0B3B8',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Trebuchet MS',
  },
  goalTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  instruction: {
    fontSize: 12,
    color: '#B0B3B8',
    textAlign: 'left',
    marginTop: 10,
    fontFamily: 'Trebuchet MS',
  },
  footer: {
    paddingTop: 20,
  },
  nextButton: {
    backgroundColor: '#1E90FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(30, 144, 255, 0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Trebuchet MS Bold',
  },
});
