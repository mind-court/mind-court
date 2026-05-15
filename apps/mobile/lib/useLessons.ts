import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'
import { useRefreshOnForeground } from './useRefreshOnForeground'
import type { Lesson } from '../types/db'

export function useLessons() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('coach_id', user.id)
      .order('scheduled_at', { ascending: true })
    setLessons(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])
  useRefreshOnForeground(fetch)

  // Keep list in sync across devices/tabs
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('lessons-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lessons', filter: `coach_id=eq.${user.id}` },
        () => fetch(),
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetch])

  async function createLesson(input: {
    playerName: string
    playerId?: string
    scheduledAt: Date
    court: string
    durationMinutes?: number | null
    drills: string
    mentalCue: string
  }): Promise<{ error: string | null } | undefined> {
    if (!user) return
    const { data, error } = await supabase
      .from('lessons')
      .insert({
        coach_id: user.id,
        player_id: input.playerId ?? null,
        player_name: input.playerName,
        scheduled_at: input.scheduledAt.toISOString(),
        court: input.court || null,
        duration_minutes: input.durationMinutes ?? null,
        drills: input.drills || null,
        mental_cue: input.mentalCue || null,
      })
      .select()
      .single()

    if (!error && data) setLessons(prev => [...prev, data].sort(byScheduledAt))
    return { error: error?.message ?? null }
  }

  async function updateLesson(
    id: string,
    updates: Partial<Pick<Lesson, 'notes' | 'drills' | 'mental_cue' | 'duration_minutes'>>,
  ) {
    const { error } = await supabase.from('lessons').update(updates).eq('id', id)
    if (!error) setLessons(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
    return { error: error?.message ?? null }
  }

  async function deleteLesson(id: string) {
    const { error } = await supabase.from('lessons').delete().eq('id', id)
    if (!error) setLessons(prev => prev.filter(l => l.id !== id))
    return { error: error?.message ?? null }
  }

  return { lessons, loading, createLesson, updateLesson, deleteLesson, refresh: fetch }
}

function byScheduledAt(a: Lesson, b: Lesson) {
  return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
}
