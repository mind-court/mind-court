import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { theme, spacing, fontSize, fontWeight, radius } from '@mind-court/ui'
import { CreateLessonSheet, type Lesson } from '../../components/CreateLessonSheet'

export default function CoachToday() {
  const [lessons, setLessons] = useState<Lesson[]>([
    {
      id: '1',
      playerName: 'Ana M.',
      date: (() => { const d = new Date(); d.setHours(9, 0, 0, 0); return d })(),
      court: 'Court 2',
      drills: 'Cross-court forehand consistency',
      mentalCue: 'One ball at a time',
    },
  ])
  const [showCreate, setShowCreate] = useState(false)

  // Build today's lesson list sorted by time
  const today = new Date()
  const todayLessons = lessons
    .filter(l => isSameDay(l.date, today))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  function handleSave(lesson: Lesson) {
    setLessons(prev => [...prev, lesson])
  }

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
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
          <StatCard label="Total players" value={String(new Set(lessons.map(l => l.playerName)).size)} />
        </View>

        <Text style={styles.sectionLabel}>Today's schedule</Text>
        {todayLessons.length === 0 ? (
          <Text style={styles.empty}>No lessons today. Add one to get started.</Text>
        ) : (
          todayLessons.map(lesson => (
            <LessonRow key={lesson.id} lesson={lesson} />
          ))
        )}
      </ScrollView>

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
  const time = lesson.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return (
    <View style={styles.lessonRow}>
      <Text style={styles.lessonTime}>{time}</Text>
      <View style={styles.lessonInfo}>
        <Text style={styles.lessonPlayer}>{lesson.playerName}</Text>
        {lesson.court ? <Text style={styles.lessonCourt}>{lesson.court}</Text> : null}
        {lesson.mentalCue ? (
          <Text style={styles.lessonCue}>"{lesson.mentalCue}"</Text>
        ) : null}
      </View>
    </View>
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
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: spacing[4], paddingTop: spacing[12] },
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
  addBtnPressed: {
    backgroundColor: theme.primaryPress,
  },
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
