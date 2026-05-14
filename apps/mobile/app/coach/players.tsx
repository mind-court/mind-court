import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { theme, spacing, fontSize, fontWeight, radius } from '@mind-court/ui'
import { Screen } from '../../components/Screen'
import { usePlayers } from '../../lib/usePlayers'
import { CreatePlayerSheet } from '../../components/CreatePlayerSheet'
import type { Player } from '../../types/db'

export default function Players() {
  const { players, loading, createPlayer } = usePlayers()
  const [showCreate, setShowCreate] = useState(false)

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
          <ActivityIndicator color={theme.primary} style={{ marginTop: spacing[8] }} />
        ) : players.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No players yet</Text>
            <Text style={styles.emptySub}>Add your first player to get started.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>{players.length} player{players.length !== 1 ? 's' : ''}</Text>
            {players.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
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

function PlayerCard({ player }: { player: Player }) {
  const initials = player.full_name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{player.full_name}</Text>
        {player.is_kid_mode && (
          <View style={styles.kidBadge}>
            <Text style={styles.kidBadgeText}>Kid Mode</Text>
          </View>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
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
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing[3],
  },
  empty: {
    marginTop: spacing[16],
    alignItems: 'center',
    gap: spacing[2],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semi,
    color: theme.fg,
  },
  emptySub: {
    fontSize: fontSize.base,
    color: theme.fgMuted,
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
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  info: { flex: 1, gap: 4 },
  name: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
    color: theme.fg,
  },
  kidBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.accentHover,
    borderRadius: radius.pill,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  kidBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: theme.fgOnAccent,
  },
  chevron: {
    fontSize: 22,
    color: theme.fgSubtle,
    lineHeight: 24,
  },
})
