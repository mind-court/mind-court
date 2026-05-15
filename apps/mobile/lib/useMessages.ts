import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'
import { useRefreshOnForeground } from './useRefreshOnForeground'
import type { Message } from '../types/db'

export function useMessages(conversationId: string) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
    setLoading(false)
  }, [conversationId])

  useEffect(() => { fetch() }, [fetch])
  useRefreshOnForeground(fetch)

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages(prev => {
            // Avoid duplicates if we already added it optimistically
            if (prev.some(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new as Message]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  async function sendMessage(content: string): Promise<{ error: string | null }> {
    if (!user) return { error: 'Not signed in' }

    const senderName = profile?.full_name || user.email || 'Coach'
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user.id,
      sender_name: senderName,
      content,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: senderName,
        content,
      })
      .select()
      .single()

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      return { error: error.message }
    }

    // The DB trigger `on_message_inserted` keeps conversations.last_message*
    // in sync, so we don't write it from the client.
    setMessages(prev => prev.map(m => m.id === optimistic.id ? data : m))
    return { error: null }
  }

  return { messages, loading, sendMessage }
}
