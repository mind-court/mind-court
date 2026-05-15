import { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import {
  theme, spacing, fontSize, fontWeight, radius,
  forest, court, sand, BouncingBall, LogoMark,
} from '@mind-court/ui'
import { Screen } from '../../../components/Screen'
import { CreateLessonSheet } from '../../../components/CreateLessonSheet'
import { useAuth } from '../../../lib/auth'
import { useLessons } from '../../../lib/useLessons'
import { usePlayers } from '../../../lib/usePlayers'
import { useConversations, isUnread } from '../../../lib/useConversations'
import { isSameDay } from '../../../lib/dateUtils'
import type { Lesson } from '../../../types/db'

export default function Today() {
  const { profile } = useAuth()
  const { lessons, loading: lessonsLoading, createLesson } = useLessons()
  const { players } = usePlayers()
  const { conversations } = useConversations()
  const [showCreate, setShowCreate] = useState(false)
  const [now, setNow] = useState(() => new Date())

  // Re-tick once a minute so the "in 12 min" countdown stays accurate.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const today = startOfDay(now)

  const firstName = (profile?.full_name?.trim().split(/\s+/)[0]) || 'Coach'
  const greeting = greetingFor(now)

  const todaysLessons = useMemo(
    () => lessons
      .filter(l => isSameDay(new Date(l.scheduled_at), today))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    [lessons, today],
  )

  const nextLesson = useMemo(
    () => lessons.find(l => new Date(l.scheduled_at) > now) ?? null,
    [lessons, now],
  )

  const remainingToday = todaysLessons.filter(l => new Date(l.scheduled_at) > now)
  const doneToday = todaysLessons.length - remainingToday.length
  const unreadCount = conversations.filter(isUnread).length

  async function handleCreate(input: {
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
        {/* Greeting */}
        <Text style={styles.eyebrow}>{formatDateEyebrow(now).toUpperCase()}</Text>
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.name}>{firstName}.</Text>

        {/* Next lesson — hero card */}
        {lessonsLoading ? (
          <View style={styles.heroLoader}>
            <BouncingBall size={14} />
          </View>
        ) : nextLesson ? (
          <NextLessonCard lesson={nextLesson} now={now} />
        ) : (
          <EmptyHero onAdd={() => setShowCreate(true)} />
        )}

        {/* Today snapshot */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>TODAY</Text>
          <Pressable onPress={() => router.push('/coach/schedule')} hitSlop={8}>
            <Text style={styles.sectionLink}>Full schedule</Text>
          </Pressable>
        </View>
        {todaysLessons.length === 0 ? (
          <View style={styles.offDayCard}>
            <Text style={styles.offDayText}>No lessons today — off day.</Text>
          </View>
        ) : (
          <View style={styles.todayList}>
            {remainingToday.slice(0, 4).map(l => (
              <CompactRow key={l.id} lesson={l} />
            ))}
            {remainingToday.length === 0 && (
              <Text style={styles.allDoneText}>
                All {doneToday} lesson{doneToday === 1 ? '' : 's'} wrapped. Nice work.
              </Text>
            )}
            {remainingToday.length > 4 && (
              <Pressable
                onPress={() => router.push('/coach/schedule')}
                style={({ pressed }) => [styles.viewMore, pressed && styles.pressed]}
              >
                <Text style={styles.viewMoreText}>
                  +{remainingToday.length - 4} more today
                </Text>
                <Feather name="arrow-right" size={14} color={theme.primary} />
              </Pressable>
            )}
          </View>
        )}

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <StatTile
            label="Players"
            value={players.length}
            onPress={() => router.push('/coach/players')}
          />
          <StatTile
            label="Unread"
            value={unreadCount}
            highlight={unreadCount > 0}
            onPress={() => router.push('/coach/messages')}
          />
          <StatTile
            label="Today"
            value={todaysLessons.length}
            sublabel={doneToday > 0 ? `${doneToday} done` : undefined}
            onPress={() => router.push('/coach/schedule')}
          />
        </View>

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]}
            onPress={() => setShowCreate(true)}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.primaryActionText}>New lesson</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
            onPress={() => router.push('/coach/players')}
          >
            <Feather name="users" size={16} color={theme.fg} />
            <Text style={styles.secondaryActionText}>Players</Text>
          </Pressable>
        </View>
      </Screen>

      <CreateLessonSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={handleCreate}
        players={players}
      />
    </>
  )
}

// ─── Next lesson hero ────────────────────────────────────────────────────────

function NextLessonCard({ lesson, now }: { lesson: Lesson; now: Date }) {
  const start = new Date(lesson.scheduled_at)
  const mins = Math.round((start.getTime() - now.getTime()) / 60000)
  const isToday = isSameDay(start, now)
  const countdown = formatCountdown(mins, isToday)
  const isImminent = isToday && mins <= 30
  const time = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <Pressable
      onPress={() => router.push(`/coach/session/${lesson.id}`)}
      style={({ pressed }) => [styles.hero, pressed && styles.heroPressed]}
    >
      <View style={styles.heroTopRow}>
        <Text style={styles.heroEyebrow}>NEXT UP</Text>
        {isImminent && (
          <View style={styles.imminentPill}>
            <Text style={styles.imminentText}>{countdown}</Text>
          </View>
        )}
      </View>
      <Text style={styles.heroName}>{lesson.player_name}</Text>
      <View style={styles.heroMetaRow}>
        <Feather name="clock" size={13} color={sand[200]} />
        <Text style={styles.heroMeta}>
          {isToday ? time : `${start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${time}`}
        </Text>
        {lesson.court ? (
          <>
            <View style={styles.heroDot} />
            <Feather name="map-pin" size={13} color={sand[200]} />
            <Text style={styles.heroMeta}>{lesson.court}</Text>
          </>
        ) : null}
      </View>
      {!isImminent && (
        <Text style={styles.heroCountdown}>{countdown}</Text>
      )}
      {lesson.mental_cue ? (
        <View style={styles.cueBar}>
          <Feather name="message-square" size={12} color={court[400]} />
          <Text style={styles.cueText} numberOfLines={2}>{lesson.mental_cue}</Text>
        </View>
      ) : null}
    </Pressable>
  )
}

function EmptyHero({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyHero}>
      <View style={{ opacity: 0.45 }}>
        <LogoMark size={56} variant="flat" />
      </View>
      <Text style={styles.emptyHeroTitle}>No lessons scheduled.</Text>
      <Text style={styles.emptyHeroSub}>Add your first lesson and the next one will live here.</Text>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [styles.emptyHeroBtn, pressed && styles.primaryActionPressed]}
      >
        <Feather name="plus" size={14} color="#fff" />
        <Text style={styles.emptyHeroBtnText}>New lesson</Text>
      </Pressable>
    </View>
  )
}

// ─── Compact row ─────────────────────────────────────────────────────────────

function CompactRow({ lesson }: { lesson: Lesson }) {
  const time = new Date(lesson.scheduled_at)
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return (
    <Pressable
      onPress={() => router.push(`/coach/session/${lesson.id}`)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={styles.rowTime}>{time}</Text>
      <Text style={styles.rowName} numberOfLines={1}>{lesson.player_name}</Text>
      {lesson.court ? <Text style={styles.rowCourt}>{lesson.court}</Text> : null}
      <Feather name="chevron-right" size={14} color={theme.fgFaint} />
    </Pressable>
  )
}

// ─── Stat tile ───────────────────────────────────────────────────────────────

function StatTile({
  label, value, sublabel, highlight, onPress,
}: {
  label: string
  value: number
  sublabel?: string
  highlight?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.statTile, pressed && styles.pressed]}
    >
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sublabel ? <Text style={styles.statSub}>{sublabel}</Text> : null}
    </Pressable>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function greetingFor(d: Date): string {
  const h = d.getHours()
  if (h < 5) return 'Late night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDateEyebrow(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function formatCountdown(mins: number, isToday: boolean): string {
  if (mins <= 0) return 'starting now'
  if (mins < 60) return `in ${mins} min`
  if (isToday) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m === 0 ? `in ${h}h` : `in ${h}h ${m}m`
  }
  const days = Math.round(mins / 1440)
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: theme.fgSubtle,
    letterSpacing: 1.4,
  },
  greeting: {
    fontSize: 22,
    fontWeight: fontWeight.medium,
    color: theme.fgMuted,
    marginTop: spacing[2],
    letterSpacing: -0.3,
  },
  name: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: theme.fg,
    letterSpacing: -0.6,
    marginBottom: spacing[5],
  },

  hero: {
    backgroundColor: theme.primary,
    borderRadius: radius.lg,
    padding: spacing[5],
    marginBottom: spacing[5],
    gap: spacing[2],
  },
  heroPressed: { backgroundColor: theme.primaryPress },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: court[300],
    letterSpacing: 1.6,
  },
  imminentPill: {
    backgroundColor: court[500],
    borderRadius: radius.pill,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  imminentText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: forest[900],
    letterSpacing: 0.6,
  },
  heroName: {
    fontSize: 26,
    fontWeight: fontWeight.bold,
    color: '#fff',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  heroMeta: {
    fontSize: fontSize.sm,
    color: sand[200],
    fontWeight: fontWeight.medium,
  },
  heroDot: {
    width: 3, height: 3, borderRadius: 999,
    backgroundColor: sand[400],
    marginHorizontal: 2,
  },
  heroCountdown: {
    fontSize: fontSize.xs,
    color: court[300],
    fontWeight: fontWeight.semi,
    marginTop: spacing[1],
    letterSpacing: 0.4,
  },
  cueBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  cueText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: sand[200],
    fontStyle: 'italic',
    lineHeight: 16,
  },
  heroLoader: {
    paddingVertical: spacing[10],
    alignItems: 'center',
    marginBottom: spacing[5],
  },

  emptyHero: {
    backgroundColor: theme.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing[5],
    alignItems: 'center',
    marginBottom: spacing[5],
    gap: spacing[2],
  },
  emptyHeroTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
    color: theme.fg,
    marginTop: spacing[3],
  },
  emptyHeroSub: {
    fontSize: fontSize.sm,
    color: theme.fgMuted,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  emptyHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.primary,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
  },
  emptyHeroBtnText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: theme.fgSubtle,
    letterSpacing: 1.5,
  },
  sectionLink: {
    fontSize: fontSize.xs,
    color: theme.primary,
    fontWeight: fontWeight.semi,
  },

  todayList: {
    gap: 6,
    marginBottom: spacing[5],
  },
  offDayCard: {
    backgroundColor: theme.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  offDayText: {
    fontSize: fontSize.sm,
    color: theme.fgFaint,
  },
  allDoneText: {
    fontSize: fontSize.sm,
    color: theme.fgMuted,
    fontStyle: 'italic',
    paddingVertical: spacing[2],
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
  },
  rowPressed: { backgroundColor: theme.bgSunken },
  rowTime: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: theme.fg,
    fontVariant: ['tabular-nums'],
    minWidth: 52,
  },
  rowName: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
    color: theme.fg,
  },
  rowCourt: {
    fontSize: fontSize.xs,
    color: theme.fgSubtle,
  },
  viewMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing[2],
  },
  viewMoreText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
    color: theme.primary,
  },

  statsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  statTile: {
    flex: 1,
    backgroundColor: theme.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    color: theme.fg,
    letterSpacing: -0.5,
  },
  statValueHighlight: {
    color: theme.primary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semi,
    color: theme.fgSubtle,
    letterSpacing: 1.2,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statSub: {
    fontSize: 10,
    color: theme.fgFaint,
    marginTop: 1,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.primary,
    paddingVertical: spacing[3],
    borderRadius: radius.md,
  },
  primaryActionPressed: { backgroundColor: theme.primaryPress },
  primaryActionText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: spacing[3],
    borderRadius: radius.md,
  },
  secondaryActionText: {
    color: theme.fg,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
  },

  pressed: { opacity: 0.6 },
})
