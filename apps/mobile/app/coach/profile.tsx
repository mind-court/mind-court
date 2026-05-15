import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../lib/auth'
import { useLessons } from '../../lib/useLessons'
import { usePlayers } from '../../lib/usePlayers'
import { Screen } from '../../components/Screen'
import { theme, spacing, fontSize, fontWeight, radius, forest } from '@mind-court/ui'

export default function Profile() {
  const { profile, user, signOut } = useAuth()
  const { lessons } = useLessons()
  const { players } = usePlayers()

  async function handleSignOut() {
    await signOut()
    router.replace('/sign-in')
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  const now = new Date()
  const thisMonthCount = lessons.filter(l => {
    const d = new Date(l.scheduled_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length

  return (
    <Screen>
      {/* Profile hero */}
      <View style={styles.hero}>
        <View style={styles.heroAvatar}>
          <Text style={styles.heroAvatarText}>{initials}</Text>
        </View>
        <Text style={styles.heroName}>{profile?.full_name ?? '—'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Coach</Text>
        </View>
        <Text style={styles.heroEmail}>{user?.email ?? '—'}</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatTile value={players.length} label="Players" />
        <StatTile value={lessons.length} label="All lessons" />
        <StatTile value={thisMonthCount} label="This month" />
      </View>

      {/* Settings section */}
      <View style={styles.settingsCard}>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsLabel}>Full name</Text>
          <Text style={styles.settingsValue} numberOfLines={1}>
            {profile?.full_name ?? '—'}
          </Text>
        </View>
        <View style={[styles.settingsRow, styles.settingsRowLast]}>
          <Text style={styles.settingsLabel}>Email</Text>
          <Text style={styles.settingsValue} numberOfLines={1}>
            {user?.email ?? '—'}
          </Text>
        </View>
      </View>

      {/* Sign out */}
      <Pressable
        style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </Screen>
  )
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    marginBottom: spacing[5],
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: forest[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroAvatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  heroName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: theme.fg,
    letterSpacing: -0.3,
    marginTop: spacing[3],
  },
  roleBadge: {
    backgroundColor: forest[50],
    borderWidth: 1,
    borderColor: forest[100],
    borderRadius: radius.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    marginTop: spacing[2],
  },
  roleBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: forest[700],
  },
  heroEmail: {
    fontSize: fontSize.sm,
    color: theme.fgSubtle,
    marginTop: spacing[1],
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    marginBottom: spacing[2],
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: theme.fg,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: theme.fgSubtle,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  settingsCard: {
    backgroundColor: theme.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  settingsRowLast: { borderBottomWidth: 0 },
  settingsLabel: {
    fontSize: fontSize.base,
    color: theme.fgMuted,
  },
  settingsValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: theme.fg,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: spacing[4],
  },
  signOut: {
    marginTop: spacing[6],
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  signOutPressed: { opacity: 0.6 },
  signOutText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: theme.fgSubtle,
  },
})
