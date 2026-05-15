import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { theme, spacing, fontSize, fontWeight, radius, forest, court, sage } from '@mind-court/ui'
import { Screen } from '../../components/Screen'
import { usePlayers } from '../../lib/usePlayers'
import { useLessons } from '../../lib/useLessons'
import { CreatePlayerSheet } from '../../components/CreatePlayerSheet'
import type { Player, Lesson } from '../../types/db'

const AVATAR_COLORS = [
  forest[500], forest[600], '#6B8CAE', '#7A8E70', '#A0845C', '#7A6B8A', sage[700],
]

function avatarColor(name: string): string {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > -7 && diffDays < 0) return date.toLocaleDateString('en-US', { weekday: 'long' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Players() {
  const { players, loading, createPlayer } = usePlayers()
  const { lessons } = useLessons()
  const [showCreate, setShowCreate] = useState(false)

  const regularPlayers = players.filter(p => !p.is_kid_mode)
  const kidPlayers = players.filter(p => p.is_kid_mode)

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
          <ActivityIndicator color={theme.primary} style={styles.loader} />
        ) : players.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="users" size={40} color={forest[300]} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No players yet</Text>
            <Text style={styles.emptySub}>
              Add your first player and start tracking their progress.
            </Text>
          </View>
        ) : (
          <>
            {regularPlayers.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>
                  {players.length} player{players.length !== 1 ? 's' : ''}
                </Text>
                {regularPlayers.map(player => (
                  <PlayerCard key={player.id} player={player} lessons={lessons} />
                ))}
              </>
            )}

            {kidPlayers.length > 0 && (
              <>
                <Text style={regularPlayers.length > 0 ? [styles.sectionLabel, styles.sectionLabelSpaced] : styles.sectionLabel}>
                  Kid Mode
                </Text>
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

  const metaText = lessonCount > 0
    ? `${lessonCount} lesson${lessonCount !== 1 ? 's' : ''}${lastDate ? ` · ${lastDate}` : ''}`
    : `Member since ${memberSince}`

  const color = avatarColor(player.full_name)

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={[styles.avatar, { backgroundColor: color }]}>
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
        <Text style={styles.meta}>{metaText}</Text>
      </View>
      <View style={styles.right}>
        {lessonCount > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{lessonCount}</Text>
          </View>
        )}
        <Feather name="chevron-right" size={16} color={theme.fgSubtle} />
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
  loader: { marginTop: spacing[8] },
  empty: {
    marginTop: spacing[16],
    alignItems: 'center',
    gap: spacing[2],
  },
  emptyIcon: { marginBottom: spacing[2] },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semi,
    color: theme.fg,
  },
  emptySub: {
    fontSize: fontSize.base,
    color: theme.fgMuted,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
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
  info: { flex: 1, gap: 4 },
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
  meta: {
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
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  countBadge: {
    backgroundColor: court[100],
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: court[700],
  },
})
