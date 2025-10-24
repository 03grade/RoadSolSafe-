import { TripEvents } from './DrivingCoach';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export type MockTripData = {
  score: number;
  points: number;
  duration: string; // e.g. "28 min"
  distance: string; // e.g. "12.3 km"
  events: TripEvents;
};

export function generateMockTripData(): MockTripData {
  // Basic trip scale
  const minutes = randInt(8, 46);
  const km = Math.round((Math.random() * 18 + 2) * 10) / 10; // 2.0 - 20.0 km

  // Event distributions (skew to 0-2 but allow up to 4)
  const hardBrake = sampleSkewedInt(0, 4, 0.65);
  const hardAccel = sampleSkewedInt(0, 4, 0.65);
  const harshTurn = sampleSkewedInt(0, 4, 0.7);
  const phoneUse = sampleSkewedInt(0, 4, 0.7);
  const speeding = clamp(sampleSkewedInt(0, 5, 0.6), 0, 5); // treat as severity buckets 0-5

  // Score approximated from events with noise
  let score = 9.5
    - hardBrake * 0.8
    - hardAccel * 0.6
    - harshTurn * 0.5
    - phoneUse * 0.7
    - speeding * 0.9
    + (Math.random() * 0.6 - 0.3);
  score = Math.round(clamp(score, 2.5, 10) * 10) / 10; // one decimal

  // Points roughly proportional to score and distance
  const points = Math.max(0, Math.round(score * (km / 2)));

  const events: TripEvents = { hardBrake, hardAccel, harshTurn, speeding, phoneUse };

  return {
    score,
    points,
    duration: `${minutes} min`,
    distance: `${km} km`,
    events,
  };
}

// Skew sampler: higher bias pushes toward lower values
function sampleSkewedInt(min: number, max: number, biasLow: number): number {
  // biasLow in (0,1): probability mass toward min
  const u = Math.random();
  const skewed = Math.pow(u, biasLow < 0.01 ? 0.01 : biasLow > 3 ? 3 : biasLow);
  const value = min + (max - min) * skewed;
  return Math.round(value);
}

