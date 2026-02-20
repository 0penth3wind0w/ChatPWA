import { ref } from 'vue'

export function useWebTools() {
  const isLoading = ref(false)
  const error = ref(null)

  /**
   * Search the web using configured search provider
   */
  const searchWeb = async (query, config) => {
    isLoading.value = true
    error.value = null

    try {
      let results = []

      if (config.searchProvider === 'brave' && config.searchApiKey) {
        // Brave Search API
        const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`, {
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': config.searchApiKey
          }
        })

        if (!response.ok) {
          throw new Error(`Brave Search API error: ${response.status}`)
        }

        const data = await response.json()
        console.log('[DEBUG] Brave Search Response:', data)

        // Extract web results
        results = (data.web?.results || []).slice(0, 5).map(result => ({
          title: result.title,
          url: result.url,
          description: result.description,
          snippet: result.description
        }))

      } else if (config.searchProvider === 'tavily' && config.searchApiKey) {
        // Tavily Search API
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            api_key: config.searchApiKey,
            query: query,
            search_depth: 'basic',
            max_results: 5
          })
        })

        if (!response.ok) {
          throw new Error(`Tavily API error: ${response.status}`)
        }

        const data = await response.json()
        console.log('[DEBUG] Tavily Search Response:', data)

        results = (data.results || []).map(result => ({
          title: result.title,
          url: result.url,
          description: result.content,
          snippet: result.content
        }))

      } else if (config.searchProvider === 'custom' && config.searchEndpoint) {
        // Custom search endpoint
        const response = await fetch(`${config.searchEndpoint}?q=${encodeURIComponent(query)}`)

        if (!response.ok) {
          throw new Error(`Custom search error: ${response.status}`)
        }

        const data = await response.json()
        results = data.results || []

      } else {
        throw new Error('No search provider configured')
      }

      // Format results as markdown
      const markdown = formatSearchResults(query, results)
      return markdown

    } catch (err) {
      console.error('Search error:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch web page content using Jina AI Reader
   */
  const fetchWebContent = async (url) => {
    isLoading.value = true
    error.value = null

    try {
      // Jina AI Reader - converts web pages to clean markdown
      const jinaUrl = `https://r.jina.ai/${url}`
      const response = await fetch(jinaUrl, {
        headers: {
          'Accept': 'text/plain'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch web content: ${response.status}`)
      }

      const content = await response.text()

      // Add metadata header
      const result = `# Web Content: ${url}\n\n${content}`
      return result

    } catch (err) {
      console.error('Fetch error:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Format search results as markdown
   */
  const formatSearchResults = (query, results) => {
    if (!results || results.length === 0) {
      return `# Search Results for "${query}"\n\nNo results found.`
    }

    let markdown = `# Search Results for "${query}"\n\n`
    markdown += `Found ${results.length} results:\n\n`

    results.forEach((result, index) => {
      markdown += `## ${index + 1}. ${result.title}\n`
      markdown += `**URL:** ${result.url}\n\n`
      markdown += `${result.description || result.snippet}\n\n`
      markdown += '---\n\n'
    })

    return markdown
  }

  return {
    isLoading,
    error,
    searchWeb,
    fetchWebContent
  }
}
