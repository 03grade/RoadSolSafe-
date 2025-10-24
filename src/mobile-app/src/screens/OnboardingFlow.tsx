import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IridescentBackgroundNative } from '../components/IridescentBackgroundNative';
import RoadSolSafeLogo from '../components/RoadSolSafeLogo';
import { DrivingGoalsScreen } from './DrivingGoalsScreen';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'goals'>('welcome');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [logoAnim] = useState(new Animated.Value(0));
  const [appNameAnim] = useState(new Animated.Value(0));
  const [subtitleAnim] = useState(new Animated.Value(0));
  const [feature1Anim] = useState(new Animated.Value(0));
  const [feature2Anim] = useState(new Animated.Value(0));
  const [feature3Anim] = useState(new Animated.Value(0));
  const [buttonAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Staggered animations for all elements
    const animations = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(appNameAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 800,
        delay: 600,
        useNativeDriver: true,
      }),
      Animated.timing(feature1Anim, {
        toValue: 1,
        duration: 1000,
        delay: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(feature2Anim, {
        toValue: 1,
        duration: 1000,
        delay: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(feature3Anim, {
        toValue: 1,
        duration: 1000,
        delay: 1400,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 1000,
        delay: 1600,
        useNativeDriver: true,
      }),
    ];

    Animated.stagger(100, animations).start();
  }, [currentStep]);

  const handleGetStarted = () => {
    setCurrentStep('goals');
  };

  const handleGoalsComplete = (selectedGoals: string[]) => {
    // Store selected goals (you can use AsyncStorage here)
    console.log('Selected goals:', selectedGoals);
    onComplete();
  };

  const handleSkipGoals = () => {
    onComplete();
  };

  if (currentStep === 'goals') {
    return (
      <DrivingGoalsScreen 
        onNext={handleGoalsComplete}
        onSkip={handleSkipGoals}
      />
    );
  }

  return (
    <IridescentBackgroundNative 
      color={[0.04, 0.14, 0.2]} 
      speed={0.6} 
      amplitude={0.08} 
      mouseReact={false}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <Animated.View style={[
            styles.header,
            {
              opacity: logoAnim,
              transform: [
                {
                  translateY: logoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
                {
                  scale: logoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            },
          ]}>
            <RoadSolSafeLogo size={150} />
          </Animated.View>

          {/* Main Content */}
          <View style={styles.content}>
            <Animated.Text style={[
              styles.appName,
              {
                opacity: appNameAnim,
                transform: [
                  {
                    translateY: appNameAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [15, 0],
                    }),
                  },
                  {
                    scale: appNameAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.98, 1],
                    }),
                  },
                ],
              },
            ]}>
              RoadSolSafe
            </Animated.Text>
            
            <Animated.Text style={[
              styles.subtitle,
              {
                opacity: subtitleAnim,
                transform: [
                {
                  translateY: subtitleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
                ],
              },
            ]}>
              Drive Safer Earn Smarter
            </Animated.Text>
            
            <View style={styles.featuresContainer}>
              <Animated.View style={[
                styles.featureItem,
                {
                  opacity: feature1Anim,
                  transform: [
                    {
                      translateX: feature1Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-100, 0],
                      }),
                    },
                    {
                      scale: feature1Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}>
                <Ionicons name="diamond" size={24} color="#EBCB6C" />
                <Text style={[styles.featureText, styles.centeredText]}>Earn USDT Rewards</Text>
              </Animated.View>
              
              <Animated.View style={[
                styles.featureItem,
                {
                  opacity: feature2Anim,
                  transform: [
                    {
                      translateX: feature2Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [100, 0],
                      }),
                    },
                    {
                      scale: feature2Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}>
                <Ionicons name="trophy" size={24} color="#32CD32" />
                <Text style={styles.featureText}>Complete Daily Quests</Text>
              </Animated.View>
              
              <Animated.View style={[
                styles.featureItem,
                {
                  opacity: feature3Anim,
                  transform: [
                    {
                      translateX: feature3Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-100, 0],
                      }),
                    },
                    {
                      scale: feature3Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}>
                <Ionicons name="people" size={24} color="#1E90FF" />
                <Text style={styles.featureText}>Compete with Friends</Text>
              </Animated.View>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Footer */}
        <View style={styles.footer}>
          <Animated.View style={[
            styles.getStartedButton,
            {
              opacity: buttonAnim,
              transform: [
                {
                  translateY: buttonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
                {
                  scale: buttonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}>
            <TouchableOpacity
              style={styles.getStartedButtonInner}
              onPress={handleGetStarted}
              activeOpacity={0.8}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </IridescentBackgroundNative>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: -10,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Trebuchet MS Bold',
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Trebuchet MS Bold',
  },
  subtitle: {
    fontSize: 15,
    color: '#B0B3B8',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 50,
    paddingHorizontal: 10,
    fontFamily: 'Trebuchet MS',
  },
  featuresContainer: {
    width: '100%',
    alignItems: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    width: '90%',
    minHeight: 60,
    justifyContent: 'flex-start',
  },
  featureText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 16,
    fontWeight: '500',
    fontFamily: 'Trebuchet MS',
    flex: 1,
    textAlign: 'left',
  },
  centeredText: {
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  getStartedButton: {
    // Container for animation
  },
  getStartedButtonInner: {
    backgroundColor: '#1E90FF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  getStartedText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
    fontFamily: 'Trebuchet MS Bold',
  },
});
