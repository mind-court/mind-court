import { Redirect } from 'expo-router'

export default function Root() {
  // Will redirect to auth once Supabase is wired up.
  // For now drops straight into the coach home.
  return <Redirect href="/coach" />
}
