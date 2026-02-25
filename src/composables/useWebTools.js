import { logger } from '../utils/logger.js'
import i18n from '../i18n/index.js'

export function useWebTools() {
  const { t } = i18n.global
  /**
   * Search the web using configured search provider
   */
  const searchWeb = async (query, config) => {
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
          throw new Error(t('api.errors.braveSearchError', { status: response.status }))
        }

        const data = await response.json()

        // Extract web results
        results = (data.web?.results || []).slice(0, 5).map(result => ({
          title: result.title,
          url: result.url,
          description: result.description
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
          throw new Error(t('api.errors.tavilyError', { status: response.status }))
        }

        const data = await response.json()

        results = (data.results || []).map(result => ({
          title: result.title,
          url: result.url,
          description: result.content
        }))

      } else {
        throw new Error(t('api.errors.searchProviderNotConfigured'))
      }

      // Format results as markdown
      const markdown = formatSearchResults(query, results)
      return markdown

    } catch (err) {
      logger.error('Search error:', err)
      throw err
    }
  }

  /**
   * Fetch web page content using Jina AI Reader
   */
  const fetchWebContent = async (url) => {
    try {
      // Jina AI Reader - converts web pages to clean markdown
      const jinaUrl = `https://r.jina.ai/${url}`
      const response = await fetch(jinaUrl, {
        headers: {
          'Accept': 'text/plain'
        }
      })

      if (!response.ok) {
        throw new Error(t('api.errors.fetchWebContentFailed', { status: response.status }))
      }

      const content = await response.text()

      // Add metadata header
      const result = `# ${t('api.webContent.title', { url })}\n\n${content}`
      return result

    } catch (err) {
      logger.error('Fetch error:', err)
      throw err
    }
  }

  /**
   * Format search results as markdown
   */
  const formatSearchResults = (query, results) => {
    if (!results || results.length === 0) {
      return `# ${t('api.webContent.searchResultsTitle', { query })}\n\n${t('api.webContent.noResults')}`
    }

    let markdown = `# ${t('api.webContent.searchResultsTitle', { query })}\n\n`
    markdown += `${t('api.webContent.foundResults', { count: results.length })}\n\n`

    results.forEach((result, index) => {
      markdown += `## ${index + 1}. ${result.title}\n`
      markdown += `**URL:** ${result.url}\n\n`
      markdown += `${result.description}\n\n`
      markdown += '---\n\n'
    })

    return markdown
  }

  return {
    searchWeb,
    fetchWebContent
  }
}
