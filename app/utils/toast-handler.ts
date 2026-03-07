/**
 * Centralized notification utility
 * Maps technical errors and successful actions to user-friendly messages
 */

// Common advice strings to avoid repetition
const ADVICE = {
  RETRY: 'Please try again in a few moments.',
  SUPPORT: 'If the problem persists, please contact support.',
  REFRESH: 'Please refresh the page and try again.',
  AUTH: 'Please log in again to continue.',
} as const

export type CRUDAction =
  | 'add'
  | 'update'
  | 'delete'
  | 'remove'
  | 'save'
  | 'move'

export type SystemAction =
  | 'copy'
  | 'login'
  | 'logout'
  | 'pin_update'
  | 'order_save'

interface ToastMessage {
  title: string
  description?: string
  color: 'error' | 'warning' | 'success'
}

/**
 * Handles error logic and returns a structured object for Toast components.
 * @param error - The raw error object (from fetch, axios, etc.)
 * @returns {ToastMessage} Ready-to-use toast configuration
 */
export function handleError(error: any): ToastMessage {
  const status = error?.status || error?.statusCode || error?.response?.status

  // 1. Log the technical error for internal debugging
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    // In development, log full details including response data and stack trace
    console.error(`[Internal Error]`, {
      message: error?.message,
      status,
      data: error?.data || error?.response?.data,
      stack: error?.stack,
    })
  } else {
    // In non-development environments, log only a minimal, non-sensitive subset
    console.error(`[Internal Error]`, {
      message: error?.message,
      status,
    })
  }

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

/**
 * Handles success notifications for common CRUD operations
 * @param action - The type of action performed
 * @param itemName - The specific name/identifier of the item (e.g., color name)
 * @param entityName - The category of the item (e.g., 'Color', 'Profile')
 * @param targetName - Optional destination for 'move' or 'add' actions
 * @returns {ToastMessage} Ready-to-use toast configuration
 */
export function handleSuccess(
  action: CRUDAction,
  itemName?: string,
  entityName?: string,
  targetName?: string,
): ToastMessage {
  // 1. Determine the subject
  let subject = ''
  if (itemName && entityName) {
    subject = `${entityName} [${itemName}]`
  } else if (itemName) {
    subject = itemName
  } else if (entityName) {
    subject = entityName
  } else {
    subject = action === 'save' ? 'Your changes' : 'Action'
  }

  // 2. Determine the verb and suffixes
  let verb = ''
  let suffix = ''

  switch (action) {
    case 'add':
      verb = 'added successfully'
      if (targetName) suffix = ` to ${targetName}`
      break
    case 'update':
      verb = 'updated successfully'
      break
    case 'save':
      verb = 'saved successfully'
      break
    case 'delete':
    case 'remove':
      verb = 'removed'
      break
    case 'move':
      verb = 'moved'
      if (targetName) suffix = ` to ${targetName}`
      break
    default:
      verb = 'processed'
  }

  // Handle specific phrasing like "Profile has been updated" vs "Changes have been saved"
  const auxiliary =
    subject.toLowerCase().endsWith('s') && !subject.includes('[')
      ? 'have been'
      : 'has been'

  return {
    title: `${subject} ${auxiliary} ${verb}${suffix}.`.trim(),
    color: 'success',
  }
}

/**
 * Handles special system-level notifications (Auth, Clipboard, etc.)
 * @param action - The system event (copy, login, logout)
 * @param payload - Optional string for user names or specific details
 * @returns {ToastMessage} Ready-to-use toast configuration
 */
export function handleNotice(
  action: SystemAction,
  payload?: string,
): ToastMessage {
  switch (action) {
    case 'copy':
      return {
        title: 'Copied to clipboard!',
        color: 'success',
      }
    case 'logout':
      return {
        title: 'You have been logged out successfully.',
        color: 'success',
      }
    case 'login':
      return {
        title: `Hello, ${payload}. You successfully logged into this website.`,
        color: 'success',
      }
    case 'pin_update':
      return {
        title: 'Your pins have been updated successfully.',
        color: 'success',
      }
    case 'order_save':
      return {
        title: 'Sorting order saved successfully.',
        color: 'success',
      }
    default:
      return {
        title: 'Action successful',
        color: 'success',
      }
  }
}
