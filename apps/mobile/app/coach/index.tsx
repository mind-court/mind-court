import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { theme, spacing, fontSize, fontWeight, radius, forest, court } from '@mind-court/ui'
import { Screen } from '../../components/Screen'
import { CreateLessonSheet } from '../../components/CreateLessonSheet'
import { useAuth } from '../../lib/auth'
import { useLessons } from '../../lib/useLessons'
import type { Lesson } from '../../types/db'

export default function CoachToday() {
  const { profile } = useAuth()
  const { lessons, loading, createLesson } = useLessons()
  const [showCreate, setShowCreate] = useState(false)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Coach'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const today = new Date()
  const todayLessons = lessons.filter(l => isSameDay(new Date(l.scheduled_at), today))
  const futureLessons = lessons
    .filter(l => {
      const d = new Date(l.scheduled_at)
      return d > today && !isSameDay(d, today)
    })
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  const upcomingLessons = futureLessons.slice(0, 4)

  const hasAnyLessons = todayLessons.length > 0 || upcomingLessons.length > 0

  async function handleSave(input: {
    playerName: string
    date: Date
    court: string
    duration: string
    drills: string
    mentalCue: string
  }) {
    await createLesson({
      playerName: input.playerName,
      scheduledAt: input.date,
      court: input.court,
      durationMinutes: parseInt(input.duration) || null,
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
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Text style={styles.statValueAccent}>{todayLessons.length}</Text>
            <Text style={styles.statLabelAccent}>lessons today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{futureLessons.length}</Text>
            <Text style={styles.statLabel}>upcoming</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.primary} style={styles.loader} />
        ) : !hasAnyLessons ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={40} color={forest[300]} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Your schedule is clear.</Text>
            <Text style={styles.emptySub}>Add your first lesson to get started.</Text>
          </View>
        ) : (
          <>
            {todayLessons.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Today's schedule</Text>
                {todayLessons.map(lesson => (
                  <LessonRow key={lesson.id} lesson={lesson} />
                ))}
              </>
            )}

            {upcomingLessons.length > 0 && (
              <>
                <Text style={todayLessons.length > 0 ? [styles.sectionLabel, styles.sectionLabelSpaced] : styles.sectionLabel}>
                  Upcoming
                </Text>
                {upcomingLessons.map(lesson => (
                  <LessonRow key={lesson.id} lesson={lesson} muted />
                ))}
              </>
            )}
          </>
        )}
      </Screen>

      <CreateLessonSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={handleSave}
      />
    </>
  )
}

function LessonRow({ lesson, muted = false }: { lesson: Lesson; muted?: boolean }) {
  const time = new Date(lesson.scheduled_at).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })
  return (
    <Pressable
      style={({ pressed }) => [styles.lessonRow, pressed && styles.lessonRowPressed]}
      onPress={() => router.push(`/coach/session/${lesson.id}`)}
    >
      <Text style={muted ? [styles.lessonTime, styles.lessonTimeMuted] : styles.lessonTime}>
        {time}
      </Text>
      <View style={styles.lessonInfo}>
        <Text style={styles.lessonPlayer}>{lesson.player_name}</Text>
        {lesson.court ? <Text style={styles.lessonCourt}>{lesson.court}</Text> : null}
        {lesson.mental_cue ? (
          <Text style={styles.lessonCue} numberOfLines={1}>"{lesson.mental_cue}"</Text>
        ) : null}
      </View>
      <View style={styles.lessonRight}>
        {lesson.duration_minutes != null && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationBadgeText}>{lesson.duration_minutes}m</Text>
          </View>
        )}
        <Feather name="chevron-right" size={16} color={theme.fgSubtle} />
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
    flex: 1,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: theme.fg,
    letterSpacing: -0.5,
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
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: theme.fgMuted,
    marginTop: spacing[1],
  },
  statLabelAccent: {
    fontSize: fontSize.xs,
    color: forest[200],
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
  sectionLabelSpaced: {
    marginTop: spacing[6],
  },
  loader: { marginTop: spacing[4] },
  emptyState: {
    marginTop: spacing[16],
    alignItems: 'center',
  },
  emptyIcon: { marginBottom: spacing[4] },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semi,
    color: theme.fg,
    marginBottom: spacing[1],
  },
  emptySub: {
    fontSize: fontSize.base,
    color: theme.fgMuted,
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
  lessonTimeMuted: {
    color: theme.fgFaint,
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
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationBadgeText: {
    fontSize: fontSize.xs,
    color: court[700],
  },
})
