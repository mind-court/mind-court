import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'
import type { Conversation } from '../types/db'

export function useConversations() {
  const { user } = useAuth()
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

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('conversations-changes')
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

    // Reuse existing conversation if one exists for this player
    const existing = conversations.find(c =>
      playerId ? c.player_id === playerId : c.player_name === playerName
    )
    if (existing) return { data: existing, error: null }

    const { data, error } = await supabase
      .from('conversations')
      .insert({ coach_id: user.id, player_name: playerName, player_id: playerId ?? null })
      .select()
      .single()

    if (!error && data) setConversations(prev => [data, ...prev])
    return { data: data ?? null, error: error?.message ?? null }
  }

  return { conversations, loading, startConversation, refresh: fetch }
}
