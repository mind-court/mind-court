import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView, Platform, Modal,
} from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { BottomSheet } from './BottomSheet'
import { theme, spacing, fontSize, fontWeight, radius, forest } from '@mind-court/ui'
import type { Player, PlayerIntake } from '../types/db'

type Props = {
  visible: boolean
  onClose: () => void
  onSave: (input: PlayerIntake) => Promise<{ data: Player | null; error: string | null } | undefined>
}

const STEP_COUNT = 2
const CADENCE_OPTIONS = ['Weekly', 'Bi-weekly', 'Monthly', 'Drop-in']
const SKILL_PRESETS = ['New to tennis', 'Recreational', 'Competitive']

export function CreatePlayerSheet({ visible, onClose, onSave }: Props) {
  const [step, setStep] = useState(1)

  const [fullName, setFullName] = useState('')
  const [isKidMode, setIsKidMode] = useState<boolean | null>(null)
  const [birthdate, setBirthdate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')

  const [skillLevel, setSkillLevel] = useState('')
  const [lessonCadence, setLessonCadence] = useState('')
  const [primaryFocus, setPrimaryFocus] = useState('')

  const [intakeNotes, setIntakeNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setStep(1)
    setFullName(''); setIsKidMode(null); setBirthdate(null); setShowDatePicker(false)
    setContactPhone(''); setContactEmail(''); setParentName(''); setParentPhone('')
    setSkillLevel(''); setLessonCadence(''); setPrimaryFocus('')
    setIntakeNotes(''); setError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  // Step 1 needs: name, adult/kid choice, and (if kid) parent contact.
  const nameOk = fullName.trim().length > 0
  const kidContactOk = isKidMode !== true
    || (parentName.trim().length > 0 && isValidPhone(parentPhone))
  const step1Ok = nameOk && isKidMode !== null && kidContactOk
  const canContinue = (step === 1 && step1Ok) || step === 2

  function next() {
    if (!canContinue) return
    if (step < STEP_COUNT) setStep(s => s + 1)
  }

  function back() {
    if (step > 1) setStep(s => s - 1)
  }

  async function save() {
    if (loading) return
    if (contactPhone.trim() && !isValidPhone(contactPhone)) {
      setError('That phone number looks incomplete — enter a full number or leave it blank.')
      return
    }
    setLoading(true)
    setError('')
    const result = await onSave({
      fullName: fullName.trim(),
      isKidMode: !!isKidMode,
      skillLevel,
      contactPhone,
      contactEmail,
      birthdate: birthdate ? toISODate(birthdate) : '',
      lessonCadence,
      primaryFocus,
      intakeNotes,
      parentName,
      parentPhone,
    })
    setLoading(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    const newId = result?.data?.id
    reset()
    onClose()
    if (newId) router.push(`/coach/player/${newId}?welcome=1`)
  }

  return (
    <>
      <BottomSheet visible={visible} onClose={handleClose}>
        {/* Header */}
        <View style={styles.header}>
          <ProgressDots step={step} total={STEP_COUNT} />
          <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
            <Feather name="x" size={20} color={theme.fgMuted} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
            <Step1
              fullName={fullName} setFullName={setFullName}
              isKidMode={isKidMode} setIsKidMode={setIsKidMode}
              birthdate={birthdate}
              onPickBirthday={() => setShowDatePicker(true)}
              contactPhone={contactPhone} setContactPhone={setContactPhone}
              contactEmail={contactEmail} setContactEmail={setContactEmail}
              parentName={parentName} setParentName={setParentName}
              parentPhone={parentPhone} setParentPhone={setParentPhone}
            />
          )}
          {step === 2 && (
            <Step2
              firstName={firstNameOf(fullName)}
              skillLevel={skillLevel} setSkillLevel={setSkillLevel}
              lessonCadence={lessonCadence} setLessonCadence={setLessonCadence}
              primaryFocus={primaryFocus} setPrimaryFocus={setPrimaryFocus}
              intakeNotes={intakeNotes} setIntakeNotes={setIntakeNotes}
            />
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        {/* Footer nav */}
        <View style={styles.footer}>
          <Pressable
            onPress={back}
            disabled={step === 1}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.backBtnPressed,
              step === 1 && styles.backBtnHidden,
            ]}
          >
            <Feather name="arrow-left" size={18} color={theme.fg} />
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>

          {step < STEP_COUNT ? (
            <Pressable
              onPress={next}
              disabled={!canContinue}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.primaryBtnPressed,
                !canContinue && styles.primaryBtnDisabled,
              ]}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
          ) : (
            <Pressable
              onPress={save}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.primaryBtnPressed,
                loading && styles.primaryBtnDisabled,
              ]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>Add player</Text>
              }
            </Pressable>
          )}
        </View>
      </BottomSheet>

      <BirthdayPicker
        visible={showDatePicker}
        value={birthdate}
        onClose={() => setShowDatePicker(false)}
        onChange={(d) => setBirthdate(d)}
      />
    </>
  )
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function Step1({
  fullName, setFullName,
  isKidMode, setIsKidMode,
  birthdate, onPickBirthday,
  contactPhone, setContactPhone, contactEmail, setContactEmail,
  parentName, setParentName, parentPhone, setParentPhone,
}: {
  fullName: string; setFullName: (v: string) => void
  isKidMode: boolean | null; setIsKidMode: (v: boolean) => void
  birthdate: Date | null; onPickBirthday: () => void
  contactPhone: string; setContactPhone: (v: string) => void
  contactEmail: string; setContactEmail: (v: string) => void
  parentName: string; setParentName: (v: string) => void
  parentPhone: string; setParentPhone: (v: string) => void
}) {
  const firstName = firstNameOf(fullName)
  return (
    <>
      <Question title="Tell me about them" sub="The basics — we'll only ask what's needed." />

      <BigField label="Their name">
        <TextInput
          style={styles.bigInput}
          placeholder="Jamie Martinez"
          placeholderTextColor={theme.fgFaint}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          returnKeyType="next"
        />
      </BigField>

      <BigField label="Adult or kid?">
        <View style={styles.segmentRow}>
          <Segment
            label="Adult"
            icon="user"
            active={isKidMode === false}
            onPress={() => setIsKidMode(false)}
          />
          <Segment
            label="Kid (under 13)"
            icon="smile"
            active={isKidMode === true}
            onPress={() => setIsKidMode(true)}
          />
        </View>
      </BigField>

      <BigField label="Birthday (optional)">
        <Pressable onPress={onPickBirthday} style={styles.dateBtn}>
          <Feather name="calendar" size={18} color={theme.fgMuted} />
          <Text style={[styles.dateBtnText, !birthdate && styles.dateBtnPlaceholder]}>
            {birthdate ? formatBirthday(birthdate) : 'Pick a date'}
          </Text>
        </Pressable>
      </BigField>

      {isKidMode === true ? (
        <>
          <View style={styles.divider} />
          <Question
            title={firstName ? `${firstName}'s parent contact` : "Parent contact"}
            sub="Required for kids — we send schedule and reminder messages here."
          />
          <BigField label="Parent or guardian name">
            <TextInput
              style={styles.bigInput}
              placeholder="Alex Martinez"
              placeholderTextColor={theme.fgFaint}
              value={parentName}
              onChangeText={setParentName}
              autoCapitalize="words"
            />
          </BigField>
          <BigField label="Parent phone">
            <TextInput
              style={styles.bigInput}
              placeholder="(555) 123-4567"
              placeholderTextColor={theme.fgFaint}
              value={parentPhone}
              onChangeText={(v) => setParentPhone(sanitizePhone(v))}
              keyboardType="phone-pad"
              maxLength={20}
            />
          </BigField>
          <BigField label="Kid's phone (optional)">
            <TextInput
              style={styles.bigInput}
              placeholder="If they have one"
              placeholderTextColor={theme.fgFaint}
              value={contactPhone}
              onChangeText={(v) => setContactPhone(sanitizePhone(v))}
              keyboardType="phone-pad"
              maxLength={20}
            />
          </BigField>
        </>
      ) : isKidMode === false ? (
        <>
          <View style={styles.divider} />
          <Question
            title="How do you reach them?"
            sub="Both optional — fill in whatever you've got."
          />
          <BigField label="Phone">
            <TextInput
              style={styles.bigInput}
              placeholder="(555) 123-4567"
              placeholderTextColor={theme.fgFaint}
              value={contactPhone}
              onChangeText={(v) => setContactPhone(sanitizePhone(v))}
              keyboardType="phone-pad"
              maxLength={20}
            />
          </BigField>
          <BigField label="Email">
            <TextInput
              style={styles.bigInput}
              placeholder="player@email.com"
              placeholderTextColor={theme.fgFaint}
              value={contactEmail}
              onChangeText={setContactEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </BigField>
        </>
      ) : null}
    </>
  )
}

function Step2({
  firstName, skillLevel, setSkillLevel,
  lessonCadence, setLessonCadence, primaryFocus, setPrimaryFocus,
  intakeNotes, setIntakeNotes,
}: {
  firstName: string
  skillLevel: string; setSkillLevel: (v: string) => void
  lessonCadence: string; setLessonCadence: (v: string) => void
  primaryFocus: string; setPrimaryFocus: (v: string) => void
  intakeNotes: string; setIntakeNotes: (v: string) => void
}) {
  const isCustomSkill = !!skillLevel && !SKILL_PRESETS.includes(skillLevel)
  return (
    <>
      <Question
        title={firstName ? `How will you coach ${firstName}?` : 'How will you coach them?'}
        sub="All of this is optional — skip what you don't know yet."
      />

      <BigField label="Where they're at">
        <View style={styles.chipGrid}>
          {SKILL_PRESETS.map(opt => {
            const active = skillLevel === opt
            return (
              <Pressable
                key={opt}
                onPress={() => setSkillLevel(active ? '' : opt)}
                style={[styles.bigChip, active && styles.bigChipActive]}
              >
                <Text style={[styles.bigChipText, active && styles.bigChipTextActive]}>{opt}</Text>
              </Pressable>
            )
          })}
        </View>
        {isCustomSkill && (
          <TextInput
            style={[styles.bigInput, { marginTop: spacing[2] }]}
            placeholder="Or describe it"
            placeholderTextColor={theme.fgFaint}
            value={skillLevel}
            onChangeText={setSkillLevel}
            autoCapitalize="sentences"
          />
        )}
      </BigField>

      <BigField label="How often do you see them?">
        <View style={styles.chipGrid}>
          {CADENCE_OPTIONS.map(opt => {
            const active = lessonCadence === opt
            return (
              <Pressable
                key={opt}
                onPress={() => setLessonCadence(active ? '' : opt)}
                style={[styles.bigChip, active && styles.bigChipActive]}
              >
                <Text style={[styles.bigChipText, active && styles.bigChipTextActive]}>{opt}</Text>
              </Pressable>
            )
          })}
        </View>
      </BigField>

      <BigField label="What are you working on first?">
        <TextInput
          style={styles.bigInput}
          placeholder="Backhand consistency, match prep…"
          placeholderTextColor={theme.fgFaint}
          value={primaryFocus}
          onChangeText={setPrimaryFocus}
        />
      </BigField>

      <BigField label="Anything else worth remembering?">
        <TextInput
          style={[styles.bigInput, styles.bigInputMultiline]}
          placeholder={`Goals, injuries, schedule quirks${firstName ? `, what ${firstName} said in the first call` : ''}…`}
          placeholderTextColor={theme.fgFaint}
          value={intakeNotes}
          onChangeText={setIntakeNotes}
          multiline
          textAlignVertical="top"
        />
      </BigField>
    </>
  )
}

// ─── Birthday picker ──────────────────────────────────────────────────────────
// Rendered as its own Modal so it doesn't fight the BottomSheet's keyboard
// listener for layout. iOS shows a spinner picker with Cancel/Done; Android
// uses the native dialog directly.

function BirthdayPicker({
  visible, value, onClose, onChange,
}: {
  visible: boolean
  value: Date | null
  onClose: () => void
  onChange: (d: Date) => void
}) {
  const [draft, setDraft] = useState<Date>(value ?? defaultBirthday())

  // The picker stays mounted, so useState only seeds `draft` once. Re-sync it
  // to the current value each time the picker opens — otherwise the spinner
  // shows a stale date (and on first open never reflects a cleared value).
  useEffect(() => {
    if (visible) setDraft(value ?? defaultBirthday())
  }, [visible, value])

  function handleIOSDone() {
    onChange(draft)
    onClose()
  }

  function handleAndroidChange(_e: DateTimePickerEvent, selected?: Date) {
    onClose()
    if (selected) onChange(selected)
  }

  if (!visible) return null

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={value ?? defaultBirthday()}
        mode="date"
        display="default"
        maximumDate={new Date()}
        onChange={handleAndroidChange}
      />
    )
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.pickerBackdrop} onPress={onClose} />
      <View style={styles.pickerSheet}>
        <View style={styles.pickerHeader}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.pickerCancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.pickerTitle}>Birthday</Text>
          <Pressable onPress={handleIOSDone} hitSlop={12}>
            <Text style={styles.pickerDone}>Done</Text>
          </Pressable>
        </View>
        <DateTimePicker
          value={draft}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          onChange={(_e, selected) => { if (selected) setDraft(selected) }}
          style={styles.pickerBody}
        />
      </View>
    </Modal>
  )
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }, (_, i) => {
        const idx = i + 1
        const filled = idx <= step
        const active = idx === step
        return (
          <View
            key={i}
            style={[
              styles.dot,
              filled && styles.dotFilled,
              active && styles.dotActive,
            ]}
          />
        )
      })}
      <Text style={styles.stepText}>Step {step} of {total}</Text>
    </View>
  )
}

function Question({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={styles.questionWrap}>
      <Text style={styles.questionTitle}>{title}</Text>
      {sub ? <Text style={styles.questionSub}>{sub}</Text> : null}
    </View>
  )
}

function BigField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.bigField}>
      <Text style={styles.bigFieldLabel}>{label}</Text>
      {children}
    </View>
  )
}

function Segment({
  label, icon, active, onPress,
}: { label: string; icon: keyof typeof Feather.glyphMap; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segment, active && styles.segmentActive]}
    >
      <Feather name={icon} size={20} color={active ? '#fff' : theme.fg} />
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function firstNameOf(full: string): string {
  return full.trim().split(/\s+/)[0] ?? ''
}

// Keep phone inputs to digits and common formatting chars, capped in length —
// stops free-text like "32" from looking like a complete entry.
function sanitizePhone(v: string): string {
  return v.replace(/[^\d\s()+\-.]/g, '').slice(0, 20)
}

function isValidPhone(v: string): boolean {
  const digits = v.replace(/\D/g, '').length
  return digits >= 7 && digits <= 15
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatBirthday(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function defaultBirthday(): Date {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 30)
  return d
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    gap: spacing[3],
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.bgSunken,
    alignItems: 'center', justifyContent: 'center',
  },

  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: theme.border,
  },
  dotFilled: { backgroundColor: forest[400] },
  dotActive: { backgroundColor: forest[700], width: 24 },
  stepText: { fontSize: fontSize.xs, color: theme.fgMuted, marginLeft: spacing[2], fontWeight: fontWeight.medium },

  scroll: { flex: 1, minHeight: 0 },
  scrollContent: { paddingHorizontal: spacing[5], paddingTop: spacing[5], paddingBottom: spacing[6] },

  questionWrap: { marginBottom: spacing[4] },
  questionTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: theme.fg,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  questionSub: {
    fontSize: fontSize.sm,
    color: theme.fgMuted,
    marginTop: spacing[1],
    lineHeight: 20,
  },

  divider: {
    height: 1,
    backgroundColor: theme.borderSubtle,
    marginVertical: spacing[5],
  },

  bigField: { marginBottom: spacing[3] },
  bigFieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: theme.fgMuted,
    marginBottom: 6,
  },
  bigInput: {
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    fontSize: fontSize.lg,
    color: theme.fg,
    minHeight: 52,
  },
  bigInputMultiline: { minHeight: 120, paddingTop: 14, fontSize: fontSize.base, lineHeight: 22 },

  segmentRow: { flexDirection: 'row', gap: spacing[3] },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: theme.border,
    backgroundColor: theme.bgElevated,
  },
  segmentActive: {
    borderColor: forest[700],
    backgroundColor: forest[700],
  },
  segmentText: { fontSize: fontSize.base, fontWeight: fontWeight.semi, color: theme.fg },
  segmentTextActive: { color: '#fff' },

  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    minHeight: 52,
  },
  dateBtnText: { fontSize: fontSize.lg, color: theme.fg },
  dateBtnPlaceholder: { color: theme.fgFaint },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  bigChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: theme.border,
    backgroundColor: theme.bgElevated,
  },
  bigChipActive: {
    backgroundColor: forest[700],
    borderColor: forest[700],
  },
  bigChipText: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: theme.fg },
  bigChipTextActive: { color: '#fff', fontWeight: fontWeight.semi },

  error: {
    fontSize: fontSize.sm,
    color: theme.danger,
    backgroundColor: '#FDECEC',
    padding: spacing[3],
    borderRadius: radius.md,
    marginTop: spacing[4],
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    backgroundColor: theme.bgElevated,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
  },
  backBtnPressed: { opacity: 0.5 },
  backBtnHidden: { opacity: 0 },
  backBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: theme.fg },

  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    minHeight: 56,
  },
  primaryBtnPressed: { backgroundColor: theme.primaryPress },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { fontSize: fontSize.lg, fontWeight: fontWeight.semi, color: '#fff' },

  // Birthday picker modal
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 31, 24, 0.4)',
  },
  pickerSheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: theme.bgElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: 32,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  pickerTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semi, color: theme.fg },
  pickerCancel: { fontSize: fontSize.base, color: theme.fgMuted, fontWeight: fontWeight.medium },
  pickerDone: { fontSize: fontSize.base, color: forest[700], fontWeight: fontWeight.semi },
  pickerBody: { width: '100%' },
})
