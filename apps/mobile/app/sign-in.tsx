import { useState } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../lib/auth'
import { Logo, theme, spacing, fontSize, fontWeight, radius, court } from '@mind-court/ui'

export default function SignIn() {
  const { signIn, signUp, sendPasswordReset } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError('')
    setInfo('')
    if (mode === 'forgot') {
      const address = email.trim()
      if (!address) {
        setError('Enter your email address.')
        return
      }
      setLoading(true)
      const { error: resetError } = await sendPasswordReset(address)
      setLoading(false)
      if (resetError) {
        setError(resetError)
      } else {
        setInfo('If that email has an account, a reset link is on its way.')
        setMode('signin')
      }
      return
    }
    setLoading(true)
    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, fullName)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else if ('needsVerification' in result && result.needsVerification) {
      setInfo('Check your email to confirm your account, then sign in.')
      setMode('signin')
    } else {
      router.replace('/coach')
    }
  }

  function switchMode(next: typeof mode) {
    setMode(next)
    setError('')
    setInfo('')
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >

        <View style={styles.brand}>
          <Logo height={44} variant="dark" />
          <View style={styles.accentBar} />
        </View>
        <Text style={styles.tagline}>
          {mode === 'signin' && 'Welcome back, coach.'}
          {mode === 'signup' && 'Build your roster and plan every session.'}
          {mode === 'forgot' && "Enter your email and we'll send a reset link."}
        </Text>

        {mode === 'signup' && (
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={theme.fgFaint}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            returnKeyType="next"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.fgFaint}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType={mode === 'forgot' ? 'done' : 'next'}
          onSubmitEditing={mode === 'forgot' ? handleSubmit : undefined}
        />

        {mode !== 'forgot' && (
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={theme.fgFaint}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        )}

        {info ? <Text style={styles.info}>{info}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>
                {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
              </Text>
          }
        </Pressable>

        {mode === 'signin' && (
          <Pressable onPress={() => switchMode('forgot')} style={styles.toggle}>
            <Text style={styles.toggleText}>Forgot password?</Text>
          </Pressable>
        )}

        <Pressable onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} style={styles.toggle}>
          <Text style={styles.toggleText}>
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Back to sign in'}
          </Text>
        </Pressable>
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
  brand: {
    marginBottom: spacing[2],
    alignItems: 'flex-start',
  },
  accentBar: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: court[500],
    marginTop: spacing[3],
  },
  tagline: {
    fontSize: fontSize.base,
    color: theme.fgMuted,
    marginBottom: spacing[4],
  },
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
  info: {
    fontSize: fontSize.sm,
    color: theme.primary,
  },
  error: {
    fontSize: fontSize.sm,
    color: theme.danger,
  },
  btn: {
    backgroundColor: theme.primary,
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  btnPressed: { backgroundColor: theme.primaryPress },
  btnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
    color: '#fff',
  },
  toggle: { alignItems: 'center', paddingVertical: spacing[2] },
  toggleText: { fontSize: fontSize.sm, color: theme.fgMuted },
})
