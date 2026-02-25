import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useLocale() {
  const { locale } = useI18n()

  const currentLocale = computed({
    get: () => locale.value,
    set: (newLocale) => {
      locale.value = newLocale
      localStorage.setItem('chatpwa_locale', newLocale)
    }
  })

  const localeOptions = [
    { value: 'en', nativeName: 'English' },
    { value: 'zh-TW', nativeName: '繁體中文' },
    { value: 'fr', nativeName: 'Français' },
    { value: 'ja', nativeName: '日本語' }
  ]

  return {
    currentLocale,
    localeOptions
  }
}
