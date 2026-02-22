import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import i18n from './i18n'

// Log version to console for debugging
console.log(`%c ChatPWA v${__APP_VERSION__} `, 'background: #3D8A5A; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;')

// Expose version globally for debugging
window.__APP_VERSION__ = __APP_VERSION__

createApp(App)
  .use(i18n)
  .mount('#app')
