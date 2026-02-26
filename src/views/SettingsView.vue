<script setup>
import { ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import SettingsForm from '../components/SettingsForm.vue'
import { usePwa } from '../composables/usePwa.js'
import { useApi } from '../composables/useApi.js'
import { useChat } from '../composables/useChat.js'
import { useDarkMode } from '../composables/useDarkMode.js'
import { useColorTheme } from '../composables/useColorTheme.js'
import { useLocale } from '../composables/useLocale.js'
import { logger } from '../utils/logger.js'

const emit = defineEmits(['navigate'])
const { t } = useI18n()
const { isDark, toggleDarkMode } = useDarkMode()
const { currentTheme, setTheme, themes } = useColorTheme()
const { currentLocale, localeOptions } = useLocale()

const { testConnection } = useApi()
const { clearMessages, conversations, deleteConversation } = useChat()
const testStatus = ref(null) // null, 'success', or 'error'
const testMessage = ref('')

// Get version from Vite define
const appVersion = __APP_VERSION__

// PWA update handler
const { needRefresh, updateServiceWorker } = usePwa()
const updateStatus = ref(null) // null, 'updating', or 'success'

let updateTimer = null
let testTimer = null

onUnmounted(() => {
  clearTimeout(updateTimer)
  clearTimeout(testTimer)
})

const handleUpdate = async () => {
  updateStatus.value = 'updating'
  try {
    await updateServiceWorker(true)
    updateStatus.value = 'success'
    // Reload the page after successful update
    updateTimer = setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch (err) {
    updateStatus.value = null
    logger.error('Failed to update:', err)
  }
}

const handleTest = async (testConfig) => {
  clearTimeout(testTimer)
  testStatus.value = null
  testMessage.value = t('settings.connectionTest.testing')

  try {
    await testConnection(testConfig)
    testStatus.value = 'success'
    testMessage.value = t('settings.connectionTest.success')

    testTimer = setTimeout(() => {
      testStatus.value = null
      testMessage.value = ''
    }, 3000)
  } catch (err) {
    testStatus.value = 'error'
    testMessage.value = err.message || t('settings.connectionTest.failed')

    testTimer = setTimeout(() => {
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

const handleClearAllConversations = async () => {
  if (confirm(t('settings.clearAllConversations.confirm'))) {
    const ids = conversations.value.map(c => c.id)
    for (const id of ids) {
      await deleteConversation(id)
    }
  }
}

const copyAppVersion = () => {
  navigator.clipboard.writeText(appVersion)
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
        <!-- Data Management Card -->
        <div class="card">
          <!-- Section header with warning icon -->
          <div class="flex items-center gap-2.5 mb-6">
            <svg class="w-5 h-5 text-warm-red shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13" stroke-linecap="round" stroke-width="2"/>
              <circle cx="12" cy="16.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
            <h2 class="text-lg font-semibold text-text-primary -tracking-tight">
              {{ t('settings.dataManagement.title') }}
            </h2>
          </div>

          <!-- Clear Current Chat -->
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
              class="h-10 px-5 bg-bg-elevated text-text-secondary text-sm font-semibold rounded-md hover:bg-border-subtle transition-colors border border-border-subtle shrink-0"
            >
              {{ t('settings.clearHistory.button') }}
            </button>
          </div>

          <!-- Clear All Conversations -->
          <div class="w-full h-px bg-border-subtle my-6"></div>
          <div class="flex items-center justify-between w-full gap-4">
            <div class="flex flex-col gap-1.5">
              <p class="text-base font-semibold text-text-primary">
                {{ t('settings.clearAllConversations.title') }}
              </p>
              <p class="text-sm text-text-tertiary leading-relaxed">
                {{ t('settings.clearAllConversations.description') }}
              </p>
            </div>
            <button
              @click="handleClearAllConversations"
              class="h-10 px-5 bg-bg-elevated text-warm-red text-sm font-semibold rounded-md hover:bg-border-subtle transition-colors border border-border-subtle shrink-0"
            >
              {{ t('settings.clearAllConversations.button') }}
            </button>
          </div>
        </div>

        <!-- AI Settings Card -->
        <div class="card">
          <h2 class="text-lg font-semibold text-text-primary -tracking-tight mb-6">
            {{ t('settings.aiSettings.title') }}
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

        <!-- Appearance Card -->
        <div class="card">
          <h2 class="text-lg font-semibold text-text-primary -tracking-tight mb-6">
            {{ t('settings.appearance.title') }}
          </h2>

          <!-- Language -->
          <div class="flex flex-col gap-5 w-full mb-6">
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

          <!-- Color Theme -->
          <div class="w-full h-px bg-border-subtle my-6"></div>
          <div class="flex flex-col gap-5 w-full mb-6">
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

          <!-- Dark Mode -->
          <div class="w-full h-px bg-border-subtle my-6"></div>
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
                class="absolute w-6 h-6 bg-white rounded-full top-0 bottom-0 my-auto transition-all shadow-sm"
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

        <!-- About Card -->
        <div class="card">
          <h2 class="text-lg font-semibold text-text-primary -tracking-tight mb-6">
            {{ t('settings.about.title') }}
          </h2>

          <!-- PWA Update -->
          <div class="flex items-center justify-between w-full gap-4 mb-6">
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

          <!-- Version Info -->
          <div class="w-full h-px bg-border-subtle my-6"></div>
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
              @click="copyAppVersion"
              class="h-10 px-5 bg-bg-elevated text-text-secondary text-sm font-semibold rounded-md hover:bg-border-subtle transition-colors border border-border-subtle"
              :aria-label="t('settings.version.copy')"
            >
              {{ t('settings.version.copy') }}
            </button>
          </div>

          <!-- Source Code Link -->
          <div class="w-full h-px bg-border-subtle my-6"></div>
          <div class="flex items-center justify-between w-full gap-4">
            <div class="flex flex-col gap-1.5">
              <p class="text-base font-semibold text-text-primary">
                {{ t('settings.sourceCode.title') }}
              </p>
              <p class="text-sm text-text-tertiary leading-relaxed">
                {{ t('settings.sourceCode.description') }}
              </p>
            </div>
            <a
              href="https://github.com/0penth3wind0w/ChatPWA"
              target="_blank"
              rel="noopener noreferrer"
              class="h-10 px-5 bg-forest-green text-white text-sm font-semibold rounded-md hover:bg-dark-green transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
