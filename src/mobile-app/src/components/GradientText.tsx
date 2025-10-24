import React from "react";
import { Text, ViewStyle } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  children: React.ReactNode;
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle;      // wrapper
  textStyle?: any;        // fontSize, weight, etc.
};

export default function GradientText({
  children,
  colors,
  start = { x: 0, y: 0.5 },
  end   = { x: 1, y: 0.5 },
  style,
  textStyle,
}: Props) {
  return (
    <MaskedView
      style={[{ alignSelf: "center", backgroundColor: "transparent" }, style]}
      maskElement={
        <Text
          style={[
            { color: "#000", includeFontPadding: false, textAlign: "center" },
            textStyle,
          ]}
        >
          {children}
        </Text>
      }
    >
      <LinearGradient colors={colors as any} start={start} end={end} style={{ paddingHorizontal: 2 }}>
        <Text
          style={[
            { color: "transparent", includeFontPadding: false, textAlign: "center" },
            textStyle,
          ]}
        >
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}
