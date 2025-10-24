// Point Reward Service for DePIN Project
// Handles point calculation and weekly SOL airdrop distribution

interface TripPoints {
  tripId: string;
  safetyScore: number;
  distance: number;
  duration: number;
  basePoints: number;
  questBonus: number;
  challengeBonus: number;
  totalPoints: number;
  timestamp: number;
}

interface WeeklyTotal {
  epochId: string;
  totalPoints: number;
  totalDistance: number;
  totalTrips: number;
  averageScore: number;
  claimableSOL: number;
}

interface QuestProgress {
  questId: string;
  questName: string;
  current: number;
  target: number;
  completed: boolean;
  pointsAwarded: number;
}

class PointRewardService {
  private readonly POINTS_CONFIG = {
    BASE_MULTIPLIER: 1.0,
    QUEST_BONUS: 10,
    CHALLENGE_BONUS: 50,
    WEEKLY_CAP: 300,
    SOL_PER_POINT: 0.001, // 1 SOL = 1000 points
  };

  private tripPoints: TripPoints[] = [];
  private questProgress: QuestProgress[] = [];
  private weeklyTotal: WeeklyTotal | null = null;

  async addTripPoints(
    tripId: string,
    safetyScore: number,
    distance: number,
    duration: number
  ): Promise<number> {
    try {
      console.log(`💰 Calculating points for trip ${tripId}`);
      
      // Calculate base points: [score] × ([km_driven] / 10)
      const basePoints = Math.round(safetyScore * (distance / 10));
      
      // Apply weekly cap (base points only, quest/challenge points don't count)
      const cappedBasePoints = Math.min(basePoints, this.POINTS_CONFIG.WEEKLY_CAP);
      
      // Check quest completions
      const questBonus = await this.checkQuestCompletions(tripId, safetyScore, distance, duration);
      
      // Check challenge completions
      const challengeBonus = await this.checkChallengeCompletions(tripId, safetyScore, distance, duration);
      
      const totalPoints = cappedBasePoints + questBonus + challengeBonus;
      
      const tripPoints: TripPoints = {
        tripId,
        safetyScore,
        distance,
        duration,
        basePoints: cappedBasePoints,
        questBonus,
        challengeBonus,
        totalPoints,
        timestamp: Date.now(),
      };
      
      this.tripPoints.push(tripPoints);
      
      // Update weekly total
      await this.updateWeeklyTotal();
      
      console.log(`✅ Points calculated: ${totalPoints} (Base: ${cappedBasePoints}, Quest: ${questBonus}, Challenge: ${challengeBonus})`);
      
      return totalPoints;
    } catch (error) {
      console.error('❌ Error calculating trip points:', error);
      return 0;
    }
  }

  async getWeeklyTotal(): Promise<WeeklyTotal | null> {
    try {
      if (!this.weeklyTotal) {
        await this.updateWeeklyTotal();
      }
      return this.weeklyTotal;
    } catch (error) {
      console.error('❌ Error getting weekly total:', error);
      return null;
    }
  }

  async getQuestProgress(): Promise<QuestProgress[]> {
    return [...this.questProgress];
  }

  async claimWeeklyAirdrop(): Promise<{ success: boolean; amount: number; txHash?: string }> {
    try {
      if (!this.weeklyTotal) {
        throw new Error('No weekly total available');
      }
      
      if (this.weeklyTotal.totalPoints === 0) {
        throw new Error('No points to claim');
      }
      
      console.log(`🎁 Claiming weekly airdrop: ${this.weeklyTotal.claimableSOL} SOL`);
      
      // In real implementation: build and send Solana transaction
      const claimResult = await this.buildClaimTransaction();
      
      if (claimResult.success) {
        console.log(`✅ Weekly airdrop claimed: ${claimResult.amount} SOL`);
        
        // Reset weekly total after successful claim
        this.weeklyTotal = null;
        this.tripPoints = [];
        this.questProgress = [];
      }
      
      return claimResult;
    } catch (error) {
      console.error('❌ Error claiming weekly airdrop:', error);
      return { success: false, amount: 0 };
    }
  }

  private async checkQuestCompletions(
    tripId: string,
    safetyScore: number,
    distance: number,
    duration: number
  ): Promise<number> {
    let totalBonus = 0;
    
    // Daily Quest 1: Smooth Operator - complete 2 trips with safety score ≥ 8.0
    const smoothOperatorQuest = this.questProgress.find(q => q.questId === 'smooth_operator');
    if (safetyScore >= 8.0) {
      if (smoothOperatorQuest) {
        smoothOperatorQuest.current++;
        if (smoothOperatorQuest.current >= 2 && !smoothOperatorQuest.completed) {
          smoothOperatorQuest.completed = true;
          smoothOperatorQuest.pointsAwarded = this.POINTS_CONFIG.QUEST_BONUS;
          totalBonus += this.POINTS_CONFIG.QUEST_BONUS;
          console.log('🎯 Smooth Operator quest completed!');
        }
      } else {
        this.questProgress.push({
          questId: 'smooth_operator',
          questName: 'Smooth Operator',
          current: 1,
          target: 2,
          completed: false,
          pointsAwarded: 0,
        });
      }
    }
    
    // Daily Quest 2: Route Explorer - 1 trip with ≥ 20% distance on new tiles
    const routeExplorerQuest = this.questProgress.find(q => q.questId === 'route_explorer');
    if (this.isNewRoute(distance)) {
      if (routeExplorerQuest) {
        routeExplorerQuest.current++;
        if (routeExplorerQuest.current >= 1 && !routeExplorerQuest.completed) {
          routeExplorerQuest.completed = true;
          routeExplorerQuest.pointsAwarded = this.POINTS_CONFIG.QUEST_BONUS;
          totalBonus += this.POINTS_CONFIG.QUEST_BONUS;
          console.log('🎯 Route Explorer quest completed!');
        }
      } else {
        this.questProgress.push({
          questId: 'route_explorer',
          questName: 'Route Explorer',
          current: 1,
          target: 1,
          completed: false,
          pointsAwarded: 0,
        });
      }
    }
    
    // Daily Quest 3: Pace Yourself - maintain speed within ±5 km/h band for ≥ 8 minutes
    const paceYourselfQuest = this.questProgress.find(q => q.questId === 'pace_yourself');
    if (this.isConsistentSpeed(duration)) {
      if (paceYourselfQuest) {
        paceYourselfQuest.current++;
        if (paceYourselfQuest.current >= 1 && !paceYourselfQuest.completed) {
          paceYourselfQuest.completed = true;
          paceYourselfQuest.pointsAwarded = this.POINTS_CONFIG.QUEST_BONUS;
          totalBonus += this.POINTS_CONFIG.QUEST_BONUS;
          console.log('🎯 Pace Yourself quest completed!');
        }
      } else {
        this.questProgress.push({
          questId: 'pace_yourself',
          questName: 'Pace Yourself',
          current: 1,
          target: 1,
          completed: false,
          pointsAwarded: 0,
        });
      }
    }
    
    return totalBonus;
  }

  private async checkChallengeCompletions(
    tripId: string,
    safetyScore: number,
    distance: number,
    duration: number
  ): Promise<number> {
    let totalBonus = 0;
    
    // Weekly Challenge 1: Flow State - 10 trips with safety score ≥ 8.0
    const flowStateChallenge = this.questProgress.find(q => q.questId === 'flow_state');
    if (safetyScore >= 8.0) {
      if (flowStateChallenge) {
        flowStateChallenge.current++;
        if (flowStateChallenge.current >= 10 && !flowStateChallenge.completed) {
          flowStateChallenge.completed = true;
          flowStateChallenge.pointsAwarded = this.POINTS_CONFIG.CHALLENGE_BONUS;
          totalBonus += this.POINTS_CONFIG.CHALLENGE_BONUS;
          console.log('🏆 Flow State challenge completed!');
        }
      } else {
        this.questProgress.push({
          questId: 'flow_state',
          questName: 'Flow State',
          current: 1,
          target: 10,
          completed: false,
          pointsAwarded: 0,
        });
      }
    }
    
    // Weekly Challenge 2: City Explorer - visit 5 tiles not driven in past 14 days
    const cityExplorerChallenge = this.questProgress.find(q => q.questId === 'city_explorer');
    if (this.isNewTile(distance)) {
      if (cityExplorerChallenge) {
        cityExplorerChallenge.current++;
        if (cityExplorerChallenge.current >= 5 && !cityExplorerChallenge.completed) {
          cityExplorerChallenge.completed = true;
          cityExplorerChallenge.pointsAwarded = this.POINTS_CONFIG.CHALLENGE_BONUS;
          totalBonus += this.POINTS_CONFIG.CHALLENGE_BONUS;
          console.log('🏆 City Explorer challenge completed!');
        }
      } else {
        this.questProgress.push({
          questId: 'city_explorer',
          questName: 'City Explorer',
          current: 1,
          target: 5,
          completed: false,
          pointsAwarded: 0,
        });
      }
    }
    
    return totalBonus;
  }

  private async updateWeeklyTotal(): Promise<void> {
    try {
      const totalPoints = this.tripPoints.reduce((sum, trip) => sum + trip.totalPoints, 0);
      const totalDistance = this.tripPoints.reduce((sum, trip) => sum + trip.distance, 0);
      const totalTrips = this.tripPoints.length;
      const averageScore = totalTrips > 0 
        ? this.tripPoints.reduce((sum, trip) => sum + trip.safetyScore, 0) / totalTrips 
        : 0;
      
      const claimableSOL = totalPoints * this.POINTS_CONFIG.SOL_PER_POINT;
      
      this.weeklyTotal = {
        epochId: this.getCurrentEpochId(),
        totalPoints,
        totalDistance,
        totalTrips,
        averageScore,
        claimableSOL,
      };
      
      console.log(`📊 Weekly total updated: ${totalPoints} points, ${claimableSOL} SOL`);
    } catch (error) {
      console.error('❌ Error updating weekly total:', error);
    }
  }

  private async buildClaimTransaction(): Promise<{ success: boolean; amount: number; txHash?: string }> {
    try {
      if (!this.weeklyTotal) {
        throw new Error('No weekly total available');
      }
      
      console.log('🔗 Building claim transaction...');
      
      // In real implementation: build Solana transaction
      // 1. Get weekly epoch data
      // 2. Build Merkle proof
      // 3. Create claim instruction
      // 4. Send transaction
      
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const txHash = `claim_${this.weeklyTotal.epochId}_${Date.now()}`;
      
      return {
        success: true,
        amount: this.weeklyTotal.claimableSOL,
        txHash,
      };
    } catch (error) {
      console.error('❌ Error building claim transaction:', error);
      return { success: false, amount: 0 };
    }
  }

  private getCurrentEpochId(): string {
    // Weekly epochs starting from project launch
    const projectStart = new Date('2024-01-01').getTime();
    const now = Date.now();
    const weekNumber = Math.floor((now - projectStart) / (7 * 24 * 60 * 60 * 1000));
    return `epoch_${weekNumber}`;
  }

  private isNewRoute(distance: number): boolean {
    // Simplified: assume 20% of routes are "new"
    return Math.random() < 0.2;
  }

  private isConsistentSpeed(duration: number): boolean {
    // Simplified: assume 30% of trips have consistent speed
    return Math.random() < 0.3;
  }

  private isNewTile(distance: number): boolean {
    // Simplified: assume 15% of trips visit "new tiles"
    return Math.random() < 0.15;
  }
}

export default new PointRewardService();
