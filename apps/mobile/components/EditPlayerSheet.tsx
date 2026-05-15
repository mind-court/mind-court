import { useState } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet, Switch, ActivityIndicator,
} from 'react-native'
import { BottomSheet } from './BottomSheet'
import { theme, spacing, fontSize, fontWeight, radius } from '@mind-court/ui'
import type { Player } from '../types/db'

type Props = {
  visible: boolean
  onClose: () => void
  player: Player
  onSave: (updates: { fullName: string; isKidMode: boolean }) => Promise<{ error: string | null } | undefined>
}

export function EditPlayerSheet({ visible, onClose, player, onSave }: Props) {
  const [fullName, setFullName] = useState(player.full_name)
  const [isKidMode, setIsKidMode] = useState(player.is_kid_mode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!fullName.trim() || loading) return
    setLoading(true)
    setError('')
    const result = await onSave({ fullName: fullName.trim(), isKidMode })
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      onClose()
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit player</Text>
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
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
        </View>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Kid Mode</Text>
            <Text style={styles.switchSub}>Optimized for younger players</Text>
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
            : <Text style={styles.saveBtnText}>Save changes</Text>
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
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: theme.fg },
  closeText: { fontSize: fontSize.base, color: theme.fgMuted, padding: spacing[1] },
  form: { padding: spacing[4], gap: spacing[4] },
  field: { gap: spacing[2] },
  label: {
    fontSize: fontSize.sm, fontWeight: fontWeight.semi, color: theme.fgSubtle,
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border,
    borderRadius: radius.md, paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    fontSize: fontSize.base, color: theme.fg,
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
  switchLabel: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: theme.fg },
  switchSub: { fontSize: fontSize.xs, color: theme.fgMuted, marginTop: 2 },
  error: { fontSize: fontSize.sm, color: theme.danger },
  saveBtn: {
    backgroundColor: theme.primary, borderRadius: radius.md,
    paddingVertical: spacing[4], alignItems: 'center', marginTop: spacing[2],
  },
  saveBtnPressed: { backgroundColor: theme.primaryPress },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semi, color: '#fff' },
})
