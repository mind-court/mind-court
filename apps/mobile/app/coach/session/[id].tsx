import { useEffect, useState, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDrillCompletions } from '../../../lib/useDrillCompletions'
import { EditLessonSheet } from '../../../components/EditLessonSheet'
import { theme, spacing, fontSize, fontWeight, radius, court, forest } from '@mind-court/ui'
import type { Lesson } from '../../../types/db'
import type { LessonEdits } from '../../../components/EditLessonSheet'

export default function Session() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [drills, setDrills] = useState<string[]>([])
  const { completed, toggleDrill } = useDrillCompletions(id)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single()
      if (data) {
        setLesson(data)
        setDrills(
          (data.drills ?? '')
            .split('\n')
            .map((d: string) => d.trim())
            .filter(Boolean)
        )
        setNotes(data.notes ?? '')
      }
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running])

  const saveNotes = useCallback(async (value: string) => {
    if (!lesson) return
    await supabase.from('lessons').update({ notes: value }).eq('id', lesson.id)
  }, [lesson])

  async function handleFinish() {
    if (!lesson || elapsed === 0) return
    const minutes = Math.max(1, Math.round(elapsed / 60))
    await supabase.from('lessons').update({ duration_minutes: minutes }).eq('id', lesson.id)
    router.back()
  }

  async function handleEditSave(edits: LessonEdits) {
    if (!lesson) return
    const updates = {
      court: edits.court || null,
      scheduled_at: edits.scheduledAt.toISOString(),
      duration_minutes: edits.durationMinutes,
      drills: edits.drills || null,
      mental_cue: edits.mentalCue || null,
    }
    const { error } = await supabase.from('lessons').update(updates).eq('id', lesson.id)
    const result = { error: error?.message ?? null }
    if (!result.error && lesson) {
      setLesson(prev => prev ? {
        ...prev,
        court: edits.court || null,
        scheduled_at: edits.scheduledAt.toISOString(),
        duration_minutes: edits.durationMinutes,
        drills: edits.drills || null,
        mental_cue: edits.mentalCue || null,
      } : prev)
      setDrills(
        (edits.drills || '').split('\n').map(d => d.trim()).filter(Boolean)
      )
    }
    return result
  }

  function handleDelete() {
    Alert.alert(
      'Delete lesson',
      `Remove this lesson with ${lesson?.player_name}? This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!lesson) return
            await supabase.from('lessons').delete().eq('id', lesson.id)
            router.back()
          },
        },
      ],
    )
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.primary} />
      </View>
    )
  }

  if (!lesson) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Lesson not found.</Text>
      </View>
    )
  }

  const time = new Date(lesson.scheduled_at).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })

  const initials = lesson.player_name
    .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >

        {/* ── Hero ── */}
        <View style={[styles.hero, { paddingTop: insets.top + spacing[4] }]}>
          <View style={styles.heroTop}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
              <Text style={styles.backText}>‹ Back</Text>
            </Pressable>
            <Pressable onPress={() => setShowEdit(true)} hitSlop={12}>
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.heroMeta}>
            <View style={styles.heroLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View>
                <Text style={styles.heroName}>{lesson.player_name}</Text>
                <Text style={styles.heroSub}>
                  {lesson.court ? `${lesson.court} · ` : ''}{time}
                </Text>
              </View>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          <View style={styles.timerRow}>
            <Pressable
              style={({ pressed }) => [styles.timerBtn, pressed && styles.timerBtnPressed]}
              onPress={() => setRunning(r => !r)}
            >
              <Text style={styles.timerBtnText}>{running ? '⏸ Pause' : '▶ Start timer'}</Text>
            </Pressable>
            <Text style={styles.timerDisplay}>{mm}:{ss}</Text>
            <Pressable
              style={({ pressed }) => [styles.notesBtn, pressed && styles.notesBtnActive, showNotes && styles.notesBtnActive]}
              onPress={() => setShowNotes(v => !v)}
            >
              <Text style={styles.notesBtnText}>Notes</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Notes ── */}
        {showNotes && (
          <View style={styles.notesBox}>
            <Text style={styles.sectionLabel}>Session notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes during the session…"
              placeholderTextColor={theme.fgFaint}
              value={notes}
              onChangeText={setNotes}
              onBlur={() => saveNotes(notes)}
              multiline
              textAlignVertical="top"
            />
          </View>
        )}

        {/* ── Focus ── */}
        {lesson.mental_cue ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Mental cue</Text>
            <View style={styles.cueCard}>
              <Text style={styles.cueText}>"{lesson.mental_cue}"</Text>
            </View>
          </View>
        ) : null}

        {/* ── Drills ── */}
        {drills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Drills · {completed.size}/{drills.length} done
            </Text>
            {drills.map((drill, i) => (
              <DrillRow
                key={i}
                index={i + 1}
                title={drill}
                done={completed.has(i)}
                onPress={() => toggleDrill(i)}
              />
            ))}
          </View>
        )}

        {drills.length === 0 && !lesson.mental_cue && (
          <View style={styles.emptySession}>
            <Text style={styles.emptyText}>Nothing planned yet — free to run it your way.</Text>
          </View>
        )}

        <View style={styles.footer}>
          {elapsed > 0 && (
            <Pressable
              style={({ pressed }) => [styles.finishBtn, pressed && styles.finishBtnPressed]}
              onPress={handleFinish}
            >
              <Text style={styles.finishBtnText}>
                Finish session · {Math.max(1, Math.round(elapsed / 60))} min
              </Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
            onPress={handleDelete}
          >
            <Text style={styles.deleteBtnText}>Delete lesson</Text>
          </Pressable>
        </View>

      </ScrollView>

      {lesson && (
        <EditLessonSheet
          visible={showEdit}
          onClose={() => setShowEdit(false)}
          onSave={handleEditSave}
          lesson={lesson}
        />
      )}
    </KeyboardAvoidingView>
  )
}

function DrillRow({
  index, title, done, onPress,
}: {
  index: number; title: string; done: boolean; onPress: () => void
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.drillRow, done && styles.drillRowDone, pressed && styles.drillRowPressed]}
      onPress={onPress}
    >
      <View style={[styles.drillIndex, done && styles.drillIndexDone]}>
        {done
          ? <Text style={styles.drillCheckmark}>✓</Text>
          : <Text style={styles.drillIndexText}>{index}</Text>
        }
      </View>
      <Text style={[styles.drillTitle, done && styles.drillTitleDone]}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  scroll: { paddingBottom: spacing[12] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg },
  errorText: { fontSize: fontSize.base, color: theme.fgMuted },

  // Hero
  hero: {
    backgroundColor: forest[700],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[5],
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  backBtn: {},
  backText: { color: '#fff', fontSize: fontSize.base, opacity: 0.8 },
  editText: { color: 'rgba(255,255,255,0.7)', fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[5],
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: forest[500],
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#fff' },
  heroName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: '#fff',
    letterSpacing: -0.3,
  },
  heroSub: { fontSize: fontSize.sm, color: forest[100], marginTop: 2 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(184,200,64,0.2)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: court[500] },
  liveText: { fontSize: fontSize.xs, fontWeight: fontWeight.semi, color: court[300] },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  timerBtn: {
    flex: 1,
    backgroundColor: court[500],
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  timerBtnPressed: { backgroundColor: court[400] },
  timerBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semi, color: forest[900] },
  timerDisplay: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#fff',
    minWidth: 56,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  notesBtn: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  notesBtnActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  notesBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semi, color: '#fff' },

  // Notes
  notesBox: {
    padding: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  notesInput: {
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    padding: spacing[4],
    fontSize: fontSize.base,
    color: theme.fg,
    minHeight: 100,
    marginTop: spacing[2],
  },

  // Sections
  section: { padding: spacing[5], gap: spacing[3] },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: theme.fgSubtle,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },

  // Cue card
  cueCard: {
    backgroundColor: court[100],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: court[200],
    padding: spacing[4],
  },
  cueText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semi,
    color: forest[800],
    lineHeight: 28,
  },

  // Drills
  drillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: theme.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing[3],
  },
  drillRowDone: { opacity: 0.5 },
  drillRowPressed: { backgroundColor: theme.bgSunken },
  drillIndex: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: theme.bgSunken,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  drillIndexDone: { backgroundColor: forest[700] },
  drillIndexText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: theme.fgSubtle,
  },
  drillCheckmark: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  drillTitle: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: theme.fg,
  },
  drillTitleDone: { textDecorationLine: 'line-through', color: theme.fgMuted },

  emptySession: {
    padding: spacing[8],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.base,
    color: theme.fgMuted,
    textAlign: 'center',
  },

  footer: {
    padding: spacing[5],
    paddingTop: spacing[8],
    alignItems: 'center',
    gap: spacing[4],
  },
  finishBtn: {
    backgroundColor: court[500],
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  finishBtnPressed: { backgroundColor: court[400] },
  finishBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
    color: forest[900],
  },
  deleteBtn: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  deleteBtnPressed: { opacity: 0.5 },
  deleteBtnText: {
    fontSize: fontSize.sm,
    color: theme.fgFaint,
    fontWeight: fontWeight.medium,
  },
})
