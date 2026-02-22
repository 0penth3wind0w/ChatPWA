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

/**
 * Development-only logger
 * All methods are no-op in production
 */
export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  error: (...args) => {
    if (isDevelopment) {
      console.error(...args)
    }
  },

  info: (...args) => {
    if (isDevelopment) {
      console.info(...args)
    }
  }
}
