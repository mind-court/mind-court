import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'
import { useRefreshOnForeground } from './useRefreshOnForeground'
import type { Player } from '../types/db'

export function usePlayers() {
  const { user } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('coach_id', user.id)
      .order('full_name', { ascending: true })
    setPlayers(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])
  useRefreshOnForeground(fetch)

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('players-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `coach_id=eq.${user.id}` },
        () => fetch(),
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetch])

  async function createPlayer(input: { fullName: string; isKidMode: boolean }) {
    if (!user) return { error: 'Not signed in' }
    const { data, error } = await supabase
      .from('players')
      .insert({ coach_id: user.id, full_name: input.fullName, is_kid_mode: input.isKidMode })
      .select()
      .single()
    if (!error && data) setPlayers(prev => [...prev, data].sort(byName))
    return { error: error?.message ?? null }
  }

  async function updatePlayer(id: string, updates: Partial<Pick<Player, 'full_name' | 'is_kid_mode'>>) {
    const { error } = await supabase.from('players').update(updates).eq('id', id)
    if (!error) setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p).sort(byName))
    return { error: error?.message ?? null }
  }

  async function deletePlayer(id: string) {
    const { error } = await supabase.from('players').delete().eq('id', id)
    if (!error) setPlayers(prev => prev.filter(p => p.id !== id))
    return { error: error?.message ?? null }
  }

  return { players, loading, createPlayer, updatePlayer, deletePlayer, refresh: fetch }
}

function byName(a: Player, b: Player) {
  return a.full_name.localeCompare(b.full_name)
}
