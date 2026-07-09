import { createApp } from 'vue'
import './styles/design-tokens.css'
import './styles/typography.css'
import './styles/global.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}