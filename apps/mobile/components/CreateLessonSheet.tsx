import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { BottomSheet } from './BottomSheet'
import { theme, spacing, fontSize, fontWeight, radius } from '@mind-court/ui'

export type LessonInput = {
  playerName: string
  date: Date
  court: string
  drills: string
  mentalCue: string
}

type Props = {
  visible: boolean
  onClose: () => void
  onSave: (input: LessonInput) => void
}

export function CreateLessonSheet({ visible, onClose, onSave }: Props) {
  const [playerName, setPlayerName] = useState('')
  const [date, setDate] = useState(new Date())
  const [court, setCourt] = useState('')
  const [drills, setDrills] = useState('')
  const [mentalCue, setMentalCue] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  function handleSave() {
    if (!playerName.trim()) return
    onSave({
      playerName: playerName.trim(),
      date,
      court: court.trim(),
      drills: drills.trim(),
      mentalCue: mentalCue.trim(),
    })
    reset()
    onClose()
  }

  function reset() {
    setPlayerName('')
    setDate(new Date())
    setCourt('')
    setDrills('')
    setMentalCue('')
  }

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>New lesson</Text>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Player">
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor={theme.fgFaint}
            value={playerName}
            onChangeText={setPlayerName}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </Field>

        <View style={styles.row}>
          <View style={styles.rowField}>
            <Field label="Date">
              <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.inputText}>{formattedDate}</Text>
              </Pressable>
            </Field>
          </View>
          <View style={styles.rowField}>
            <Field label="Time">
              <Pressable style={styles.input} onPress={() => setShowTimePicker(true)}>
                <Text style={styles.inputText}>{formattedTime}</Text>
              </Pressable>
            </Field>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selected) => {
              setShowDatePicker(Platform.OS === 'android')
              if (selected) {
                const updated = new Date(date)
                updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate())
                setDate(updated)
              }
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selected) => {
              setShowTimePicker(Platform.OS === 'android')
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

        <Field label="Drills & plan">
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder={"One drill per line:\nCross-court forehands — 20 reps\nServe — first serve %"}
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

        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed, !playerName.trim() && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!playerName.trim()}
        >
          <Text style={styles.saveBtnText}>Add lesson</Text>
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
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: theme.fg,
  },
  closeBtn: {
    padding: spacing[1],
  },
  closeText: {
    fontSize: fontSize.base,
    color: theme.fgMuted,
  },
  scroll: { flex: 1 },
  form: {
    padding: spacing[4],
    gap: spacing[4],
    paddingBottom: spacing[8],
  },
  field: {
    gap: spacing[2],
  },
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
  inputText: {
    fontSize: fontSize.base,
    color: theme.fg,
  },
  textarea: {
    minHeight: 80,
    paddingTop: spacing[3],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  rowField: {
    flex: 1,
  },
  saveBtn: {
    backgroundColor: theme.primary,
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  saveBtnPressed: {
    backgroundColor: theme.primaryPress,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
    color: '#fff',
  },
})
