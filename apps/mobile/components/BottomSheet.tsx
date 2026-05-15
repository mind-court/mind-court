import { useEffect, useRef } from 'react'
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { theme, radius } from '@mind-court/ui'

const SCREEN_HEIGHT = Dimensions.get('window').height

type Props = {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

export function BottomSheet({ visible, onClose, children }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const canDismiss = useRef(false)
  const guardTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (visible) {
      canDismiss.current = false
      clearTimeout(guardTimer.current)
      guardTimer.current = setTimeout(() => { canDismiss.current = true }, 350)
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
      }).start()
    }
    return () => clearTimeout(guardTimer.current)
  }, [visible])

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => canDismiss.current && onClose()}
        />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
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
    height: SCREEN_HEIGHT * 0.75,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
})
