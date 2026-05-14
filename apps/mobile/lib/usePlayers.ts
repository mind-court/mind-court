import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'
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

  async function createPlayer(input: { fullName: string; isKidMode: boolean }) {
    if (!user) return { error: 'Not signed in' }
    const { data, error } = await supabase
      .from('players')
      .insert({
        coach_id: user.id,
        full_name: input.fullName,
        is_kid_mode: input.isKidMode,
      })
      .select()
      .single()
    if (!error && data) setPlayers(prev => [...prev, data].sort((a, b) => a.full_name.localeCompare(b.full_name)))
    return { error: error?.message ?? null }
  }

  return { players, loading, createPlayer, refresh: fetch }
}
