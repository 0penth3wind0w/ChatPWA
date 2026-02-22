<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useStorage } from '../composables/useStorage.js'

const emit = defineEmits(['test'])

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
    errors.value.endpoint = 'API endpoint is required'
    return false
  }

  try {
    new URL(endpoint.value)
    delete errors.value.endpoint
    return true
  } catch (e) {
    errors.value.endpoint = 'Please enter a valid URL'
    return false
  }
}

const validateModel = () => {
  if (!model.value.trim()) {
    errors.value.model = 'Model name is required'
    return false
  }
  delete errors.value.model
  return true
}

const validateToken = () => {
  const trimmedToken = token.value.trim()

  if (!trimmedToken) {
    errors.value.token = 'Authentication token is required'
    return false
  }

  // Check if token starts with 'Bearer ' and warn user to remove it
  if (trimmedToken.toLowerCase().startsWith('bearer ')) {
    errors.value.token = 'Remove "Bearer " prefix from token'
    return false
  }

  // Check for whitespace (common copy-paste error)
  if (/\s/.test(trimmedToken)) {
    errors.value.token = 'Token contains whitespace - please check for line breaks or spaces'
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
      <legend class="text-base font-semibold text-text-primary">System Prompt</legend>

      <div class="w-full space-y-2">
        <label for="system-prompt" class="sr-only">System Prompt</label>
        <textarea
          id="system-prompt"
          ref="systemPromptTextarea"
          v-model="systemPrompt"
          placeholder="You are a helpful assistant..."
          rows="1"
          class="input-field resize-none overflow-hidden leading-normal"
          style="min-height: 3.25rem; padding-top: 0.875rem; padding-bottom: 0.875rem;"
          aria-describedby="system-prompt-help"
          @input="resizeTextarea"
        ></textarea>
        <p id="system-prompt-help" class="text-xs text-text-tertiary">
          Customize AI behavior and personality
        </p>
      </div>

      <!-- History Limit -->
      <div class="w-full space-y-2">
        <label for="history-limit" class="text-sm font-medium text-text-secondary">
          Message History Limit
        </label>
        <select id="history-limit" v-model.number="maxHistoryMessages" class="input-field" aria-describedby="history-limit-help">
          <option :value="0">Unlimited (all messages)</option>
          <option :value="6">6 messages (3 exchanges)</option>
          <option :value="10">10 messages (5 exchanges)</option>
          <option :value="20">20 messages (10 exchanges)</option>
          <option :value="40">40 messages (20 exchanges)</option>
        </select>
        <p id="history-limit-help" class="text-xs text-text-tertiary">
          Limit messages sent to API to reduce token usage and costs
        </p>
      </div>
    </fieldset>

    <!-- ===== API CONFIGURATION ===== -->
    <div class="w-full h-px bg-border-subtle" role="separator"></div>
    <fieldset class="w-full space-y-4">
      <legend class="text-base font-semibold text-text-primary">API Configuration</legend>

      <!-- API Format Selection -->
      <div class="w-full space-y-2">
        <label for="provider" class="text-sm font-medium text-text-secondary">
          API Format
        </label>
        <select id="provider" v-model="provider" class="input-field" aria-describedby="provider-help">
          <option value="openai">OpenAI Compatible</option>
          <option value="anthropic">Anthropic Compatible</option>
          <option value="gemini">Google Gemini Compatible</option>
        </select>
        <p id="provider-help" class="text-xs text-text-tertiary">
          Request/response format your API uses
        </p>
      </div>

      <!-- API Endpoint URL -->
      <div class="w-full space-y-2">
        <label for="endpoint" class="text-sm font-medium text-text-secondary">
          Endpoint URL
        </label>
        <input
          id="endpoint"
          v-model="endpoint"
          type="url"
          placeholder="https://api.openai.com/v1"
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
          Your API base URL (custom or official)
        </p>
      </div>

      <!-- Authentication Token -->
      <div class="w-full space-y-2">
        <label for="api-key" class="text-sm font-medium text-text-secondary">
          API Key
        </label>
        <input
          id="api-key"
          v-model="token"
          type="password"
          placeholder="Enter your API key"
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
          No "Bearer " prefix needed
        </p>
      </div>
    </fieldset>

    <!-- ===== CHAT CONFIGURATION ===== -->
    <div class="w-full h-px bg-border-subtle" role="separator"></div>
    <fieldset class="w-full space-y-4">
      <legend class="text-base font-semibold text-text-primary">Chat Configuration</legend>

      <!-- Model Name -->
      <div class="w-full space-y-2">
        <label for="model" class="text-sm font-medium text-text-secondary">
          Chat Model
        </label>
        <input
          id="model"
          v-model="model"
          type="text"
          placeholder="gpt-4"
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
          Chat Endpoint Path
        </label>
        <input
          id="chat-path"
          v-model="chatPath"
          type="text"
          class="input-field"
          placeholder="/chat/completions"
          aria-describedby="chat-path-help"
        />
        <p id="chat-path-help" class="text-xs text-text-tertiary">
          Auto-updates when provider changes
        </p>
      </div>
    </fieldset>

    <!-- ===== IMAGE GENERATION ===== -->
    <div class="w-full h-px bg-border-subtle" role="separator"></div>
    <fieldset class="w-full space-y-4">
      <legend class="text-base font-semibold text-text-primary">Image Generation</legend>

      <!-- Image Endpoint Path -->
      <div class="w-full space-y-2">
        <label for="image-path" class="text-sm font-medium text-text-secondary">
          Image Endpoint Path
        </label>
        <input
          id="image-path"
          v-model="imagePath"
          type="text"
          class="input-field"
          placeholder="/images/generations"
          aria-describedby="image-path-help"
        />
        <p id="image-path-help" class="text-xs text-text-tertiary">
          Auto-updates when provider changes
        </p>
      </div>

      <!-- Image Model -->
      <div class="w-full space-y-2">
        <label for="image-model" class="text-sm font-medium text-text-secondary">
          Image Model
        </label>
        <input
          id="image-model"
          v-model="imageModel"
          type="text"
          placeholder="dall-e-3"
          class="input-field"
          aria-describedby="image-model-help"
        />
        <p id="image-model-help" class="text-xs text-text-tertiary">
          dall-e-2, dall-e-3, or custom model
        </p>
      </div>

      <!-- OpenAI-specific settings -->
      <template v-if="provider === 'openai' || provider === 'anthropic'">
        <!-- Image Size -->
        <div class="w-full space-y-2">
          <label for="image-size" class="text-sm font-medium text-text-secondary">
            Image Size
          </label>
          <select id="image-size" v-model="imageSize" class="input-field">
            <option value="256x256">256x256</option>
            <option value="512x512">512x512</option>
            <option value="1024x1024">1024x1024 (Square)</option>
            <option value="1792x1024">1792x1024 (Landscape)</option>
            <option value="1024x1792">1024x1792 (Portrait)</option>
          </select>
        </div>

        <!-- Image Quality -->
        <div class="w-full space-y-2">
          <label for="image-quality" class="text-sm font-medium text-text-secondary">
            Image Quality
          </label>
          <select id="image-quality" v-model="imageQuality" class="input-field">
            <option value="standard">Standard</option>
            <option value="hd">HD (DALL-E 3 only)</option>
          </select>
        </div>
      </template>

      <!-- Gemini-specific settings -->
      <template v-if="provider === 'gemini'">
        <!-- Aspect Ratio -->
        <div class="w-full space-y-2">
          <label for="aspect-ratio" class="text-sm font-medium text-text-secondary">
            Aspect Ratio
          </label>
          <select id="aspect-ratio" v-model="imageAspectRatio" class="input-field">
            <option value="1:1">1:1 (Square)</option>
            <option value="2:3">2:3 (Portrait)</option>
            <option value="3:2">3:2 (Landscape)</option>
            <option value="3:4">3:4 (Portrait)</option>
            <option value="4:3">4:3 (Landscape)</option>
            <option value="4:5">4:5 (Portrait)</option>
            <option value="5:4">5:4 (Landscape)</option>
            <option value="9:16">9:16 (Tall)</option>
            <option value="16:9">16:9 (Wide)</option>
            <option value="21:9">21:9 (Ultra Wide)</option>
          </select>
        </div>

        <!-- Resolution -->
        <div class="w-full space-y-2">
          <label for="resolution" class="text-sm font-medium text-text-secondary">
            Resolution
          </label>
          <select id="resolution" v-model="imageResolution" class="input-field">
            <option value="1K">1K</option>
            <option value="2K">2K</option>
            <option value="4K">4K (Gemini 3 Pro only)</option>
          </select>
        </div>
      </template>
    </fieldset>

    <!-- ===== WEB SEARCH ===== -->
    <div class="w-full h-px bg-border-subtle" role="separator"></div>
    <fieldset class="w-full space-y-4">
      <legend class="text-base font-semibold text-text-primary">Web Search</legend>

      <!-- Search Provider -->
      <div class="w-full space-y-2">
        <label for="search-provider" class="text-sm font-medium text-text-secondary">
          Search Provider
        </label>
        <select id="search-provider" v-model="searchProvider" class="input-field">
          <option value="brave">Brave Search</option>
          <option value="tavily">Tavily AI</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <!-- Search API Key -->
      <div class="w-full space-y-2">
        <label for="search-api-key" class="text-sm font-medium text-text-secondary">
          Search API Key
        </label>
        <input
          id="search-api-key"
          v-model="searchApiKey"
          type="password"
          placeholder="Enter search API key"
          class="input-field"
          aria-describedby="search-api-key-help"
        />
        <p id="search-api-key-help" class="text-xs text-text-tertiary">
          Required for Brave or Tavily
        </p>
      </div>
    </fieldset>

    <!-- ===== CONNECTION TEST ===== -->
    <div class="w-full h-px bg-border-subtle" role="separator"></div>
    <div class="flex items-center justify-between w-full">
      <div class="flex flex-col gap-1">
        <h3 class="text-base font-semibold text-text-primary">
          Connection Test
        </h3>
        <p id="test-description" class="text-sm text-text-tertiary">
          Verify your chat API settings
        </p>
      </div>
      <button
        type="submit"
        :disabled="!isValid || testing"
        aria-describedby="test-description"
        class="h-10 px-5 bg-forest-green text-white text-sm font-semibold rounded-md hover:bg-dark-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ testing ? 'Testing...' : 'Test' }}
      </button>
    </div>
  </form>
</template>
