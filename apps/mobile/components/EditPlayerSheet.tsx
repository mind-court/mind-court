import { useEffect, useRef, useState } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet, Switch, ActivityIndicator, ScrollView,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { BottomSheet } from './BottomSheet'
import { theme, spacing, fontSize, fontWeight, radius, court, forest } from '@mind-court/ui'
import type { Player, PlayerIntake } from '../types/db'

type Props = {
  visible: boolean
  onClose: () => void
  player: Player
  onSave: (input: PlayerIntake) => Promise<{ error: string | null } | undefined>
}

const CADENCE_OPTIONS = ['Weekly', 'Bi-weekly', 'Monthly', 'Drop-in']

export function EditPlayerSheet({ visible, onClose, player, onSave }: Props) {
  const [fullName, setFullName] = useState(player.full_name)
  const [skillLevel, setSkillLevel] = useState(player.skill_level ?? '')
  const [contactPhone, setContactPhone] = useState(player.contact_phone ?? '')
  const [contactEmail, setContactEmail] = useState(player.contact_email ?? '')
  const [birthdate, setBirthdate] = useState(player.birthdate ?? '')
  const [lessonCadence, setLessonCadence] = useState(player.lesson_cadence ?? '')
  const [primaryFocus, setPrimaryFocus] = useState(player.primary_focus ?? '')
  const [intakeNotes, setIntakeNotes] = useState(player.intake_notes ?? '')
  const [isKidMode, setIsKidMode] = useState(player.is_kid_mode)
  const [parentName, setParentName] = useState(player.parent_name ?? '')
  const [parentPhone, setParentPhone] = useState(player.parent_phone ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const prevVisible = useRef(false)

  useEffect(() => {
    if (visible && !prevVisible.current) {
      setFullName(player.full_name)
      setSkillLevel(player.skill_level ?? '')
      setContactPhone(player.contact_phone ?? '')
      setContactEmail(player.contact_email ?? '')
      setBirthdate(player.birthdate ?? '')
      setLessonCadence(player.lesson_cadence ?? '')
      setPrimaryFocus(player.primary_focus ?? '')
      setIntakeNotes(player.intake_notes ?? '')
      setIsKidMode(player.is_kid_mode)
      setParentName(player.parent_name ?? '')
      setParentPhone(player.parent_phone ?? '')
      setError('')
    }
    prevVisible.current = visible
  }, [visible])

  const nameOk = fullName.trim().length > 0
  const kidContactOk = !isKidMode || (parentName.trim().length > 0 && parentPhone.trim().length > 0)
  const canSave = nameOk && kidContactOk && !loading

  async function handleSave() {
    if (!canSave) return
    setLoading(true)
    setError('')
    const result = await onSave({
      fullName: fullName.trim(),
      isKidMode,
      skillLevel,
      contactPhone,
      contactEmail,
      birthdate,
      lessonCadence,
      primaryFocus,
      intakeNotes,
      parentName,
      parentPhone,
    })
    setLoading(false)
    if (result?.error) setError(result.error)
    else onClose()
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Edit player</Text>
          <Text style={styles.subtitle}>Update what you know about {player.full_name.split(' ')[0]}.</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
          <Feather name="x" size={20} color={theme.fgMuted} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Section label="Basics">
          <Field label="Full name" required>
            <TextInput
              style={styles.input}
              placeholder="Jamie Martinez"
              placeholderTextColor={theme.fgFaint}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </Field>
          <View style={styles.row}>
            <Field label="Skill level" flex>
              <TextInput
                style={styles.input}
                placeholder="NTRP 3.5, Beginner…"
                placeholderTextColor={theme.fgFaint}
                value={skillLevel}
                onChangeText={setSkillLevel}
                autoCapitalize="words"
              />
            </Field>
            <Field label="Birthdate" flex>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.fgFaint}
                value={birthdate}
                onChangeText={setBirthdate}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
              />
            </Field>
          </View>
        </Section>

        <Section label="Contact">
          <View style={styles.row}>
            <Field label="Phone" flex>
              <TextInput
                style={styles.input}
                placeholder="(555) 123-4567"
                placeholderTextColor={theme.fgFaint}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />
            </Field>
            <Field label="Email" flex>
              <TextInput
                style={styles.input}
                placeholder="player@email.com"
                placeholderTextColor={theme.fgFaint}
                value={contactEmail}
                onChangeText={setContactEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>
          </View>
        </Section>

        <Section label="Coaching">
          <Field label="Lesson cadence">
            <View style={styles.chipRow}>
              {CADENCE_OPTIONS.map(opt => {
                const active = lessonCadence === opt
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setLessonCadence(active ? '' : opt)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
                  </Pressable>
                )
              })}
            </View>
          </Field>
          <Field label="Primary focus">
            <TextInput
              style={styles.input}
              placeholder="Backhand consistency, match prep…"
              placeholderTextColor={theme.fgFaint}
              value={primaryFocus}
              onChangeText={setPrimaryFocus}
            />
          </Field>
        </Section>

        <Section label="Player experience">
          <View style={[styles.kidCard, isKidMode && styles.kidCardActive]}>
            <View style={styles.kidHeader}>
              <View style={styles.kidLabelWrap}>
                <View style={styles.kidTitleRow}>
                  <Feather name="smile" size={16} color={isKidMode ? court[700] : theme.fg} />
                  <Text style={styles.kidTitle}>Kid Mode</Text>
                </View>
                <Text style={styles.kidBlurb}>
                  Turn on for players under ~13. Their app switches to a kid-friendly view: bigger
                  taps, simpler language, short visual drills, and reminders sent to a parent
                  instead of the player.
                </Text>
              </View>
              <Switch
                value={isKidMode}
                onValueChange={setIsKidMode}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor={theme.bgElevated}
              />
            </View>

            {isKidMode && (
              <View style={styles.kidDetail}>
                <Text style={styles.kidContactLabel}>Parent / guardian contact</Text>
                <Text style={styles.kidContactHelp}>Required so we can reach an adult for scheduling and updates.</Text>
                <View style={styles.row}>
                  <Field label="Parent name" required flex>
                    <TextInput
                      style={styles.input}
                      placeholder="Alex Martinez"
                      placeholderTextColor={theme.fgFaint}
                      value={parentName}
                      onChangeText={setParentName}
                      autoCapitalize="words"
                    />
                  </Field>
                  <Field label="Parent phone" required flex>
                    <TextInput
                      style={styles.input}
                      placeholder="(555) 123-4567"
                      placeholderTextColor={theme.fgFaint}
                      value={parentPhone}
                      onChangeText={setParentPhone}
                      keyboardType="phone-pad"
                    />
                  </Field>
                </View>
              </View>
            )}
          </View>
        </Section>

        <Section label="Intake notes">
          <Field label="What should you remember?">
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Goals, injuries, schedule constraints…"
              placeholderTextColor={theme.fgFaint}
              value={intakeNotes}
              onChangeText={setIntakeNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Field>
        </Section>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && styles.saveBtnPressed,
            !canSave && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={!canSave}
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

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  )
}

function Field({
  label, required, flex, children,
}: { label: string; required?: boolean; flex?: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.field, flex && styles.fieldFlex]}>
      <Text style={styles.fieldLabel}>
        {label}{required ? <Text style={styles.fieldRequired}> *</Text> : null}
      </Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    gap: spacing[3],
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: theme.fg, letterSpacing: -0.3 },
  subtitle: { fontSize: fontSize.xs, color: theme.fgMuted, marginTop: 2, maxWidth: 260, lineHeight: 16 },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: theme.bgSunken,
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { flexGrow: 0 },
  scrollContent: { padding: spacing[5], paddingBottom: spacing[6], gap: spacing[5] },

  section: { gap: spacing[2] },
  sectionLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: theme.fgSubtle,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionBody: { gap: spacing[3] },

  row: { flexDirection: 'row', gap: spacing[3] },
  field: { gap: 6 },
  fieldFlex: { flex: 1 },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: theme.fgMuted,
  },
  fieldRequired: { color: theme.danger },

  input: {
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: 10,
    fontSize: fontSize.sm,
    color: theme.fg,
  },
  inputMultiline: { minHeight: 88, paddingTop: 10 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.bg,
  },
  chipActive: {
    backgroundColor: forest[700],
    borderColor: forest[700],
  },
  chipText: { fontSize: fontSize.xs, fontWeight: fontWeight.semi, color: theme.fg },
  chipTextActive: { color: '#fff' },

  kidCard: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.lg,
    padding: spacing[4],
    backgroundColor: theme.bg,
    gap: spacing[3],
  },
  kidCardActive: {
    borderColor: court[300],
    backgroundColor: court[100],
  },
  kidHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing[3] },
  kidLabelWrap: { flex: 1 },
  kidTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kidTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semi, color: theme.fg },
  kidBlurb: { fontSize: fontSize.xs, color: theme.fgMuted, marginTop: 4, lineHeight: 17 },

  kidDetail: { gap: spacing[3], paddingTop: spacing[2], borderTopWidth: 1, borderTopColor: court[200] },

  kidContactLabel: {
    fontSize: fontSize.xs, fontWeight: fontWeight.semi, color: theme.fg,
    marginTop: spacing[1],
  },
  kidContactHelp: { fontSize: 11, color: theme.fgMuted, marginTop: -2 },

  error: {
    fontSize: fontSize.sm,
    color: theme.danger,
    backgroundColor: '#FDECEC',
    padding: spacing[3],
    borderRadius: radius.md,
  },

  footer: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    backgroundColor: theme.bgElevated,
  },
  saveBtn: {
    backgroundColor: theme.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnPressed: { backgroundColor: theme.primaryPress },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semi, color: '#fff' },
})
