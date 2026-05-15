import { useState, useMemo } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { theme, spacing, fontSize, fontWeight, radius, forest, court, sand, sage } from '@mind-court/ui'
import { Screen } from '../../components/Screen'
import { CreateLessonSheet } from '../../components/CreateLessonSheet'
import { useAuth } from '../../lib/auth'
import { useLessons } from '../../lib/useLessons'
import { usePlayers } from '../../lib/usePlayers'
import { isSameDay } from '../../lib/dateUtils'
import type { Lesson } from '../../types/db'

type Filter = 'all' | 'today'

export default function CoachSchedule() {
  const { profile } = useAuth()
  const { lessons, loading, createLesson } = useLessons()
  const { players } = usePlayers()
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [weekOffset, setWeekOffset] = useState(0)

  const now = new Date()
  const today = startOfDay(now)
  const weekStart = useMemo(() => addDays(startOfWeek(today), weekOffset * 7), [today, weekOffset])
  const weekEnd = addDays(weekStart, 6)

  const weekDays = useMemo(() => buildWeek(weekStart, today, lessons), [weekStart, today, lessons])
  const groups = useMemo(() => groupLessonsByDay(lessons, weekStart, today), [lessons, weekStart, today])

  const visibleGroups = filter === 'today'
    ? groups.filter(g => g.isToday)
    : groups

  // Summary line numbers (always for "today", regardless of filter / week offset)
  const todayLessons = lessons.filter(l => isSameDay(new Date(l.scheduled_at), today))
  const nextToday = todayLessons.find(l => new Date(l.scheduled_at) > now)
  const futureCount = lessons.filter(l => new Date(l.scheduled_at) > now).length

  const monthLabel = formatMonthRange(weekStart, weekEnd).toUpperCase()

  async function handleSave(input: {
    playerName: string
    playerId?: string
    date: Date
    court: string
    duration: string
    drills: string
    mentalCue: string
  }) {
    return createLesson({
      playerName: input.playerName,
      playerId: input.playerId,
      scheduledAt: input.date,
      court: input.court,
      durationMinutes: input.duration ? parseInt(input.duration, 10) : null,
      drills: input.drills,
      mentalCue: input.mentalCue,
    })
  }

  return (
    <>
      <Screen>
        {/* Top bar: month + nav + add */}
        <View style={styles.topBar}>
          <Text style={styles.monthEyebrow}>{monthLabel}</Text>
          <View style={styles.topBarActions}>
            <Pressable
              accessibilityLabel="Previous week"
              onPress={() => setWeekOffset(o => o - 1)}
              hitSlop={10}
              style={({ pressed }) => [styles.navBtn, pressed && styles.btnPressed]}
            >
              <Feather name="chevron-left" size={16} color={theme.fg} />
            </Pressable>
            <Pressable
              accessibilityLabel="Next week"
              onPress={() => setWeekOffset(o => o + 1)}
              hitSlop={10}
              style={({ pressed }) => [styles.navBtn, pressed && styles.btnPressed]}
            >
              <Feather name="chevron-right" size={16} color={theme.fg} />
            </Pressable>
            <Pressable
              accessibilityLabel="Add lesson"
              onPress={() => setShowCreate(true)}
              hitSlop={12}
              style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
            >
              <Feather name="plus" size={18} color="#fff" />
              <Text style={styles.addBtnLabel}>Add</Text>
            </Pressable>
          </View>
        </View>

        {/* Title + summary */}
        <Text style={styles.title}>Schedule</Text>
        <Text style={styles.summary}>
          <Text style={styles.summaryStrong}>{todayLessons.length} today</Text>
          {nextToday ? <Text> · next {formatTime(new Date(nextToday.scheduled_at))}</Text> : null}
          {futureCount > 0 && (
            <Text style={{ color: theme.fgSubtle }}>
              {' '}· {futureCount} upcoming
            </Text>
          )}
        </Text>

        {/* Week strip */}
        <View style={styles.weekStrip}>
          {weekDays.map((d, i) => (
            <Pressable
              key={i}
              accessibilityLabel={`${d.label} ${d.dateNum}`}
              style={[styles.dayPill, d.isActive && styles.dayPillActive]}
              onPress={() => {/* select day — future */}}
            >
              <Text style={[
                styles.dayLabel,
                d.isActive && styles.dayLabelActive,
                d.count === 0 && !d.isActive && styles.dayLabelEmpty,
              ]}>{d.label}</Text>
              <Text style={[
                styles.dayDate,
                d.isActive && styles.dayDateActive,
                d.count === 0 && !d.isActive && styles.dayDateEmpty,
              ]}>{d.dateNum}</Text>
              <View style={[
                styles.dayDot,
                d.count > 0 && (d.isActive ? styles.dayDotActive : styles.dayDotFilled),
              ]}/>
            </Pressable>
          ))}
        </View>

        {/* Filter chips */}
        <View style={styles.chipRow}>
          {([
            { id: 'all',   label: 'All week' },
            { id: 'today', label: 'Today' },
          ] as { id: Filter; label: string }[]).map(c => (
            <Pressable
              key={c.id}
              onPress={() => setFilter(c.id)}
              style={[styles.chip, filter === c.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, filter === c.id && styles.chipTextActive]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Body */}
        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: spacing[4] }} />
        ) : lessons.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={36} color={forest[300]} style={{ marginBottom: spacing[3] }} />
            <Text style={styles.emptyTitle}>Your schedule is clear.</Text>
            <Text style={styles.emptySub}>Tap + to put your first lesson on the books.</Text>
          </View>
        ) : visibleGroups.length === 0 ? (
          <Text style={styles.emptyRow}>No lessons today.</Text>
        ) : (
          visibleGroups.map((g, gi) => (
            <DayGroup key={gi} group={g} first={gi === 0} />
          ))
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

// ─── DayGroup ────────────────────────────────────────────────────────────────

type Group = {
  date: Date
  label: string     // "Today" or "Mon"
  sublabel: string  // "Sat · Mar 14" or "Mar 16"
  isToday: boolean
  isEmpty: boolean
  count: number     // lessons in this day
  lessons: Lesson[]
}

function DayGroup({ group, first }: { group: Group; first: boolean }) {
  return (
    <View style={[styles.group, !first && styles.groupSpaced]}>
      <View style={styles.groupHead}>
        <View style={styles.groupHeadLeft}>
          <Text style={[styles.groupLabel, group.isToday && styles.groupLabelToday]}>
            {group.label.toUpperCase()}
          </Text>
          <Text style={styles.groupSub}>{group.sublabel}</Text>
          {group.isToday && !group.isEmpty && (
            <View style={styles.nowPill}>
              <Text style={styles.nowPillText}>NOW</Text>
            </View>
          )}
        </View>
        <Text style={[styles.groupCount, group.isEmpty && styles.groupCountEmpty]}>
          {group.isEmpty ? 'Off day' : `${group.count} ${group.count === 1 ? 'lesson' : 'lessons'}`}
        </Text>
      </View>
      {group.isEmpty ? (
        <View style={styles.offDayCard}>
          <Text style={styles.offDayText}>No lessons</Text>
        </View>
      ) : (
        group.lessons.map((lesson, li) => (
          <CompactLessonRow key={lesson.id} lesson={lesson} isFirst={group.isToday && li === 0} />
        ))
      )}
    </View>
  )
}

// ─── CompactLessonRow ────────────────────────────────────────────────────────
// Tighter than the legacy LessonRow — used on the Schedule page.

function CompactLessonRow({ lesson, isFirst }: { lesson: Lesson; isFirst?: boolean }) {
  const time = formatTime(new Date(lesson.scheduled_at))
  return (
    <Pressable
      onPress={() => router.push(`/coach/session/${lesson.id}`)}
      style={({ pressed }) => [
        styles.lessonRow,
        isFirst && styles.lessonRowFirst,
        pressed && (isFirst ? styles.lessonRowFirstPressed : styles.lessonRowPressed),
      ]}
    >
      <View style={styles.lessonTimeCol}>
        <Text style={[styles.lessonTime, isFirst && styles.lessonTimeFirst]}>{time}</Text>
        {lesson.court ? (
          <Text style={[styles.lessonCourt, isFirst && styles.lessonCourtFirst]}>
            {lesson.court}
          </Text>
        ) : null}
      </View>
      <View style={styles.lessonInfo}>
        <Text style={[styles.lessonName, isFirst && styles.lessonNameFirst]}>
          {lesson.player_name}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.lessonFocus, isFirst && styles.lessonFocusFirst]}
        >
          {[lesson.drills, lesson.duration_minutes ? `${lesson.duration_minutes} min` : null]
            .filter(Boolean)
            .join(' · ') || 'No drills set'}
        </Text>
      </View>
      {lesson.mental_cue && !isFirst ? (
        <Feather name="message-square" size={12} color={sage[500]} style={{ marginTop: 4 }} />
      ) : null}
    </Pressable>
  )
}

// ─── Date helpers ────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d)
  const dow = x.getDay() // 0=Sun..6=Sat
  const diff = dow === 0 ? -6 : 1 - dow
  x.setDate(x.getDate() + diff)
  return x
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function buildWeek(weekStart: Date, today: Date, lessons: Lesson[]) {
  const SINGLE = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    const count = lessons.filter(l => isSameDay(new Date(l.scheduled_at), date)).length
    return {
      label: SINGLE[i],
      dateNum: date.getDate(),
      isActive: isSameDay(date, today),
      count,
    }
  })
}

function groupLessonsByDay(lessons: Lesson[], weekStart: Date, today: Date): Group[] {
  const groups: Group[] = []
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i)
    const dayLessons = lessons
      .filter(l => isSameDay(new Date(l.scheduled_at), date))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    const isToday = isSameDay(date, today)
    // Always show today; show other days only if they have lessons
    if (!isToday && dayLessons.length === 0) continue
    groups.push({
      date,
      label: isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
      sublabel: date.toLocaleDateString('en-US', {
        weekday: isToday ? 'short' : undefined,
        month: 'short',
        day: 'numeric',
      }),
      isToday,
      isEmpty: dayLessons.length === 0,
      count: dayLessons.length,
      lessons: dayLessons,
    })
  }
  // Surface today first regardless of week order (it usually is, but be safe)
  groups.sort((a, b) => {
    if (a.isToday) return -1
    if (b.isToday) return 1
    return a.date.getTime() - b.date.getTime()
  })
  return groups
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatMonthRange(start: Date, end: Date): string {
  const yearStart = start.getFullYear()
  const yearEnd = end.getFullYear()
  const monthStart = start.toLocaleDateString('en-US', { month: 'short' })
  const monthEnd = end.toLocaleDateString('en-US', { month: 'short' })
  if (yearStart !== yearEnd) {
    return `${monthStart} ${yearStart} – ${monthEnd} ${yearEnd}`
  }
  if (monthStart !== monthEnd) {
    return `${monthStart} – ${monthEnd} ${yearStart}`
  }
  return `${monthStart} ${yearStart}`
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  monthEyebrow: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: theme.fgSubtle,
    letterSpacing: 1.4,
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 4,
  },
  navBtn: {
    width: 32, height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    paddingHorizontal: 10,
    gap: 4,
    borderRadius: 8,
    backgroundColor: theme.primary,
  },
  addBtnLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: fontWeight.semi,
  },
  addBtnPressed: { backgroundColor: theme.primaryPress },
  btnPressed: { backgroundColor: theme.bgSunken },

  title: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
    color: theme.fg,
    letterSpacing: -0.5,
    lineHeight: 24,
    marginTop: 2,
  },
  summary: {
    fontSize: 12,
    color: theme.fgSubtle,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 10,
  },
  summaryStrong: {
    color: theme.primary,
    fontWeight: fontWeight.semi,
  },

  weekStrip: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 6,
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 10,
  },
  dayPillActive: {
    backgroundColor: theme.primary,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: fontWeight.semi,
    color: theme.fg,
    opacity: 0.55,
    letterSpacing: 0.4,
  },
  dayLabelActive: {
    color: '#fff',
    opacity: 0.7,
  },
  dayLabelEmpty: {
    color: theme.fgFaint,
  },
  dayDate: {
    fontSize: 14,
    fontWeight: fontWeight.bold,
    color: theme.fg,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
    lineHeight: 16,
  },
  dayDateActive: {
    color: '#fff',
  },
  dayDateEmpty: {
    color: theme.fgFaint,
  },
  dayDot: {
    width: 3, height: 3,
    borderRadius: 999,
    marginTop: 3,
    backgroundColor: 'transparent',
  },
  dayDotFilled: {
    backgroundColor: forest[500],
  },
  dayDotActive: {
    backgroundColor: court[400],
  },

  chipRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 4,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: fontWeight.semi,
    color: theme.fgMuted,
  },
  chipTextActive: {
    color: '#fff',
  },

  group: {},
  groupSpaced: {
    marginTop: 14,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 6,
    gap: spacing[2],
  },
  groupHeadLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexShrink: 1,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: theme.fgSubtle,
    letterSpacing: 1.1,
  },
  groupLabelToday: {
    color: theme.primary,
  },
  groupSub: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: theme.fgFaint,
  },
  nowPill: {
    backgroundColor: theme.accent,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  nowPillText: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    color: forest[900],
    letterSpacing: 0.6,
  },
  groupCount: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: theme.fgSubtle,
  },
  groupCountEmpty: {
    color: theme.fgFaint,
    fontStyle: 'italic',
  },

  offDayCard: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  offDayText: {
    fontSize: 12,
    color: theme.fgFaint,
  },

  lessonRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    marginBottom: 6,
  },
  lessonRowFirst: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  lessonRowPressed: {
    backgroundColor: theme.bgSunken,
  },
  lessonRowFirstPressed: {
    backgroundColor: theme.primaryPress,
  },
  lessonTimeCol: {
    minWidth: 44,
  },
  lessonTime: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: theme.fg,
    fontVariant: ['tabular-nums'],
    lineHeight: 15,
  },
  lessonTimeFirst: {
    color: '#fff',
  },
  lessonCourt: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
    color: theme.fgFaint,
    marginTop: 2,
  },
  lessonCourtFirst: {
    color: forest[200],
  },
  lessonInfo: {
    flex: 1,
    minWidth: 0,
  },
  lessonName: {
    fontSize: 13,
    fontWeight: fontWeight.semi,
    color: theme.fg,
    lineHeight: 15,
  },
  lessonNameFirst: {
    color: '#fff',
  },
  lessonFocus: {
    fontSize: 11,
    color: theme.fgMuted,
    marginTop: 2,
    opacity: 0.7,
  },
  lessonFocusFirst: {
    color: forest[100],
    opacity: 0.85,
  },

  emptyState: {
    alignItems: 'center',
    marginTop: spacing[8],
    paddingHorizontal: spacing[4],
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
    color: theme.fg,
  },
  emptySub: {
    fontSize: fontSize.sm,
    color: theme.fgMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  emptyRow: {
    fontSize: fontSize.sm,
    color: theme.fgMuted,
    textAlign: 'center',
    marginTop: spacing[6],
  },
})
