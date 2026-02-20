import { ref } from 'vue'

const STORAGE_KEYS = {
  API_CONFIG: 'chatpwa_api_config'
}

// Default configuration template
const DEFAULT_CONFIG = {
  endpoint: '',
  model: '',
  token: '',
  chatPath: '/chat/completions', // '/messages' for Anthropic, '/models/{model}:generateContent' for Gemini
  imagePath: '/images/generations',
  provider: 'openai', // 'openai', 'anthropic', or 'gemini'
  enableStreaming: false,
  systemPrompt: '', // Custom system prompt for AI behavior
  temperature: null, // null means don't send this parameter
  maxTokens: null, // null means don't send this parameter
  topP: null,
  imageModel: 'dall-e-3',
  imageSize: '1024x1024',
  imageQuality: 'standard',
  imageStyle: 'vivid',
  imageCount: 1,
  // Web Tools Configuration
  searchProvider: 'brave', // 'brave', 'tavily', or 'custom'
  searchApiKey: '',
  searchEndpoint: '' // For custom search provider
}

// Shared config state (singleton)
const config = ref({ ...DEFAULT_CONFIG })

// Load config from localStorage on module initialization
const initConfig = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.API_CONFIG)
    if (stored) {
      const parsed = JSON.parse(stored)
      config.value = {
        ...DEFAULT_CONFIG,
        ...parsed
      }
    }
  } catch (error) {
    console.error('Failed to load configuration:', error)
  }
}

// Initialize config immediately when module loads
initConfig()

export function useStorage() {

  /**
   * Save API configuration to localStorage
   */
  const saveConfig = (newConfig) => {
    try {
      config.value = {
        ...DEFAULT_CONFIG,
        ...newConfig
      }
      localStorage.setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(config.value))
      return true
    } catch (error) {
      console.error('Failed to save configuration:', error)
      return false
    }
  }

  /**
   * Clear API configuration from localStorage
   */
  const clearConfig = () => {
    try {
      config.value = { ...DEFAULT_CONFIG }
      localStorage.removeItem(STORAGE_KEYS.API_CONFIG)
      return true
    } catch (error) {
      console.error('Failed to clear configuration:', error)
      return false
    }
  }

  /**
   * Check if configuration is complete
   */
  const isConfigured = () => {
    return !!(config.value.endpoint && config.value.model && config.value.token)
  }

  /**
   * Get preset configurations (can be customized per deployment)
   */
  const getPresets = () => {
    return {
      // Add your custom presets here
      // Example:
      // 'openai-gpt4': {
      //   name: 'OpenAI GPT-4',
      //   endpoint: 'https://api.openai.com/v1',
      //   model: 'gpt-4',
      //   chatPath: '/chat/completions',
      //   provider: 'openai'
      // }
    }
  }

  return {
    config,
    saveConfig,
    clearConfig,
    isConfigured,
    getPresets
  }
}
