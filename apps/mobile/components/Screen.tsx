import { ScrollView, View, StyleSheet, type ViewStyle, type ScrollViewProps } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme, spacing } from '@mind-court/ui'

type Props = ScrollViewProps & {
  children: React.ReactNode
  scroll?: boolean
  style?: ViewStyle
  noPadding?: boolean
}

export function Screen({ children, scroll = true, style, noPadding, ...rest }: Props) {
  const insets = useSafeAreaInsets()
  const paddingTop = insets.top + spacing[4]

  if (!scroll) {
    return (
      <View style={[styles.base, { paddingTop: noPadding ? insets.top : paddingTop }, style]}>
        {children}
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.base}
      contentContainerStyle={[
        styles.content,
        { paddingTop: noPadding ? insets.top : paddingTop },
        style,
      ]}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {children}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  base: { flex: 1, backgroundColor: theme.bg },
  content: { padding: spacing[4], flexGrow: 1 },
})
