import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../lib/auth'
import { Screen } from '../../components/Screen'
import { theme, spacing, fontSize, fontWeight, radius } from '@mind-court/ui'

export default function Profile() {
  const { profile, user, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    router.replace('/sign-in')
  }

  return (
    <Screen scroll={false}>
      <Text style={styles.heading}>Account</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{profile?.full_name || '—'}</Text>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email || '—'}</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.signOutBtn, pressed && styles.signOutBtnPressed]}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  heading: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: theme.fg,
    letterSpacing: -0.5,
    marginBottom: spacing[6],
  },
  card: {
    backgroundColor: theme.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: spacing[6],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  rowLast: { borderBottomWidth: 0 },
  label: {
    fontSize: fontSize.base,
    color: theme.fgMuted,
  },
  value: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: theme.fg,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: spacing[4],
  },
  signOutBtn: {
    backgroundColor: theme.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.danger,
    padding: spacing[4],
    alignItems: 'center',
  },
  signOutBtnPressed: { opacity: 0.7 },
  signOutText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
    color: theme.danger,
  },
})
