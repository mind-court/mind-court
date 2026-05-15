import { Tabs } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { theme } from '@mind-court/ui'

type FeatherName = React.ComponentProps<typeof Feather>['name']

function icon(name: FeatherName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Feather name={name} color={color} size={size} />
  )
}

export default function CoachLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.fgSubtle,
        tabBarStyle: {
          backgroundColor: theme.bgElevated,
          borderTopColor: theme.border,
          borderTopWidth: 1,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Today', tabBarIcon: icon('calendar') }}
      />
      <Tabs.Screen
        name="players"
        options={{ title: 'Players', tabBarIcon: icon('users') }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: 'Messages', tabBarIcon: icon('message-circle') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Account', tabBarIcon: icon('user') }}
      />
      {/* Sub-screens — hidden from tab bar, tab bar hidden when active */}
      <Tabs.Screen
        name="session/[id]"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="thread/[id]"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="player/[id]"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  )
}
