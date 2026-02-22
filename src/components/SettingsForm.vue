<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStorage } from '../composables/useStorage.js'

const emit = defineEmits(['test'])
const { t } = useI18n()

const { config, saveConfig } = useStorage()
const systemPromptTextarea = ref(null)

// Use the shared config directly instead of props
const endpoint = ref(config.value.endpoint || '')
const model = ref(config.value.model || '')
const token = ref(config.value.token || '')
const provider = ref(config.value.provider || 'openai')
const chatPath = ref(config.value.chatPath || '/chat/completions')
const imagePath = ref(config.value.imagePath || '/images/generations')
const imageModel = ref(config.value.imageModel || 'dall-e-3')
const imageSize = ref(config.value.imageSize || '1024x1024')
const imageQuality = ref(config.value.imageQuality || 'standard')
const imageAspectRatio = ref(config.value.imageAspectRatio || '1:1')
const imageResolution = ref(config.value.imageResolution || '2K')
const systemPrompt = ref(config.value.systemPrompt || '')
const maxHistoryMessages = ref(config.value.maxHistoryMessages ?? 10)
const searchProvider = ref(config.value.searchProvider || 'brave')
const searchApiKey = ref(config.value.searchApiKey || '')
const errors = ref({})
const testing = ref(false)

// Auto-save configuration
const AUTO_SAVE_DEBOUNCE_MS = 500 // Balance between responsiveness and save frequency
const TEST_TIMEOUT_MS = 3000 // Time to show test status message

// Debounce helper
let saveTimeout = null
const debouncedAutoSave = () => {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    // Only auto-save if basic fields are filled
    if (endpoint.value.trim() && model.value.trim() && token.value.trim()) {
      saveConfig({
        endpoint: endpoint.value.trim(),
        model: model.value.trim(),
        token: token.value.trim(),
        provider: provider.value,
        chatPath: chatPath.value,
        imagePath: imagePath.value,
        systemPrompt: systemPrompt.value,
        imageModel: imageModel.value,
        imageSize: imageSize.value,
        imageQuality: imageQuality.value,
        imageAspectRatio: imageAspectRatio.value,
        imageResolution: imageResolution.value,
        maxHistoryMessages: maxHistoryMessages.value,
        searchProvider: searchProvider.value,
        searchApiKey: searchApiKey.value
      })
    }
  }, AUTO_SAVE_DEBOUNCE_MS)
}

// Update chat path when provider changes
watch(provider, (newProvider) => {
  if (newProvider === 'openai') {
    chatPath.value = '/chat/completions'
    imagePath.value = '/images/generations'
  } else if (newProvider === 'anthropic') {
    chatPath.value = '/messages'
    imagePath.value = '/images/generations'
  } else if (newProvider === 'gemini') {
    chatPath.value = '/models/{model}:generateContent'
    imagePath.value = '/models/{model}:generateContent'
  }
})

// Clear search API key when search provider changes
watch(searchProvider, () => {
  searchApiKey.value = ''
})

// Watch all fields for changes with debounce
watch([endpoint, model, token, provider, chatPath, imagePath, systemPrompt, imageModel, imageSize, imageQuality, imageAspectRatio, imageResolution, maxHistoryMessages, searchProvider, searchApiKey], debouncedAutoSave)

const isValid = computed(() => {
  return endpoint.value.trim() && model.value.trim() && token.value.trim()
})

const validateEndpoint = () => {
  if (!endpoint.value.trim()) {
    errors.value.endpoint = t('settings.errors.endpointRequired')
    return false
  }

  try {
    new URL(endpoint.value)
    delete errors.value.endpoint
    return true
  } catch (e) {
    errors.value.endpoint = t('settings.errors.invalidUrl')
    return false
  }
}

const validateModel = () => {
  if (!model.value.trim()) {
    errors.value.model = t('settings.errors.modelRequired')
    return false
  }
  delete errors.value.model
  return true
}

const validateToken = () => {
  const trimmedToken = token.value.trim()

  if (!trimmedToken) {
    errors.value.token = t('settings.errors.tokenRequired')
    return false
  }

  // Check if token starts with 'Bearer ' and warn user to remove it
  if (trimmedToken.toLowerCase().startsWith('bearer ')) {
    errors.value.token = t('settings.errors.removeBearerPrefix')
    return false
  }

  // Check for whitespace (common copy-paste error)
  if (/\s/.test(trimmedToken)) {
    errors.value.token = t('settings.errors.tokenWhitespace')
    return false
  }

  delete errors.value.token
  return true
}

const handleTest = async () => {
  const endpointValid = validateEndpoint()
  const modelValid = validateModel()
  const tokenValid = validateToken()

  if (endpointValid && modelValid && tokenValid) {
    testing.value = true
    emit('test', {
      endpoint: endpoint.value.trim(),
      model: model.value.trim(),
      token: token.value.trim()
    })
    // Reset testing state after configured timeout
    setTimeout(() => {
      testing.value = false
    }, TEST_TIMEOUT_MS)
  }
}

// Auto-resize textarea with requestAnimationFrame
let resizeFrame = null
const resizeTextarea = () => {
  if (resizeFrame) {
    cancelAnimationFrame(resizeFrame)
  }

  resizeFrame = requestAnimationFrame(() => {
    if (systemPromptTextarea.value) {
      systemPromptTextarea.value.style.height = 'auto'
      systemPromptTextarea.value.style.height = systemPromptTextarea.value.scrollHeight + 'px'
    }
    resizeFrame = null
  })
}

// Watch systemPrompt for changes and resize
watch(systemPrompt, async () => {
  await nextTick()
  resizeTextarea()
})

// Initial resize on mount
watch(systemPromptTextarea, async (newVal) => {
  if (newVal) {
    await nextTick()
    resizeTextarea()
  }
})

// Cleanup timeout and animation frame on unmount
onUnmounted(() => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  if (resizeFrame) {
    cancelAnimationFrame(resizeFrame)
  }
})
</script>

<template>
  <form class="w-full space-y-5" @submit.prevent="handleTest">
    <!-- ===== SYSTEM PROMPT ===== -->
    <fieldset class="w-full space-y-4">
      <legend class="text-base font-semibold text-text-primary">{{ t('settings.systemPrompt.label') }}</legend>

      <div class="w-full space-y-2">
        <label for="system-prompt" class="sr-only">{{ t('settings.systemPrompt.label') }}</label>
        <textarea
          id="system-prompt"
          ref="systemPromptTextarea"
          v-model="systemPrompt"
          :placeholder="t('settings.systemPrompt.placeholder')"
          rows="1"
          class="input-field resize-none overflow-hidden leading-normal"
          style="min-height: 3.25rem; padding-top: 0.875rem; padding-bottom: 0.875rem;"
          aria-describedby="system-prompt-help"
          @input="resizeTextarea"
        ></textarea>
        <p id="system-prompt-help" class="text-xs text-text-tertiary">
          {{ t('settings.systemPrompt.help') }}
        </p>
      </div>

      <!-- History Limit -->
      <div class="w-full space-y-2">
        <label for="history-limit" class="text-sm font-medium text-text-secondary">
          {{ t('settings.historyLimit.label') }}
        </label>
        <select id="history-limit" v-model.number="maxHistoryMessages" class="input-field" aria-describedby="history-limit-help">
          <option :value="0">{{ t('settings.historyLimit.options.unlimited') }}</option>
          <option :value="6">{{ t('settings.historyLimit.options.6') }}</option>
          <option :value="10">{{ t('settings.historyLimit.options.10') }}</option>
          <option :value="20">{{ t('settings.historyLimit.options.20') }}</option>
          <option :value="40">{{ t('settings.historyLimit.options.40') }}</option>
        </select>
        <p id="history-limit-help" class="text-xs text-text-tertiary">
          {{ t('settings.historyLimit.help') }}
        </p>
      </div>
    </fieldset>

    <!-- ===== API CONFIGURATION ===== -->
    <div class="w-full h-px bg-border-subtle" role="separator"></div>
    <fieldset class="w-full space-y-4">
      <legend class="text-base font-semibold text-text-primary">{{ t('settings.apiConfig.title') }}</legend>

      <!-- API Format Selection -->
      <div class="w-full space-y-2">
        <label for="provider" class="text-sm font-medium text-text-secondary">
          {{ t('settings.provider.label') }}
        </label>
        <select id="provider" v-model="provider" class="input-field" aria-describedby="provider-help">
          <option value="openai">{{ t('settings.provider.options.openai') }}</option>
          <option value="anthropic">{{ t('settings.provider.options.anthropic') }}</option>
          <option value="gemini">{{ t('settings.provider.options.gemini') }}</option>
        </select>
        <p id="provider-help" class="text-xs text-text-tertiary">
          {{ t('settings.provider.help') }}
        </p>
      </div>

      <!-- API Endpoint URL -->
      <div class="w-full space-y-2">
        <label for="endpoint" class="text-sm font-medium text-text-secondary">
          {{ t('settings.endpoint.label') }}
        </label>
        <input
          id="endpoint"
          v-model="endpoint"
          type="url"
          :placeholder="t('settings.endpoint.placeholder')"
          class="input-field"
          :class="{ 'border-warm-red': errors.endpoint }"
          :aria-invalid="!!errors.endpoint"
          :aria-describedby="errors.endpoint ? 'endpoint-error endpoint-help' : 'endpoint-help'"
          @blur="validateEndpoint"
        />
        <p v-if="errors.endpoint" id="endpoint-error" class="text-xs text-warm-red" role="alert">
          {{ errors.endpoint }}
        </p>
        <p id="endpoint-help" class="text-xs text-text-tertiary">
          {{ t('settings.endpoint.help') }}
        </p>
      </div>

      <!-- Authentication Token -->
      <div class="w-full space-y-2">
        <label for="api-key" class="text-sm font-medium text-text-secondary">
          {{ t('settings.apiKey.label') }}
        </label>
        <input
          id="api-key"
          v-model="token"
          type="password"
          :placeholder="t('settings.apiKey.placeholder')"
          class="input-field"
          :class="{ 'border-warm-red': errors.token }"
          :aria-invalid="!!errors.token"
          :aria-describedby="errors.token ? 'api-key-error api-key-help' : 'api-key-help'"
          @blur="validateToken"
        />
        <p v-if="errors.token" id="api-key-error" class="text-xs text-warm-red" role="alert">
          {{ errors.token }}
        </p>
        <p id="api-key-help" class="text-xs text-text-tertiary">
          {{ t('settings.apiKey.help') }}
        </p>
      </div>
    </fieldset>

    <!-- ===== CHAT CONFIGURATION ===== -->
    <div class="w-full h-px bg-border-subtle" role="separator"></div>
    <fieldset class="w-full space-y-4">
      <legend class="text-base font-semibold text-text-primary">{{ t('settings.chatConfig.title') }}</legend>

      <!-- Model Name -->
      <div class="w-full space-y-2">
        <label for="model" class="text-sm font-medium text-text-secondary">
          {{ t('settings.model.label') }}
        </label>
        <input
          id="model"
          v-model="model"
          type="text"
          :placeholder="t('settings.model.placeholder')"
          class="input-field"
          :class="{ 'border-warm-red': errors.model }"
          :aria-invalid="!!errors.model"
          :aria-describedby="errors.model ? 'model-error' : undefined"
          @blur="validateModel"
        />
        <p v-if="errors.model" id="model-error" class="text-xs text-warm-red" role="alert">
          {{ errors.model }}
        </p>
      </div>

      <!-- Chat Path -->
      <div class="w-full space-y-2">
        <label for="chat-path" class="text-sm font-medium text-text-secondary">
          {{ t('settings.chatPath.label') }}
        </label>
        <input
          id="chat-path"
          v-model="chatPath"
          type="text"
          class="input-field"
          :placeholder="t('settings.chatPath.placeholder')"
          aria-describedby="chat-path-help"
        />
        <p id="chat-path-help" class="text-xs text-text-tertiary">
          {{ t('settings.chatPath.help') }}
        </p>
      </div>
    </fieldset>

    <!-- ===== IMAGE GENERATION ===== -->
    <div class="w-full h-px bg-border-subtle" role="separator"></div>
    <fieldset class="w-full space-y-4">
      <legend class="text-base font-semibold text-text-primary">{{ t('settings.imageGeneration.title') }}</legend>

      <!-- Image Endpoint Path -->
      <div class="w-full space-y-2">
        <label for="image-path" class="text-sm font-medium text-text-secondary">
          {{ t('settings.imagePath.label') }}
        </label>
        <input
          id="image-path"
          v-model="imagePath"
          type="text"
          class="input-field"
          :placeholder="t('settings.imagePath.placeholder')"
          aria-describedby="image-path-help"
        />
        <p id="image-path-help" class="text-xs text-text-tertiary">
          {{ t('settings.imagePath.help') }}
        </p>
      </div>

      <!-- Image Model -->
      <div class="w-full space-y-2">
        <label for="image-model" class="text-sm font-medium text-text-secondary">
          {{ t('settings.imageModel.label') }}
        </label>
        <input
          id="image-model"
          v-model="imageModel"
          type="text"
          :placeholder="t('settings.imageModel.placeholder')"
          class="input-field"
          aria-describedby="image-model-help"
        />
        <p id="image-model-help" class="text-xs text-text-tertiary">
          {{ t('settings.imageModel.help') }}
        </p>
      </div>

      <!-- OpenAI-specific settings -->
      <template v-if="provider === 'openai' || provider === 'anthropic'">
        <!-- Image Size -->
        <div class="w-full space-y-2">
          <label for="image-size" class="text-sm font-medium text-text-secondary">
            {{ t('settings.imageSize.label') }}
          </label>
          <select id="image-size" v-model="imageSize" class="input-field">
            <option value="256x256">256x256</option>
            <option value="512x512">512x512</option>
            <option value="1024x1024">{{ t('settings.imageSize.options.square') }}</option>
            <option value="1792x1024">{{ t('settings.imageSize.options.landscape') }}</option>
            <option value="1024x1792">{{ t('settings.imageSize.options.portrait') }}</option>
          </select>
        </div>

        <!-- Image Quality -->
        <div class="w-full space-y-2">
          <label for="image-quality" class="text-sm font-medium text-text-secondary">
            {{ t('settings.imageQuality.label') }}
          </label>
          <select id="image-quality" v-model="imageQuality" class="input-field">
            <option value="standard">{{ t('settings.imageQuality.options.standard') }}</option>
            <option value="hd">{{ t('settings.imageQuality.options.hd') }}</option>
          </select>
        </div>
      </template>

      <!-- Gemini-specific settings -->
      <template v-if="provider === 'gemini'">
        <!-- Aspect Ratio -->
        <div class="w-full space-y-2">
          <label for="aspect-ratio" class="text-sm font-medium text-text-secondary">
            {{ t('settings.aspectRatio.label') }}
          </label>
          <select id="aspect-ratio" v-model="imageAspectRatio" class="input-field">
            <option value="1:1">{{ t('settings.aspectRatio.options.square') }}</option>
            <option value="2:3">{{ t('settings.aspectRatio.options.portrait23') }}</option>
            <option value="3:2">{{ t('settings.aspectRatio.options.landscape32') }}</option>
            <option value="3:4">{{ t('settings.aspectRatio.options.portrait34') }}</option>
            <option value="4:3">{{ t('settings.aspectRatio.options.landscape43') }}</option>
            <option value="4:5">{{ t('settings.aspectRatio.options.portrait45') }}</option>
            <option value="5:4">{{ t('settings.aspectRatio.options.landscape54') }}</option>
            <option value="9:16">{{ t('settings.aspectRatio.options.tall') }}</option>
            <option value="16:9">{{ t('settings.aspectRatio.options.wide') }}</option>
            <option value="21:9">{{ t('settings.aspectRatio.options.ultraWide') }}</option>
          </select>
        </div>

        <!-- Resolution -->
        <div class="w-full space-y-2">
          <label for="resolution" class="text-sm font-medium text-text-secondary">
            {{ t('settings.resolution.label') }}
          </label>
          <select id="resolution" v-model="imageResolution" class="input-field">
            <option value="1K">1K</option>
            <option value="2K">2K</option>
            <option value="4K">{{ t('settings.resolution.options.4k') }}</option>
          </select>
        </div>
      </template>
    </fieldset>

    <!-- ===== WEB SEARCH ===== -->
    <div class="w-full h-px bg-border-subtle" role="separator"></div>
    <fieldset class="w-full space-y-4">
      <legend class="text-base font-semibold text-text-primary">{{ t('settings.webSearch.title') }}</legend>

      <!-- Search Provider -->
      <div class="w-full space-y-2">
        <label for="search-provider" class="text-sm font-medium text-text-secondary">
          {{ t('settings.searchProvider.label') }}
        </label>
        <select id="search-provider" v-model="searchProvider" class="input-field">
          <option value="brave">{{ t('settings.searchProvider.options.brave') }}</option>
          <option value="tavily">{{ t('settings.searchProvider.options.tavily') }}</option>
          <option value="custom">{{ t('settings.searchProvider.options.custom') }}</option>
        </select>
      </div>

      <!-- Search API Key -->
      <div class="w-full space-y-2">
        <label for="search-api-key" class="text-sm font-medium text-text-secondary">
          {{ t('settings.searchApiKey.label') }}
        </label>
        <input
          id="search-api-key"
          v-model="searchApiKey"
          type="password"
          :placeholder="t('settings.searchApiKey.placeholder')"
          class="input-field"
          aria-describedby="search-api-key-help"
        />
        <p id="search-api-key-help" class="text-xs text-text-tertiary">
          {{ t('settings.searchApiKey.help') }}
        </p>
      </div>
    </fieldset>

    <!-- ===== CONNECTION TEST ===== -->
    <div class="w-full h-px bg-border-subtle" role="separator"></div>
    <div class="flex items-center justify-between w-full">
      <div class="flex flex-col gap-1">
        <h3 class="text-base font-semibold text-text-primary">
          {{ t('settings.connectionTest.title') }}
        </h3>
        <p id="test-description" class="text-sm text-text-tertiary">
          {{ t('settings.connectionTest.description') }}
        </p>
      </div>
      <button
        type="submit"
        :disabled="!isValid || testing"
        aria-describedby="test-description"
        class="h-10 px-5 bg-forest-green text-white text-sm font-semibold rounded-md hover:bg-dark-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ testing ? t('settings.connectionTest.testing') : t('settings.connectionTest.test') }}
      </button>
    </div>
  </form>
</template>
