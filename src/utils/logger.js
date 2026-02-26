/**
 * Environment-aware logger utility
 * Removes console logs in production build for security and performance
 */

const isDevelopment = import.meta.env.DEV

/**
 * Sanitize config object to remove sensitive data before logging
 */
export const sanitizeConfig = (config) => {
  if (!config) return config

  const sanitized = { ...config }

  // Mask API token (show only first 4 and last 4 characters)
  if (sanitized.token && typeof sanitized.token === 'string') {
    const token = sanitized.token
    if (token.length > 8) {
      sanitized.token = `${token.slice(0, 4)}...${token.slice(-4)}`
    } else {
      sanitized.token = '****'
    }
  }

  return sanitized
}

const noop = () => {}

/**
 * Development-only logger
 * All methods are no-op in production
 */
export const logger = isDevelopment
  ? {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console)
    }
  : { log: noop, warn: noop, error: console.error.bind(console) }
