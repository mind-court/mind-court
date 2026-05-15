import { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { theme, spacing, fontSize, fontWeight, radius, forest, court, BouncingBall, LogoMark } from '@mind-court/ui'
import { useConversations, isUnread } from '../../../lib/useConversations'
import { usePlayers } from '../../../lib/usePlayers'
import { PlayerPickerSheet } from '../../../components/PlayerPickerSheet'
import { avatarColor } from '../../../lib/avatarColor'
import type { Conversation, Player } from '../../../types/db'

export default function Messages() {
  const { conversations, loading, startConversation } = useConversations()
  const { players } = usePlayers()
  const [showPicker, setShowPicker] = useState(false)
  const [query, setQuery] = useState('')
  const insets = useSafeAreaInsets()

  const sorted = [...conversations].sort((a, b) => {
    const ua = isUnread(a)
    const ub = isUnread(b)
    if (ua && !ub) return -1
    if (!ua && ub) return 1
    return (b.last_message_at ?? '').localeCompare(a.last_message_at ?? '')
  })

  const filtered = query.trim()
    ? sorted.filter(c => c.player_name.toLowerCase().includes(query.toLowerCase()))
    : sorted

  async function handlePickPlayer(player: Player) {
    const { data, error } = await startConversation(player.full_name, player.id)
    if (data) {
      router.push(`/coach/thread/${data.id}`)
    } else if (error) {
      Alert.alert('Could not open conversation', error)
    }
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
          <View style={styles.loader}>
            <BouncingBall size={14} />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyMark}>
              <LogoMark size={72} variant="flat" />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySub}>
              Start a conversation with one of your players to get coaching feedback and scheduling going.
            </Text>
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

  const unread = isUnread(conversation)

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={[styles.avatar, { backgroundColor: avatarColor(conversation.player_name) }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.rowInfo}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowName, unread && styles.rowNameUnread]} numberOfLines={1}>
            {conversation.player_name}
          </Text>
          {time ? <Text style={[styles.rowTime, unread && styles.rowTimeUnread]}>{time}</Text> : null}
        </View>
        <View style={styles.rowBottom}>
          <Text style={[styles.rowPreview, unread && styles.rowPreviewUnread]} numberOfLines={1}>
            {conversation.last_message ?? 'No messages yet'}
          </Text>
          {unread && <View style={styles.unreadDot} />}
        </View>
      </View>
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
    paddingBottom: spacing[3],
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
  loader: { marginTop: spacing[8], alignItems: 'center' },
  list: { paddingHorizontal: spacing[4], paddingBottom: spacing[16] },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing[16],
    paddingHorizontal: spacing[8],
  },
  emptyIcon: { marginBottom: spacing[4] },
  emptyMark: { opacity: 0.45, marginBottom: spacing[4] },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semi, color: theme.fg },
  emptySub: {
    fontSize: fontSize.sm,
    color: theme.fgMuted,
    textAlign: 'center',
    marginTop: spacing[1],
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
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#fff' },
  rowInfo: { flex: 1, gap: 3, minWidth: 0 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
  },
  rowName: { fontSize: fontSize.base, fontWeight: fontWeight.semi, color: theme.fg, flexShrink: 1 },
  rowNameUnread: { fontWeight: fontWeight.bold },
  rowTime: { fontSize: fontSize.xs, color: theme.fgFaint, flexShrink: 0 },
  rowTimeUnread: { color: theme.primary, fontWeight: fontWeight.semi },
  rowPreview: { fontSize: fontSize.sm, color: theme.fgMuted, flex: 1 },
  rowPreviewUnread: { color: theme.fg, fontWeight: fontWeight.medium },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: court[500],
    flexShrink: 0,
  },
})
