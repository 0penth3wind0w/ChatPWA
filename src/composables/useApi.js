import { logger, sanitizeConfig } from '../utils/logger.js'
import i18n from '../i18n/index.js'

// Constants for retry logic
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000
const RETRY_BACKOFF_MULTIPLIER = 2

// Tool definitions — canonical format, indexed by name for O(1) lookup
const TOOL_DEFINITIONS = new Map([
  ['web_search', {
    name: 'web_search',
    description: 'Search the web for current information. Use this when the user asks you to search for something, or when you need up-to-date information not in your training data.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query' }
      },
      required: ['query']
    }
  }],
  ['fetch_url', {
    name: 'fetch_url',
    description: 'Fetch and read the content of a web page. Use this when the user provides a URL or asks you to read a specific web page.',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to fetch' }
      },
      required: ['url']
    }
  }],
  ['generate_image', {
    name: 'generate_image',
    description: 'Generate an image from a text description. Use this when the user asks you to create, draw, or generate an image.',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Detailed description of the image to generate' }
      },
      required: ['prompt']
    }
  }]
])

/**
 * Return the subset of tool definitions available given the current config.
 */
const getAvailableTools = (config) => {
  const tools = []
  // web_search: requires a search provider and a non-empty API key
  if (config.searchProvider && config.searchApiKey && config.searchApiKey.trim()) {
    tools.push(TOOL_DEFINITIONS.get('web_search'))
  }
  // fetch_url: always available (uses Jina, no key needed)
  tools.push(TOOL_DEFINITIONS.get('fetch_url'))
  // generate_image: requires an imageModel to be set
  if (config.imageModel && config.imageModel.trim()) {
    tools.push(TOOL_DEFINITIONS.get('generate_image'))
  }
  return tools
}

// Module-level singleton abort controller — shared across all useApi() callers
// so that cancelRequest() from any component cancels the active request.
let currentAbortController = null

/**
 * Convert canonical tool definitions to OpenAI format
 */
const buildOpenAITools = (tools) =>
  tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }))

/**
 * Convert canonical tool definitions to Anthropic format
 */
const buildAnthropicTools = (tools) =>
  tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters
  }))

/**
 * Convert canonical tool definitions to Gemini format
 */
const buildGeminiTools = (tools) => [{
  functionDeclarations: tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }))
}]

/**
 * Attach Gemini tools to a request body if any are available.
 */
const attachGeminiTools = (request, config) => {
  const tools = buildGeminiTools(getAvailableTools(config))
  if (tools[0].functionDeclarations.length > 0) request.tools = tools
}

/**
 * Parse tool calls from an OpenAI response.
 * Returns null if no tool calls, or [{id, name, args}]
 */
const parseOpenAIToolCalls = (data) => {
  const toolCalls = data.choices?.[0]?.message?.tool_calls
  if (!toolCalls || toolCalls.length === 0) return null
  return toolCalls.map(tc => ({
    id: tc.id,
    name: tc.function.name,
    args: JSON.parse(tc.function.arguments)
  }))
}

/**
 * Parse tool calls from an Anthropic response.
 * Returns null if no tool calls, or [{id, name, args}]
 */
const parseAnthropicToolCalls = (data) => {
  const toolUseBlocks = (data.content || []).filter(b => b.type === 'tool_use')
  if (toolUseBlocks.length === 0) return null
  return toolUseBlocks.map(b => ({
    id: b.id,
    name: b.name,
    args: b.input
  }))
}

/**
 * Parse tool calls from a Gemini response.
 * Returns null if no tool calls, or [{id, name, args}]
 */
const parseGeminiToolCalls = (data) => {
  const parts = data.candidates?.[0]?.content?.parts || []
  const fnCalls = parts.filter(p => p.functionCall)
  if (fnCalls.length === 0) return null
  return fnCalls.map((p, i) => ({
    id: `gemini_tool_${i}`,
    name: p.functionCall.name,
    args: p.functionCall.args || {}
  }))
}

/**
 * Append a tool-call turn + tool results to an OpenAI message array.
 * assistantData: the raw response JSON from the API
 * results: [{id, name, result}]
 */
const appendOpenAIToolResults = (messages, assistantData, results) => {
  // Append the assistant message that contained the tool calls
  const assistantMsg = assistantData.choices[0].message
  const updated = [
    ...messages,
    { role: 'assistant', content: assistantMsg.content || null, tool_calls: assistantMsg.tool_calls }
  ]
  // Append one tool result message per call
  for (const r of results) {
    updated.push({ role: 'tool', tool_call_id: r.id, content: r.result })
  }
  return updated
}

/**
 * Append a tool-call turn + tool results to an Anthropic message array.
 */
const appendAnthropicToolResults = (messages, assistantData, results) => {
  const updated = [
    ...messages,
    { role: 'assistant', content: assistantData.content }
  ]
  updated.push({
    role: 'user',
    content: results.map(r => ({
      type: 'tool_result',
      tool_use_id: r.id,
      content: r.result
    }))
  })
  return updated
}

/**
 * Append a tool-call turn + tool results to a Gemini contents array.
 * geminiMessages: the current contents array
 */
const appendGeminiToolResults = (geminiMessages, assistantData, results) => {
  const modelParts = assistantData.candidates[0].content.parts
  const updated = [
    ...geminiMessages,
    { role: 'model', parts: modelParts }
  ]
  updated.push({
    role: 'user',
    parts: results.map(r => ({
      functionResponse: {
        name: r.name,
        response: { content: r.result }
      }
    }))
  })
  return updated
}

/**
 * Build request headers for the given provider and token
 */
const buildHeaders = (provider, token, path = '') => {
  const headers = { 'Content-Type': 'application/json' }
  if (provider === 'gemini' && !path.includes('/chat/completions') && (path.includes('generateContent') || path.includes('/models/'))) {
    headers['x-goog-api-key'] = token
  } else {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (provider === 'anthropic') {
    headers['anthropic-version'] = '2023-06-01'
  }
  return headers
}

/**
 * Build OpenAI-compatible request body
 */
const buildOpenAIRequest = (messages, config) => {
  const body = {
    model: config.model,
    messages: messages
  }
  const tools = buildOpenAITools(getAvailableTools(config))
  if (tools.length > 0) body.tools = tools
  return body
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

  const tools = buildAnthropicTools(getAvailableTools(config))
  if (tools.length > 0) request.tools = tools

  return request
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

  attachGeminiTools(request, config)

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
    // OpenAI format (default)
    return {
      prompt: prompt,
      model: config.imageModel || 'dall-e-3',
      size: config.imageSize || '1024x1024',
      quality: config.imageQuality || 'standard',
      response_format: 'b64_json'
    }
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
 * Cancel any in-flight request and create a fresh AbortSignal for the next one.
 */
const resetAbortController = () => {
  cancelRequest()
  currentAbortController = new AbortController()
  return currentAbortController.signal
}

/**
 * Check if error is retryable (network errors, 5xx errors, rate limits)
 */
const isRetryableError = (response) => {
  // Network errors (no response) — fail fast, don't retry
  if (!response) return false

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
 * Parse a response JSON into {toolCalls, text}.
 * toolCalls is null when the LLM returned plain text.
 */
const parseResponse = (data, provider) => {
  logger.log('[Chat API Response]', JSON.stringify(data, null, 2))

  if (provider === 'openai') {
    const toolCalls = parseOpenAIToolCalls(data)
    if (toolCalls) return { toolCalls, rawData: data, text: null }
    return { toolCalls: null, rawData: data, text: data.choices?.[0]?.message?.content || '' }
  } else if (provider === 'anthropic') {
    const toolCalls = parseAnthropicToolCalls(data)
    if (toolCalls) return { toolCalls, rawData: data, text: null }
    return { toolCalls: null, rawData: data, text: data.content?.find(b => b.type === 'text')?.text || '' }
  } else if (provider === 'gemini') {
    const toolCalls = parseGeminiToolCalls(data)
    if (toolCalls) return { toolCalls, rawData: data, text: null }
    return { toolCalls: null, rawData: data, text: data.candidates?.[0]?.content?.parts?.[0]?.text || '' }
  }

  return { toolCalls: null, rawData: data, text: '' }
}

/**
 * One raw HTTP call to the chat endpoint.
 * Returns parsed {toolCalls, rawData, text, sentMessages}.
 * sentMessages: the provider-native message array that was sent (used to continue tool loops).
 */
const chatRequest = async (messages, config, signal) => {
  const provider = config.provider || 'openai'

  let chatPath = config.chatPath || '/chat/completions'
  if (chatPath.includes('{model}')) {
    chatPath = chatPath.replace('{model}', config.model)
  }
  const endpoint = `${config.endpoint}${chatPath}`
  const token = (config.token || '').trim()

  let requestBody
  // sentMessages tracks the provider-format messages array actually sent
  let sentMessages = messages

  // Detect if messages are already in Gemini-native format (have .parts, not .content)
  const isGeminiNativeFormat = provider === 'gemini' && messages.length > 0 && messages[0].parts !== undefined

  if (config.chatPath?.includes('/chat/completions')) {
    requestBody = buildOpenAIRequest(messages, config)
  } else if (provider === 'anthropic') {
    requestBody = buildAnthropicRequest(messages, config)
    // For Anthropic, sentMessages excludes the system message (it's in request.system)
    sentMessages = messages.filter(m => m.role !== 'system')
  } else if (provider === 'gemini') {
    if (isGeminiNativeFormat) {
      // Already Gemini-native (e.g. from continueWithToolResults) — use as-is
      requestBody = { contents: messages }
      attachGeminiTools(requestBody, config)
    } else {
      requestBody = buildGeminiRequest(messages, config)
      sentMessages = requestBody.contents
    }
  } else {
    requestBody = buildOpenAIRequest(messages, config)
  }

  const headers = buildHeaders(provider, token, config.chatPath || '')

  logger.log('[chatRequest] Making request to:', endpoint)
  logger.log('[chatRequest] Request body:', JSON.stringify(requestBody, null, 2))

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
    signal
  })

  logger.log('[chatRequest] Response status:', response.status, response.statusText)

  if (!response.ok) {
    await handleApiError(response)
  }

  const data = await response.json()
  const parsed = parseResponse(data, provider)
  return { ...parsed, sentMessages }
}

export function useApi() {
  /**
   * Send chat message to API.
   * Returns {text, toolCalls} — callers handle the tool execution loop.
   * When tools are enabled and the LLM wants to call one, toolCalls is set.
   */
  const sendChatMessage = async (messages, config) => {
    logger.log('[sendChatMessage] Called with', messages.length, 'messages')
    logger.log('[sendChatMessage] Config:', sanitizeConfig(config))

    const signal = resetAbortController()
    const provider = config.provider || 'openai'

    return await withRetry(async () => {
      logger.log('[sendChatMessage] Using provider:', provider)

      // Add system prompt if configured
      let messagesWithSystem = [...messages]
      if (config.systemPrompt && config.systemPrompt.trim()) {
        const hasSystemMessage = messages.some(m => m.role === 'system')
        if (!hasSystemMessage) {
          messagesWithSystem = [
            { role: 'system', content: config.systemPrompt.trim() },
            ...messages
          ]
        }
      }

      return await chatRequest(messagesWithSystem, config, signal)
    })
  }

  /**
   * Append tool results to the conversation and continue.
   * sentMessages: the provider-native sentMessages returned by the previous chatRequest
   * rawData: the raw API response JSON from the previous call
   * results: [{id, name, result}]
   */
  const continueWithToolResults = async (sentMessages, config, rawData, results) => {
    const signal = resetAbortController()
    const provider = config.provider || 'openai'

    return await withRetry(async () => {
      let updatedMessages
      if (provider === 'anthropic') {
        updatedMessages = appendAnthropicToolResults(sentMessages, rawData, results)
      } else if (provider === 'gemini') {
        updatedMessages = appendGeminiToolResults(sentMessages, rawData, results)
      } else {
        updatedMessages = appendOpenAIToolResults(sentMessages, rawData, results)
      }

      logger.log('[continueWithToolResults] Continuing conversation, provider:', provider)
      return await chatRequest(updatedMessages, config, signal)
    })
  }

  /**
   * Generate image from prompt
   */
  const generateImage = async (prompt, config) => {
    const signal = resetAbortController()
    const provider = config.provider || 'openai'

    return await withRetry(async () => {
      logger.log('[Image API Request]', { prompt, config: sanitizeConfig(config) })

      // Build endpoint - replace {model} placeholder if present
      let imagePath = config.imagePath || '/images/generations'
      if (imagePath.includes('{model}')) {
        imagePath = imagePath.replace('{model}', config.imageModel || config.model)
      }
      const endpoint = `${config.endpoint}${imagePath}`

      const requestBody = buildImageRequest(prompt, config, provider)

      // Validate and clean token
      const token = (config.token || '').trim()

      const headers = buildHeaders(provider, token, imagePath)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal
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
        // OpenAI format
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
    continueWithToolResults,
    generateImage,
    testConnection,
    cancelRequest
  }
}
