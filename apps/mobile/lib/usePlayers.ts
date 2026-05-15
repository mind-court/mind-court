import { useEffect, useState, useCallback, useId } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'
import { useRefreshOnForeground } from './useRefreshOnForeground'
import type { Player, PlayerIntake } from '../types/db'

export function usePlayers() {
  const { user } = useAuth()
  const instanceId = useId()
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
      .channel(`players-${instanceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `coach_id=eq.${user.id}` },
        () => fetch(),
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetch])

  async function createPlayer(input: PlayerIntake) {
    if (!user) return { error: 'Not signed in' }
    const { data, error } = await supabase
      .from('players')
      .insert({
        coach_id: user.id,
        full_name: input.fullName,
        is_kid_mode: input.isKidMode,
        skill_level: emptyToNull(input.skillLevel),
        contact_phone: emptyToNull(input.contactPhone),
        contact_email: emptyToNull(input.contactEmail),
        birthdate: emptyToNull(input.birthdate),
        lesson_cadence: emptyToNull(input.lessonCadence),
        primary_focus: emptyToNull(input.primaryFocus),
        intake_notes: emptyToNull(input.intakeNotes),
        parent_name: emptyToNull(input.parentName),
        parent_phone: emptyToNull(input.parentPhone),
      })
      .select()
      .single()
    if (!error && data) setPlayers(prev => [...prev, data].sort(byName))
    return { error: error?.message ?? null }
  }

  async function updatePlayer(id: string, input: PlayerIntake) {
    const updates = {
      full_name: input.fullName,
      is_kid_mode: input.isKidMode,
      skill_level: emptyToNull(input.skillLevel),
      contact_phone: emptyToNull(input.contactPhone),
      contact_email: emptyToNull(input.contactEmail),
      birthdate: emptyToNull(input.birthdate),
      lesson_cadence: emptyToNull(input.lessonCadence),
      primary_focus: emptyToNull(input.primaryFocus),
      intake_notes: emptyToNull(input.intakeNotes),
      parent_name: emptyToNull(input.parentName),
      parent_phone: emptyToNull(input.parentPhone),
    }
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

function emptyToNull(v: string | undefined | null): string | null {
  if (v == null) return null
  const trimmed = v.trim()
  return trimmed.length === 0 ? null : trimmed
}
