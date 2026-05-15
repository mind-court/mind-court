import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Animated,
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
  const { id, welcome } = useLocalSearchParams<{ id: string; welcome?: string }>()
  const isWelcome = welcome === '1'
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
            const { error } = await deletePlayer(id)
            if (error) {
              Alert.alert('Error', 'Could not remove player. Please try again.')
            } else {
              router.back()
            }
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
      {/* Welcome banner — appears when arriving from Add Player */}
      {isWelcome && <WelcomeBanner firstName={firstNameOf(player.full_name)} topInset={insets.top} />}

      {/* Header */}
      <View style={[styles.hero, { paddingTop: insets.top + spacing[4] }]}>
        <View style={styles.heroTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Feather name="arrow-left" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.backText}> Players</Text>
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

      {/* Next-action ribbon — Schedule / Message / Edit */}
      <View style={styles.actionsRow}>
        <ActionPill
          icon="calendar"
          label={playerLessons.length === 0 ? 'Schedule first lesson' : 'Schedule'}
          accent={isWelcome && playerLessons.length === 0}
          onPress={() => router.push('/coach')}
        />
        <ActionPill
          icon="message-circle"
          label="Message"
          onPress={handleMessage}
        />
        <ActionPill
          icon="edit-2"
          label="Edit"
          onPress={() => setShowEdit(true)}
        />
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

      {/* Profile */}
      <ProfileSection player={player} />

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
        onSave={async (input) => {
          const result = await updatePlayer(id, input)
          if (!result?.error) {
            setPlayer(prev => prev ? {
              ...prev,
              full_name: input.fullName,
              is_kid_mode: input.isKidMode,
              skill_level: input.skillLevel?.trim() || null,
              contact_phone: input.contactPhone?.trim() || null,
              contact_email: input.contactEmail?.trim() || null,
              birthdate: input.birthdate?.trim() || null,
              lesson_cadence: input.lessonCadence?.trim() || null,
              primary_focus: input.primaryFocus?.trim() || null,
              intake_notes: input.intakeNotes?.trim() || null,
              parent_name: input.parentName?.trim() || null,
              parent_phone: input.parentPhone?.trim() || null,
            } : prev)
          }
          return result
        }}
      />
    </ScrollView>
  )
}

function WelcomeBanner({ firstName, topInset }: { firstName: string; topInset: number }) {
  const opacity = useRef(new Animated.Value(0)).current
  const translate = useRef(new Animated.Value(-32)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(translate, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
    ]).start()

    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(translate, { toValue: -32, duration: 500, useNativeDriver: true }),
      ]).start()
    }, 3500)
    return () => clearTimeout(t)
  }, [opacity, translate])

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.welcomeBanner,
        { paddingTop: topInset + 6, opacity, transform: [{ translateY: translate }] },
      ]}
    >
      <View style={styles.welcomePill}>
        <Feather name="check-circle" size={18} color={forest[900]} />
        <Text style={styles.welcomeText}>{firstName} is on your roster 🎾</Text>
      </View>
    </Animated.View>
  )
}

function ActionPill({
  icon, label, onPress, accent,
}: {
  icon: keyof typeof Feather.glyphMap
  label: string
  onPress: () => void
  accent?: boolean
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionBtn,
        accent && styles.actionBtnAccent,
        pressed && styles.actionBtnPressed,
      ]}
      onPress={onPress}
    >
      <Feather
        name={icon}
        size={18}
        color={accent ? forest[900] : theme.primary}
      />
      <Text
        style={[styles.actionBtnText, accent && styles.actionBtnTextAccent]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  )
}

function firstNameOf(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full
}

function ProfileSection({ player }: { player: Player }) {
  const facts: { label: string; value: string }[] = []
  if (player.skill_level) facts.push({ label: 'Skill level', value: player.skill_level })
  if (player.birthdate) {
    const age = ageFromBirthdate(player.birthdate)
    const formatted = formatBirthdate(player.birthdate)
    facts.push({ label: 'Birthdate', value: age != null ? `${formatted} · ${age}` : formatted })
  }
  if (player.lesson_cadence) facts.push({ label: 'Cadence', value: player.lesson_cadence })
  if (player.primary_focus) facts.push({ label: 'Focus', value: player.primary_focus })

  const hasContact = player.contact_phone || player.contact_email
  const hasParent = player.is_kid_mode && (player.parent_name || player.parent_phone)
  const hasNotes = !!player.intake_notes
  const hasAnything = facts.length > 0 || hasContact || hasParent || hasNotes

  if (!hasAnything) return null

  return (
    <View style={styles.profileWrap}>
      <Text style={styles.sectionLabel}>Profile</Text>

      {facts.length > 0 && (
        <View style={styles.factGrid}>
          {facts.map(f => (
            <View key={f.label} style={styles.factTile}>
              <Text style={styles.factLabel}>{f.label}</Text>
              <Text style={styles.factValue} numberOfLines={2}>{f.value}</Text>
            </View>
          ))}
        </View>
      )}

      {hasContact && (
        <View style={styles.contactRow}>
          {player.contact_phone && (
            <View style={styles.contactItem}>
              <Feather name="phone" size={14} color={theme.fgSubtle} />
              <Text style={styles.contactText}>{player.contact_phone}</Text>
            </View>
          )}
          {player.contact_email && (
            <View style={styles.contactItem}>
              <Feather name="mail" size={14} color={theme.fgSubtle} />
              <Text style={styles.contactText} numberOfLines={1}>{player.contact_email}</Text>
            </View>
          )}
        </View>
      )}

      {hasParent && (
        <View style={styles.parentCard}>
          <View style={styles.parentHeader}>
            <Feather name="users" size={13} color={court[700]} />
            <Text style={styles.parentTitle}>Parent contact</Text>
          </View>
          {player.parent_name && <Text style={styles.parentName}>{player.parent_name}</Text>}
          {player.parent_phone && (
            <View style={styles.contactItem}>
              <Feather name="phone" size={13} color={court[700]} />
              <Text style={[styles.contactText, { color: court[700] }]}>{player.parent_phone}</Text>
            </View>
          )}
        </View>
      )}

      {hasNotes && (
        <View style={styles.notesCard}>
          <Text style={styles.notesLabel}>Intake notes</Text>
          <Text style={styles.notesText}>{player.intake_notes}</Text>
        </View>
      )}
    </View>
  )
}

function ageFromBirthdate(birthdate: string): number | null {
  const d = new Date(birthdate)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const monthDiff = now.getMonth() - d.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) age--
  return age >= 0 && age < 130 ? age : null
}

function formatBirthdate(birthdate: string): string {
  const d = new Date(birthdate)
  if (Number.isNaN(d.getTime())) return birthdate
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
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
  actionBtnAccent: {
    backgroundColor: court[300],
    borderColor: court[400],
  },
  actionBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semi, color: theme.primary },
  actionBtnTextAccent: { color: forest[900] },

  welcomeBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  welcomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: court[300],
    borderRadius: radius.pill,
    paddingHorizontal: spacing[4],
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  welcomeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
    color: forest[900],
  },

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

  profileWrap: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    gap: spacing[3],
  },
  factGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  factTile: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: 2,
  },
  factLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semi,
    color: theme.fgSubtle,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  factValue: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: theme.fg },

  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  contactText: { fontSize: fontSize.sm, color: theme.fg },

  parentCard: {
    backgroundColor: court[100],
    borderWidth: 1,
    borderColor: court[200],
    borderRadius: radius.md,
    padding: spacing[3],
    gap: 4,
  },
  parentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  parentTitle: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: court[700],
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  parentName: { fontSize: fontSize.sm, fontWeight: fontWeight.semi, color: theme.fg },

  notesCard: {
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    padding: spacing[3],
    gap: 4,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semi,
    color: theme.fgSubtle,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  notesText: { fontSize: fontSize.sm, color: theme.fg, lineHeight: 19 },

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
    backgroundColor: forest[50], borderRadius: 999,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  durationText: { fontSize: 11, fontWeight: fontWeight.semi, color: forest[700] },

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
