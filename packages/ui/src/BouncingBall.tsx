import { useEffect, useRef } from 'react'
import { Animated, Easing, View, type ViewStyle } from 'react-native'
import { court, sand } from './tokens'

type Props = {
  /** Diameter of the ball in px. The full component takes `size * 2.4` height. */
  size?: number
  /** Show the baseline (court line) under the ball. */
  baseline?: boolean
  style?: ViewStyle
}

/**
 * Mind Court signature loader — a chartreuse tennis ball bouncing on a court
 * baseline. Use anywhere we'd otherwise reach for ActivityIndicator.
 */
export function BouncingBall({ size = 14, baseline = true, style }: Props) {
  const t = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.quad),  // fall-fast on the way down
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: 480,
          easing: Easing.in(Easing.quad),   // ease on the way up
          useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [t])

  const apex = -size * 1.1
  const translateY = t.interpolate({
    inputRange: [0, 1],
    outputRange: [apex, 0],
  })
  // Squash slightly at impact (1 = on the ground)
  const scaleY = t.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1, 1, 0.82],
  })
  const scaleX = t.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1, 1, 1.12],
  })
  // Soft shadow opacity grows on landing
  const shadowOpacity = t.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.45],
  })

  const trackHeight = size * 2.4
  const baselineWidth = size * 2.2

  return (
    <View
      style={[
        {
          height: trackHeight,
          width: baselineWidth,
          alignItems: 'center',
          justifyContent: 'flex-end',
        },
        style,
      ]}
    >
      {/* Shadow */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: baseline ? 2 : 0,
          width: size * 0.85,
          height: size * 0.2,
          borderRadius: size,
          backgroundColor: '#000',
          opacity: shadowOpacity,
        }}
      />

      {/* Ball */}
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: court[500],
          marginBottom: baseline ? size * 0.25 : 0,
          transform: [
            { translateY },
            { scaleX },
            { scaleY },
          ],
        }}
      />

      {/* Baseline (court line) */}
      {baseline ? (
        <View
          style={{
            width: baselineWidth,
            height: 1.5,
            backgroundColor: sand[400],
            opacity: 0.6,
          }}
        />
      ) : null}
    </View>
  )
}
