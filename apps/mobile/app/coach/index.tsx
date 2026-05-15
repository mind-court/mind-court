import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { theme, spacing, fontSize, fontWeight, radius, forest, court } from '@mind-court/ui'
import { Screen } from '../../components/Screen'
import { CreateLessonSheet } from '../../components/CreateLessonSheet'
import { useLessons } from '../../lib/useLessons'
import { usePlayers } from '../../lib/usePlayers'
import { useAuth } from '../../lib/auth'
import type { Lesson } from '../../types/db'

export default function CoachToday() {
  const { lessons, loading, createLesson } = useLessons()
  const { players } = usePlayers()
  const { profile } = useAuth()
  const [showCreate, setShowCreate] = useState(false)

  const today = new Date()
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Coach'

  const todayLessons = lessons.filter(l => isSameDay(new Date(l.scheduled_at), today))

  const upcomingLessons = lessons
    .filter(l => {
      const d = new Date(l.scheduled_at)
      return d > today && !isSameDay(d, today)
    })
    .slice(0, 4)

  const upcomingCount = lessons.filter(l => {
    const d = new Date(l.scheduled_at)
    return d > today && !isSameDay(d, today)
  }).length

  async function handleSave(input: {
    playerName: string
    playerId?: string
    date: Date
    court: string
    drills: string
    mentalCue: string
  }) {
    await createLesson({
      playerName: input.playerName,
      playerId: input.playerId,
      scheduledAt: input.date,
      court: input.court,
      drills: input.drills,
      mentalCue: input.mentalCue,
    })
  }

  return (
    <>
      <Screen>
        <Text style={styles.eyebrow}>
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <View style={styles.headingRow}>
          <Text style={styles.heading}>{greeting}, {firstName}</Text>
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
            onPress={() => setShowCreate(true)}
          >
            <Text style={styles.addBtnText}>+ Add lesson</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Today" value={String(todayLessons.length)} hint="on court today" accent />
          <StatCard label="Upcoming" value={String(upcomingCount)} />
        </View>

        <Text style={styles.sectionLabel}>Today's schedule</Text>

        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: spacing[4] }} />
        ) : lessons.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={40} color={forest[300]} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Your schedule is clear.</Text>
            <Text style={styles.emptySub}>Add your first lesson to get started.</Text>
          </View>
        ) : todayLessons.length === 0 ? (
          <Text style={styles.empty}>No lessons today.</Text>
        ) : (
          todayLessons.map(lesson => <LessonRow key={lesson.id} lesson={lesson} />)
        )}

        {upcomingLessons.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, styles.upcomingLabel]}>Upcoming</Text>
            {upcomingLessons.map(lesson => <LessonRow key={lesson.id} lesson={lesson} />)}
          </>
        )}
      </Screen>

      <CreateLessonSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={handleSave}
        players={players}
      />
    </>
  )
}

function StatCard({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <View style={[styles.statCard, accent && styles.statCardAccent]}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      <Text style={[styles.statLabel, accent && styles.statLabelAccent]}>{label}</Text>
      {hint ? <Text style={[styles.statHint, accent && styles.statHintAccent]}>{hint}</Text> : null}
    </View>
  )
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  const time = new Date(lesson.scheduled_at).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })
  return (
    <Pressable
      style={({ pressed }) => [styles.lessonRow, pressed && styles.lessonRowPressed]}
      onPress={() => router.push(`/coach/session/${lesson.id}`)}
    >
      <Text style={styles.lessonTime}>{time}</Text>
      <View style={styles.lessonInfo}>
        <Text style={styles.lessonPlayer}>{lesson.player_name}</Text>
        {lesson.court ? <Text style={styles.lessonCourt}>{lesson.court}</Text> : null}
        {lesson.mental_cue ? (
          <Text style={styles.lessonCue} numberOfLines={1}>"{lesson.mental_cue}"</Text>
        ) : null}
      </View>
      <View style={styles.lessonRight}>
        {lesson.duration_minutes != null ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationBadgeText}>{lesson.duration_minutes}m</Text>
          </View>
        ) : null}
        <Feather name="chevron-right" size={16} color={theme.fgFaint} />
      </View>
    </Pressable>
  )
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: theme.fgSubtle,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: spacing[1],
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[6],
  },
  heading: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: theme.fg,
    letterSpacing: -0.5,
    flex: 1,
    marginRight: spacing[3],
  },
  addBtn: {
    backgroundColor: theme.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  addBtnPressed: { backgroundColor: theme.primaryPress },
  addBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
    color: '#fff',
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
  statCardAccent: {
    backgroundColor: forest[700],
    borderColor: forest[700],
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: theme.fg,
  },
  statValueAccent: {
    color: '#fff',
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: theme.fgMuted,
    marginTop: spacing[1],
  },
  statLabelAccent: {
    color: forest[200],
  },
  statHint: {
    fontSize: fontSize.xs,
    color: theme.fgFaint,
    marginTop: 2,
  },
  statHintAccent: {
    color: forest[300],
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: theme.fgSubtle,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: spacing[3],
  },
  upcomingLabel: {
    marginTop: spacing[8],
  },
  empty: {
    fontSize: fontSize.base,
    color: theme.fgMuted,
    marginTop: spacing[2],
  },
  emptyState: {
    alignItems: 'center',
    marginTop: spacing[10],
    paddingHorizontal: spacing[4],
  },
  emptyIcon: {
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semi,
    color: theme.fg,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: fontSize.sm,
    color: theme.fgMuted,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.bgElevated,
    borderRadius: radius.md,
    padding: spacing[4],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: theme.border,
    gap: spacing[4],
  },
  lessonRowPressed: { backgroundColor: theme.bgSunken },
  lessonTime: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: theme.fgMuted,
    width: 70,
    paddingTop: 2,
    fontVariant: ['tabular-nums'],
  },
  lessonInfo: { flex: 1 },
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
  lessonCue: {
    fontSize: fontSize.sm,
    color: court[700],
    marginTop: spacing[1],
    fontStyle: 'italic',
  },
  lessonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingTop: 2,
  },
  durationBadge: {
    backgroundColor: court[100],
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.semi,
    color: court[700],
  },
})
