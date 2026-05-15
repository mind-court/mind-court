import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput,
  Pressable, KeyboardAvoidingView, ActivityIndicator, Platform, Alert,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../../lib/supabase'
import { useMessages } from '../../../lib/useMessages'
import { useAuth } from '../../../lib/auth'
import { markConversationRead } from '../../../lib/useConversations'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme, spacing, fontSize, fontWeight, radius, forest, sand } from '@mind-court/ui'
import { avatarColor } from '../../../lib/avatarColor'
import { isSameDay } from '../../../lib/dateUtils'
import type { Conversation, Message } from '../../../types/db'

export default function Thread() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const { messages, loading, sendMessage } = useMessages(id)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<FlatList>(null)

  useEffect(() => {
    if (!id) return
    supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => setConversation(data))
    markConversationRead(id)
  }, [id])

  // Mark read again when the newest message changes (e.g., new realtime msg
  // arrives while the thread is open).
  const lastMessageId = messages[messages.length - 1]?.id
  useEffect(() => {
    if (id && lastMessageId) markConversationRead(id)
  }, [id, lastMessageId])

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setText('')
    setSending(true)
    const { error } = await sendMessage(trimmed)
    setSending(false)
    if (error) {
      // Put the text back so the user can retry without retyping.
      setText(trimmed)
      Alert.alert('Message not sent', error)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header — back chevron pinned left, avatar+name centered absolutely */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]}
        >
          <Feather name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <View style={styles.headerCenter} pointerEvents="none">
          <View style={[
            styles.headerAvatar,
            { backgroundColor: avatarColor(conversation?.player_name ?? '') },
          ]}>
            <Text style={styles.headerAvatarText}>
              {(conversation?.player_name ?? '').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.headerName} numberOfLines={1}>
            {conversation?.player_name ?? '…'}
          </Text>
        </View>
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
              <Feather name="message-circle" size={36} color={theme.fgFaint} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>Start the conversation</Text>
              <Text style={styles.emptySubtitle}>Send a drill tip, schedule note, or feedback.</Text>
            </View>
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}

      {/* Composer */}
      <View style={[styles.composer, { paddingBottom: insets.bottom + spacing[2] }]}>
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
          <Feather name="arrow-up" size={20} color="#fff" />
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
  // Optimistic messages have a temp-prefixed id until the DB row replaces them.
  const pending = message.id.startsWith('temp-')

  return (
    <>
      {showDate && (
        <View style={styles.dateRow}>
          <View style={styles.dateRule} />
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <View style={styles.dateRule} />
        </View>
      )}
      <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
        <View style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
          pending && styles.bubblePending,
        ]}>
          <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>
            {message.content}
          </Text>
        </View>
        <View style={styles.bubbleMeta}>
          <Text style={styles.bubbleTime}>{time}</Text>
          {isOwn && (
            pending
              ? <Feather name="clock" size={11} color={theme.fgFaint} />
              : <Feather name="check" size={12} color={theme.fgFaint} />
          )}
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  header: {
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    backgroundColor: theme.bgElevated,
    minHeight: 48,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: spacing[2],
    bottom: 0,
    top: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
    zIndex: 1,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[10],
  },
  headerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  headerName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
    color: theme.fg,
    flexShrink: 1,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageList: {
    paddingHorizontal: spacing[3],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    flexGrow: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginVertical: spacing[3],
  },
  dateRule: { flex: 1, height: 1, backgroundColor: theme.borderSubtle },
  dateLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semi,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: theme.fgFaint,
  },
  bubbleRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: spacing[1],
  },
  bubbleRowOwn: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  bubbleOther: {
    backgroundColor: theme.bgElevated,
    borderBottomLeftRadius: radius.xs,
  },
  bubbleOwn: {
    backgroundColor: forest[700],
    borderBottomRightRadius: radius.xs,
  },
  bubblePending: { opacity: 0.55 },
  bubbleText: {
    fontSize: fontSize.base,
    color: theme.fg,
    lineHeight: 20,
  },
  bubbleTextOwn: { color: '#fff' },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginHorizontal: spacing[1],
  },
  bubbleTime: {
    fontSize: fontSize.xs,
    color: theme.fgFaint,
  },
  emptyThread: {
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
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    backgroundColor: theme.bgElevated,
    gap: spacing[2],
  },
  input: {
    flex: 1,
    backgroundColor: sand[100],
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[2],
    fontSize: fontSize.base,
    color: theme.fg,
    maxHeight: 120,
    minHeight: 38,
  },
  sendBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sendBtnPressed: { backgroundColor: theme.primaryPress },
  sendBtnDisabled: { opacity: 0.35 },
})
