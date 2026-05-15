import { Stack } from 'expo-router'

export default function CoachLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      <Stack.Screen name="player/[id]" />
      <Stack.Screen name="session/[id]" />
      <Stack.Screen name="thread/[id]" />
    </Stack>
  )
}
