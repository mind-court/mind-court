import { useState } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet, FlatList,
} from 'react-native'
import { BottomSheet } from './BottomSheet'
import { theme, spacing, fontSize, fontWeight, radius } from '@mind-court/ui'
import type { Player } from '../types/db'

type Props = {
  visible: boolean
  onClose: () => void
  players: Player[]
  onSelect: (player: Player) => void
}

export function PlayerPickerSheet({ visible, onClose, players, onSelect }: Props) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? players.filter(p => p.full_name.toLowerCase().includes(query.toLowerCase()))
    : players

  function handleSelect(player: Player) {
    setQuery('')
    onSelect(player)
    onClose()
  }

  function handleClose() {
    setQuery('')
    onClose()
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View style={styles.header}>
        <Text style={styles.title}>Select player</Text>
        <Pressable onPress={handleClose} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search players…"
          placeholderTextColor={theme.fgFaint}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="words"
          autoFocus
          returnKeyType="search"
        />
      </View>

      {players.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No players yet</Text>
          <Text style={styles.emptySub}>Add players from the Players tab first.</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No match</Text>
          <Text style={styles.emptySub}>No player named "{query}".</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const initials = item.full_name
              .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
            return (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => handleSelect(item)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{item.full_name}</Text>
                  {item.is_kid_mode && (
                    <Text style={styles.kidBadge}>Kid Mode</Text>
                  )}
                </View>
              </Pressable>
            )
          }}
        />
      )}
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: theme.fg,
  },
  closeText: {
    fontSize: fontSize.base,
    color: theme.fgMuted,
    padding: spacing[1],
  },
  searchBox: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  searchInput: {
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSize.base,
    color: theme.fg,
  },
  list: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    paddingBottom: spacing[8],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  rowPressed: { opacity: 0.6 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.primary,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  rowInfo: { flex: 1, gap: 2 },
  rowName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: theme.fg,
  },
  kidBadge: {
    fontSize: fontSize.xs,
    color: theme.accentPress,
    fontWeight: fontWeight.medium,
  },
  empty: {
    padding: spacing[8],
    alignItems: 'center',
    gap: spacing[2],
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
    color: theme.fg,
  },
  emptySub: {
    fontSize: fontSize.sm,
    color: theme.fgMuted,
    textAlign: 'center',
  },
})
