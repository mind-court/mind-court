import { useState } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet, Switch, ActivityIndicator,
} from 'react-native'
import { BottomSheet } from './BottomSheet'
import { theme, spacing, fontSize, fontWeight, radius } from '@mind-court/ui'

type Props = {
  visible: boolean
  onClose: () => void
  onSave: (input: { fullName: string; isKidMode: boolean }) => Promise<{ error: string | null } | undefined>
}

export function CreatePlayerSheet({ visible, onClose, onSave }: Props) {
  const [fullName, setFullName] = useState('')
  const [isKidMode, setIsKidMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!fullName.trim()) return
    setLoading(true)
    setError('')
    const result = await onSave({ fullName: fullName.trim(), isKidMode })
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setFullName('')
      setIsKidMode(false)
      onClose()
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>Add player</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Player's full name"
            placeholderTextColor={theme.fgFaint}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
        </View>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>🎾  Kid Mode</Text>
            <Text style={styles.switchSub}>Optimized for younger players — bigger touch targets, gentler language, simplified drills</Text>
          </View>
          <Switch
            value={isKidMode}
            onValueChange={setIsKidMode}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor={theme.bgElevated}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && styles.saveBtnPressed,
            (!fullName.trim() || loading) && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={!fullName.trim() || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Add player</Text>
          }
        </Pressable>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: theme.fg,
  },
  closeText: {
    fontSize: fontSize.base,
    color: theme.fgMuted,
    padding: spacing[1],
  },
  form: {
    padding: spacing[4],
    gap: spacing[4],
  },
  field: { gap: spacing[2] },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
    color: theme.fgSubtle,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSize.base,
    color: theme.fg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    padding: spacing[4],
  },
  switchLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: theme.fg,
  },
  switchSub: {
    fontSize: fontSize.xs,
    color: theme.fgMuted,
    marginTop: 2,
    maxWidth: 220,
  },
  error: {
    fontSize: fontSize.sm,
    color: theme.danger,
  },
  saveBtn: {
    backgroundColor: theme.primary,
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  saveBtnPressed: { backgroundColor: theme.primaryPress },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
    color: '#fff',
  },
})
