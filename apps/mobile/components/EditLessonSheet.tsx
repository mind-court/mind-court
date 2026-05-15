import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, ScrollView, Pressable,
  StyleSheet, Platform, ActivityIndicator,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { BottomSheet } from './BottomSheet'
import { theme, spacing, fontSize, fontWeight, radius } from '@mind-court/ui'
import type { Lesson } from '../types/db'

export type LessonEdits = {
  court: string
  scheduledAt: Date
  durationMinutes: number | null
  drills: string
  mentalCue: string
}

type Props = {
  visible: boolean
  onClose: () => void
  onSave: (edits: LessonEdits) => Promise<{ error: string | null } | undefined>
  lesson: Lesson
}

export function EditLessonSheet({ visible, onClose, onSave, lesson }: Props) {
  const [court, setCourt] = useState(lesson.court ?? '')
  const [date, setDate] = useState(new Date(lesson.scheduled_at))
  const [duration, setDuration] = useState(lesson.duration_minutes != null ? String(lesson.duration_minutes) : '')
  const [drills, setDrills] = useState(lesson.drills ?? '')
  const [mentalCue, setMentalCue] = useState(lesson.mental_cue ?? '')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const prevVisible = useRef(false)

  useEffect(() => {
    if (visible && !prevVisible.current) {
      setCourt(lesson.court ?? '')
      setDate(new Date(lesson.scheduled_at))
      setDuration(lesson.duration_minutes != null ? String(lesson.duration_minutes) : '')
      setDrills(lesson.drills ?? '')
      setMentalCue(lesson.mental_cue ?? '')
      setSaveError('')
    }
    prevVisible.current = visible
  }, [visible])

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setSaveError('')
    const result = await onSave({
      court: court.trim(),
      scheduledAt: date,
      durationMinutes: duration.trim() ? parseInt(duration.trim(), 10) : null,
      drills: drills.trim(),
      mentalCue: mentalCue.trim(),
    })
    setSaving(false)
    if (result?.error) {
      setSaveError(result.error)
    } else {
      onClose()
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit lesson</Text>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.row}>
          <View style={styles.rowField}>
            <Field label="Date">
              {Platform.OS === 'ios' ? (
                <View style={[styles.input, styles.pickerCompact]}>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="compact"
                    onChange={(_, selected) => {
                      if (selected) {
                        const updated = new Date(date)
                        updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate())
                        setDate(updated)
                      }
                    }}
                  />
                </View>
              ) : (
                <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.inputText}>{formattedDate}</Text>
                </Pressable>
              )}
            </Field>
          </View>
          <View style={styles.rowField}>
            <Field label="Time">
              {Platform.OS === 'ios' ? (
                <View style={[styles.input, styles.pickerCompact]}>
                  <DateTimePicker
                    value={date}
                    mode="time"
                    display="compact"
                    onChange={(_, selected) => {
                      if (selected) {
                        const updated = new Date(date)
                        updated.setHours(selected.getHours(), selected.getMinutes())
                        setDate(updated)
                      }
                    }}
                  />
                </View>
              ) : (
                <Pressable style={styles.input} onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.inputText}>{formattedTime}</Text>
                </Pressable>
              )}
            </Field>
          </View>
        </View>

        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(_, selected) => {
              setShowDatePicker(false)
              if (selected) {
                const updated = new Date(date)
                updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate())
                setDate(updated)
              }
            }}
          />
        )}

        {showTimePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            onChange={(_, selected) => {
              setShowTimePicker(false)
              if (selected) {
                const updated = new Date(date)
                updated.setHours(selected.getHours(), selected.getMinutes())
                setDate(updated)
              }
            }}
          />
        )}

        <Field label="Court">
          <TextInput
            style={styles.input}
            placeholder="e.g. Court 1"
            placeholderTextColor={theme.fgFaint}
            value={court}
            onChangeText={setCourt}
            returnKeyType="next"
          />
        </Field>

        <Field label="Duration">
          <View style={styles.durationRow}>
            <TextInput
              style={styles.durationInput}
              placeholder="60"
              placeholderTextColor={theme.fgFaint}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              returnKeyType="next"
            />
            <Text style={styles.durationUnit}>min</Text>
          </View>
        </Field>

        <Field label="Drills & plan">
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder={"One drill per line:\nCross-court forehands — 20 reps\nServe placement — first ball %"}
            placeholderTextColor={theme.fgFaint}
            value={drills}
            onChangeText={setDrills}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </Field>

        <Field label="Mental cue">
          <TextInput
            style={styles.input}
            placeholder="e.g. Reset between points"
            placeholderTextColor={theme.fgFaint}
            value={mentalCue}
            onChangeText={setMentalCue}
            returnKeyType="done"
          />
        </Field>

        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save changes</Text>
          }
        </Pressable>
      </ScrollView>
    </BottomSheet>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
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
  closeBtn: { padding: spacing[1] },
  closeText: { fontSize: fontSize.base, color: theme.fgMuted },
  scroll: { flex: 1 },
  form: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] },
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
  inputText: { fontSize: fontSize.base, color: theme.fg },
  pickerCompact: { alignItems: 'flex-start', justifyContent: 'center' },
  textarea: { minHeight: 80, paddingTop: spacing[3] },
  row: { flexDirection: 'row', gap: spacing[3] },
  rowField: { flex: 1 },
  durationRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bg,
    borderWidth: 1, borderColor: theme.border, borderRadius: radius.md, overflow: 'hidden',
  },
  durationInput: {
    flex: 1, paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    fontSize: fontSize.base, color: theme.fg,
  },
  durationUnit: { paddingRight: spacing[3], fontSize: fontSize.sm, color: theme.fgSubtle },
  errorText: { fontSize: fontSize.sm, color: theme.danger },
  saveBtn: {
    backgroundColor: theme.primary, borderRadius: radius.md,
    paddingVertical: spacing[4], alignItems: 'center', marginTop: spacing[2],
  },
  saveBtnPressed: { backgroundColor: theme.primaryPress },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semi, color: '#fff' },
})
