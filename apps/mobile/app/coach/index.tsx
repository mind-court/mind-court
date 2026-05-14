import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { theme, spacing, fontSize, fontWeight, radius } from '@mind-court/ui'
import { Screen } from '../../components/Screen'
import { CreateLessonSheet } from '../../components/CreateLessonSheet'
import { useLessons } from '../../lib/useLessons'
import type { Lesson } from '../../types/db'

export default function CoachToday() {
  const { lessons, loading, createLesson } = useLessons()
  const [showCreate, setShowCreate] = useState(false)

  const today = new Date()
  const todayLessons = lessons
    .filter(l => isSameDay(new Date(l.scheduled_at), today))

  async function handleSave(input: {
    playerName: string
    date: Date
    court: string
    drills: string
    mentalCue: string
  }) {
    await createLesson({
      playerName: input.playerName,
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
          <Text style={styles.heading}>Good morning</Text>
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
            onPress={() => setShowCreate(true)}
          >
            <Text style={styles.addBtnText}>+ Add lesson</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Lessons today" value={String(todayLessons.length)} />
          <StatCard label="Total players" value={String(new Set(lessons.map(l => l.player_name)).size)} />
        </View>

        <Text style={styles.sectionLabel}>Today's schedule</Text>

        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: spacing[4] }} />
        ) : todayLessons.length === 0 ? (
          <Text style={styles.empty}>No lessons today. Add one to get started.</Text>
        ) : (
          todayLessons.map(lesson => <LessonRow key={lesson.id} lesson={lesson} />)
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
          <Text style={styles.lessonCue}>"{lesson.mental_cue}"</Text>
        ) : null}
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
  empty: {
    fontSize: fontSize.base,
    color: theme.fgMuted,
    marginTop: spacing[2],
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
    color: theme.accent,
    marginTop: spacing[2],
    fontStyle: 'italic',
  },
})
