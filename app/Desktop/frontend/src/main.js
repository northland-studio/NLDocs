import { createApp } from 'vue'
import './styles/design-tokens.css'
import './styles/typography.css'
import './styles/global.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')

// Electron environment detection
window.isElectron = typeof window.electronAPI !== 'undefined'
