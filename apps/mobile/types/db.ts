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
}

export type Lesson = {
  id: string
  coach_id: string
  player_id: string | null
  player_name: string        // denormalised for quick display
  scheduled_at: string       // ISO timestamp
  court: string | null
  drills: string | null
  mental_cue: string | null
  created_at: string
}
