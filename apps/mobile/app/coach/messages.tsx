import { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, Modal, TextInput,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { theme, spacing, fontSize, fontWeight, radius, forest, court, sage } from '@mind-court/ui'
import { useConversations } from '../../lib/useConversations'
import { usePlayers } from '../../lib/usePlayers'
import type { Conversation } from '../../lib/useConversations'

const AVATAR_COLORS = [
  forest[500], forest[600], '#6B8CAE', '#7A8E70', '#A0845C', '#7A6B8A', sage[700],
]

function avatarColor(name: string): string {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function isRecent(conversation: Conversation): boolean {
  if (!conversation.last_message_at) return false
  return Date.now() - new Date(conversation.last_message_at).getTime() < 24 * 60 * 60 * 1000
}

export default function Messages() {
  const { conversations, loading, startConversation } = useConversations()
  const { players } = usePlayers()
  const [showPicker, setShowPicker] = useState(false)
  const insets = useSafeAreaInsets()

  async function handlePickPlayer(playerName: string, playerId?: string) {
    setShowPicker(false)
    const { data, error } = await startConversation(playerName, playerId)
    if (!error && data) router.push(`/coach/thread/${data.id}`)
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

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={15} color={theme.fgFaint} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations"
              placeholderTextColor={theme.fgFaint}
              editable={false}
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.primary} style={styles.loader} />
        ) : conversations.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="message-circle" size={40} color={forest[300]} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySub}>
              Start a conversation with one of your players to get coaching feedback and scheduling going.
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
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

      {/* Player picker modal */}
      <Modal visible={showPicker} transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowPicker(false)} />
        <View style={styles.picker}>
          <Text style={styles.pickerTitle}>Message a player</Text>
          {players.length === 0 ? (
            <Text style={styles.pickerEmpty}>Add players first from the Players tab.</Text>
          ) : (
            <FlatList
              data={players}
              keyExtractor={p => p.id}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.pickerRow, pressed && styles.pickerRowPressed]}
                  onPress={() => handlePickPlayer(item.full_name, item.id)}
                >
                  <View style={[styles.pickerAvatar, { backgroundColor: avatarColor(item.full_name) }]}>
                    <Text style={styles.pickerAvatarText}>
                      {item.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.pickerName}>{item.full_name}</Text>
                </Pressable>
              )}
            />
          )}
        </View>
      </Modal>
    </>
  )
}

function ConversationRow({ conversation, onPress }: { conversation: Conversation; onPress: () => void }) {
  const initials = conversation.player_name
    .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  const time = conversation.last_message_at
    ? formatTime(new Date(conversation.last_message_at))
    : ''

  const recent = isRecent(conversation)
  const color = avatarColor(conversation.player_name)

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      {recent ? <View style={styles.unreadDot} /> : <View style={styles.unreadSpacer} />}
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.rowInfo}>
        <View style={styles.rowTop}>
          <Text style={recent ? [styles.rowName, styles.rowNameBold] : styles.rowName}>
            {conversation.player_name}
          </Text>
          {time ? <Text style={styles.rowTime}>{time}</Text> : null}
        </View>
        <Text style={styles.rowPreview} numberOfLines={1}>
          {conversation.last_message ?? 'No messages yet'}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={theme.fgSubtle} />
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

  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: theme.fg,
  },

  loader: { marginTop: spacing[8] },
  list: { paddingHorizontal: spacing[4], paddingBottom: spacing[16] },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[8],
    paddingBottom: spacing[16],
  },
  emptyIcon: { marginBottom: spacing[2] },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semi, color: theme.fg },
  emptySub: { fontSize: fontSize.base, color: theme.fgMuted, textAlign: 'center' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    gap: spacing[3],
  },
  rowPressed: { backgroundColor: theme.bgSunken },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: court[500],
    flexShrink: 0,
  },
  unreadSpacer: {
    width: 8,
    height: 8,
    flexShrink: 0,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#fff' },
  rowInfo: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: theme.fg },
  rowNameBold: { fontWeight: fontWeight.semi },
  rowTime: { fontSize: fontSize.xs, color: theme.fgFaint },
  rowPreview: { fontSize: fontSize.sm, color: theme.fgMuted },

  // Picker
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,31,24,0.4)',
  },
  picker: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: theme.bgElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing[5],
    paddingBottom: 40,
    maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: theme.fg,
    marginBottom: spacing[4],
  },
  pickerEmpty: { fontSize: fontSize.base, color: theme.fgMuted },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  pickerRowPressed: { opacity: 0.6 },
  pickerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  pickerAvatarText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: '#fff' },
  pickerName: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: theme.fg },
})
