/**
 * Centralized error handling utility
 * Maps technical errors to user-friendly toast notifications
 */

// Common advice strings to avoid repetition
const ADVICE = {
  RETRY: 'Please try again in a few moments.',
  SUPPORT: 'If the problem persists, please contact support.',
  REFRESH: 'Please refresh the page and try again.',
  AUTH: 'Please log in again to continue.',
} as const

interface ToastMessage {
  title: string
  description: string
  color: 'error' | 'warning'
}

/**
 * Handles error logic and returns a structured object for Toast components.
 * @param error - The raw error object (from fetch, axios, etc.)
 * @returns {ToastMessage} Ready-to-use toast configuration
 */
export function handleError(error: any): ToastMessage {
  // 1. Log the full technical error for internal debugging
  console.error(`[Error Log]`, {
    message: error?.message,
    status: error?.status || error?.statusCode || error?.response?.status,
    data: error?.data || error?.response?.data,
    stack: error?.stack,
  })

  const status = error?.status || error?.statusCode || error?.response?.status

  // 2. Handle specific HTTP status codes for smarter feedback
  if (status === 401 || status === 403) {
    return {
      title: 'Session Expired or Restricted',
      description: ADVICE.AUTH,
      color: 'warning',
    }
  }

  if (status === 404) {
    return {
      title: 'Not Found',
      description: 'The requested resource could not be located.',
      color: 'error',
    }
  }

  if (status === 429) {
    return {
      title: 'Too Many Requests',
      description: 'You are doing that a bit too fast. ' + ADVICE.RETRY,
      color: 'warning',
    }
  }

  if (status >= 500) {
    return {
      title: 'Server Error',
      description: 'Our systems are having trouble. ' + ADVICE.SUPPORT,
      color: 'error',
    }
  }

  // 3. Fallback to generic message
  return {
    title: 'Something went wrong',
    description: ADVICE.SUPPORT,
    color: 'error',
  }
}
