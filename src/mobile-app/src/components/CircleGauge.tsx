import React, { memo, useMemo } from "react";
import { View, Text, ViewStyle } from "react-native";
import Svg, { Circle, Line, G, Defs, LinearGradient, Stop } from "react-native-svg";

export type GaugeZone = { from: number; to: number; color: string; opacity?: number };

type Props = {
  size: number;
  value: number;
  min?: number;
  max?: number;

  label: string;
  centerText: string;
  unit?: string;

  /** Visuals */
  trackColor?: string;           // ring background
  color?: string;                // progress color (mono)
  zones?: GaugeZone[];           // colored bands under progress
  showNeedle?: boolean;          // classic speedo needle

  /** Ticks */
  majorTickEvery?: number;       // degrees (default 50)
  minorTickEvery?: number;       // degrees (default 10)

  /** Layout scales */
  fontScale?: number;
  strokeScale?: number;
  containerStyle?: ViewStyle;
};

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

const CircleGauge: React.FC<Props> = ({
  size,
  value,
  min = 0,
  max = 1,
  label,
  centerText,
  unit,
  trackColor = "#243248",
  color = "#5CD3FF",
  zones,
  showNeedle = false,
  majorTickEvery = 50,
  minorTickEvery = 10,
  fontScale = 0.85,
  strokeScale = 0.9,
  containerStyle,
}) => {
  const strokeBase = Math.max(8, Math.round(size * 0.085));
  const stroke = Math.max(6, Math.round(strokeBase * strokeScale));
  const r = size / 2 - stroke / 2;
  const cx = size / 2;
  const cy = size / 2;

  const startDeg = -210;
  const sweepDeg = 300;

  const C = 2 * Math.PI * r;
  const sweepPx = C * (sweepDeg / 360);
  const frac = clamp((value - min) / (max - min), 0, 1);
  const valuePx = sweepPx * frac;

  const numFont = Math.max(16, Math.round(size * 0.2 * fontScale));
  const unitFont = Math.max(10, Math.round(size * 0.06 * fontScale));
  const labelFont = Math.max(10, Math.round(size * 0.07 * fontScale));
  const centerTop = size * 0.36;

  const ids = useMemo(
    () => ({ grad: `g_${Math.random().toString(36).slice(2)}` }),
    []
  );

  const degToXY = (deg: number, radius: number) => {
    const a = (Math.PI / 180) * deg;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  };

  return (
    <View style={[{ width: size, alignItems: "center" }, containerStyle]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={ids.grad} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={color} />
            <Stop offset="100%" stopColor={color} />
          </LinearGradient>
        </Defs>

        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={trackColor}
          strokeOpacity={0.95}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={[sweepPx, C]}
          transform={`rotate(${startDeg} ${cx} ${cy})`}
        />

        {/* Zones under progress */}
        {zones?.map((z, i) => {
          const z0 = clamp((z.from - min) / (max - min), 0, 1);
          const z1 = clamp((z.to - min) / (max - min), 0, 1);
          if (z1 <= z0) return null;
          const dash = (z1 - z0) * sweepPx;
          const gap = C - dash;
          return (
            <Circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              stroke={z.color}
              strokeOpacity={z.opacity ?? 0.3}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={[dash, gap]}
              transform={`rotate(${startDeg + z0 * sweepDeg} ${cx} ${cy})`}
            />
          );
        })}

        {/* Progress */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={`url(#${ids.grad})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={[valuePx, C]}
          transform={`rotate(${startDeg} ${cx} ${cy})`}
        />

        {/* Ticks */}
        <G>
          {Array.from({ length: Math.floor(sweepDeg / minorTickEvery) + 1 }).map((_, i) => {
            const d = startDeg + i * minorTickEvery;
            const major = Math.round((d - startDeg) % majorTickEvery) === 0;
            const rOuter = r - stroke / 2 + 2;
            const rInner = rOuter - (major ? 16 : 10);
            const p1 = degToXY(d, rOuter);
            const p2 = degToXY(d, rInner);
            return (
              <Line
                key={i}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={major ? "rgba(225,235,255,0.95)" : "rgba(130,150,175,0.9)"}
                strokeWidth={major ? 3 : 2}
              />
            );
          })}
        </G>

        {/* Needle (optional) */}
        {showNeedle && (() => {
          const d = startDeg + frac * sweepDeg;
          const tip = degToXY(d, r - stroke / 2 - 18);
          const tail = degToXY(d + 180, 14);
          return (
            <Line
              x1={tail.x}
              y1={tail.y}
              x2={tip.x}
              y2={tip.y}
              stroke="#FF3B4E"
              strokeWidth={4}
            />
          );
        })()}
      </Svg>

      {/* Center readout */}
      <View style={{ position: "absolute", top: centerTop, width: "100%", alignItems: "center" }}>
        <Text style={{ color: "#F0F6FF", fontSize: numFont, fontWeight: "800" }}>
          {centerText}
        </Text>
        {!!unit && (
          <Text style={{ color: "rgba(200,220,240,0.9)", fontSize: unitFont, fontWeight: "700" }}>
            {unit}
          </Text>
        )}
      </View>

      <Text style={{ marginTop: 6, color: "rgba(185,205,230,0.95)", fontSize: labelFont, fontWeight: "700" }}>
        {label}
      </Text>
    </View>
  );
};

export default memo(CircleGauge);
