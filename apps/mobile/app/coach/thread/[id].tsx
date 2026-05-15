import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput,
  Pressable, KeyboardAvoidingView, ActivityIndicator, Platform,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../../lib/supabase'
import { useMessages } from '../../../lib/useMessages'
import { useAuth } from '../../../lib/auth'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme, spacing, fontSize, fontWeight, radius, forest, sage } from '@mind-court/ui'
import type { Conversation } from '../../../lib/useConversations'
import type { Message } from '../../../lib/useMessages'

const AVATAR_COLORS = [forest[500], forest[600], '#6B8CAE', '#7A8E70', '#A0845C', '#7A6B8A', sage[700]]
function avatarColor(name: string) {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

export default function Thread() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const { messages, loading, sendMessage } = useMessages(id)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<FlatList>(null)
  const playerName = conversation?.player_name ?? ''

  useEffect(() => {
    supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => setConversation(data))
  }, [id])

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages.length])

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setText('')
    setSending(true)
    await sendMessage(trimmed)
    setSending(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={theme.primary} />
          <Text style={styles.backText}> Messages</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          {playerName ? (
            <View style={[styles.headerAvatar, { backgroundColor: avatarColor(playerName) }]}>
              <Text style={styles.headerAvatarText}>{initials(playerName)}</Text>
            </View>
          ) : null}
          <Text style={styles.headerName}>{playerName || '…'}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              isOwn={item.sender_id === user?.id}
              showDate={index === 0 || !isSameDay(
                new Date(messages[index - 1].created_at),
                new Date(item.created_at)
              )}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyThread}>
              <Feather name="message-circle" size={32} color={theme.fgFaint} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>Start the conversation</Text>
              <Text style={styles.emptySubtitle}>Send a drill tip, schedule note, or feedback.</Text>
            </View>
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Composer */}
      <View style={[styles.composer, { paddingBottom: insets.bottom + spacing[3] }]}>
        <TextInput
          style={styles.input}
          placeholder="Message…"
          placeholderTextColor={theme.fgFaint}
          value={text}
          onChangeText={setText}
          multiline
          returnKeyType="default"
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            pressed && styles.sendBtnPressed,
            (!text.trim() || sending) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

function MessageBubble({
  message, isOwn, showDate,
}: {
  message: Message; isOwn: boolean; showDate: boolean
}) {
  const time = new Date(message.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })
  const dateLabel = new Date(message.created_at).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  return (
    <>
      {showDate && (
        <Text style={styles.dateLabel}>{dateLabel}</Text>
      )}
      <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>
            {message.content}
          </Text>
        </View>
        <Text style={styles.bubbleTime}>{time}</Text>
      </View>
    </>
  )
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    backgroundColor: theme.bgElevated,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    minWidth: spacing[24],
  },
  backText: {
    fontSize: fontSize.sm,
    color: theme.primary,
    fontWeight: fontWeight.medium,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  headerName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
    color: theme.fg,
  },
  headerSpacer: { width: spacing[24] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageList: {
    padding: spacing[4],
    paddingBottom: spacing[2],
    gap: spacing[1],
    flexGrow: 1,
  },
  dateLabel: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: theme.fgFaint,
    marginVertical: spacing[3],
  },
  bubbleRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  bubbleRowOwn: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  bubbleOther: {
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderBottomLeftRadius: radius.xs,
  },
  bubbleOwn: {
    backgroundColor: forest[700],
    borderBottomRightRadius: radius.xs,
  },
  bubbleText: {
    fontSize: fontSize.base,
    color: theme.fg,
    lineHeight: 22,
  },
  bubbleTextOwn: { color: '#fff' },
  bubbleTime: {
    fontSize: fontSize.xs,
    color: theme.fgFaint,
    marginTop: 3,
    marginHorizontal: spacing[1],
  },
  emptyThread: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing[16],
  },
  emptyIcon: { marginBottom: spacing[3] },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: theme.fgSubtle,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: theme.fgFaint,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing[3],
    paddingBottom: spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.bgElevated,
    gap: spacing[2],
  },
  input: {
    flex: 1,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSize.base,
    color: theme.fg,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sendBtnPressed: { backgroundColor: theme.primaryPress },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontSize: fontSize.lg, color: '#fff', fontWeight: fontWeight.bold, lineHeight: 22 },
})
