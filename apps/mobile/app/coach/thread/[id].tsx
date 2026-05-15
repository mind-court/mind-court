import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput,
  Pressable, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { useMessages } from '../../../lib/useMessages'
import { useAuth } from '../../../lib/auth'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme, spacing, fontSize, fontWeight, radius, forest } from '@mind-court/ui'
import type { Conversation } from '../../../lib/useConversations'
import type { Message } from '../../../lib/useMessages'

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
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerName}>{conversation?.player_name ?? '…'}</Text>
        <View style={{ width: 32 }} />
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
              <Text style={styles.emptyText}>No messages yet. Say something.</Text>
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
  backBtn: { width: 32 },
  backText: {
    fontSize: 28,
    color: theme.primary,
    lineHeight: 32,
  },
  headerName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
    color: theme.fg,
  },
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
  emptyText: { fontSize: fontSize.base, color: theme.fgMuted },
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
