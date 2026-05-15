import { View, Text, type ViewStyle } from 'react-native'
import { forest, court, sand, fontWeight } from './tokens'

type LogoMarkProps = {
  size?: number
  variant?: 'dark' | 'light' | 'flat'
  style?: ViewStyle
}

export function LogoMark({ size = 40, variant = 'dark', style }: LogoMarkProps) {
  const isLight = variant === 'light'
  const isFlat = variant === 'flat'

  const bgColor = isLight ? sand[50] : isFlat ? 'transparent' : forest[700]
  const lineColor = isLight ? forest[700] : isFlat ? forest[700] : court[500]
  const ballColor = court[500]

  const cornerRadius = size * 0.22
  const insetPct = 0.1875 // 12/64
  const inset = size * insetPct
  const innerSize = size - inset * 2
  const lineThickness = Math.max(1, Math.round(size * 0.03125))
  const ballSize = Math.max(2, Math.round(size * 0.11))

  // Position the net line horizontally across the middle, and service "T" vertically below.
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: cornerRadius,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        isFlat && {
          borderWidth: lineThickness,
          borderColor: lineColor,
        },
        style,
      ]}
    >
      {/* Court rectangle */}
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderWidth: lineThickness,
          borderColor: lineColor,
        }}
      >
        {/* Net line (horizontal across center) */}
        <View
          style={{
            position: 'absolute',
            top: innerSize / 2 - lineThickness / 2,
            left: -lineThickness,
            right: -lineThickness,
            height: lineThickness,
            backgroundColor: lineColor,
          }}
        />
        {/* Service "T" — vertical line below net */}
        <View
          style={{
            position: 'absolute',
            left: innerSize / 2 - lineThickness / 2,
            top: innerSize / 2,
            bottom: -lineThickness,
            width: lineThickness,
            backgroundColor: lineColor,
          }}
        />
      </View>

      {/* Tennis ball — center at y = 22/64 of canvas */}
      <View
        style={{
          position: 'absolute',
          top: size * 0.34375 - ballSize / 2,
          left: size / 2 - ballSize / 2,
          width: ballSize,
          height: ballSize,
          borderRadius: ballSize / 2,
          backgroundColor: ballColor,
        }}
      />
    </View>
  )
}

type LogoProps = {
  height?: number
  variant?: 'dark' | 'light'
  style?: ViewStyle
}

/** Full lockup: mark + "Mind Court" wordmark. */
export function Logo({ height = 40, variant = 'dark', style }: LogoProps) {
  const isLight = variant === 'light'
  const textColor = isLight ? sand[50] : forest[900]
  const fontSize = Math.round(height * 0.6)

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: height * 0.3 }, style]}>
      <LogoMark size={height} variant={variant} />
      <Text
        style={{
          fontSize,
          fontWeight: fontWeight.bold,
          letterSpacing: -0.5,
          color: textColor,
          // Optical alignment with the mark
          marginTop: -height * 0.02,
        }}
      >
        Mind Court
      </Text>
    </View>
  )
}
