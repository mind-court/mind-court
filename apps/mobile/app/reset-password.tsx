import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { router, useRootNavigationState } from 'expo-router'
import * as Linking from 'expo-linking'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Logo, theme, spacing, fontSize, fontWeight, radius } from '@mind-court/ui'

const MIN_LENGTH = 8

// The recovery link returns its tokens in the URL fragment. The Supabase client
// has detectSessionInUrl off, so the session is established here.
async function readRecoveryUrl() {
  const url = Platform.OS === 'web' ? window.location.href : await Linking.getInitialURL()
  const fragment = url?.split('#')[1]
  return new URLSearchParams(fragment ?? '')
}

export default function ResetPassword() {
  const { changePassword } = useAuth()
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid'>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Expo Router writes the URL as it mounts, so wait for it before reading the fragment.
  const navigationReady = !!useRootNavigationState()?.key

  useEffect(() => {
    if (!navigationReady) return
    let cancelled = false
    async function establish() {
      const params = await readRecoveryUrl()
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      const valid = params.get('type') === 'recovery' && access_token && refresh_token
      const result = valid ? await supabase.auth.setSession({ access_token, refresh_token }) : null
      return !!result && !result.error
    }
    establish()
      .catch(() => false)
      .then(ok => { if (!cancelled) setStatus(ok ? 'ready' : 'invalid') })
    return () => { cancelled = true }
  }, [navigationReady])

  // Once the link is consumed, keep its tokens out of browser history. This runs after
  // the session change settles, because Expo Router restores the fragment until then.
  useEffect(() => {
    if (status === 'checking' || Platform.OS !== 'web') return
    const timer = setTimeout(() => {
      window.history.replaceState(window.history.state, '', window.location.pathname)
    }, 0)
    return () => clearTimeout(timer)
  }, [status])

  async function handleSave() {
    setError('')
    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError("Those passwords don't match.")
      return
    }
    setSaving(true)
    const { error: saveError } = await changePassword(password)
    setSaving(false)
    if (saveError) setError(saveError)
    else router.replace('/coach')
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Logo height={44} variant="dark" />
        </View>

        {status === 'checking' && <ActivityIndicator color={theme.primary} />}

        {status === 'invalid' && (
          <>
            <Text style={styles.tagline}>
              This reset link has expired or was already used. Request a new one from the sign-in screen.
            </Text>
            <Pressable style={styles.btn} onPress={() => router.replace('/sign-in')}>
              <Text style={styles.btnText}>Back to sign in</Text>
            </Pressable>
          </>
        )}

        {status === 'ready' && (
          <>
            <Text style={styles.tagline}>Choose a new password. Use at least {MIN_LENGTH} characters.</Text>
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor={theme.fgFaint}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="next"
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor={theme.fgFaint}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Save password</Text>
              }
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[3],
  },
  brand: { marginBottom: spacing[2], alignItems: 'flex-start' },
  tagline: { fontSize: fontSize.base, color: theme.fgMuted, marginBottom: spacing[4] },
  input: {
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSize.base,
    color: theme.fg,
  },
  error: { fontSize: fontSize.sm, color: theme.danger },
  btn: {
    backgroundColor: theme.primary,
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  btnPressed: { backgroundColor: theme.primaryPress },
  btnText: { fontSize: fontSize.base, fontWeight: fontWeight.semi, color: '#fff' },
})
