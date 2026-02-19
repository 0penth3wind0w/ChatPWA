<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  initialConfig: {
    type: Object,
    default: () => ({ endpoint: '', model: '', token: '' })
  }
})

const emit = defineEmits(['save', 'test'])

const endpoint = ref(props.initialConfig.endpoint || '')
const model = ref(props.initialConfig.model || '')
const token = ref(props.initialConfig.token || '')
const errors = ref({})
const testing = ref(false)

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
  if (!token.value.trim()) {
    errors.value.token = 'Authentication token is required'
    return false
  }
  delete errors.value.token
  return true
}

const handleSave = () => {
  const endpointValid = validateEndpoint()
  const modelValid = validateModel()
  const tokenValid = validateToken()

  if (endpointValid && modelValid && tokenValid) {
    emit('save', {
      endpoint: endpoint.value.trim(),
      model: model.value.trim(),
      token: token.value.trim()
    })
  }
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
        placeholder="https://api.example.com/v1/chat"
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
        placeholder="sk-••••••••••••••••"
        class="input-field"
        :class="{ 'border-warm-red': errors.token }"
        @blur="validateToken"
      />
      <p v-if="errors.token" class="text-xs text-warm-red">
        {{ errors.token }}
      </p>
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
