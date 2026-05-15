import { Redirect } from 'expo-router'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuth } from '../lib/auth'
import { LogoMark, court, forest, spacing } from '@mind-court/ui'

export default function Root() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={styles.screen}>
        <LogoMark size={84} variant="dark" />
        <ActivityIndicator color={court[500]} style={styles.spinner} />
      </View>
    )
  }

  return <Redirect href={session ? '/coach' : '/sign-in'} />
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: forest[700],
    gap: spacing[8],
  },
  spinner: {
    marginTop: spacing[2],
  },
})
