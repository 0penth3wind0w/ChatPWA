import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useLocale() {
  const { locale, availableLocales, t } = useI18n()

  const currentLocale = computed({
    get: () => locale.value,
    set: (newLocale) => {
      locale.value = newLocale
      localStorage.setItem('chatpwa_locale', newLocale)
    }
  })

  const localeOptions = [
    { value: 'en', label: 'English', nativeName: 'English' },
    { value: 'zh-TW', label: '繁體中文', nativeName: '繁體中文' },
    { value: 'fr', label: 'Français', nativeName: 'Français' },
    { value: 'ja', label: '日本語', nativeName: '日本語' }
  ]

  return {
    currentLocale,
    localeOptions,
    availableLocales,
    t
  }
}
