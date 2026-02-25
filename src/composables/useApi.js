import { logger, sanitizeConfig } from '../utils/logger.js'
import i18n from '../i18n/index.js'

// Constants for retry logic
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000
const RETRY_BACKOFF_MULTIPLIER = 2

export function useApi() {
  // Abort controller for canceling requests
  let currentAbortController = null
  /**
   * Build OpenAI-compatible request body
   */
  const buildOpenAIRequest = (messages, config) => {
    return {
      model: config.model,
      messages: messages
    }
  }

  /**
   * Build Anthropic-compatible request body
   */
  const buildAnthropicRequest = (messages, config) => {
    // Separate system message if present
    const systemMessage = messages.find(m => m.role === 'system')
    const conversationMessages = messages.filter(m => m.role !== 'system')

    const request = {
      model: config.model,
      max_tokens: 2000,
      messages: conversationMessages
    }

    if (systemMessage) {
      request.system = systemMessage.content
    }

    return request
  }

  /**
   * Build Gemini-compatible request body
   */
  const buildGeminiRequest = (messages) => {
    // Convert messages to Gemini's contents format
    // Filter out system messages as Gemini handles them differently
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))

    // Build system instruction from system message if present
    const systemMessage = messages.find(m => m.role === 'system')

    const request = {
      contents: contents
    }

    // Add system instruction if present
    if (systemMessage) {
      request.systemInstruction = {
        parts: [{ text: systemMessage.content }]
      }
    }

    return request
  }

  /**
   * Build image generation request body
   */
  const buildImageRequest = (prompt, config, provider) => {
    if (provider === 'gemini') {
      // Gemini image generation format
      const request = {
        contents: [{
          role: "user",
          parts: [{
            text: prompt
          }]
        }]
      }

      // Add generation config for image generation
      const generationConfig = {
        responseModalities: ["IMAGE"]
      }

      // Use Gemini-specific aspect ratio and resolution settings
      const imageConfig = {}

      if (config.imageAspectRatio) {
        imageConfig.aspectRatio = config.imageAspectRatio
      }

      if (config.imageResolution) {
        imageConfig.imageSize = config.imageResolution
      }

      if (Object.keys(imageConfig).length > 0) {
        generationConfig.imageConfig = imageConfig
      }

      request.generationConfig = generationConfig
      return request
    } else {
      // OpenAI DALL-E format (default)
      const requestBody = {
        prompt: prompt,
        model: config.imageModel || 'dall-e-3',
        size: config.imageSize || '1024x1024',
        quality: config.imageQuality || 'standard',
        response_format: 'b64_json'
      }

      return requestBody
    }
  }

  /**
   * Cancel the current API request if one is in progress
   */
  const cancelRequest = () => {
    if (currentAbortController) {
      currentAbortController.abort()
      currentAbortController = null
    }
  }

  /**
   * Check if error is retryable (network errors, 5xx errors, rate limits)
   */
  const isRetryableError = (response) => {
    // Network errors (no response)
    if (!response) return true

    // Server errors (5xx)
    if (response.status >= 500) return true

    // Rate limit (429)
    if (response.status === 429) return true

    return false
  }

  /**
   * Retry a function with exponential backoff
   */
  const withRetry = async (fn, retries = MAX_RETRIES) => {
    let lastError

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error

        // Don't retry if abort was called
        if (error.name === 'AbortError') {
          // Preserve AbortError so it can be handled gracefully
          throw error
        }

        // Don't retry on last attempt
        if (attempt === retries) break

        // Check if error is retryable
        if (!isRetryableError(error.response)) break

        // Wait with exponential backoff before retrying
        const delay = RETRY_DELAY_MS * Math.pow(RETRY_BACKOFF_MULTIPLIER, attempt)
        logger.warn(`Request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  /**
   * Handle API errors consistently
   */
  const handleApiError = async (response) => {
    const { t } = i18n.global
    const errorData = await response.json().catch(() => ({ error: { message: t('api.errors.unknown') } }))
    const message = errorData.error?.message || errorData.message || t('api.errors.apiError', { status: response.status, statusText: response.statusText })
    const error = new Error(message)
    error.response = response // Attach response for retry logic
    throw error
  }

  /**
   * Parse standard response
   */
  const handleStandardResponse = async (response, provider = 'openai') => {
    const data = await response.json()

    logger.log('[Chat API Response]', JSON.stringify(data, null, 2))

    if (provider === 'openai') {
      return data.choices?.[0]?.message?.content || ''
    } else if (provider === 'anthropic') {
      return data.content?.[0]?.text || ''
    } else if (provider === 'gemini') {
      return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    }

    return ''
  }

  /**
   * Send chat message to API
   */
  const sendChatMessage = async (messages, config) => {
    logger.log('[sendChatMessage] Called with', messages.length, 'messages')
    logger.log('[sendChatMessage] Config:', sanitizeConfig(config))

    // Cancel any previous request
    cancelRequest()

    // Create new abort controller for this request
    currentAbortController = new AbortController()
    const signal = currentAbortController.signal

    return await withRetry(async () => {
      // Use provider from config
      const provider = config.provider || 'openai'
      logger.log('[sendChatMessage] Using provider:', provider)

      // Add system prompt if configured
      let messagesWithSystem = [...messages]
      if (config.systemPrompt && config.systemPrompt.trim()) {
        // Check if there's already a system message
        const hasSystemMessage = messages.some(m => m.role === 'system')
        if (!hasSystemMessage) {
          // Add system prompt as first message
          messagesWithSystem = [
            { role: 'system', content: config.systemPrompt.trim() },
            ...messages
          ]
        }
      }

      // Build endpoint - replace {model} placeholder for Gemini
      let chatPath = config.chatPath || '/chat/completions'
      if (chatPath.includes('{model}')) {
        chatPath = chatPath.replace('{model}', config.model)
      }
      const endpoint = `${config.endpoint}${chatPath}`

      // Validate and clean token
      const token = (config.token || '').trim()

      // Build request body based on provider and endpoint
      let requestBody
      // If using OpenAI-compatible endpoint (like LiteLLM proxy), always use OpenAI format
      if (config.chatPath?.includes('/chat/completions')) {
        requestBody = buildOpenAIRequest(messagesWithSystem, config)
      } else if (provider === 'anthropic') {
        requestBody = buildAnthropicRequest(messagesWithSystem, config)
      } else if (provider === 'gemini') {
        requestBody = buildGeminiRequest(messagesWithSystem)
      } else {
        requestBody = buildOpenAIRequest(messagesWithSystem, config)
      }

      // Build headers based on provider and endpoint
      const headers = {
        'Content-Type': 'application/json'
      }

      // Use appropriate authentication header
      if (provider === 'gemini' && !config.chatPath?.includes('/chat/completions')) {
        // Native Gemini API uses x-goog-api-key
        headers['x-goog-api-key'] = token
      } else {
        // OpenAI, Anthropic, and LiteLLM proxy use Authorization Bearer
        headers['Authorization'] = `Bearer ${token}`
      }

      if (provider === 'anthropic') {
        headers['anthropic-version'] = '2023-06-01'
      }

      logger.log('[sendChatMessage] Making request to:', endpoint)
      logger.log('[sendChatMessage] Request body:', JSON.stringify(requestBody, null, 2))

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal // Add abort signal
      })

      logger.log('[sendChatMessage] Response status:', response.status, response.statusText)

      if (!response.ok) {
        await handleApiError(response)
      }

      return await handleStandardResponse(response, provider)
    })
  }

  /**
   * Generate image from prompt
   */
  const generateImage = async (prompt, config) => {
    // Cancel any previous request
    cancelRequest()

    // Create new abort controller for this request
    currentAbortController = new AbortController()
    const signal = currentAbortController.signal

    return await withRetry(async () => {
      logger.log('[Image API Request]', { prompt, config: sanitizeConfig(config) })

      // Build endpoint - replace {model} placeholder if present
      let imagePath = config.imagePath || '/images/generations'
      if (imagePath.includes('{model}')) {
        imagePath = imagePath.replace('{model}', config.imageModel || config.model)
      }
      const endpoint = `${config.endpoint}${imagePath}`

      // Determine provider from imagePath or config
      const provider = config.provider || 'openai'

      const requestBody = buildImageRequest(prompt, config, provider)

      // Build headers based on provider
      const headers = {
        'Content-Type': 'application/json'
      }

      // Use appropriate authentication header
      if (provider === 'gemini' && imagePath.includes('generateContent')) {
        // Native Gemini API uses x-goog-api-key
        headers['x-goog-api-key'] = config.token
      } else {
        // OpenAI and LiteLLM proxy use Authorization Bearer
        headers['Authorization'] = `Bearer ${config.token}`
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal // Add abort signal
      })

      if (!response.ok) {
        await handleApiError(response)
      }

      const data = await response.json()

      // Handle different response formats
      if (provider === 'gemini') {
        // Gemini response format: candidates[].content.parts[].inlineData
        const candidates = data.candidates || []
        const images = []

        for (const candidate of candidates) {
          const parts = candidate.content?.parts || []

          for (const part of parts) {
            // Check both camelCase (actual API) and snake_case (documentation)
            const inlineData = part.inlineData || part.inline_data
            if (inlineData) {
              // Convert Gemini's inlineData to data URL
              const mimeType = inlineData.mimeType || inlineData.mime_type || 'image/png'
              images.push({
                url: `data:${mimeType};base64,${inlineData.data}`
              })
            }
          }
        }

        return images
      } else {
        // OpenAI DALL-E format
        const images = data.data || []
        const result = images.map(img => {
          if (img.b64_json) {
            return {
              ...img,
              url: `data:image/png;base64,${img.b64_json}`
            }
          }
          return img
        })

        logger.log('[Image API Response]', JSON.stringify(data, null, 2))
        return result
      }
    })
  }

  /**
   * Test API connection
   */
  const testConnection = async (config) => {
    const { t } = i18n.global
    try {
      const testMessages = [
        { role: 'user', content: t('api.errors.connectionTestMessage') }
      ]
      await sendChatMessage(testMessages, config)
      return true
    } catch (err) {
      throw new Error(t('api.errors.connectionTestFailed', { message: err.message }))
    }
  }

  return {
    sendChatMessage,
    generateImage,
    testConnection,
    cancelRequest
  }
}
