<script setup>
import { ref, computed, watch } from 'vue'
import { useStorage } from '../composables/useStorage.js'

const emit = defineEmits(['test'])

const { config, saveConfig } = useStorage()

// Use the shared config directly instead of props
const endpoint = ref(config.value.endpoint || '')
const model = ref(config.value.model || '')
const token = ref(config.value.token || '')
const provider = ref(config.value.provider || 'openai')
const chatPath = ref(config.value.chatPath || '/chat/completions')
const imagePath = ref(config.value.imagePath || '/images/generations')
const enableStreaming = ref(config.value.enableStreaming || false)
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
        enableStreaming: enableStreaming.value,
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
  }, 500)
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
watch([endpoint, model, token, provider, chatPath, imagePath, enableStreaming, systemPrompt, imageModel, imageSize, imageQuality, imageAspectRatio, imageResolution, maxHistoryMessages, searchProvider, searchApiKey], debouncedAutoSave)

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
    // Reset testing state after 3 seconds
    setTimeout(() => {
      testing.value = false
    }, 3000)
  }
}
</script>

<template>
  <div class="w-full space-y-5">
    <!-- ===== SYSTEM PROMPT ===== -->
    <div class="w-full space-y-4">
      <h3 class="text-base font-semibold text-text-primary">System Prompt</h3>

      <div class="w-full space-y-2">
        <textarea
          v-model="systemPrompt"
          placeholder="You are a helpful assistant..."
          rows="3"
          class="input-field resize-none py-3"
        ></textarea>
        <p class="text-xs text-text-tertiary">
          Customize AI behavior and personality
        </p>
      </div>

      <!-- History Limit -->
      <div class="w-full space-y-2">
        <label class="text-sm font-medium text-text-secondary">
          Message History Limit
        </label>
        <select v-model.number="maxHistoryMessages" class="input-field">
          <option :value="0">Unlimited (all messages)</option>
          <option :value="6">6 messages (3 exchanges)</option>
          <option :value="10">10 messages (5 exchanges)</option>
          <option :value="20">20 messages (10 exchanges)</option>
          <option :value="40">40 messages (20 exchanges)</option>
        </select>
        <p class="text-xs text-text-tertiary">
          Limit messages sent to API to reduce token usage and costs
        </p>
      </div>
    </div>

    <!-- ===== CHAT PROVIDER ===== -->
    <div class="w-full h-px bg-border-subtle"></div>
    <div class="w-full space-y-4">
      <h3 class="text-base font-semibold text-text-primary">Chat Provider</h3>

      <!-- Provider Selection -->
      <div class="w-full space-y-2">
        <label class="text-sm font-medium text-text-secondary">
          Provider
        </label>
        <select v-model="provider" class="input-field">
          <option value="openai">OpenAI (GPT models)</option>
          <option value="anthropic">Anthropic (Claude models)</option>
          <option value="gemini">Google (Gemini models)</option>
        </select>
      </div>

      <!-- API Endpoint URL -->
      <div class="w-full space-y-2">
        <label class="text-sm font-medium text-text-secondary">
          API Endpoint
        </label>
        <input
          v-model="endpoint"
          type="url"
          placeholder="https://api.openai.com/v1"
          class="input-field"
          :class="{ 'border-warm-red': errors.endpoint }"
          @blur="validateEndpoint"
        />
        <p v-if="errors.endpoint" class="text-xs text-warm-red">
          {{ errors.endpoint }}
        </p>
      </div>

      <!-- Model Name -->
      <div class="w-full space-y-2">
        <label class="text-sm font-medium text-text-secondary">
          Model
        </label>
        <input
          v-model="model"
          type="text"
          placeholder="gpt-4"
          class="input-field"
          :class="{ 'border-warm-red': errors.model }"
          @blur="validateModel"
        />
        <p v-if="errors.model" class="text-xs text-warm-red">
          {{ errors.model }}
        </p>
      </div>

      <!-- Authentication Token -->
      <div class="w-full space-y-2">
        <label class="text-sm font-medium text-text-secondary">
          API Key
        </label>
        <input
          v-model="token"
          type="password"
          placeholder="Enter your API key"
          class="input-field"
          :class="{ 'border-warm-red': errors.token }"
          @blur="validateToken"
        />
        <p v-if="errors.token" class="text-xs text-warm-red">
          {{ errors.token }}
        </p>
        <p class="text-xs text-text-tertiary">
          No "Bearer " prefix needed
        </p>
      </div>

      <!-- Chat Path -->
      <div class="w-full space-y-2">
        <label class="text-sm font-medium text-text-secondary">
          Chat Endpoint Path
        </label>
        <input
          v-model="chatPath"
          type="text"
          class="input-field"
          placeholder="/chat/completions"
        />
        <p class="text-xs text-text-tertiary">
          Auto-updates when provider changes
        </p>
      </div>
    </div>

    <!-- ===== IMAGE GENERATION ===== -->
    <div class="w-full h-px bg-border-subtle"></div>
    <div class="w-full space-y-4">
      <h3 class="text-base font-semibold text-text-primary">Image Generation</h3>

      <!-- Image Endpoint Path -->
      <div class="w-full space-y-2">
        <label class="text-sm font-medium text-text-secondary">
          Image Endpoint Path
        </label>
        <input
          v-model="imagePath"
          type="text"
          class="input-field"
          placeholder="/images/generations"
        />
        <p class="text-xs text-text-tertiary">
          Auto-updates when provider changes
        </p>
      </div>

      <!-- Image Model -->
      <div class="w-full space-y-2">
        <label class="text-sm font-medium text-text-secondary">
          Image Model
        </label>
        <input
          v-model="imageModel"
          type="text"
          placeholder="dall-e-3"
          class="input-field"
        />
        <p class="text-xs text-text-tertiary">
          dall-e-2, dall-e-3, or custom model
        </p>
      </div>

      <!-- OpenAI-specific settings -->
      <template v-if="provider === 'openai' || provider === 'anthropic'">
        <!-- Image Size -->
        <div class="w-full space-y-2">
          <label class="text-sm font-medium text-text-secondary">
            Image Size
          </label>
          <select v-model="imageSize" class="input-field">
            <option value="256x256">256x256</option>
            <option value="512x512">512x512</option>
            <option value="1024x1024">1024x1024 (Square)</option>
            <option value="1792x1024">1792x1024 (Landscape)</option>
            <option value="1024x1792">1024x1792 (Portrait)</option>
          </select>
        </div>

        <!-- Image Quality -->
        <div class="w-full space-y-2">
          <label class="text-sm font-medium text-text-secondary">
            Image Quality
          </label>
          <select v-model="imageQuality" class="input-field">
            <option value="standard">Standard</option>
            <option value="hd">HD (DALL-E 3 only)</option>
          </select>
        </div>
      </template>

      <!-- Gemini-specific settings -->
      <template v-if="provider === 'gemini'">
        <!-- Aspect Ratio -->
        <div class="w-full space-y-2">
          <label class="text-sm font-medium text-text-secondary">
            Aspect Ratio
          </label>
          <select v-model="imageAspectRatio" class="input-field">
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
          <label class="text-sm font-medium text-text-secondary">
            Resolution
          </label>
          <select v-model="imageResolution" class="input-field">
            <option value="1K">1K</option>
            <option value="2K">2K</option>
            <option value="4K">4K (Gemini 3 Pro only)</option>
          </select>
        </div>
      </template>
    </div>

    <!-- ===== WEB SEARCH ===== -->
    <div class="w-full h-px bg-border-subtle"></div>
    <div class="w-full space-y-4">
      <h3 class="text-base font-semibold text-text-primary">Web Search</h3>

      <!-- Search Provider -->
      <div class="w-full space-y-2">
        <label class="text-sm font-medium text-text-secondary">
          Search Provider
        </label>
        <select v-model="searchProvider" class="input-field">
          <option value="brave">Brave Search</option>
          <option value="tavily">Tavily AI</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <!-- Search API Key -->
      <div class="w-full space-y-2">
        <label class="text-sm font-medium text-text-secondary">
          Search API Key
        </label>
        <input
          v-model="searchApiKey"
          type="password"
          placeholder="Enter search API key"
          class="input-field"
        />
        <p class="text-xs text-text-tertiary">
          Required for Brave or Tavily
        </p>
      </div>
    </div>

    <!-- ===== CONNECTION TEST ===== -->
    <div class="w-full h-px bg-border-subtle"></div>
    <div class="flex items-center justify-between w-full">
      <div class="flex flex-col gap-1">
        <h3 class="text-base font-semibold text-text-primary">
          Connection Test
        </h3>
        <p class="text-sm text-text-tertiary">
          Verify your chat API settings
        </p>
      </div>
      <button
        @click="handleTest"
        :disabled="!isValid || testing"
        class="h-10 px-5 bg-forest-green text-white text-sm font-semibold rounded-md hover:bg-dark-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ testing ? 'Testing...' : 'Test' }}
      </button>
    </div>
  </div>
</template>
