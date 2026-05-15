export type Role = 'coach' | 'player'

export type Profile = {
  id: string
  role: Role
  full_name: string
  created_at: string
}

export type Player = {
  id: string
  coach_id: string
  full_name: string
  is_kid_mode: boolean
  created_at: string
  skill_level: string | null
  contact_phone: string | null
  contact_email: string | null
  birthdate: string | null
  lesson_cadence: string | null
  primary_focus: string | null
  intake_notes: string | null
  parent_name: string | null
  parent_phone: string | null
}

export type PlayerIntake = {
  fullName: string
  isKidMode: boolean
  skillLevel?: string
  contactPhone?: string
  contactEmail?: string
  birthdate?: string
  lessonCadence?: string
  primaryFocus?: string
  intakeNotes?: string
  parentName?: string
  parentPhone?: string
}

export type Lesson = {
  id: string
  coach_id: string
  player_id: string | null
  player_name: string
  scheduled_at: string
  court: string | null
  drills: string | null
  mental_cue: string | null
  notes: string | null
  duration_minutes: number | null
  created_at: string
}

export type DrillCompletion = {
  id: string
  lesson_id: string
  coach_id: string
  drill_index: number
  completed_at: string
}

export type Conversation = {
  id: string
  coach_id: string
  player_id: string | null
  player_name: string
  last_message: string | null
  last_message_at: string | null
  last_read_at: string | null
  created_at: string
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  content: string
  created_at: string
}
