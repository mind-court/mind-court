import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { BottomSheet } from './BottomSheet'
import { theme, spacing, fontSize, fontWeight, radius } from '@mind-court/ui'
import { avatarColor } from '../lib/avatarColor'
import type { Player } from '../types/db'

export type LessonInput = {
  playerName: string
  playerId?: string
  date: Date
  court: string
  duration: string
  drills: string
  mentalCue: string
}

type Props = {
  visible: boolean
  onClose: () => void
  onSave: (input: LessonInput) => void
  players: Player[]
}

export function CreateLessonSheet({ visible, onClose, onSave, players }: Props) {
  const [step, setStep] = useState<'form' | 'picker'>('form')
  const [query, setQuery] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [date, setDate] = useState(new Date())
  const [court, setCourt] = useState('')
  const [duration, setDuration] = useState('')
  const [drills, setDrills] = useState('')
  const [mentalCue, setMentalCue] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  const filtered = query.trim()
    ? players.filter(p => p.full_name.toLowerCase().includes(query.toLowerCase()))
    : players

  function handleSelectPlayer(player: Player) {
    setSelectedPlayer(player)
    setQuery('')
    setStep('form')
  }

  function handleSave() {
    if (!selectedPlayer) return
    onSave({
      playerName: selectedPlayer.full_name,
      playerId: selectedPlayer.id,
      date,
      court: court.trim(),
      duration: duration.trim(),
      drills: drills.trim(),
      mentalCue: mentalCue.trim(),
    })
    reset()
    onClose()
  }

  function handleClose() {
    reset()
    onClose()
  }

  function reset() {
    setStep('form')
    setQuery('')
    setSelectedPlayer(null)
    setDate(new Date())
    setCourt('')
    setDuration('')
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
    <BottomSheet visible={visible} onClose={handleClose}>
      {step === 'picker' ? (
        <>
          <View style={styles.header}>
            <Pressable onPress={() => { setQuery(''); setStep('form') }} hitSlop={12} style={styles.backBtn}>
              <Text style={styles.backText}>‹</Text>
            </Pressable>
            <Text style={styles.title}>Select player</Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search players…"
              placeholderTextColor={theme.fgFaint}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="words"
              autoFocus
              returnKeyType="search"
            />
          </View>

          {players.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No players yet</Text>
              <Text style={styles.emptySub}>Add players from the Players tab first.</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No match</Text>
              <Text style={styles.emptySub}>No player named "{query}".</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={p => p.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.pickerList}
              renderItem={({ item }) => {
                const initials = item.full_name
                  .split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                return (
                  <Pressable
                    style={({ pressed }) => [styles.pickerRow, pressed && styles.pickerRowPressed]}
                    onPress={() => handleSelectPlayer(item)}
                  >
                    <View style={[styles.pickerAvatar, { backgroundColor: avatarColor(item.full_name) }]}>
                      <Text style={styles.pickerAvatarText}>{initials}</Text>
                    </View>
                    <View style={styles.pickerRowInfo}>
                      <Text style={styles.pickerName}>{item.full_name}</Text>
                      {item.is_kid_mode && (
                        <Text style={styles.kidBadge}>Kid Mode</Text>
                      )}
                    </View>
                  </Pressable>
                )
              }}
            />
          )}
        </>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>New lesson</Text>
            <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
          >
            <Field label="Player">
              <Pressable
                style={[styles.input, styles.playerBtn]}
                onPress={() => setStep('picker')}
              >
                {selectedPlayer ? (
                  <View style={styles.playerSelected}>
                    <View style={[styles.playerAvatar, { backgroundColor: avatarColor(selectedPlayer.full_name) }]}>
                      <Text style={styles.playerAvatarText}>
                        {selectedPlayer.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.playerName}>{selectedPlayer.full_name}</Text>
                  </View>
                ) : (
                  <Text style={styles.playerPlaceholder}>Select player…</Text>
                )}
              </Pressable>
            </Field>

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
                placeholder={"One drill per line:\nCross-court forehands — 20 reps\nServe placement — first ball %\nMatch play — first to 7"}
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
              style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed, !selectedPlayer && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!selectedPlayer}
            >
              <Text style={styles.saveBtnText}>Add lesson</Text>
            </Pressable>
          </ScrollView>
        </>
      )}
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
  backBtn: { width: 32 },
  backText: { fontSize: 28, color: theme.primary, lineHeight: 32 },
  closeBtn: { padding: spacing[1] },
  closeText: { fontSize: fontSize.base, color: theme.fgMuted },
  scroll: { flex: 1 },
  form: {
    padding: spacing[4],
    gap: spacing[4],
    paddingBottom: spacing[8],
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
  inputText: { fontSize: fontSize.base, color: theme.fg },
  pickerCompact: { alignItems: 'flex-start', justifyContent: 'center' },
  textarea: { minHeight: 80, paddingTop: spacing[3] },
  row: { flexDirection: 'row', gap: spacing[3] },
  rowField: { flex: 1 },
  saveBtn: {
    backgroundColor: theme.primary,
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  saveBtnPressed: { backgroundColor: theme.primaryPress },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semi, color: '#fff' },

  // Duration field
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  durationInput: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSize.base,
    color: theme.fg,
  },
  durationUnit: {
    paddingRight: spacing[3],
    fontSize: fontSize.sm,
    color: theme.fgSubtle,
  },

  // Player field (form step)
  playerBtn: { justifyContent: 'center' },
  playerPlaceholder: { fontSize: fontSize.base, color: theme.fgFaint },
  playerSelected: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  playerAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: theme.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  playerAvatarText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: '#fff' },
  playerName: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: theme.fg },

  // Picker step
  searchBox: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  searchInput: {
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSize.base,
    color: theme.fg,
  },
  pickerList: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    paddingBottom: spacing[8],
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  pickerRowPressed: { opacity: 0.6 },
  pickerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.primary,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  pickerAvatarText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#fff' },
  pickerRowInfo: { flex: 1, gap: 2 },
  pickerName: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: theme.fg },
  kidBadge: { fontSize: fontSize.xs, color: theme.accentPress, fontWeight: fontWeight.medium },
  empty: { padding: spacing[8], alignItems: 'center', gap: spacing[2] },
  emptyTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semi, color: theme.fg },
  emptySub: { fontSize: fontSize.sm, color: theme.fgMuted, textAlign: 'center' },
})
