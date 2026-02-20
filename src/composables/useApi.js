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
  const buildImageRequest = (prompt, config) => {
    return {
      prompt: prompt,
      model: config.imageModel || 'dall-e-3',
      n: config.imageCount || 1,
      size: config.imageSize || '1024x1024',
      quality: config.imageQuality || 'standard',
      style: config.imageStyle || 'vivid',
      response_format: 'b64_json'
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
      // Determine provider based on chatPath
      let provider = 'openai'
      if (config.chatPath?.includes('/messages')) {
        provider = 'anthropic'
      } else if (config.chatPath?.includes('generateContent')) {
        provider = 'gemini'
      }

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

      // Build endpoint - Gemini uses model name in path
      let endpoint
      if (provider === 'gemini') {
        const streamSuffix = config.enableStreaming ? 'streamGenerateContent' : 'generateContent'
        endpoint = `${config.endpoint}/models/${config.model}:${streamSuffix}`
      } else {
        endpoint = `${config.endpoint}${config.chatPath || '/chat/completions'}`
      }

      // Validate and clean token
      const token = (config.token || '').trim()

      // Build request body based on provider
      let requestBody
      if (provider === 'anthropic') {
        requestBody = buildAnthropicRequest(messagesWithSystem, config)
      } else if (provider === 'gemini') {
        requestBody = buildGeminiRequest(messagesWithSystem, config)
      } else {
        requestBody = buildOpenAIRequest(messagesWithSystem, config)
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(provider === 'anthropic' && { 'anthropic-version': '2023-06-01' })
        },
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
      const endpoint = `${config.endpoint}${config.imagePath || '/images/generations'}`
      const requestBody = buildImageRequest(prompt, config)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.token}`
        },
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

      // Convert base64 responses to data URLs if needed
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
