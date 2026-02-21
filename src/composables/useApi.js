import { ref } from 'vue'

export function useApi() {
  const isLoading = ref(false)
  const error = ref(null)

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

    if (config.enableStreaming !== undefined) {
      request.stream = config.enableStreaming
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
      stream: config.enableStreaming || false,
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

      // Only add n parameter for DALL-E 2 (DALL-E 3 only supports n=1)
      if (config.imageModel === 'dall-e-2') {
        requestBody.n = config.imageCount || 1
      }

      return requestBody
    }
  }

  /**
   * Parse streaming response (Server-Sent Events)
   */
  const handleStreamingResponse = async (response, onChunk, provider = 'openai') => {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              console.log('[DEBUG] Streaming chunk:', parsed)

              // Handle different provider formats
              if (provider === 'openai') {
                const content = parsed.choices?.[0]?.delta?.content
                if (content) onChunk(content)
              } else if (provider === 'anthropic') {
                const content = parsed.delta?.text
                if (content) onChunk(content)
              } else if (provider === 'gemini') {
                const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text
                if (content) onChunk(content)
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Parse standard (non-streaming) response
   */
  const handleStandardResponse = async (response, provider = 'openai') => {
    const data = await response.json()
    console.log('[DEBUG] Standard response data:', data)

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
  const sendChatMessage = async (messages, config, onChunk = null) => {
    isLoading.value = true
    error.value = null

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
      // Handle streaming suffix for Gemini
      if (provider === 'gemini' && chatPath.includes(':generateContent')) {
        const streamSuffix = config.enableStreaming ? 'streamGenerateContent' : 'generateContent'
        chatPath = chatPath.replace(':generateContent', `:${streamSuffix}`)
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

      console.log('[DEBUG] Chat API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        provider,
        endpoint
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.log('[DEBUG] Chat API Error Response:', errorData)
        throw new Error(errorData.error?.message || errorData.message || `API Error: ${response.status} ${response.statusText}`)
      }

      // Handle streaming vs standard response
      if (config.enableStreaming && onChunk) {
        await handleStreamingResponse(response, onChunk, provider)
        return null
      } else {
        const result = await handleStandardResponse(response, provider)
        console.log('[DEBUG] Chat API Success Response:', result)
        return result
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Generate image from prompt
   */
  const generateImage = async (prompt, config) => {
    isLoading.value = true
    error.value = null

    try {
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

      console.log('[DEBUG] Image API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        endpoint
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.log('[DEBUG] Image API Error Response:', errorData)
        throw new Error(errorData.error?.message || errorData.message || `API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[DEBUG] Image API Success Response:', data)

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
        return images.map(img => {
          if (img.b64_json) {
            return {
              ...img,
              url: `data:image/png;base64,${img.b64_json}`
            }
          }
          return img
        })
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
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
      await sendChatMessage(testMessages, { ...config, enableStreaming: false })
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
