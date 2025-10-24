import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import Ionicons from "react-native-vector-icons/Ionicons";

type Props = {
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  disabled?: boolean;

  /** Visual tweaks */
  width?: number;
  height?: number;
  iconName?: string; // Ionicons name
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;

  /** Shiny text effect toggle (in addition to whole-button sheen) */
  shinyText?: boolean;
  /** Seconds per sweep (for both sheen + text shine) */
  speed?: number;
};

export default function StartTripButtonShiny({
  title = "Start Trip",
  subtitle = "Safe mode • GPS on",
  onPress,
  disabled = false,

  width = 320,
  height = 64,
  iconName = "speedometer-outline",
  style,
  titleStyle,
  subtitleStyle,

  shinyText = true,
  speed = 2.4,
}: Props) {
  // Button sheen (whole-button) animated left→right
  const sweep = useRef(new Animated.Value(-1)).current;
  // Shiny text sweep
  const textSweep = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (disabled) return;

    // button sheen
    const loopSheen = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: speed * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    // text shine
    const loopText = Animated.loop(
      Animated.timing(textSweep, {
        toValue: 1,
        duration: speed * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loopSheen.start();
    shinyText && loopText.start();
    return () => {
      loopSheen.stop();
      loopText.stop();
    };
  }, [disabled, shinyText, speed, sweep, textSweep]);

  // map -1..1 to pixel translation distance
  const travelX = width + 220; // extra overdraw so sheen fully traverses
  const sheenTranslate = sweep.interpolate({
    inputRange: [-1, 1],
    outputRange: [-travelX / 2, travelX / 2],
  });
  const textTranslate = textSweep.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[{ width }, style]}>
      {/* Inner glass panel */}
      <View
        style={[
          styles.inner,
          {
            width,
            height,
            borderRadius: height / 2,
          },
        ]}
      >
        {/* Sheen overlay across entire button */}
        {!disabled && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.sheenWrap,
              { transform: [{ translateX: sheenTranslate }] },
            ]}
          >
            <LinearGradient
              colors={["transparent", "rgba(255,255,255,0.28)", "transparent"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.sheen}
            />
          </Animated.View>
        )}

        <Pressable
          onPress={onPress}
          disabled={disabled}
          android_ripple={{ color: "rgba(255,255,255,0.12)" }}
          style={({ pressed }) => [
            styles.content,
            { height },
            pressed && { transform: [{ translateY: 1 }] },
            disabled && { opacity: 0.65 },
          ]}
        >
          {/* Icon pod */}
          <View style={styles.left}>
            <View style={styles.iconPill}>
               <Ionicons name={iconName as any} size={20} color="#FFFFFF" />
            </View>
          </View>

          {/* Text block (optionally shiny text) */}
          <View style={styles.center}>
            {shinyText ? (
              <MaskedView
                style={{ alignSelf: "stretch" }}
                maskElement={
                  <Text
                    numberOfLines={1}
                    style={[styles.titleBase, titleStyle, { color: "#fff" }]}
                  >
                    {title}
                  </Text>
                }
              >
                {/* base text color under mask (dim grey) */}
                <Text
                  numberOfLines={1}
                  style={[styles.titleBase, titleStyle, { color: "rgba(181,181,181,0.64)" }]}
                >
                  {title}
                </Text>

                {/* moving bright band masked by title */}
                {!disabled && (
                  <Animated.View
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      transform: [{ translateX: textTranslate }],
                    }}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(255,255,255,0)",
                        "rgba(255,255,255,0.85)",
                        "rgba(255,255,255,0)",
                      ]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={{ width: 110, height: "100%" }}
                    />
                  </Animated.View>
                )}
              </MaskedView>
            ) : (
              <Text numberOfLines={1} style={[styles.titleBase, titleStyle]}>
                {title}
              </Text>
            )}

            {!!subtitle && (
              <Text
                numberOfLines={1}
                style={[styles.subtitleBase, subtitleStyle]}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {/* Chevron */}
          <Ionicons
            name="chevron-forward"
            size={18}
            color="#EAF2FF"
            style={{ opacity: 0.9 }}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    backgroundColor: "rgba(30, 144, 255, 0.85)",
    overflow: "hidden",
    borderRadius: 999,
    position: "relative",
  },
  content: {
    paddingHorizontal: 14,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sheenWrap: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: -220,
    right: -220,
  },
  sheen: { flex: 1 },

  left: { width: 56, height: "100%", justifyContent: "center" },
  iconPill: {
    position: "absolute",
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  center: { flex: 1, justifyContent: "center" },
  titleBase: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
    color: "#FFFFFF",
  },
  subtitleBase: {
    marginTop: 2,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(210,225,245,0.75)",
  },
});
