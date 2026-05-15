import { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, Modal,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { theme, spacing, fontSize, fontWeight, radius } from '@mind-court/ui'
import { useConversations } from '../../lib/useConversations'
import { usePlayers } from '../../lib/usePlayers'
import type { Conversation } from '../../lib/useConversations'

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

        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: spacing[8] }} />
        ) : conversations.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySub}>Start a conversation with one of your players.</Text>
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
                  <View style={styles.pickerAvatar}>
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

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.rowInfo}>
        <View style={styles.rowTop}>
          <Text style={styles.rowName}>{conversation.player_name}</Text>
          {time ? <Text style={styles.rowTime}>{time}</Text> : null}
        </View>
        <Text style={styles.rowPreview} numberOfLines={1}>
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
  list: { paddingHorizontal: spacing[4] },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
    paddingBottom: spacing[16],
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semi, color: theme.fg },
  emptySub: { fontSize: fontSize.base, color: theme.fgMuted, textAlign: 'center', paddingHorizontal: spacing[8] },
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
    backgroundColor: theme.primary,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#fff' },
  rowInfo: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName: { fontSize: fontSize.base, fontWeight: fontWeight.semi, color: theme.fg },
  rowTime: { fontSize: fontSize.xs, color: theme.fgFaint },
  rowPreview: { fontSize: fontSize.sm, color: theme.fgMuted },
  chevron: { fontSize: 22, color: theme.fgSubtle, lineHeight: 24 },

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
    backgroundColor: theme.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  pickerAvatarText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: '#fff' },
  pickerName: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: theme.fg },
})
