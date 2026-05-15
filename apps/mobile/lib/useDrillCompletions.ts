import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'
import { useRefreshOnForeground } from './useRefreshOnForeground'

export function useDrillCompletions(lessonId: string | null) {
  const { user } = useAuth()
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user || !lessonId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('drill_completions')
      .select('drill_index')
      .eq('lesson_id', lessonId)
    setCompleted(new Set((data ?? []).map((r: { drill_index: number }) => r.drill_index)))
    setLoading(false)
  }, [user, lessonId])

  useEffect(() => { fetch() }, [fetch])
  useRefreshOnForeground(fetch)

  async function toggleDrill(drillIndex: number) {
    if (!user || !lessonId) return

    if (completed.has(drillIndex)) {
      // Optimistic remove
      setCompleted(prev => { const s = new Set(prev); s.delete(drillIndex); return s })
      const { error } = await supabase
        .from('drill_completions')
        .delete()
        .eq('lesson_id', lessonId)
        .eq('drill_index', drillIndex)
      if (error) setCompleted(prev => new Set([...prev, drillIndex]))
    } else {
      // Optimistic add
      setCompleted(prev => new Set([...prev, drillIndex]))
      const { error } = await supabase
        .from('drill_completions')
        .insert({ lesson_id: lessonId, coach_id: user.id, drill_index: drillIndex })
      if (error) setCompleted(prev => { const s = new Set(prev); s.delete(drillIndex); return s })
    }
  }

  return { completed, loading, toggleDrill }
}
