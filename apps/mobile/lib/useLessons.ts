import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'
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

  async function createLesson(input: {
    playerName: string
    scheduledAt: Date
    court: string
    drills: string
    mentalCue: string
  }) {
    if (!user) return
    const { data, error } = await supabase
      .from('lessons')
      .insert({
        coach_id: user.id,
        player_name: input.playerName,
        scheduled_at: input.scheduledAt.toISOString(),
        court: input.court || null,
        drills: input.drills || null,
        mental_cue: input.mentalCue || null,
      })
      .select()
      .single()

    if (!error && data) setLessons(prev => [...prev, data])
    return { error: error?.message ?? null }
  }

  return { lessons, loading, createLesson, refresh: fetch }
}
