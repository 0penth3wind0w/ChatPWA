<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import SettingsForm from '../components/SettingsForm.vue'
import { useStorage } from '../composables/useStorage.js'
import { useApi } from '../composables/useApi.js'
import { useChat } from '../composables/useChat.js'
import { useDarkMode } from '../composables/useDarkMode.js'
import { useColorTheme } from '../composables/useColorTheme.js'
import { useLocale } from '../composables/useLocale.js'

const emit = defineEmits(['navigate'])
const { t } = useI18n()
const { isDark, toggleDarkMode } = useDarkMode()
const { currentTheme, setTheme, themes } = useColorTheme()
const { currentLocale, localeOptions } = useLocale()

const { testConnection } = useApi()
const { clearMessages } = useChat()
const testStatus = ref(null) // null, 'success', or 'error'
const testMessage = ref('')

// Get version from Vite define
const appVersion = __APP_VERSION__

// PWA update handler
const { needRefresh, updateServiceWorker } = useRegisterSW()
const updateStatus = ref(null) // null, 'updating', or 'success'

const handleUpdate = async () => {
  updateStatus.value = 'updating'
  try {
    await updateServiceWorker(true)
    updateStatus.value = 'success'
    // Reload the page after successful update
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch (err) {
    updateStatus.value = null
    console.error('Failed to update:', err)
  }
}

const handleTest = async (testConfig) => {
  testStatus.value = null
  testMessage.value = t('settings.connectionTest.testing')

  try {
    await testConnection(testConfig)
    testStatus.value = 'success'
    testMessage.value = t('settings.connectionTest.success')

    // Clear success message after 3 seconds
    setTimeout(() => {
      testStatus.value = null
      testMessage.value = ''
    }, 3000)
  } catch (err) {
    testStatus.value = 'error'
    testMessage.value = err.message || t('settings.connectionTest.failed')

    // Clear error message after 5 seconds
    setTimeout(() => {
      testStatus.value = null
      testMessage.value = ''
    }, 5000)
  }
}

const handleClearHistory = async () => {
  if (confirm(t('settings.clearHistory.confirm'))) {
    await clearMessages()
  }
}

const handleBack = () => {
  emit('navigate', 'chat')
}
</script>

<template>
  <div class="w-full flex flex-col bg-bg-primary" style="height: calc(var(--vh, 1vh) * 100)">
    <!-- Fixed Header -->
    <header role="banner" class="flex-shrink-0 px-6 pt-6 pb-4">
      <div class="flex items-center justify-between w-full">
        <button
          @click="handleBack"
          aria-label="Back to chat"
          class="w-11 h-11 bg-bg-surface rounded-full shadow-elevated flex items-center justify-center hover:bg-bg-elevated transition-colors"
        >
          <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 class="text-2xl font-semibold text-text-primary -tracking-tight">
          {{ t('common.settings') }}
        </h1>
        <div class="w-11 h-11" aria-hidden="true"></div>
      </div>
    </header>

    <!-- Scrollable Content -->
    <main id="main-content" role="main" tabindex="-1" class="flex-1 overflow-y-auto px-6 min-h-0 focus:outline-none" aria-label="Settings configuration">
      <div class="flex flex-col gap-6 pb-24 pt-2">
        <!-- Clear Chat History Card -->
        <div class="card">
          <div class="flex items-center justify-between w-full gap-4">
            <div class="flex flex-col gap-1.5">
              <p class="text-base font-semibold text-text-primary">
                {{ t('settings.clearHistory.title') }}
              </p>
              <p class="text-sm text-text-tertiary leading-relaxed">
                {{ t('settings.clearHistory.description') }}
              </p>
            </div>
            <button
              @click="handleClearHistory"
              class="h-10 px-5 bg-bg-elevated text-text-secondary text-sm font-semibold rounded-lg hover:bg-border-subtle transition-colors border border-border-subtle"
            >
              {{ t('settings.clearHistory.button') }}
            </button>
          </div>
        </div>

        <!-- Settings Card -->
        <div class="card">
          <h2 class="text-lg font-semibold text-text-primary -tracking-tight mb-6">
            {{ t('settings.apiConfig.title') }}
          </h2>
          <SettingsForm
            @test="handleTest"
          />

          <!-- Test Status Message -->
          <div v-if="testMessage" class="mt-5 p-4 rounded-xl" :class="{
            'bg-light-green/30 text-forest-green': testStatus === 'success',
            'bg-red-50 text-warm-red': testStatus === 'error',
            'bg-bg-elevated text-text-secondary': !testStatus
          }">
            <p class="text-sm font-medium">{{ testMessage }}</p>
          </div>
        </div>

        <!-- Language Card -->
        <div class="card">
          <div class="flex flex-col gap-5 w-full">
            <div class="flex flex-col gap-1.5">
              <p class="text-base font-semibold text-text-primary">
                {{ t('settings.language.label') }}
              </p>
              <p class="text-sm text-text-tertiary leading-relaxed">
                {{ t('settings.language.description') }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="locale in localeOptions"
                :key="locale.value"
                @click="currentLocale = locale.value"
                class="relative flex items-center justify-between p-4 rounded-xl border-2 transition-all"
                :class="currentLocale === locale.value
                  ? 'border-forest-green bg-light-green/20'
                  : 'border-border-subtle bg-bg-surface hover:border-border-strong'"
              >
                <span class="text-base font-medium text-text-primary">
                  {{ locale.nativeName }}
                </span>
                <svg
                  v-if="currentLocale === locale.value"
                  class="w-5 h-5 text-forest-green"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Color Theme Card -->
        <div class="card">
          <div class="flex flex-col gap-5 w-full">
            <div class="flex flex-col gap-1.5">
              <p class="text-base font-semibold text-text-primary">
                {{ t('settings.colorTheme.label') }}
              </p>
              <p class="text-sm text-text-tertiary leading-relaxed">
                {{ t('settings.colorTheme.description') }}
              </p>
            </div>
            <div class="flex flex-col gap-3">
              <button
                v-for="(theme, key) in themes"
                :key="key"
                @click="setTheme(key)"
                :aria-label="`Select ${theme.name} theme`"
                :aria-pressed="currentTheme === key"
                class="relative flex items-center justify-between p-4 rounded-xl border-2 transition-all group"
                :class="currentTheme === key ? 'border-forest-green bg-light-green/20' : 'border-border-subtle bg-bg-elevated hover:border-border-strong hover:bg-bg-surface'"
              >
                <div class="flex items-center gap-4">
                  <!-- Color Preview Circles -->
                  <div class="flex items-center gap-1.5" aria-hidden="true">
                    <div
                      class="w-10 h-10 rounded-full shadow-soft border-2 border-white"
                      :style="{ backgroundColor: theme.primary }"
                    ></div>
                    <div
                      class="w-8 h-8 rounded-full shadow-soft border-2 border-white"
                      :style="{ backgroundColor: theme.dark }"
                    ></div>
                    <div
                      class="w-6 h-6 rounded-full shadow-soft border-2 border-white"
                      :style="{ backgroundColor: theme.light }"
                    ></div>
                  </div>
                  <!-- Theme Name -->
                  <span class="text-base font-semibold text-text-primary">
                    {{ theme.name }}
                  </span>
                </div>
                <!-- Selected Indicator -->
                <div
                  v-if="currentTheme === key"
                  class="w-6 h-6 rounded-full bg-forest-green flex items-center justify-center"
                  aria-hidden="true"
                >
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <!-- Hover Ring -->
                <div
                  v-else
                  class="w-6 h-6 rounded-full border-2 border-border-subtle transition-colors group-hover:border-forest-green"
                  aria-hidden="true"
                ></div>
              </button>
            </div>
          </div>
        </div>

        <!-- Dark Mode Card -->
        <div class="card">
          <div class="flex items-center justify-between w-full gap-4">
            <div class="flex flex-col gap-1.5">
              <p class="text-base font-semibold text-text-primary">
                {{ t('settings.darkMode.label') }}
              </p>
              <p class="text-sm text-text-tertiary leading-relaxed">
                {{ t('settings.darkMode.description') }}
              </p>
            </div>
            <button
              @click="toggleDarkMode"
              :aria-label="isDark ? t('settings.darkMode.switchToLight') : t('settings.darkMode.switchToDark')"
              class="w-14 h-8 bg-bg-elevated rounded-full relative transition-colors border border-border-subtle"
              :class="{ 'bg-forest-green border-forest-green': isDark }"
            >
              <span
                class="absolute w-6 h-6 bg-white rounded-full top-1 transition-all shadow-sm"
                :class="isDark ? 'left-7' : 'left-1'"
              >
                <!-- Sun icon (light mode) -->
                <svg v-if="!isDark" class="w-4 h-4 text-forest-green absolute top-1 left-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                <!-- Moon icon (dark mode) -->
                <svg v-else class="w-4 h-4 text-forest-green absolute top-1 left-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
              </span>
            </button>
          </div>
        </div>

        <!-- PWA Update Card -->
        <div class="card">
          <div class="flex items-center justify-between w-full gap-4">
            <div class="flex flex-col gap-1.5">
              <p class="text-base font-semibold text-text-primary">
                {{ t('settings.pwaUpdate.title') }}
              </p>
              <p class="text-sm text-text-tertiary leading-relaxed">
                {{ t('settings.pwaUpdate.description') }}
              </p>
            </div>
            <button
              @click="handleUpdate"
              :disabled="updateStatus === 'updating'"
              class="h-10 px-5 bg-forest-green text-white text-sm font-semibold rounded-md hover:bg-dark-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="updateStatus === 'updating'">{{ t('settings.pwaUpdate.updating') }}</span>
              <span v-else-if="updateStatus === 'success'">{{ t('settings.pwaUpdate.updated') }}</span>
              <span v-else-if="needRefresh">{{ t('settings.pwaUpdate.updateAvailable') }}</span>
              <span v-else>{{ t('settings.pwaUpdate.check') }}</span>
            </button>
          </div>
        </div>

        <!-- Version Info Card -->
        <div class="card">
          <div class="flex items-center justify-between w-full gap-4">
            <div class="flex flex-col gap-1.5">
              <p class="text-base font-semibold text-text-primary">
                {{ t('settings.version.title') }}
              </p>
              <p class="text-sm text-text-tertiary leading-relaxed font-mono">
                {{ appVersion }}
              </p>
            </div>
            <button
              @click="() => { navigator.clipboard.writeText(appVersion) }"
              class="h-10 px-5 bg-bg-elevated text-text-secondary text-sm font-semibold rounded-lg hover:bg-border-subtle transition-colors border border-border-subtle"
              :aria-label="t('settings.version.copy')"
            >
              {{ t('settings.version.copy') }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
