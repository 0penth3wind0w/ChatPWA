import { ref } from 'vue'

export function useApi() {
  /**
   * Build OpenAI-compatible request body
   */
  const buildOpenAIRequest = (messages, config) => {
    // Start with required fields only
    const request = {
      model: config.model,
      messages: messages
    }

    // Add optional fields only if they have valid values
    if (config.temperature !== undefined && config.temperature !== null) {
      request.temperature = config.temperature
    }

    if (config.maxTokens) {
      request.max_tokens = config.maxTokens
    }

    if (config.topP) {
      request.top_p = config.topP
    }

    if (config.presencePenalty) {
      request.presence_penalty = config.presencePenalty
    }

    if (config.frequencyPenalty) {
      request.frequency_penalty = config.frequencyPenalty
    }

    return request
  }

  /**
   * Build Anthropic-compatible request body
   */
  const buildAnthropicRequest = (messages, config) => {
    // Separate system message if present
    const systemMessage = messages.find(m => m.role === 'system')
    const conversationMessages = messages.filter(m => m.role !== 'system')

    return {
      model: config.model,
      max_tokens: config.maxTokens || 2000,
      messages: conversationMessages,
      ...(systemMessage && { system: systemMessage.content }),
      temperature: config.temperature || 1.0,
      ...(config.topP && { top_p: config.topP })
    }
  }

  /**
   * Build Gemini-compatible request body
   */
  const buildGeminiRequest = (messages, config) => {
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

    // Add generation config with optional parameters
    const generationConfig = {}

    if (config.temperature !== undefined && config.temperature !== null) {
      generationConfig.temperature = config.temperature
    }

    if (config.maxTokens) {
      generationConfig.maxOutputTokens = config.maxTokens
    }

    if (config.topP) {
      generationConfig.topP = config.topP
    }

    if (Object.keys(generationConfig).length > 0) {
      request.generationConfig = generationConfig
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
   * Parse standard response
   */
  const handleStandardResponse = async (response, provider = 'openai') => {
    const data = await response.json()

    console.log('[Chat API Response]', JSON.stringify(data, null, 2))

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
    try {
      // Use provider from config
      const provider = config.provider || 'openai'

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
        requestBody = buildGeminiRequest(messagesWithSystem, config)
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

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || errorData.message || `API Error: ${response.status} ${response.statusText}`)
      }

      return await handleStandardResponse(response, provider)
    } catch (err) {
      throw err
    }
  }

  /**
   * Generate image from prompt
   */
  const generateImage = async (prompt, config) => {
    try {
      console.log('[Image API Request]', { prompt, config })

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
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || errorData.message || `API Error: ${response.status} ${response.statusText}`)
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

        console.log('[Image API Response]', JSON.stringify(data, null, 2))
        return result
      }
    } catch (err) {
      throw err
    }
  }

  /**
   * Test API connection
   */
  const testConnection = async (config) => {
    try {
      const testMessages = [
        { role: 'user', content: 'Hello, this is a connection test.' }
      ]
      await sendChatMessage(testMessages, config)
      return true
    } catch (err) {
      throw new Error(`Connection test failed: ${err.message}`)
    }
  }

  return {
    sendChatMessage,
    generateImage,
    testConnection
  }
}
