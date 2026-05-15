import { useState } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView, Platform,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { BottomSheet } from './BottomSheet'
import { theme, spacing, fontSize, fontWeight, radius, forest } from '@mind-court/ui'
import type { PlayerIntake } from '../types/db'

type Props = {
  visible: boolean
  onClose: () => void
  onSave: (input: PlayerIntake) => Promise<{ error: string | null } | undefined>
}

const STEP_COUNT = 4
const CADENCE_OPTIONS = ['Weekly', 'Bi-weekly', 'Monthly', 'Drop-in']
const SKILL_PRESETS = ['Beginner', 'NTRP 2.5', 'NTRP 3.0', 'NTRP 3.5', 'NTRP 4.0', 'NTRP 4.5+']

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

  // Step gating
  const step1Ok = fullName.trim().length > 0 && isKidMode !== null
  const step2Ok = isKidMode === false
    || (parentName.trim().length > 0 && parentPhone.trim().length > 0)
  const canContinue = (step === 1 && step1Ok) || (step === 2 && step2Ok) || step === 3 || step === 4

  function next() {
    if (!canContinue) return
    if (step < STEP_COUNT) setStep(s => s + 1)
  }

  function back() {
    if (step > 1) setStep(s => s - 1)
  }

  async function save() {
    if (loading) return
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
    if (result?.error) setError(result.error)
    else { reset(); onClose() }
  }

  function onDateChange(_e: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowDatePicker(false)
    if (selected) setBirthdate(selected)
  }

  return (
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
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <Step1
            fullName={fullName} setFullName={setFullName}
            isKidMode={isKidMode} setIsKidMode={setIsKidMode}
            birthdate={birthdate}
            showDatePicker={showDatePicker} setShowDatePicker={setShowDatePicker}
            onDateChange={onDateChange}
          />
        )}
        {step === 2 && (
          <Step2
            isKidMode={!!isKidMode}
            firstName={firstNameOf(fullName)}
            contactPhone={contactPhone} setContactPhone={setContactPhone}
            contactEmail={contactEmail} setContactEmail={setContactEmail}
            parentName={parentName} setParentName={setParentName}
            parentPhone={parentPhone} setParentPhone={setParentPhone}
          />
        )}
        {step === 3 && (
          <Step3
            firstName={firstNameOf(fullName)}
            skillLevel={skillLevel} setSkillLevel={setSkillLevel}
            lessonCadence={lessonCadence} setLessonCadence={setLessonCadence}
            primaryFocus={primaryFocus} setPrimaryFocus={setPrimaryFocus}
          />
        )}
        {step === 4 && (
          <Step4
            firstName={firstNameOf(fullName)}
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
  )
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function Step1({
  fullName, setFullName, isKidMode, setIsKidMode,
  birthdate, showDatePicker, setShowDatePicker, onDateChange,
}: {
  fullName: string; setFullName: (v: string) => void
  isKidMode: boolean | null; setIsKidMode: (v: boolean) => void
  birthdate: Date | null
  showDatePicker: boolean; setShowDatePicker: (v: boolean) => void
  onDateChange: (e: DateTimePickerEvent, d?: Date) => void
}) {
  return (
    <>
      <Question title="What's their name?" />
      <TextInput
        style={styles.bigInput}
        placeholder="Jamie Martinez"
        placeholderTextColor={theme.fgFaint}
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        autoFocus
        returnKeyType="next"
      />

      <View style={styles.spacer} />

      <Question title="Are they an adult or a kid?" sub="Kids under 13 use a simpler version of the app and we'll need a parent contact." />
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

      <View style={styles.spacer} />

      <Question title="Their birthday" sub="Optional — handy for age-appropriate drills and check-ins." />
      <Pressable
        onPress={() => setShowDatePicker(true)}
        style={styles.dateBtn}
      >
        <Feather name="calendar" size={18} color={theme.fgMuted} />
        <Text style={[styles.dateBtnText, !birthdate && styles.dateBtnPlaceholder]}>
          {birthdate ? formatBirthday(birthdate) : 'Pick a date'}
        </Text>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          value={birthdate ?? defaultBirthday()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={new Date()}
          onChange={onDateChange}
        />
      )}
      {Platform.OS === 'ios' && showDatePicker && (
        <Pressable onPress={() => setShowDatePicker(false)} style={styles.doneBtn}>
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      )}
    </>
  )
}

function Step2({
  isKidMode, firstName,
  contactPhone, setContactPhone, contactEmail, setContactEmail,
  parentName, setParentName, parentPhone, setParentPhone,
}: {
  isKidMode: boolean
  firstName: string
  contactPhone: string; setContactPhone: (v: string) => void
  contactEmail: string; setContactEmail: (v: string) => void
  parentName: string; setParentName: (v: string) => void
  parentPhone: string; setParentPhone: (v: string) => void
}) {
  if (isKidMode) {
    return (
      <>
        <Question
          title={`Who's ${firstName || 'the kid'}'s parent or guardian?`}
          sub="We'll send schedule and reminder messages here."
        />
        <BigField label="Parent or guardian name">
          <TextInput
            style={styles.bigInput}
            placeholder="Alex Martinez"
            placeholderTextColor={theme.fgFaint}
            value={parentName}
            onChangeText={setParentName}
            autoCapitalize="words"
            autoFocus
          />
        </BigField>
        <BigField label="Parent phone">
          <TextInput
            style={styles.bigInput}
            placeholder="(555) 123-4567"
            placeholderTextColor={theme.fgFaint}
            value={parentPhone}
            onChangeText={setParentPhone}
            keyboardType="phone-pad"
          />
        </BigField>

        <View style={styles.spacer} />
        <Question
          title={`Can ${firstName || 'they'} also be reached directly?`}
          sub="Optional — some families prefer the kid get reminders too."
        />
        <BigField label="Kid's phone (optional)">
          <TextInput
            style={styles.bigInput}
            placeholder="(555) 123-4567"
            placeholderTextColor={theme.fgFaint}
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
          />
        </BigField>
      </>
    )
  }

  return (
    <>
      <Question
        title={`How do you reach ${firstName || 'them'}?`}
        sub="Both are optional — fill in whatever you've got."
      />
      <BigField label="Phone (optional)">
        <TextInput
          style={styles.bigInput}
          placeholder="(555) 123-4567"
          placeholderTextColor={theme.fgFaint}
          value={contactPhone}
          onChangeText={setContactPhone}
          keyboardType="phone-pad"
          autoFocus
        />
      </BigField>
      <BigField label="Email (optional)">
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
  )
}

function Step3({
  firstName, skillLevel, setSkillLevel,
  lessonCadence, setLessonCadence, primaryFocus, setPrimaryFocus,
}: {
  firstName: string
  skillLevel: string; setSkillLevel: (v: string) => void
  lessonCadence: string; setLessonCadence: (v: string) => void
  primaryFocus: string; setPrimaryFocus: (v: string) => void
}) {
  return (
    <>
      <Question
        title={`Where is ${firstName || 'this player'} at?`}
        sub="Pick what fits — or type your own."
      />
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
      <TextInput
        style={[styles.bigInput, { marginTop: spacing[2] }]}
        placeholder="Or describe it (e.g. Returning after break)"
        placeholderTextColor={theme.fgFaint}
        value={SKILL_PRESETS.includes(skillLevel) ? '' : skillLevel}
        onChangeText={setSkillLevel}
        autoCapitalize="sentences"
      />

      <View style={styles.spacer} />

      <Question title="How often do you see them?" />
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

      <View style={styles.spacer} />

      <Question
        title="What are you working on first?"
        sub="One sentence is plenty."
      />
      <TextInput
        style={styles.bigInput}
        placeholder="Backhand consistency, match prep…"
        placeholderTextColor={theme.fgFaint}
        value={primaryFocus}
        onChangeText={setPrimaryFocus}
      />
    </>
  )
}

function Step4({
  firstName, intakeNotes, setIntakeNotes,
}: {
  firstName: string
  intakeNotes: string; setIntakeNotes: (v: string) => void
}) {
  return (
    <>
      <Question
        title="Anything you want to remember?"
        sub={`Goals, injuries, schedule quirks${firstName ? `, what ${firstName} said in the first call` : ''} — anything you'd jot in a notebook. Optional.`}
      />
      <TextInput
        style={[styles.bigInput, styles.bigInputMultiline]}
        placeholder={`E.g. "Recovering from a shoulder strain, OK to serve at 75%. Loves doubles."`}
        placeholderTextColor={theme.fgFaint}
        value={intakeNotes}
        onChangeText={setIntakeNotes}
        multiline
        textAlignVertical="top"
        autoFocus
      />
    </>
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

  scroll: { flexGrow: 0 },
  scrollContent: { paddingHorizontal: spacing[5], paddingTop: spacing[5], paddingBottom: spacing[6] },

  questionWrap: { marginBottom: spacing[3] },
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

  spacer: { height: spacing[6] },

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
  bigInputMultiline: { minHeight: 140, paddingTop: 14, fontSize: fontSize.base, lineHeight: 22 },

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

  doneBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  doneBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semi, color: forest[700] },

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
})
