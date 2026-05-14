import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  content: string
  created_at: string
}

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

  async function sendMessage(content: string) {
    if (!user || !profile) return
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user.id,
      sender_name: profile.full_name || user.email || 'Coach',
      content,
      created_at: new Date().toISOString(),
    }
    // Optimistic update
    setMessages(prev => [...prev, optimistic])

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: profile.full_name || user.email || 'Coach',
        content,
      })
      .select()
      .single()

    if (error) {
      // Roll back optimistic update on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
    } else {
      // Replace optimistic with real row
      setMessages(prev => prev.map(m => m.id === optimistic.id ? data : m))
      // Update conversation preview
      await supabase
        .from('conversations')
        .update({ last_message: content, last_message_at: data.created_at })
        .eq('id', conversationId)
    }
  }

  return { messages, loading, sendMessage }
}
