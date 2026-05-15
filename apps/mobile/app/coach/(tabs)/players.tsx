import { useMemo, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { theme, spacing, fontSize, fontWeight, radius, forest, court, BouncingBall, LogoMark } from '@mind-court/ui'
import { Screen } from '../../../components/Screen'
import { usePlayers } from '../../../lib/usePlayers'
import { useLessons } from '../../../lib/useLessons'
import { CreatePlayerSheet } from '../../../components/CreatePlayerSheet'
import { avatarColor } from '../../../lib/avatarColor'
import { formatRelativeDate } from '../../../lib/dateUtils'
import type { Player, Lesson } from '../../../types/db'

export default function Players() {
  const { players, loading, createPlayer } = usePlayers()
  const { lessons } = useLessons()
  const [showCreate, setShowCreate] = useState(false)

  const regularPlayers = players.filter(p => !p.is_kid_mode)
  const kidPlayers = players.filter(p => p.is_kid_mode)

  // Players seen this week (most recent lesson within last 7 days), most-recent first.
  const recentPlayers = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 86400_000
    const lastLessonByPlayer = new Map<string, number>() // playerId -> ts
    for (const l of lessons) {
      const ts = new Date(l.scheduled_at).getTime()
      if (ts > Date.now()) continue          // skip future-scheduled
      if (ts < sevenDaysAgo) continue        // outside the window
      const key = l.player_id ?? l.player_name
      if (!key) continue
      const prev = lastLessonByPlayer.get(key) ?? 0
      if (ts > prev) lastLessonByPlayer.set(key, ts)
    }
    return players
      .map(p => ({
        player: p,
        lastTs: lastLessonByPlayer.get(p.id) ?? lastLessonByPlayer.get(p.full_name) ?? 0,
      }))
      .filter(x => x.lastTs > 0)
      .sort((a, b) => b.lastTs - a.lastTs)
      .map(x => x.player)
  }, [players, lessons])

  return (
    <>
      <Screen>
        <View style={styles.headingRow}>
          <Text style={styles.heading}>Players</Text>
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
            onPress={() => setShowCreate(true)}
          >
            <Text style={styles.addBtnText}>+ Add player</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <BouncingBall size={14} />
          </View>
        ) : players.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyMark}>
              <LogoMark size={72} variant="flat" />
            </View>
            <Text style={styles.emptyTitle}>No players yet</Text>
            <Text style={styles.emptySub}>Add your first player to start tracking their progress.</Text>
          </View>
        ) : (
          <>
            {recentPlayers.length > 0 && (
              <RecentChips players={recentPlayers} />
            )}
            <Text style={styles.sectionLabel}>
              {regularPlayers.length} player{regularPlayers.length !== 1 ? 's' : ''}
            </Text>
            {regularPlayers.map(player => (
              <PlayerCard key={player.id} player={player} lessons={lessons} />
            ))}
            {kidPlayers.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, styles.kidSectionLabel]}>Kid Mode</Text>
                {kidPlayers.map(player => (
                  <PlayerCard key={player.id} player={player} lessons={lessons} />
                ))}
              </>
            )}
          </>
        )}
      </Screen>

      <CreatePlayerSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={createPlayer}
      />
    </>
  )
}

// ─── Recent chips ────────────────────────────────────────────────────────────

function RecentChips({ players }: { players: Player[] }) {
  return (
    <View style={styles.recentBlock}>
      <Text style={styles.recentLabel}>SEEN THIS WEEK</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recentRow}
      >
        {players.map(p => {
          const initials = p.full_name
            .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
          return (
            <Pressable
              key={p.id}
              onPress={() => router.push(`/coach/player/${p.id}`)}
              style={({ pressed }) => [styles.recentChip, pressed && { opacity: 0.7 }]}
            >
              <View style={styles.recentRingOuter}>
                <View style={[styles.recentAvatar, { backgroundColor: avatarColor(p.full_name) }]}>
                  <Text style={styles.recentInitials}>{initials}</Text>
                </View>
              </View>
              <Text style={styles.recentName} numberOfLines={1}>
                {p.full_name.split(' ')[0]}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

function PlayerCard({ player, lessons }: { player: Player; lessons: Lesson[] }) {
  const initials = player.full_name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const playerLessons = lessons.filter(
    l => l.player_id === player.id || l.player_name === player.full_name
  )
  const lessonCount = playerLessons.length
  const lastLesson = [...playerLessons].sort(
    (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
  )[0]
  const lastDate = lastLesson ? formatRelativeDate(new Date(lastLesson.scheduled_at)) : null

  const memberSince = new Date(player.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/coach/player/${player.id}`)}
    >
      <View style={[styles.avatar, { backgroundColor: avatarColor(player.full_name) }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{player.full_name}</Text>
          {player.is_kid_mode && (
            <View style={styles.kidBadge}>
              <Text style={styles.kidBadgeText}>Kid Mode</Text>
            </View>
          )}
        </View>
        <Text style={styles.metaText} numberOfLines={1}>
          {lastDate
            ? `${lessonCount} lesson${lessonCount !== 1 ? 's' : ''} · ${lastDate}`
            : `Member since ${memberSince}`}
        </Text>
      </View>
      <View style={styles.cardRight}>
        {lessonCount > 0 && (
          <View style={styles.lessonCountBadge}>
            <Text style={styles.lessonCountText}>{lessonCount}</Text>
          </View>
        )}
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
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
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: theme.fgSubtle,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: spacing[3],
  },
  kidSectionLabel: {
    marginTop: spacing[6],
  },
  loader: { marginTop: spacing[8], alignItems: 'center' },
  emptyState: {
    marginTop: spacing[16],
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  emptyMark: {
    opacity: 0.45,
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgElevated,
    borderRadius: radius.md,
    padding: spacing[4],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: theme.border,
    gap: spacing[3],
  },
  cardPressed: { backgroundColor: theme.bgSunken },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  info: { flex: 1, gap: 3 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
    color: theme.fg,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: theme.fgSubtle,
  },
  kidBadge: {
    backgroundColor: court[100],
    borderRadius: radius.pill,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  kidBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: court[700],
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  lessonCountBadge: {
    backgroundColor: forest[50],
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: spacing[2],
  },
  lessonCountText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: forest[700],
  },
  chevron: {
    fontSize: 22,
    color: theme.fgSubtle,
    lineHeight: 24,
  },

  // Recent chips
  recentBlock: {
    marginBottom: spacing[5],
  },
  recentLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: theme.fgSubtle,
    letterSpacing: 1.5,
    marginBottom: spacing[2],
  },
  recentRow: {
    gap: spacing[3],
    paddingRight: spacing[2],
  },
  recentChip: {
    alignItems: 'center',
    width: 56,
  },
  recentRingOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: court[500],
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  recentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInitials: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  recentName: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: theme.fgMuted,
    marginTop: 4,
    maxWidth: 56,
  },
})
