import { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, TextInput,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { theme, spacing, fontSize, fontWeight, radius, forest, court } from '@mind-court/ui'
import { useConversations } from '../../lib/useConversations'
import { usePlayers } from '../../lib/usePlayers'
import { PlayerPickerSheet } from '../../components/PlayerPickerSheet'
import { avatarColor } from '../../lib/avatarColor'
import type { Conversation, Player } from '../../types/db'

function isRecent(dateStr: string | null): boolean {
  if (!dateStr) return false
  return Date.now() - new Date(dateStr).getTime() < 86400000
}

export default function Messages() {
  const { conversations, loading, startConversation } = useConversations()
  const { players } = usePlayers()
  const [showPicker, setShowPicker] = useState(false)
  const [query, setQuery] = useState('')
  const insets = useSafeAreaInsets()

  const sorted = [...conversations].sort((a, b) => {
    const ra = isRecent(a.last_message_at)
    const rb = isRecent(b.last_message_at)
    if (ra && !rb) return -1
    if (!ra && rb) return 1
    return (b.last_message_at ?? '').localeCompare(a.last_message_at ?? '')
  })

  const filtered = query.trim()
    ? sorted.filter(c => c.player_name.toLowerCase().includes(query.toLowerCase()))
    : sorted

  async function handlePickPlayer(player: Player) {
    const { data, error } = await startConversation(player.full_name, player.id)
    if (data) router.push(`/coach/thread/${data.id}`)
  }

  return (
    <>
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
          <Text style={styles.heading}>Messages</Text>
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.addBtnText}>+ New</Text>
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={theme.fgFaint} />
          <TextInput
            placeholder="Search conversations"
            placeholderTextColor={theme.fgFaint}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: spacing[8] }} />
        ) : conversations.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="message-circle" size={40} color={forest[300]} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySub}>Start a conversation with one of your players.</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="search" size={32} color={forest[300]} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No results</Text>
            <Text style={styles.emptySub}>No conversations matching "{query}".</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={c => c.id}
            renderItem={({ item }) => (
              <ConversationRow
                conversation={item}
                onPress={() => router.push(`/coach/thread/${item.id}`)}
              />
            )}
            contentContainerStyle={styles.list}
          />
        )}
      </View>

      <PlayerPickerSheet
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        players={players}
        onSelect={handlePickPlayer}
      />
    </>
  )
}

function ConversationRow({ conversation, onPress }: { conversation: Conversation; onPress: () => void }) {
  const initials = conversation.player_name
    .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  const time = conversation.last_message_at
    ? formatTime(new Date(conversation.last_message_at))
    : ''

  const recent = isRecent(conversation.last_message_at)

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={[styles.recentDot, recent && styles.recentDotVisible]} />
      <View style={[styles.avatar, { backgroundColor: avatarColor(conversation.player_name) }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.rowInfo}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowName, recent && styles.rowNameRecent]}>{conversation.player_name}</Text>
          {time ? <Text style={styles.rowTime}>{time}</Text> : null}
        </View>
        <Text style={[styles.rowPreview, recent && styles.rowPreviewRecent]} numberOfLines={1}>
          {conversation.last_message ?? 'No messages yet'}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  )
}

function formatTime(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`
  if (diff < 86_400_000) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
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
  addBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semi, color: '#fff' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: theme.fg,
  },
  list: { paddingHorizontal: spacing[4], paddingBottom: spacing[16] },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing[16],
    paddingHorizontal: spacing[8],
  },
  emptyIcon: {
    marginBottom: spacing[4],
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semi, color: theme.fg },
  emptySub: {
    fontSize: fontSize.sm,
    color: theme.fgMuted,
    textAlign: 'center',
    marginTop: spacing[1],
    paddingHorizontal: spacing[8],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    gap: spacing[3],
  },
  rowPressed: { backgroundColor: theme.bgSunken },
  recentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
    flexShrink: 0,
  },
  recentDotVisible: {
    backgroundColor: court[500],
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#fff' },
  rowInfo: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName: { fontSize: fontSize.base, fontWeight: fontWeight.semi, color: theme.fg },
  rowNameRecent: { fontWeight: fontWeight.bold },
  rowTime: { fontSize: fontSize.xs, color: theme.fgFaint },
  rowPreview: { fontSize: fontSize.sm, color: theme.fgMuted, fontWeight: fontWeight.regular },
  rowPreviewRecent: { fontWeight: fontWeight.medium },
  chevron: { fontSize: 22, color: theme.fgSubtle, lineHeight: 24 },
})
