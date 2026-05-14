import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { theme, spacing, fontSize, fontWeight } from '@mind-court/ui'

export default function Messages() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Messages</Text>
      <Text style={styles.sub}>No messages yet.</Text>
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
