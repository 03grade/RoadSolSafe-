import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import CircleGauge, { GaugeZone } from "./CircleGauge";

/** Color thresholds for 0..10 safety score */
const zoneBands: GaugeZone[] = [
  { from: 0,   to: 3.5, color: "#FF4D4F", opacity: 0.35 }, // red
  { from: 3.5, to: 6.0, color: "#FFA940", opacity: 0.30 }, // orange
  { from: 6.0, to: 8.0, color: "#FFD45E", opacity: 0.28 }, // yellow
  { from: 8.0, to: 10,  color: "#52C41A", opacity: 0.28 }, // green
];

const colorByScore = (s: number) =>
  s < 3.5 ? "#FF4D4F" : s < 6.0 ? "#FFA940" : s < 8.0 ? "#FFD45E" : "#52C41A";

type Props = {
  safetyScore?: number;   // 0..10
  totalTripKm?: number;
  dayStreak?: number;
  weeklyTripGoal?: number; // denominator for left gauge
  streakGoal?: number;     // denominator for right gauge
};

export default function SafetyCluster({
  safetyScore = 6.1,
  totalTripKm = 124.7,
  dayStreak = 12,
  weeklyTripGoal = 300,
  streakGoal = 20,
}: Props) {
  const { width: W } = useWindowDimensions();

  // Compact sizes that match your base card, with side dials slightly lowered
  const midSize  = Math.min(140, Math.max(120, W * 0.32));
  const sideSize = Math.min(100, Math.max(85,  W * 0.22));
  const sideOffset = Math.max(8, Math.round((midSize - sideSize) * 0.45));

  const tripClamped   = Math.min(totalTripKm, weeklyTripGoal);
  const streakClamped = Math.min(dayStreak,    streakGoal);

  return (
    <View style={styles.row}>
      <CircleGauge
        size={sideSize}
        value={tripClamped}
        min={0}
        max={weeklyTripGoal}
        label="Total Trip"
        centerText={tripClamped.toFixed(1)}
        unit="km"
        color="#5CD3FF"
        trackColor="#223047"
        containerStyle={{ marginTop: sideOffset }}
      />

      <CircleGauge
        size={midSize}
        value={safetyScore}
        min={0}
        max={10}
        label="Safety Score"
        centerText={safetyScore.toFixed(1)}
        unit="/10"
        zones={zoneBands}
        color={colorByScore(safetyScore)}   // overlay matches current zone
        trackColor="#223047"
        showNeedle
      />

      <CircleGauge
        size={sideSize}
        value={streakClamped}
        min={0}
        max={streakGoal}
        label="Day Streak"
        centerText={`${streakClamped}`}
        unit="days"
        color="#FFCE56"
        trackColor="#223047"
        containerStyle={{ marginTop: sideOffset }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 16,
    gap: 12,
  },
});
