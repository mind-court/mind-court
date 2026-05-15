import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth'
import { useLessons } from '../../lib/useLessons'
import { usePlayers } from '../../lib/usePlayers'
import { theme, spacing, fontSize, fontWeight, radius, forest } from '@mind-court/ui'

export default function Profile() {
  const { profile, user, signOut } = useAuth()
  const { lessons } = useLessons()
  const { players } = usePlayers()

  const now = new Date()
  const thisMonthLessons = lessons.filter(l => {
    const d = new Date(l.scheduled_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })

  const initials = profile?.full_name
    ?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'

  async function handleSignOut() {
    await signOut()
    router.replace('/sign-in')
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Profile hero */}
      <View style={styles.hero}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile?.full_name ?? '—'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Coach</Text>
        </View>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{String(players.length)}</Text>
          <Text style={styles.statLabel}>Players</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{String(lessons.length)}</Text>
          <Text style={styles.statLabel}>All lessons</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{String(thisMonthLessons.length)}</Text>
          <Text style={styles.statLabel}>This month</Text>
        </View>
      </View>

      {/* Info card */}
      <View style={styles.infoCard}>
        <View style={[styles.infoRow, styles.infoRowBorder]}>
          <Text style={styles.infoLabel}>Full name</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{profile?.full_name ?? '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{user?.email ?? '—'}</Text>
        </View>
      </View>

      {/* Sign out */}
      <View style={styles.signOutContainer}>
        <Pressable
          style={({ pressed }) => [pressed && styles.signOutPressed]}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.bg },
  content: { paddingBottom: spacing[12] },

  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: forest[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  name: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: theme.fg,
    letterSpacing: -0.3,
    marginTop: spacing[3],
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: forest[50],
    borderWidth: 1,
    borderColor: forest[100],
    borderRadius: 999,
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    marginTop: spacing[2],
  },
  roleBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: forest[700],
  },
  email: {
    fontSize: fontSize.sm,
    color: theme.fgSubtle,
    marginTop: spacing[1],
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingVertical: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
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
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.borderSubtle,
    alignSelf: 'center',
  },

  // Info card
  infoCard: {
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    backgroundColor: theme.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: theme.fgMuted,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: theme.fg,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing[4],
  },

  // Sign out
  signOutContainer: {
    marginTop: spacing[6],
    marginBottom: spacing[8],
    alignItems: 'center',
  },
  signOutPressed: {
    opacity: 0.5,
  },
  signOutText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: theme.fgSubtle,
  },
})
