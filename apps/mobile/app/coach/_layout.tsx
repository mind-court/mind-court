import { Tabs } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { theme } from '@mind-court/ui'
import { useConversations } from '../../lib/useConversations'

type FeatherName = React.ComponentProps<typeof Feather>['name']

function icon(name: FeatherName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Feather name={name} color={color} size={size} />
  )
}

export default function CoachLayout() {
  const { conversations } = useConversations()
  const recentCount = conversations.filter(c =>
    c.last_message_at != null &&
    Date.now() - new Date(c.last_message_at).getTime() < 86400000
  ).length

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
        options={{
          title: 'Messages',
          tabBarIcon: icon('message-circle'),
          tabBarBadge: recentCount > 0 ? recentCount : undefined,
        }}
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
