import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { theme, spacing, fontSize, fontWeight, radius } from '@mind-court/ui'

export default function Players() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Players</Text>
      <Text style={styles.sub}>Add your first player to get started.</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: spacing[4], paddingTop: spacing[12] },
  heading: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: theme.fg,
    marginBottom: spacing[2],
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: fontSize.base,
    color: theme.fgMuted,
  },
})
