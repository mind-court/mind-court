import { useState, useMemo, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { theme, spacing, fontSize, fontWeight, radius, forest, court, sand, sage, BouncingBall, LogoMark } from '@mind-court/ui'
import { Screen } from '../../../components/Screen'
import { CreateLessonSheet } from '../../../components/CreateLessonSheet'
import { useAuth } from '../../../lib/auth'
import { useLessons } from '../../../lib/useLessons'
import { usePlayers } from '../../../lib/usePlayers'
import { isSameDay } from '../../../lib/dateUtils'
import type { Lesson } from '../../../types/db'

export default function CoachSchedule() {
  const { profile } = useAuth()
  const { lessons, loading, createLesson } = useLessons()
  const { players } = usePlayers()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [recentExpanded, setRecentExpanded] = useState(false)
  const [now, setNow] = useState(() => new Date())

  // Re-tick every 60 s so the "Now · H:MM" hairline & next-up summary stay live.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const today = startOfDay(now)
  const isCurrentWeek = weekOffset === 0
  const weekStart = useMemo(() => addDays(startOfWeek(today), weekOffset * 7), [today, weekOffset])
  const weekEnd = addDays(weekStart, 6)

  const weekDays = useMemo(
    () => buildWeek(weekStart, today, selectedDay, lessons),
    [weekStart, today, selectedDay, lessons],
  )

  // For the current week, only show today + upcoming days inline; past lessons go
  // into the collapsed "Recent" section below. For other weeks, just show everything.
  const groups = useMemo(
    () => groupLessonsByDay(lessons, weekStart, today, isCurrentWeek),
    [lessons, weekStart, today, isCurrentWeek],
  )

  const recentGroups = useMemo(
    () => (isCurrentWeek ? buildRecentGroups(lessons, today) : []),
    [lessons, today, isCurrentWeek],
  )

  const visibleGroups = selectedDay
    ? groups.filter(g => isSameDay(g.date, selectedDay))
    : groups

  // Summary line numbers — always for the real today, regardless of filter / nav.
  const todayLessons = lessons.filter(l => isSameDay(new Date(l.scheduled_at), today))
  const nextToday = todayLessons.find(l => new Date(l.scheduled_at) > now)
  const futureCount = lessons.filter(l => new Date(l.scheduled_at) > now).length

  const monthLabel = formatMonthRange(weekStart, weekEnd).toUpperCase()

  function toggleDay(date: Date) {
    setSelectedDay(prev => (prev && isSameDay(prev, date) ? null : date))
  }

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

  const filterIsAll = selectedDay === null
  const filterIsToday = selectedDay !== null && isSameDay(selectedDay, today)

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

        {/* Week strip — tap a day to filter, tap it again to clear */}
        <View style={styles.weekStrip}>
          {weekDays.map(d => (
            <Pressable
              key={d.date.getTime()}
              accessibilityLabel={`${d.label} ${d.dateNum}`}
              style={[styles.dayPill, d.isSelected && styles.dayPillSelected]}
              onPress={() => toggleDay(d.date)}
            >
              <Text style={[
                styles.dayLabel,
                d.isSelected && styles.dayLabelSelected,
                !d.isSelected && d.isToday && styles.dayLabelToday,
                !d.isSelected && d.count === 0 && !d.isToday && styles.dayLabelEmpty,
              ]}>{d.label}</Text>
              <Text style={[
                styles.dayDate,
                d.isSelected && styles.dayDateSelected,
                !d.isSelected && d.isToday && styles.dayDateToday,
                !d.isSelected && d.count === 0 && !d.isToday && styles.dayDateEmpty,
              ]}>{d.dateNum}</Text>
              <View style={[
                styles.dayDot,
                d.count > 0 && (d.isSelected ? styles.dayDotSelected : styles.dayDotFilled),
              ]}/>
            </Pressable>
          ))}
        </View>

        {/* Filter chips — share state with the strip */}
        <View style={styles.chipRow}>
          <Pressable
            onPress={() => setSelectedDay(null)}
            style={[styles.chip, filterIsAll && styles.chipActive]}
          >
            <Text style={[styles.chipText, filterIsAll && styles.chipTextActive]}>All week</Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedDay(today)}
            style={[styles.chip, filterIsToday && styles.chipActive]}
          >
            <Text style={[styles.chipText, filterIsToday && styles.chipTextActive]}>Today</Text>
          </Pressable>
        </View>

        {/* Body */}
        {loading ? (
          <View style={{ alignItems: 'center', marginTop: spacing[6] }}>
            <BouncingBall size={14} />
          </View>
        ) : lessons.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyMark}>
              <LogoMark size={72} variant="flat" />
            </View>
            <Text style={styles.emptyTitle}>Your schedule is clear.</Text>
            <Text style={styles.emptySub}>Tap + to put your first lesson on the books.</Text>
          </View>
        ) : visibleGroups.length === 0 ? (
          <Text style={styles.emptyRow}>
            {selectedDay
              ? `No lessons ${isSameDay(selectedDay, today) ? 'today' : 'on this day'}.`
              : 'No lessons this week.'}
          </Text>
        ) : (
          visibleGroups.map((g, gi) => (
            <DayGroup key={g.date.getTime()} group={g} first={gi === 0} now={now} />
          ))
        )}

        {/* Recent section — only on the current week, only when no filter is active */}
        {!loading && !selectedDay && isCurrentWeek && recentGroups.length > 0 && (
          <RecentSection
            groups={recentGroups}
            expanded={recentExpanded}
            onToggle={() => setRecentExpanded(e => !e)}
            now={now}
          />
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
  isPast: boolean   // entire day is in the past
  isEmpty: boolean
  count: number
  lessons: Lesson[]
}

function DayGroup({ group, first, now }: { group: Group; first: boolean; now: Date }) {
  // Index of the first lesson today that hasn't started yet — that's where the
  // "Now" hairline goes. -1 means everything today is already in the past, so
  // the hairline lands after the last lesson.
  const upcomingIdx = group.isToday
    ? group.lessons.findIndex(l => new Date(l.scheduled_at) > now)
    : -1
  const showHairlineAtEnd = group.isToday && upcomingIdx === -1 && group.lessons.length > 0

  return (
    <View style={[styles.group, !first && styles.groupSpaced]}>
      <View style={styles.groupHead}>
        <View style={styles.groupHeadLeft}>
          <Text style={[styles.groupLabel, group.isToday && styles.groupLabelToday, group.isPast && styles.groupLabelPast]}>
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
        <>
          {group.lessons.map((lesson, li) => {
            const lessonIsPast = new Date(lesson.scheduled_at) < now
            return (
              <View key={lesson.id}>
                {group.isToday && upcomingIdx === li && <NowHairline now={now} />}
                <CompactLessonRow
                  lesson={lesson}
                  isFirst={group.isToday && li === upcomingIdx}
                  faded={group.isPast || (group.isToday && lessonIsPast)}
                />
              </View>
            )
          })}
          {showHairlineAtEnd && <NowHairline now={now} />}
        </>
      )}
    </View>
  )
}

// ─── NowHairline ────────────────────────────────────────────────────────────
// 1 px chartreuse line that crosses today's lesson list at the current time,
// labeled with the live clock. Acts as a "you are here" marker.

function NowHairline({ now }: { now: Date }) {
  return (
    <View style={styles.nowLineWrap}>
      <View style={styles.nowLineBar} />
      <View style={styles.nowLineTag}>
        <Text style={styles.nowLineText}>NOW · {formatTime(now)}</Text>
      </View>
      <View style={styles.nowLineBar} />
    </View>
  )
}

// ─── Recent section ──────────────────────────────────────────────────────────

function RecentSection({
  groups, expanded, onToggle, now,
}: { groups: Group[]; expanded: boolean; onToggle: () => void; now: Date }) {
  const lessonCount = groups.reduce((sum, g) => sum + g.count, 0)
  return (
    <View style={styles.recentWrap}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.recentHead, pressed && { opacity: 0.65 }]}
        accessibilityLabel={expanded ? 'Hide recent lessons' : 'Show recent lessons'}
      >
        <View style={styles.groupHeadLeft}>
          <Text style={styles.recentLabel}>RECENT</Text>
          <Text style={styles.groupSub}>last 7 days</Text>
        </View>
        <View style={styles.recentRight}>
          <Text style={styles.recentCount}>
            {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
          </Text>
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.fgSubtle}
          />
        </View>
      </Pressable>
      {expanded && groups.map((g, gi) => (
        <DayGroup key={g.date.getTime()} group={g} first={gi === 0} now={now} />
      ))}
    </View>
  )
}

// ─── CompactLessonRow ────────────────────────────────────────────────────────
// Tighter than the legacy LessonRow — used on the Schedule page.

function CompactLessonRow({
  lesson, isFirst, faded,
}: { lesson: Lesson; isFirst?: boolean; faded?: boolean }) {
  const time = formatTime(new Date(lesson.scheduled_at))
  return (
    <Pressable
      onPress={() => router.push(`/coach/session/${lesson.id}`)}
      style={({ pressed }) => [
        styles.lessonRow,
        isFirst && styles.lessonRowFirst,
        faded && !isFirst && styles.lessonRowFaded,
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

function buildWeek(weekStart: Date, today: Date, selectedDay: Date | null, lessons: Lesson[]) {
  const SINGLE = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    const count = lessons.filter(l => isSameDay(new Date(l.scheduled_at), date)).length
    const isToday = isSameDay(date, today)
    const isSelected = selectedDay != null && isSameDay(date, selectedDay)
    return {
      date,
      label: SINGLE[i],
      dateNum: date.getDate(),
      isToday,
      isSelected,
      count,
    }
  })
}

function groupLessonsByDay(
  lessons: Lesson[],
  weekStart: Date,
  today: Date,
  isCurrentWeek: boolean,
): Group[] {
  const groups: Group[] = []
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i)
    const dayStart = startOfDay(date)
    const isToday = isSameDay(date, today)
    const isPast = !isToday && dayStart.getTime() < today.getTime()

    // On the current week, hide past days inline — they show up in "Recent" instead.
    if (isCurrentWeek && isPast) continue

    const dayLessons = lessons
      .filter(l => isSameDay(new Date(l.scheduled_at), date))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

    // Always show today (even when empty). Other days only if they have lessons.
    if (!isToday && dayLessons.length === 0) continue

    groups.push({
      date,
      label: isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
      sublabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday,
      isPast,
      isEmpty: dayLessons.length === 0,
      count: dayLessons.length,
      lessons: dayLessons,
    })
  }
  // Today first, then chronological.
  groups.sort((a, b) => {
    if (a.isToday) return -1
    if (b.isToday) return 1
    return a.date.getTime() - b.date.getTime()
  })
  return groups
}

function buildRecentGroups(lessons: Lesson[], today: Date): Group[] {
  // Last 7 days, excluding today. Newest day first inside the section.
  const groups: Group[] = []
  for (let i = 1; i <= 7; i++) {
    const date = addDays(today, -i)
    const dayLessons = lessons
      .filter(l => isSameDay(new Date(l.scheduled_at), date))
      .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
    if (dayLessons.length === 0) continue
    groups.push({
      date,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      sublabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday: false,
      isPast: true,
      isEmpty: false,
      count: dayLessons.length,
      lessons: dayLessons,
    })
  }
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
  dayPillSelected: {
    backgroundColor: theme.primary,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: fontWeight.semi,
    color: theme.fg,
    opacity: 0.55,
    letterSpacing: 0.4,
  },
  dayLabelSelected: {
    color: '#fff',
    opacity: 0.7,
  },
  dayLabelToday: {
    color: theme.primary,
    opacity: 0.85,
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
  dayDateSelected: {
    color: '#fff',
  },
  dayDateToday: {
    color: theme.primary,
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
  dayDotSelected: {
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
  groupLabelPast: {
    color: theme.fgFaint,
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

  // Now hairline
  nowLineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingHorizontal: 0,
    gap: 6,
  },
  nowLineBar: {
    flex: 1,
    height: 1,
    backgroundColor: theme.accent,
  },
  nowLineTag: {
    backgroundColor: theme.accent,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  nowLineText: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    color: forest[900],
    letterSpacing: 0.6,
    fontVariant: ['tabular-nums'],
  },

  // Recent section
  recentWrap: {
    marginTop: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
  },
  recentHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  recentLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: theme.fgSubtle,
    letterSpacing: 1.1,
  },
  recentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentCount: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: theme.fgSubtle,
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
  lessonRowFaded: {
    opacity: 0.55,
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
  emptyMark: {
    opacity: 0.45,
    marginBottom: spacing[4],
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
