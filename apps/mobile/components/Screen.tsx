import { ScrollView, View, type ViewStyle, type ScrollViewProps } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme, spacing } from '@mind-court/ui'

type Props = ScrollViewProps & {
  children: React.ReactNode
  scroll?: boolean
  style?: ViewStyle
  contentStyle?: ViewStyle
}

export function Screen({ children, scroll = true, style, contentStyle, ...rest }: Props) {
  const insets = useSafeAreaInsets()

  const pad = {
    paddingTop: insets.top + spacing[4],
    paddingBottom: insets.bottom + spacing[6],
    paddingHorizontal: spacing[4],
  }

  if (!scroll) {
    return (
      <View style={[{ flex: 1, backgroundColor: theme.bg, ...pad }, style]}>
        {children}
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={[{ flexGrow: 1, ...pad }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...rest}
    >
      {children}
    </ScrollView>
  )
}
