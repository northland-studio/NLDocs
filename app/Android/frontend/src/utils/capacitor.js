import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Keyboard } from '@capacitor/keyboard'

export const isNative = () => Capacitor.isNativePlatform()
export const isAndroid = () => Capacitor.getPlatform() === 'android'

export const setStatusBarDark = async () => {
  if (isNative()) {
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#0071e3' })
  }
}

export const setStatusBarLight = async () => {
  if (isNative()) {
    await StatusBar.setStyle({ style: Style.Light })
    await StatusBar.setBackgroundColor({ color: '#f5f5f7' })
  }
}

export const triggerHaptic = async (style = ImpactStyle.Light) => {
  if (isNative()) {
    await Haptics.impact({ style })
  }
}

export const hideSplashScreen = async () => {
  if (isNative()) {
    await SplashScreen.hide()
  }
}

export const setKeyboardResize = async (mode) => {
  if (isNative()) {
    await Keyboard.setResizeMode({ mode })
  }
}

export { ImpactStyle }
