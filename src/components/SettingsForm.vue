<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useStorage } from '../composables/useStorage.js'

const emit = defineEmits(['test'])

const { config, saveConfig } = useStorage()

// Use the shared config directly instead of props
const endpoint = ref(config.value.endpoint || '')
const model = ref(config.value.model || '')
const token = ref(config.value.token || '')
const provider = ref(config.value.provider || 'openai')
const chatPath = ref(config.value.chatPath || '/chat/completions')
const enableStreaming = ref(config.value.enableStreaming || false)
const errors = ref({})
const testing = ref(false)

onMounted(() => {
  // Update local refs from shared config in case it loaded after component creation
  endpoint.value = config.value.endpoint || ''
  model.value = config.value.model || ''
  token.value = config.value.token || ''
  provider.value = config.value.provider || 'openai'
  chatPath.value = config.value.chatPath || '/chat/completions'
  enableStreaming.value = config.value.enableStreaming || false
})

// Auto-save settings when any field changes (immediately)
const autoSave = () => {
  // Only auto-save if basic fields are filled
  if (endpoint.value.trim() && model.value.trim() && token.value.trim()) {
    saveConfig({
      endpoint: endpoint.value.trim(),
      model: model.value.trim(),
      token: token.value.trim(),
      provider: provider.value,
      chatPath: chatPath.value,
      enableStreaming: enableStreaming.value
    })
  }
}

// Watch all fields for changes
watch([endpoint, model, token, provider, chatPath, enableStreaming], autoSave)

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

  // Check if token starts with 'Bearer ' and remove it
  if (trimmedToken.toLowerCase().startsWith('bearer ')) {
    errors.value.token = 'Remove "Bearer " prefix from token'
    return false
  }

  // JWT tokens should have 3 segments separated by dots
  const segments = trimmedToken.split('.')
  if (segments.length !== 3) {
    errors.value.token = `Invalid token format (found ${segments.length} segments, expected 3)`
    return false
  }

  // Check for whitespace
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
    <!-- API Endpoint URL -->
    <div class="w-full space-y-2">
      <label class="text-sm font-medium text-text-secondary">
        API Endpoint URL
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
        Model Name
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
        Authentication Token
      </label>
      <input
        v-model="token"
        type="password"
        placeholder="Bearer token or API key"
        class="input-field"
        :class="{ 'border-warm-red': errors.token }"
        @blur="validateToken"
      />
      <p v-if="errors.token" class="text-xs text-warm-red">
        {{ errors.token }}
      </p>
      <p class="text-xs text-text-tertiary">
        Enter your API authentication token (without "Bearer " prefix)
      </p>
    </div>

    <!-- Advanced Options -->
    <div class="w-full space-y-3 p-4 bg-bg-elevated rounded-md">
      <p class="text-sm font-medium text-text-secondary">Advanced Options</p>

      <!-- Provider Selection -->
      <div class="w-full space-y-2">
        <label class="text-xs font-medium text-text-tertiary">
          API Provider
        </label>
        <select v-model="provider" class="input-field text-sm h-10">
          <option value="openai">OpenAI (GPT models)</option>
          <option value="anthropic">Anthropic (Claude models)</option>
          <option value="gemini">Google (Gemini models)</option>
        </select>
      </div>

      <!-- Chat Path -->
      <div class="w-full space-y-2">
        <label class="text-xs font-medium text-text-tertiary">
          Chat Endpoint Path
        </label>
        <input
          v-model="chatPath"
          type="text"
          class="input-field text-sm h-10"
          placeholder="/chat/completions"
        />
        <p class="text-xs text-text-tertiary">
          /chat/completions for OpenAI, /messages for Anthropic, /models/{model}:generateContent for Gemini
        </p>
      </div>

      <!-- Streaming Toggle -->
      <div class="flex items-center gap-3">
        <input
          v-model="enableStreaming"
          type="checkbox"
          id="streaming"
          class="w-4 h-4 text-forest-green border-border-subtle rounded focus:ring-2 focus:ring-forest-green focus:ring-opacity-20"
        />
        <label for="streaming" class="text-xs text-text-secondary">
          Enable streaming responses (experimental)
        </label>
      </div>
    </div>

    <!-- Divider -->
    <div class="w-full h-px bg-border-subtle"></div>

    <!-- Connection Test -->
    <div class="flex items-center justify-between w-full gap-3">
      <div class="flex flex-col gap-1">
        <p class="text-base font-medium text-text-primary">
          Connection Status
        </p>
        <p class="text-sm text-text-tertiary">
          Test your API connection
        </p>
      </div>
      <button
        @click="handleTest"
        :disabled="!isValid || testing"
        class="h-9 px-4 bg-forest-green text-white text-sm font-semibold rounded-md hover:bg-dark-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ testing ? 'Testing...' : 'Test' }}
      </button>
    </div>
  </div>
</template>
