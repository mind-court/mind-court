import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { theme, spacing, fontSize, fontWeight, radius } from '@mind-court/ui'

export default function CoachToday() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Thursday, 15 May</Text>
      <Text style={styles.heading}>Good morning</Text>

      <View style={styles.statsRow}>
        <StatCard label="Lessons today" value="3" />
        <StatCard label="Players" value="8" />
        <StatCard label="Hours" value="4.5" />
      </View>

      <Text style={styles.sectionLabel}>Schedule</Text>
      <LessonRow time="9:00 AM" player="Ana M." court="Court 2" />
      <LessonRow time="11:00 AM" player="Jake T." court="Court 1" />
      <LessonRow time="2:00 PM" player="Sara & Liam" court="Court 3" />
    </ScrollView>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function LessonRow({ time, player, court }: { time: string; player: string; court: string }) {
  return (
    <View style={styles.lessonRow}>
      <Text style={styles.lessonTime}>{time}</Text>
      <View style={styles.lessonInfo}>
        <Text style={styles.lessonPlayer}>{player}</Text>
        <Text style={styles.lessonCourt}>{court}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: spacing[4],
    paddingTop: spacing[12],
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: theme.fgSubtle,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: spacing[1],
  },
  heading: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: theme.fg,
    marginBottom: spacing[6],
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[8],
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.bgElevated,
    borderRadius: radius.md,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: theme.border,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: theme.fg,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: theme.fgMuted,
    marginTop: spacing[1],
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
    color: theme.fgSubtle,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: spacing[3],
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgElevated,
    borderRadius: radius.md,
    padding: spacing[4],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: theme.border,
    gap: spacing[4],
  },
  lessonTime: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: theme.fgMuted,
    width: 64,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonPlayer: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
    color: theme.fg,
  },
  lessonCourt: {
    fontSize: fontSize.sm,
    color: theme.fgMuted,
    marginTop: 2,
  },
})
