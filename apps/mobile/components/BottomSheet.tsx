import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme, radius } from '@mind-court/ui'

const SCREEN_HEIGHT = Dimensions.get('window').height
const TARGET_HEIGHT = SCREEN_HEIGHT * 0.85
const TOP_GAP = 24 // breathing room between sheet top and screen top when keyboard pushes it up
const DRAG_DISMISS_DISTANCE = 120
const DRAG_DISMISS_VELOCITY = 0.5

type Props = {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

export function BottomSheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets()
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const dragY = useRef(new Animated.Value(0)).current
  const canDismiss = useRef(false)
  const guardTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const onCloseRef = useRef(onClose)
  const keyboardHeightRef = useRef(0)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => { keyboardHeightRef.current = keyboardHeight }, [keyboardHeight])

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const showSub = Keyboard.addListener(showEvent, e => setKeyboardHeight(e.endCoordinates.height))
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0))
    return () => { showSub.remove(); hideSub.remove() }
  }, [])

  // Shrink sheet so its top stays at least TOP_GAP below the safe-area top
  // even after the keyboard pushes it up.
  const cappedHeight = Math.max(
    160,
    Math.min(TARGET_HEIGHT, SCREEN_HEIGHT - insets.top - keyboardHeight - TOP_GAP),
  )

  useEffect(() => {
    if (visible) {
      canDismiss.current = false
      clearTimeout(guardTimer.current)
      guardTimer.current = setTimeout(() => { canDismiss.current = true }, 350)
      dragY.setValue(0)
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start()
    } else {
      canDismiss.current = false
      clearTimeout(guardTimer.current)
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start(() => dragY.setValue(0))
    }
    return () => clearTimeout(guardTimer.current)
  }, [visible, translateY, dragY])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        if (keyboardHeightRef.current > 0) Keyboard.dismiss()
      },
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) dragY.setValue(g.dy)
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DRAG_DISMISS_DISTANCE || g.vy > DRAG_DISMISS_VELOCITY) {
          Animated.timing(dragY, {
            toValue: SCREEN_HEIGHT,
            duration: 180,
            useNativeDriver: true,
          }).start(() => onCloseRef.current())
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start()
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start()
      },
    }),
  ).current

  function handleBackdropPress() {
    if (!canDismiss.current) return
    // If the keyboard is up, drop it first — the user can tap again to close.
    if (keyboardHeight > 0) {
      Keyboard.dismiss()
      return
    }
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.flex}>
        <Pressable style={styles.backdrop} onPress={handleBackdropPress} />
        <Animated.View
          style={[
            styles.sheet,
            {
              height: cappedHeight,
              transform: [
                { translateY },
                // Lift the sheet above the keyboard
                { translateY: -keyboardHeight },
                // Drag offset
                { translateY: dragY },
              ],
            },
          ]}
        >
          <View style={styles.handleHitArea} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 31, 24, 0.4)',
  },
  sheet: {
    backgroundColor: theme.bgElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: 40,
  },
  handleHitArea: {
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.border,
  },
})
