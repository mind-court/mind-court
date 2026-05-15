import { useEffect, useState, useCallback, useId } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'
import { useRefreshOnForeground } from './useRefreshOnForeground'
import type { Conversation } from '../types/db'

export function isUnread(c: Conversation): boolean {
  if (!c.last_message_at) return false
  if (!c.last_read_at) return true
  return new Date(c.last_message_at).getTime() > new Date(c.last_read_at).getTime()
}

export async function markConversationRead(conversationId: string) {
  await supabase
    .from('conversations')
    .update({ last_read_at: new Date().toISOString() })
    .eq('id', conversationId)
}

export function useConversations() {
  const { user } = useAuth()
  const instanceId = useId()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('coach_id', user.id)
      .order('last_message_at', { ascending: false, nullsFirst: false })
    setConversations(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])
  useRefreshOnForeground(fetch)

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`conversations-${instanceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `coach_id=eq.${user.id}` },
        () => fetch(),
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetch])

  async function startConversation(playerName: string, playerId?: string) {
    if (!user) return { data: null, error: 'Not signed in' }

    const existing = conversations.find(c =>
      playerId ? c.player_id === playerId : c.player_name === playerName
    )
    if (existing) return { data: existing, error: null }

    const { data, error } = await supabase
      .from('conversations')
      .insert({ coach_id: user.id, player_name: playerName, player_id: playerId ?? null })
      .select()
      .single()

    if (!error && data) {
      setConversations(prev => [data, ...prev])
      return { data, error: null }
    }

    // Unique constraint violation — fetch the row that already exists.
    if (playerId) {
      const { data: existingRow } = await supabase
        .from('conversations')
        .select('*')
        .eq('coach_id', user.id)
        .eq('player_id', playerId)
        .single()
      if (existingRow) return { data: existingRow, error: null }
    }

    return { data: null, error: error?.message ?? 'Could not start conversation' }
  }

  return { conversations, loading, startConversation, refresh: fetch }
}
