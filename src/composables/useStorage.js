import { shallowRef } from 'vue'
import { logger } from '../utils/logger.js'

const STORAGE_KEYS = {
  API_CONFIG: 'chatpwa_api_config'
}

// Default paths per provider — exported so SettingsForm can reuse them
export const DEFAULT_PATHS = {
  openai: { chatPath: '/chat/completions', imagePath: '/images/generations' },
  anthropic: { chatPath: '/messages', imagePath: '/images/generations' },
  gemini: { chatPath: '/models/{model}:generateContent', imagePath: '/models/{model}:generateContent' }
}

// Default configuration template
const DEFAULT_CONFIG = {
  endpoint: '',
  model: '',
  token: '',
  chatPath: '/chat/completions', // '/messages' for Anthropic, '/models/{model}:generateContent' for Gemini
  imagePath: '/images/generations',
  provider: 'openai', // 'openai', 'anthropic', or 'gemini'
  systemPrompt: '', // Custom system prompt for AI behavior
  imageModel: 'dall-e-3',
  imageSize: '1024x1024',
  imageQuality: 'standard',
  imageAspectRatio: '1:1', // For Gemini
  imageResolution: '2K', // For Gemini
  // Chat Configuration
  maxHistoryMessages: 10, // Number of messages to send to API (0 = unlimited)
  // Web Tools Configuration
  searchProvider: 'brave', // 'brave' or 'tavily'
  searchApiKey: '',
  // Appearance
  colorTheme: 'green' // 'green', 'blue', or 'slate'
}

// Shared config state (singleton)
// shallowRef: config is a flat object, no nested reactivity needed
const config = shallowRef({ ...DEFAULT_CONFIG })

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
    logger.error('Failed to load configuration:', error)
  }
}

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
      logger.error('Failed to save configuration:', error)
      return false
    }
  }

  /**
   * Check if configuration is complete
   */
  const isConfigured = () => {
    return !!(config.value.endpoint && config.value.model && config.value.token)
  }

  return {
    config,
    saveConfig,
    isConfigured
  }
}
