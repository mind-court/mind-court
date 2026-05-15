import { useEffect, useRef } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

export function useRefreshOnForeground(refresh: () => void) {
  const appState = useRef<AppStateStatus>(AppState.currentState)

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (appState.current === 'background' && next === 'active') {
        refresh()
      }
      appState.current = next
    })
    return () => sub.remove()
  }, [refresh])
}
