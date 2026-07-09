import { createApp } from 'vue'
import './styles/design-tokens.css'
import './styles/typography.css'
import './styles/global.css'
import App from './App.vue'
import router from './router'

// Capacitor plugins
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { App as CapacitorApp } from '@capacitor/app'

const app = createApp(App)
app.use(router)
app.mount('#app')

// Initialize Capacitor plugins (only on native platform)
if (Capacitor.isNativePlatform()) {
  // Configure status bar
  StatusBar.setStyle({ style: Style.Dark })
  StatusBar.setBackgroundColor({ color: '#0071e3' })

  // Hide splash screen after app loads
  setTimeout(async () => {
    await SplashScreen.hide()
  }, 2000)

  // Handle hardware back button
  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      CapacitorApp.exitApp()
    }
  })
}

// Register service worker (skip on Capacitor native)
if ('serviceWorker' in navigator && import.meta.env.PROD && !Capacitor.isNativePlatform()) {
  navigator.serviceWorker.register('/sw.js').catch(() => {})
}
