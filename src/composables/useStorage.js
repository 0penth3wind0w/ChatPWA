import { ref } from 'vue'

const STORAGE_KEYS = {
  API_CONFIG: 'chatpwa_api_config'
}

export function useStorage() {
  const config = ref({
    endpoint: '',
    model: '',
    token: ''
  })

  /**
   * Load API configuration from localStorage
   */
  const loadConfig = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.API_CONFIG)
      if (stored) {
        const parsed = JSON.parse(stored)
        config.value = {
          endpoint: parsed.endpoint || '',
          model: parsed.model || '',
          token: parsed.token || ''
        }
        return config.value
      }
    } catch (error) {
      console.error('Failed to load configuration:', error)
    }
    return null
  }

  /**
   * Save API configuration to localStorage
   */
  const saveConfig = (newConfig) => {
    try {
      config.value = {
        endpoint: newConfig.endpoint || '',
        model: newConfig.model || '',
        token: newConfig.token || ''
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
      config.value = {
        endpoint: '',
        model: '',
        token: ''
      }
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

  return {
    config,
    loadConfig,
    saveConfig,
    clearConfig,
    isConfigured
  }
}
