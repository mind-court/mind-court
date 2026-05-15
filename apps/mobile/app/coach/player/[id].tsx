import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../../lib/supabase'
import { useLessons } from '../../../lib/useLessons'
import { usePlayers } from '../../../lib/usePlayers'
import { useConversations } from '../../../lib/useConversations'
import { EditPlayerSheet } from '../../../components/EditPlayerSheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme, spacing, fontSize, fontWeight, radius, forest, court } from '@mind-court/ui'
import { avatarColor } from '../../../lib/avatarColor'
import { formatRelativeDate } from '../../../lib/dateUtils'
import type { Player, Lesson } from '../../../types/db'

export default function PlayerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const { lessons } = useLessons()
  const { players, deletePlayer, updatePlayer } = usePlayers()
  const { startConversation } = useConversations()
  const [showEdit, setShowEdit] = useState(false)
  const [player, setPlayer] = useState<Player | null>(null)

  useEffect(() => {
    const found = players.find(p => p.id === id)
    if (found) {
      setPlayer(found)
      return
    }
    // Fallback: fetch directly if players list isn't loaded yet
    supabase.from('players').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setPlayer(data)
    })
  }, [id, players])

  const playerLessons = lessons
    .filter(l => l.player_id === id || (player && l.player_name === player.full_name))
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())

  const totalMinutes = playerLessons.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0)

  async function handleMessage() {
    if (!player) return
    const { data } = await startConversation(player.full_name, player.id)
    if (data) router.push(`/coach/thread/${data.id}`)
  }

  async function handleDelete() {
    Alert.alert(
      'Remove player',
      `Remove ${player?.full_name} from your roster? This won't delete their lesson history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deletePlayer(id)
            router.back()
          },
        },
      ],
    )
  }

  if (!player) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    )
  }

  const initials = player.full_name
    .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  const memberSince = new Date(player.created_at).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  })

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
    >
      {/* Header */}
      <View style={[styles.hero, { paddingTop: insets.top + spacing[4] }]}>
        <View style={styles.heroTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Feather name="arrow-left" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.backText}> Players</Text>
          </Pressable>
          <Pressable onPress={() => setShowEdit(true)} hitSlop={12}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>

        <View style={[styles.avatar, { backgroundColor: avatarColor(player.full_name) }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.heroName}>{player.full_name}</Text>
        <View style={styles.badges}>
          {player.is_kid_mode && (
            <View style={styles.kidBadge}>
              <Text style={styles.kidBadgeText}>Kid Mode</Text>
            </View>
          )}
          <Text style={styles.memberSince}>Member since {memberSince}</Text>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          onPress={handleMessage}
        >
          <Feather name="message-circle" size={18} color={theme.primary} />
          <Text style={styles.actionBtnText}>Message</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{playerLessons.length}</Text>
          <Text style={styles.statLabel}>Lessons</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{Math.round(totalMinutes / 60 * 10) / 10}h</Text>
          <Text style={styles.statLabel}>On court</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statTile}>
          <Text style={styles.statValue}>
            {playerLessons[0] ? formatRelativeDate(new Date(playerLessons[0].scheduled_at)) : '—'}
          </Text>
          <Text style={styles.statLabel}>
            {playerLessons[0] && new Date(playerLessons[0].scheduled_at) > new Date()
              ? 'Next session'
              : 'Last session'}
          </Text>
        </View>
      </View>

      {/* Lesson history */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Lesson history</Text>
        {playerLessons.length === 0 ? (
          <Text style={styles.empty}>No lessons recorded yet.</Text>
        ) : (
          playerLessons.map(lesson => (
            <LessonHistoryRow key={lesson.id} lesson={lesson} />
          ))
        )}
      </View>

      {/* Danger zone */}
      <View style={styles.dangerZone}>
        <Pressable
          style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
          onPress={handleDelete}
        >
          <Feather name="user-minus" size={16} color={theme.danger} />
          <Text style={styles.deleteBtnText}>Remove player</Text>
        </Pressable>
      </View>
      <EditPlayerSheet
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        player={player}
        onSave={async (updates) => {
          const result = await updatePlayer(id, {
            full_name: updates.fullName,
            is_kid_mode: updates.isKidMode,
          })
          if (!result?.error) {
            setPlayer(prev => prev ? { ...prev, full_name: updates.fullName, is_kid_mode: updates.isKidMode } : prev)
          }
          return result
        }}
      />
    </ScrollView>
  )
}

function LessonHistoryRow({ lesson }: { lesson: Lesson }) {
  const date = new Date(lesson.scheduled_at).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
  const time = new Date(lesson.scheduled_at).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <Pressable
      style={({ pressed }) => [styles.lessonRow, pressed && styles.lessonRowPressed]}
      onPress={() => router.push(`/coach/session/${lesson.id}`)}
    >
      <View style={styles.lessonDate}>
        <Text style={styles.lessonDateText}>{date}</Text>
        <Text style={styles.lessonTimeText}>{time}</Text>
      </View>
      <View style={styles.lessonInfo}>
        {lesson.court ? <Text style={styles.lessonCourt}>{lesson.court}</Text> : null}
        {lesson.mental_cue ? (
          <Text style={styles.lessonCue} numberOfLines={1}>"{lesson.mental_cue}"</Text>
        ) : null}
        {!lesson.court && !lesson.mental_cue ? (
          <Text style={styles.lessonNoDetails}>No details</Text>
        ) : null}
      </View>
      <View style={styles.lessonRight}>
        {lesson.duration_minutes ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{lesson.duration_minutes}m</Text>
          </View>
        ) : null}
        <Feather name="chevron-right" size={14} color={theme.fgFaint} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: {},
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg },

  hero: {
    backgroundColor: forest[700],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[6],
    alignItems: 'center',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: spacing[4],
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  editText: { color: 'rgba(255,255,255,0.7)', fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing[3],
  },
  avatarText: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#fff' },
  heroName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: '#fff',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  badges: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[2] },
  kidBadge: {
    backgroundColor: 'rgba(184,200,64,0.25)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
  },
  kidBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semi, color: court[300] },
  memberSince: { fontSize: fontSize.xs, color: forest[200] },

  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
  },
  actionBtnPressed: { backgroundColor: theme.bgSunken },
  actionBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semi, color: theme.primary },

  statsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    paddingVertical: spacing[5],
  },
  statTile: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: theme.fg },
  statLabel: {
    fontSize: fontSize.xs, color: theme.fgSubtle, marginTop: 2,
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  statDivider: { width: 1, height: 40, backgroundColor: theme.borderSubtle, alignSelf: 'center' },

  section: { padding: spacing[5], gap: spacing[2] },
  sectionLabel: {
    fontSize: fontSize.xs, fontWeight: fontWeight.semi, color: theme.fgSubtle,
    letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: spacing[1],
  },
  empty: { fontSize: fontSize.base, color: theme.fgMuted },

  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgElevated,
    borderRadius: radius.md,
    padding: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: theme.border,
    gap: spacing[3],
  },
  lessonRowPressed: { backgroundColor: theme.bgSunken },
  lessonDate: { minWidth: 90 },
  lessonDateText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: theme.fg },
  lessonTimeText: { fontSize: fontSize.xs, color: theme.fgMuted, marginTop: 1 },
  lessonInfo: { flex: 1 },
  lessonCourt: { fontSize: fontSize.sm, color: theme.fgSubtle },
  lessonCue: { fontSize: fontSize.xs, color: court[700], fontStyle: 'italic' },
  lessonNoDetails: { fontSize: fontSize.sm, color: theme.fgFaint },
  lessonRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  durationBadge: {
    backgroundColor: court[100], borderRadius: 999,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  durationText: { fontSize: 11, fontWeight: fontWeight.semi, color: court[700] },

  dangerZone: {
    marginHorizontal: spacing[5],
    marginTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    paddingTop: spacing[5],
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    alignSelf: 'flex-start',
    padding: spacing[2],
  },
  deleteBtnPressed: { opacity: 0.5 },
  deleteBtnText: { fontSize: fontSize.base, color: theme.danger, fontWeight: fontWeight.medium },
})
