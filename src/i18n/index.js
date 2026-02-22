import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zh from './locales/zh-TW.json'
import fr from './locales/fr.json'
import ja from './locales/ja.json'

// Get saved locale from localStorage or use browser language
const getSavedLocale = () => {
  const saved = localStorage.getItem('chatpwa_locale')
  if (saved) return saved

  // Try to match browser language
  const browserLang = navigator.language || navigator.userLanguage
  if (browserLang.startsWith('zh')) return 'zh-TW'
  if (browserLang.startsWith('fr')) return 'fr'
  if (browserLang.startsWith('ja')) return 'ja'
  return 'en'
}

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: getSavedLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-TW': zh,
    fr,
    ja
  }
})

export default i18n
