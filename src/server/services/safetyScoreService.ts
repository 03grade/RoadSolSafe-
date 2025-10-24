// Safety Score Calculation Service (v1)
// Implements the complete safety scoring algorithm from your spec

import { logger } from '../utils/logger.js';

// Telemetry data types
interface GPSPoint {
  lat: number;
  lng: number;
  speed: number; // m/s
  heading: number;
  accuracy: number;
  timestamp: number;
}

interface IMUSample {
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
  timestamp: number;
}

interface TelemetryChunk {
  sessionId: string;
  chunkIndex: number;
  startTime: number;
  endTime: number;
  gpsData: GPSPoint[];
  imuData: IMUSample[];
  phoneInteractionDetected: boolean;
  deviceFlags: {
    isScreenOn: boolean;
    batteryLevel: number;
    networkType: string;
  };
}

export interface SafetyScoreResult {
  totalScore: number; // 0-10
  scoreBreakdown: {
    hardBrakes: number;
    hardAccelerations: number;
    harshCorners: number;
    speedingTime: number;
    phoneInteraction: number;
  };
  events: {
    hardBrakeCount: number;
    hardAccelCount: number;
    harshCornerCount: number;
    speedingPercentage: number;
    phoneUseMinutes: number;
  };
  tripMetrics: {
    distanceKm: number;
    durationMinutes: number;
    avgSpeedKmh: number;
    maxSpeedKmh: number;
    movingTimeMinutes: number;
  };
  isValid: boolean;
  validationErrors: string[];
}

export class SafetyScoreService {
  // Safety score thresholds (from your spec)
  private readonly HARD_BRAKE_THRESHOLD = 3.5; // m/s²
  private readonly HARD_BRAKE_DURATION_MS = 300;
  private readonly HARD_ACCEL_THRESHOLD = 3.0; // m/s²
  private readonly HARSH_CORNER_THRESHOLD = 25; // degrees/second
  private readonly SPEEDING_BUFFER_KMH = 5; // Speed limit buffer

  // Trip validity thresholds (from your spec)
  private readonly MIN_DISTANCE_KM = 2;
  private readonly MIN_DURATION_MINUTES = 8;
  private readonly MIN_AVG_SPEED_KMH = 12;
  private readonly MAX_IDLE_PERCENTAGE = 0.3; // 30%
  private readonly MIN_SPEED_MOVING_KMH = 5;

  // Score penalties per 10km (from your spec)
  private readonly PENALTY_HARD_BRAKE = 1.5;
  private readonly PENALTY_HARD_ACCEL = 1.0;
  private readonly PENALTY_HARSH_CORNER = 1.0;
  private readonly PENALTY_SPEEDING_MULTIPLIER = 6.0;
  private readonly PENALTY_PHONE_PER_MINUTE = 0.5;

  /**
   * Calculate complete safety score from telemetry chunks
   */
  async calculateSafetyScore(chunks: TelemetryChunk[]): Promise<SafetyScoreResult> {
    try {
      logger.info(`Calculating safety score from ${chunks.length} chunks`);

      // Combine all GPS and IMU data
      const allGPSData = chunks.flatMap((c) => c.gpsData);
      const allIMUData = chunks.flatMap((c) => c.imuData);

      // Calculate trip metrics
      const tripMetrics = this.calculateTripMetrics(allGPSData);

      // Validate trip
      const validation = this.validateTrip(tripMetrics, allGPSData, allIMUData);
      if (!validation.isValid) {
        return {
          totalScore: 0,
          scoreBreakdown: {
            hardBrakes: 0,
            hardAccelerations: 0,
            harshCorners: 0,
            speedingTime: 0,
            phoneInteraction: 0,
          },
          events: {
            hardBrakeCount: 0,
            hardAccelCount: 0,
            harshCornerCount: 0,
            speedingPercentage: 0,
            phoneUseMinutes: 0,
          },
          tripMetrics,
          isValid: false,
          validationErrors: validation.errors,
        };
      }

      // Detect safety events
      const hardBrakes = this.detectHardBraking(allIMUData);
      const hardAccels = this.detectHardAcceleration(allIMUData);
      const harshCorners = this.detectHarshCornering(allIMUData);
      const speedingTime = this.detectSpeeding(allGPSData);
      const phoneUseMinutes = this.calculatePhoneInteraction(chunks);

      // Calculate penalties (normalized to per 10km)
      const distanceNormalized = tripMetrics.distanceKm / 10;

      let totalPenalty = 0;
      totalPenalty += (hardBrakes.length / distanceNormalized) * this.PENALTY_HARD_BRAKE;
      totalPenalty += (hardAccels.length / distanceNormalized) * this.PENALTY_HARD_ACCEL;
      totalPenalty += (harshCorners.length / distanceNormalized) * this.PENALTY_HARSH_CORNER;
      totalPenalty += speedingTime.percentage * this.PENALTY_SPEEDING_MULTIPLIER;
      totalPenalty += phoneUseMinutes * this.PENALTY_PHONE_PER_MINUTE;

      // Calculate final score (start at 10, subtract penalties)
      const totalScore = Math.max(0, Math.min(10, 10 - totalPenalty));

      const result: SafetyScoreResult = {
        totalScore: Math.round(totalScore * 10) / 10, // Round to 1 decimal
        scoreBreakdown: {
          hardBrakes: (hardBrakes.length / distanceNormalized) * this.PENALTY_HARD_BRAKE,
          hardAccelerations: (hardAccels.length / distanceNormalized) * this.PENALTY_HARD_ACCEL,
          harshCorners: (harshCorners.length / distanceNormalized) * this.PENALTY_HARSH_CORNER,
          speedingTime: speedingTime.percentage * this.PENALTY_SPEEDING_MULTIPLIER,
          phoneInteraction: phoneUseMinutes * this.PENALTY_PHONE_PER_MINUTE,
        },
        events: {
          hardBrakeCount: hardBrakes.length,
          hardAccelCount: hardAccels.length,
          harshCornerCount: harshCorners.length,
          speedingPercentage: Math.round(speedingTime.percentage * 100),
          phoneUseMinutes,
        },
        tripMetrics,
        isValid: true,
        validationErrors: [],
      };

      logger.info(`Safety score calculated: ${result.totalScore}/10`);
      return result;
    } catch (error) {
      logger.error('Safety score calculation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate trip metrics from GPS data
   */
  private calculateTripMetrics(gpsData: GPSPoint[]): SafetyScoreResult['tripMetrics'] {
    if (gpsData.length === 0) {
      return {
        distanceKm: 0,
        durationMinutes: 0,
        avgSpeedKmh: 0,
        maxSpeedKmh: 0,
        movingTimeMinutes: 0,
      };
    }

    // Calculate distance using Haversine formula
    let totalDistanceMeters = 0;
    for (let i = 1; i < gpsData.length; i++) {
      const dist = this.haversineDistance(
        gpsData[i - 1].lat,
        gpsData[i - 1].lng,
        gpsData[i].lat,
        gpsData[i].lng
      );
      totalDistanceMeters += dist;
    }

    const distanceKm = totalDistanceMeters / 1000;

    // Calculate duration
    const startTime = gpsData[0].timestamp;
    const endTime = gpsData[gpsData.length - 1].timestamp;
    const durationMinutes = (endTime - startTime) / 1000 / 60;

    // Calculate moving time (speed > MIN_SPEED_MOVING_KMH)
    let movingTimeSeconds = 0;
    for (let i = 1; i < gpsData.length; i++) {
      const speedKmh = gpsData[i].speed * 3.6; // m/s to km/h
      if (speedKmh >= this.MIN_SPEED_MOVING_KMH) {
        const timeDiff = (gpsData[i].timestamp - gpsData[i - 1].timestamp) / 1000;
        movingTimeSeconds += timeDiff;
      }
    }
    const movingTimeMinutes = movingTimeSeconds / 60;

    // Calculate average and max speed
    const speeds = gpsData.map((p) => p.speed * 3.6); // Convert to km/h
    const avgSpeedKmh = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const maxSpeedKmh = Math.max(...speeds);

    return {
      distanceKm,
      durationMinutes,
      avgSpeedKmh,
      maxSpeedKmh,
      movingTimeMinutes,
    };
  }

  /**
   * Validate trip against minimum requirements
   */
  private validateTrip(
    metrics: SafetyScoreResult['tripMetrics'],
    gpsData: GPSPoint[],
    imuData: IMUSample[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check minimum distance
    if (metrics.distanceKm < this.MIN_DISTANCE_KM) {
      errors.push(`too_short_distance — Drive at least ${this.MIN_DISTANCE_KM} km.`);
    }

    // Check minimum duration
    if (metrics.durationMinutes < this.MIN_DURATION_MINUTES) {
      errors.push(`too_short_time — Drive at least ${this.MIN_DURATION_MINUTES} minutes.`);
    }

    // Check average speed
    if (metrics.avgSpeedKmh < this.MIN_AVG_SPEED_KMH) {
      errors.push(`low_avg_speed — Average speed must be at least ${this.MIN_AVG_SPEED_KMH} km/h.`);
    }

    // Check excessive idle time
    const idlePercentage = 1 - metrics.movingTimeMinutes / metrics.durationMinutes;
    if (idlePercentage > this.MAX_IDLE_PERCENTAGE) {
      errors.push('excessive_idle — Trip mostly stationary; try a normal moving trip.');
    }

    // Check GPS continuity (detect teleports)
    for (let i = 1; i < gpsData.length; i++) {
      const dist = this.haversineDistance(
        gpsData[i - 1].lat,
        gpsData[i - 1].lng,
        gpsData[i].lat,
        gpsData[i].lng
      );
      const timeDiff = (gpsData[i].timestamp - gpsData[i - 1].timestamp) / 1000; // seconds
      const speed = dist / timeDiff; // m/s

      // If speed > 100 m/s (360 km/h), likely a teleport
      if (speed > 100) {
        errors.push('gps_teleport — GPS jumped; wait for stable signal before starting.');
        break;
      }
    }

    // Check sensor quality
    if (imuData.length < 10) {
      errors.push('low_sensor_quality — Enable Location + Motion; keep phone stable.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Detect hard braking events
   */
  private detectHardBraking(imuData: IMUSample[]): IMUSample[] {
    const hardBrakes: IMUSample[] = [];

    for (let i = 1; i < imuData.length; i++) {
      const accel = imuData[i].accelerometer;
      const magnitude = Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2);

      // Hard brake: deceleration > HARD_BRAKE_THRESHOLD
      if (magnitude > this.HARD_BRAKE_THRESHOLD) {
        // Check if sustained for HARD_BRAKE_DURATION_MS
        let sustainedCount = 0;
        for (let j = i; j < Math.min(i + 15, imuData.length); j++) {
          // ~300ms at 50Hz
          const accelJ = imuData[j].accelerometer;
          const magJ = Math.sqrt(accelJ.x ** 2 + accelJ.y ** 2 + accelJ.z ** 2);
          if (magJ > this.HARD_BRAKE_THRESHOLD) {
            sustainedCount++;
          }
        }

        if (sustainedCount >= 15) {
          // 300ms sustained
          hardBrakes.push(imuData[i]);
          i += 15; // Skip ahead to avoid duplicate detection
        }
      }
    }

    return hardBrakes;
  }

  /**
   * Detect hard acceleration events
   */
  private detectHardAcceleration(imuData: IMUSample[]): IMUSample[] {
    const hardAccels: IMUSample[] = [];

    for (let i = 1; i < imuData.length; i++) {
      const accel = imuData[i].accelerometer;
      const magnitude = Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2);

      if (magnitude > this.HARD_ACCEL_THRESHOLD) {
        hardAccels.push(imuData[i]);
        i += 10; // Skip ahead to avoid duplicates
      }
    }

    return hardAccels;
  }

  /**
   * Detect harsh cornering events
   */
  private detectHarshCornering(imuData: IMUSample[]): IMUSample[] {
    const harshCorners: IMUSample[] = [];

    for (let i = 0; i < imuData.length; i++) {
      const gyro = imuData[i].gyroscope;
      // Yaw rate is typically the Z-axis
      const yawRateDegPerSec = Math.abs(gyro.z) * (180 / Math.PI); // Convert rad/s to deg/s

      if (yawRateDegPerSec > this.HARSH_CORNER_THRESHOLD) {
        harshCorners.push(imuData[i]);
        i += 10; // Skip ahead
      }
    }

    return harshCorners;
  }

  /**
   * Detect speeding violations
   */
  private detectSpeeding(gpsData: GPSPoint[]): { percentage: number; totalSeconds: number } {
    // For MVP, use a simple fallback rule:
    // Urban: 50 km/h, Highway: 100 km/h
    // We'll assume urban for simplicity
    const FALLBACK_SPEED_LIMIT_KMH = 50;

    let speedingTimeSeconds = 0;
    let totalTimeSeconds = 0;

    for (let i = 1; i < gpsData.length; i++) {
      const speedKmh = gpsData[i].speed * 3.6; // m/s to km/h
      const timeDiff = (gpsData[i].timestamp - gpsData[i - 1].timestamp) / 1000;

      totalTimeSeconds += timeDiff;

      // Check if speeding (with buffer)
      if (speedKmh > FALLBACK_SPEED_LIMIT_KMH + this.SPEEDING_BUFFER_KMH) {
        speedingTimeSeconds += timeDiff;
      }
    }

    const percentage = totalTimeSeconds > 0 ? speedingTimeSeconds / totalTimeSeconds : 0;

    return {
      percentage,
      totalSeconds: speedingTimeSeconds,
    };
  }

  /**
   * Calculate phone interaction time
   */
  private calculatePhoneInteraction(chunks: TelemetryChunk[]): number {
    let interactionMinutes = 0;

    for (const chunk of chunks) {
      if (chunk.phoneInteractionDetected) {
        const chunkDurationMinutes = (chunk.endTime - chunk.startTime) / 1000 / 60;
        interactionMinutes += chunkDurationMinutes;
      }
    }

    return Math.round(interactionMinutes * 10) / 10; // Round to 1 decimal
  }

  /**
   * Haversine distance formula (in meters)
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Generate trip summary and recommendations (from your spec)
   */
  generateTripSummary(scoreResult: SafetyScoreResult): {
    summary: string;
    recommendation: string;
  } {
    const { totalScore, events, tripMetrics } = scoreResult;

    // Summary
    const summary = `Trip summary: Score ${totalScore}/10 • Distance ${tripMetrics.distanceKm.toFixed(1)} km • Duration ${Math.round(tripMetrics.durationMinutes)} min • Events HB ${events.hardBrakeCount}, HA ${events.hardAccelCount}, HC ${events.harshCornerCount} • Speeding ${events.speedingPercentage}% • Phone use ${events.phoneUseMinutes} min.`;

    // Recommendation (pick primary tip based on largest deduction)
    const breakdown = scoreResult.scoreBreakdown;
    const maxPenalty = Math.max(
      breakdown.hardBrakes,
      breakdown.hardAccelerations,
      breakdown.harshCorners,
      breakdown.speedingTime,
      breakdown.phoneInteraction
    );

    let primaryTip = '';
    if (maxPenalty === breakdown.hardBrakes) {
      primaryTip = 'Reduce hard braking by maintaining a safe following distance and anticipating stops.';
    } else if (maxPenalty === breakdown.hardAccelerations) {
      primaryTip = 'Apply throttle gently and accelerate smoothly for better safety scores.';
    } else if (maxPenalty === breakdown.harshCorners) {
      primaryTip = 'Slow down before turns and navigate corners smoothly.';
    } else if (maxPenalty === breakdown.speedingTime) {
      primaryTip = 'Respect speed limits with a small buffer for better scores.';
    } else if (maxPenalty === breakdown.phoneInteraction) {
      primaryTip = 'Keep your phone in Do Not Disturb mode while driving.';
    }

    const recommendation = `Recommendation: ${primaryTip}`;

    return { summary, recommendation };
  }
}

// Export singleton instance
export const safetyScoreService = new SafetyScoreService();
export default safetyScoreService;

