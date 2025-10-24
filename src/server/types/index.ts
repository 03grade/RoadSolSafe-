// Type definitions for the backend system

export interface Driver {
  id: string;
  driverId: string;
  publicKey: string;
  totalTrips: number;
  totalEarnings: number;
  totalDistance: number;
  totalScore: number;
  avgRating: number;
  lastTripTime: number;
  isActive: boolean;
  validatorPubkey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trip {
  id: string;
  tripId: string;
  driverId: string;
  passengerId: string;
  startTime: number;
  endTime: number;
  distance: number;
  duration: number;
  fare: number;
  rating: number;
  status: 'pending' | 'completed' | 'verified' | 'rejected';
  score: number;
  tripHash: string;
  verificationStatus: number;
  validatorPubkey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  sessionId: string;
  driverId: string;
  startedAt: number;
  lastActive: number;
  expiresAt: number;
  isActive: boolean;
  telemetryData: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Reward {
  id: string;
  driverId: string;
  poolId: number;
  amount: number;
  tripId: string;
  status: 'pending' | 'claimed' | 'failed';
  txHash: string;
  claimedAt: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Validator {
  id: string;
  validatorId: string;
  publicKey: string;
  privateKey: string;
  isActive: boolean;
  totalValidations: number;
  successRate: number;
  lastValidationTime: number;
  validatorWeight: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionData {
  sessionId: string;
  driverId: string;
  token: string;
  expiresAt: number;
}

export interface TripData {
  tripId: string;
  passengerId: string;
  startTime: number;
  endTime: number;
  distance: number;
  duration: number;
  fare: number;
  rating: number;
}

export interface TelemetryData {
  timestamp: number;
  location: {
    lat: number;
    lng: number;
  };
  speed: number;
  acceleration: number;
  battery: number;
  network: string;
}

export interface RewardClaim {
  claimId: string;
  amount: number;
  txHash: string;
}