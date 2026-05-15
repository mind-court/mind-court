import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, Pressable, StyleSheet, Alert, TextInput, ActivityIndicator, Linking, Platform,
  RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth'
import { useLessons } from '../../lib/useLessons'
import { usePlayers } from '../../lib/usePlayers'
import { avatarColor } from '../../lib/avatarColor'
import { Screen } from '../../components/Screen'
import { BottomSheet } from '../../components/BottomSheet'
import { theme, spacing, fontSize, fontWeight, radius, forest, sand, court, Logo, LogoMark } from '@mind-court/ui'

const APP_VERSION = '0.0.1'

type FeatherName = React.ComponentProps<typeof Feather>['name']

export default function Account() {
  const {
    profile, user, signOut, signOutEverywhere, updateProfile, changePassword, refreshProfile,
  } = useAuth()
  const { lessons, refresh: refreshLessons } = useLessons()
  const { players, refresh: refreshPlayers } = usePlayers()
  const [editing, setEditing] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([refreshProfile(), refreshLessons(), refreshPlayers()])
    } finally {
      setRefreshing(false)
    }
  }, [refreshProfile, refreshLessons, refreshPlayers])

  const fullName = profile?.full_name?.trim() || 'Add your name'
  const initials = profile?.full_name
    ?.split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'
  const avatarBg = avatarColor(profile?.full_name?.trim() || user?.email || 'coach')

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lessonsThisMonth = lessons.filter(l => new Date(l.scheduled_at) >= monthStart)
  const hoursThisMonth = Math.round(
    lessonsThisMonth.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0) / 60,
  )
  const coachSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '—'

  function handleSignOut() {
    Alert.alert('Sign out', 'Sign out of Mind Court?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut()
          router.replace('/sign-in')
        },
      },
    ])
  }

  function handleSignOutEverywhere() {
    Alert.alert(
      'Sign out everywhere',
      'You\'ll be signed out of Mind Court on this device and every other device where you\'re signed in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out everywhere',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOutEverywhere()
            if (error) {
              Alert.alert('Sign out failed', error)
              return
            }
            router.replace('/sign-in')
          },
        },
      ],
    )
  }

  function handleHelp() {
    const subject = encodeURIComponent('Mind Court — help')
    const body = encodeURIComponent(`\n\n---\nFrom: ${profile?.full_name ?? ''} <${user?.email ?? ''}>`)
    Linking.openURL(`mailto:support@mindcourt.app?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert('Email unavailable', 'Reach us at support@mindcourt.app')
    })
  }

  return (
    <>
      <Screen
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.heroNameRow}>
            <Text style={styles.heroName} numberOfLines={1}>{fullName}</Text>
            <Pressable
              onPress={() => setEditing(true)}
              hitSlop={10}
              style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
              accessibilityLabel="Edit profile"
            >
              <Feather name="edit-2" size={14} color={theme.fgMuted} />
            </Pressable>
          </View>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>Coach</Text>
          </View>
          <Text style={styles.heroEmail} numberOfLines={1}>{user?.email ?? '—'}</Text>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <Stat value={players.length} label="Players" />
          <View style={styles.statDivider} />
          <Stat value={lessonsThisMonth.length} label="Lessons" sublabel="this mo." />
          <View style={styles.statDivider} />
          <Stat value={hoursThisMonth} label="Hours" sublabel="this mo." />
        </View>

        <SectionLabel>Profile</SectionLabel>
        <View style={styles.card}>
          <InfoRow label="Full name" value={fullName} onPress={() => setEditing(true)} first />
          <InfoRow label="Email" value={user?.email ?? '—'} />
          <InfoRow label="Coach since" value={coachSince} last />
        </View>

        <SectionLabel>Security</SectionLabel>
        <View style={styles.card}>
          <SettingRow
            icon="lock"
            label="Change password"
            onPress={() => setChangingPwd(true)}
            first
          />
          <SettingRow
            icon="log-out"
            label="Sign out everywhere"
            hint="All devices"
            onPress={handleSignOutEverywhere}
            last
          />
        </View>

        <SectionLabel>App</SectionLabel>
        <View style={styles.card}>
          <SettingRow icon="bell" label="Notifications" hint="Coming soon" disabled first />
          <SettingRow icon="help-circle" label="Help & support" onPress={handleHelp} />
          <SettingRow
            icon="info"
            label="About Mind Court"
            hint={`v${APP_VERSION}`}
            onPress={() => setShowAbout(true)}
            last
          />
        </View>

        <View style={[styles.card, styles.dangerCard]}>
          <SettingRow icon="log-out" label="Sign out" onPress={handleSignOut} danger first last />
        </View>

        <View style={styles.footer}>
          <LogoMark size={28} variant="dark" />
          <Text style={styles.footerText}>Mind Court · v{APP_VERSION}</Text>
        </View>
      </Screen>

      <EditNameSheet
        visible={editing}
        initial={profile?.full_name ?? ''}
        onClose={() => setEditing(false)}
        onSave={async name => {
          const result = await updateProfile({ full_name: name })
          return result
        }}
      />

      <ChangePasswordSheet
        visible={changingPwd}
        onClose={() => setChangingPwd(false)}
        onSave={changePassword}
      />

      <AboutSheet
        visible={showAbout}
        onClose={() => setShowAbout(false)}
      />
    </>
  )
}

// ─── About sheet ─────────────────────────────────────────────────────────────

function AboutSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={about.header}>
        <Pressable onPress={onClose} hitSlop={12} style={sheet.closeBtn}>
          <Feather name="x" size={18} color={theme.fgMuted} />
        </Pressable>
      </View>
      <View style={about.body}>
        <View style={about.brand}>
          <Logo height={48} variant="dark" />
        </View>
        <View style={about.accentBar} />
        <Text style={about.tagline}>
          Tennis lesson planning, scheduling, and player notes — built for coaches.
        </Text>
        <View style={about.metaRow}>
          <Text style={about.metaLabel}>Version</Text>
          <Text style={about.metaValue}>{APP_VERSION}</Text>
        </View>
      </View>
    </BottomSheet>
  )
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function Stat({ value, label, sublabel }: { value: number; label: string; sublabel?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sublabel ? <Text style={styles.statSub}>{sublabel}</Text> : null}
    </View>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>
}

function InfoRow({
  label, value, onPress, first, last,
}: { label: string; value: string; onPress?: () => void; first?: boolean; last?: boolean }) {
  const body = (
    <View style={[styles.row, first && styles.rowFirst, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
        {onPress ? <Feather name="chevron-right" size={16} color={theme.fgFaint} /> : null}
      </View>
    </View>
  )
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>{body}</Pressable>
  ) : body
}

function SettingRow({
  icon, label, hint, onPress, danger, disabled, first, last,
}: {
  icon: FeatherName
  label: string
  hint?: string
  onPress?: () => void
  danger?: boolean
  disabled?: boolean
  first?: boolean
  last?: boolean
}) {
  const content = (
    <View style={[styles.settingRow, first && styles.rowFirst, last && styles.rowLast]}>
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        <Feather name={icon} size={15} color={danger ? theme.danger : forest[700]} />
      </View>
      <Text style={[styles.settingLabel, danger && styles.settingLabelDanger, disabled && styles.disabledText]}>
        {label}
      </Text>
      {hint ? <Text style={[styles.settingHint, disabled && styles.disabledText]}>{hint}</Text> : null}
      {!danger && !disabled && onPress ? (
        <Feather name="chevron-right" size={16} color={theme.fgFaint} />
      ) : null}
    </View>
  )
  if (disabled || !onPress) return content
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  )
}

// ─── Edit Name Sheet ─────────────────────────────────────────────────────────

function EditNameSheet({
  visible, initial, onClose, onSave,
}: {
  visible: boolean
  initial: string
  onClose: () => void
  onSave: (name: string) => Promise<{ error: string | null }>
}) {
  const [name, setName] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const prevVisible = useRef(false)

  useEffect(() => {
    if (visible && !prevVisible.current) {
      setName(initial)
      setError('')
    }
    prevVisible.current = visible
  }, [visible, initial])

  const trimmed = name.trim()
  const canSave = trimmed.length > 0 && trimmed !== initial.trim() && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError('')
    const { error } = await onSave(trimmed)
    setSaving(false)
    if (error) setError(error)
    else onClose()
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={sheet.header}>
        <View style={{ flex: 1 }}>
          <Text style={sheet.title}>Edit profile</Text>
          <Text style={sheet.subtitle}>How players see your name in Mind Court.</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={12} style={sheet.closeBtn}>
          <Feather name="x" size={18} color={theme.fgMuted} />
        </Pressable>
      </View>

      <View style={sheet.body}>
        <Text style={sheet.fieldLabel}>Full name</Text>
        <TextInput
          style={sheet.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={theme.fgFaint}
          autoCapitalize="words"
          autoFocus={Platform.OS === 'ios'}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
        {error ? <Text style={sheet.error}>{error}</Text> : null}
      </View>

      <View style={sheet.footer}>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={({ pressed }) => [
            sheet.save,
            pressed && sheet.savePressed,
            !canSave && sheet.saveDisabled,
          ]}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={sheet.saveText}>Save</Text>}
        </Pressable>
      </View>
    </BottomSheet>
  )
}

// ─── Change Password Sheet ───────────────────────────────────────────────────

function ChangePasswordSheet({
  visible, onClose, onSave,
}: {
  visible: boolean
  onClose: () => void
  onSave: (newPassword: string) => Promise<{ error: string | null }>
}) {
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const prevVisible = useRef(false)

  useEffect(() => {
    if (visible && !prevVisible.current) {
      setPwd(''); setConfirm(''); setShow(false); setError('')
    }
    prevVisible.current = visible
  }, [visible])

  const tooShort = pwd.length > 0 && pwd.length < 8
  const mismatch = confirm.length > 0 && pwd !== confirm
  const canSave = pwd.length >= 8 && pwd === confirm && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError('')
    const { error } = await onSave(pwd)
    setSaving(false)
    if (error) {
      setError(error)
      return
    }
    Alert.alert('Password updated', 'Your password has been changed.')
    onClose()
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={sheet.header}>
        <View style={{ flex: 1 }}>
          <Text style={sheet.title}>Change password</Text>
          <Text style={sheet.subtitle}>Use at least 8 characters. Avoid reusing an old one.</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={12} style={sheet.closeBtn}>
          <Feather name="x" size={18} color={theme.fgMuted} />
        </Pressable>
      </View>

      <View style={sheet.body}>
        <Text style={sheet.fieldLabel}>New password</Text>
        <TextInput
          style={sheet.input}
          value={pwd}
          onChangeText={setPwd}
          placeholder="At least 8 characters"
          placeholderTextColor={theme.fgFaint}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />

        <View style={{ height: spacing[3] }} />

        <Text style={sheet.fieldLabel}>Confirm new password</Text>
        <TextInput
          style={sheet.input}
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Re-enter your new password"
          placeholderTextColor={theme.fgFaint}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        <Pressable onPress={() => setShow(s => !s)} hitSlop={8} style={sheet.toggleRow}>
          <Feather name={show ? 'eye-off' : 'eye'} size={14} color={theme.fgMuted} />
          <Text style={sheet.toggleText}>{show ? 'Hide passwords' : 'Show passwords'}</Text>
        </Pressable>

        {tooShort ? <Text style={sheet.hint}>Use at least 8 characters.</Text> : null}
        {mismatch ? <Text style={sheet.hint}>Passwords don't match.</Text> : null}
        {error ? <Text style={sheet.error}>{error}</Text> : null}
      </View>

      <View style={sheet.footer}>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={({ pressed }) => [
            sheet.save,
            pressed && sheet.savePressed,
            !canSave && sheet.saveDisabled,
          ]}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={sheet.saveText}>Update password</Text>}
        </Pressable>
      </View>
    </BottomSheet>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: spacing[3],
    paddingBottom: spacing[5],
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
    maxWidth: '90%',
  },
  heroName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: theme.fg,
    letterSpacing: -0.3,
  },
  editBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center', justifyContent: 'center',
  },
  rolePill: {
    backgroundColor: forest[50],
    borderWidth: 1,
    borderColor: forest[100],
    borderRadius: radius.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
    marginTop: spacing[2],
  },
  rolePillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: forest[700],
  },
  heroEmail: {
    fontSize: fontSize.xs,
    color: theme.fgSubtle,
    marginTop: spacing[1],
  },

  stats: {
    flexDirection: 'row',
    backgroundColor: theme.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: spacing[3],
    marginBottom: spacing[2],
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.borderSubtle,
    marginVertical: 4,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: theme.fg,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semi,
    color: theme.fgSubtle,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  statSub: {
    fontSize: 10,
    color: theme.fgFaint,
    marginTop: 1,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: theme.fgSubtle,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: spacing[5],
    marginBottom: spacing[2],
    paddingHorizontal: spacing[1],
  },

  card: {
    backgroundColor: theme.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  dangerCard: {
    marginTop: spacing[5],
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
  },
  rowFirst: { borderTopWidth: 0 },
  rowLast: {},
  rowLabel: {
    fontSize: fontSize.sm,
    color: theme.fgMuted,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: spacing[4],
  },
  rowValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: theme.fg,
    textAlign: 'right',
    flexShrink: 1,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: 12,
    paddingHorizontal: spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
  },
  settingIcon: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: forest[50],
    alignItems: 'center', justifyContent: 'center',
  },
  settingIconDanger: {
    backgroundColor: theme.dangerBg,
  },
  settingLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: theme.fg,
  },
  settingLabelDanger: { color: theme.danger },
  settingHint: {
    fontSize: fontSize.xs,
    color: theme.fgSubtle,
  },
  disabledText: { color: theme.fgFaint },

  pressed: { opacity: 0.6 },

  footer: {
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[6],
  },
  footerText: {
    fontSize: 11,
    color: sand[500],
  },
})

const about = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing[3],
  },
  body: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    alignItems: 'flex-start',
  },
  brand: {
    marginTop: spacing[1],
  },
  accentBar: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: court[500],
    marginTop: spacing[3],
    marginBottom: spacing[3],
  },
  tagline: {
    fontSize: fontSize.base,
    color: theme.fgMuted,
    lineHeight: 22,
    marginBottom: spacing[5],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
  },
  metaLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: theme.fgSubtle,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: theme.fg,
  },
})

const sheet = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    gap: spacing[3],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: theme.fg,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: theme.fgMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: theme.bgSunken,
    alignItems: 'center', justifyContent: 'center',
  },

  body: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    gap: 6,
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: theme.fgMuted,
  },
  input: {
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: 10,
    fontSize: fontSize.base,
    color: theme.fg,
  },
  error: {
    fontSize: fontSize.sm,
    color: theme.danger,
    marginTop: 4,
  },
  hint: {
    fontSize: fontSize.xs,
    color: theme.fgMuted,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing[2],
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  toggleText: {
    fontSize: fontSize.xs,
    color: theme.fgMuted,
    fontWeight: fontWeight.medium,
  },

  footer: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[1],
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    backgroundColor: theme.bgElevated,
  },
  save: {
    backgroundColor: theme.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  savePressed: { backgroundColor: theme.primaryPress },
  saveDisabled: { opacity: 0.4 },
  saveText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
    color: '#fff',
  },
})
