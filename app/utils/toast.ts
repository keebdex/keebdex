/**
 * Toast message builders. Each returns a ready-to-use config for
 * `useToast().add()`, so every screen phrases the same event the same way:
 * a short Title Case title plus a full-sentence description.
 *
 * - `successToast`: a record was changed (`Kit Added`).
 * - `noticeToast`: a fixed app event that is not a record change.
 * - `notificationToast`: a notification arrived in realtime.
 * - `validationToast`: a client-side check failed; shows the message as is.
 * - `errorToast`: a request or runtime error; logs it and maps it by status.
 */

type ToastColor = 'success' | 'info' | 'warning' | 'error'

export interface ToastMessage {
  title: string
  description?: string
  color: ToastColor
}

/**
 * - `add`: create a record, or add an item to `target` (a collection)
 * - `update`: edit an existing record
 * - `delete`: permanently delete a record
 * - `remove`: take an item out of a collection (the record itself stays)
 * - `move`: move an item to `target`
 * - `approve` / `reject`: moderate a submission
 */
export type SuccessAction =
  | 'add'
  | 'update'
  | 'delete'
  | 'remove'
  | 'move'
  | 'approve'
  | 'reject'

const PAST_TENSE: Record<SuccessAction, string> = {
  add: 'added',
  update: 'updated',
  delete: 'deleted',
  remove: 'removed',
  move: 'moved',
  approve: 'approved',
  reject: 'rejected',
}

const TARGET_PREPOSITION: Partial<Record<SuccessAction, string>> = {
  add: 'to',
  move: 'to',
  remove: 'from',
}

interface SuccessSubject {
  /** Kind of record, or a counted label from `countLabel` such as `3 kits`. */
  entity?: string
  /** Display name of the record; rendered in quotes. */
  name?: string | null
  /** Destination for `add`/`move`, or source collection for `remove`. */
  target?: string | null
  /** Parent the records belong to, e.g. the keyset of bulk-approved kits. */
  scope?: string | null
  /** Treat `entity` as plural (`have been`); inferred for counted labels. */
  plural?: boolean
}

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1)

const titleCase = (text: string) => text.split(' ').map(capitalize).join(' ')

const quote = (text: string) => `"${text}"`

/** Counted label for bulk toasts: `1 kit`, `3 kits`. */
export const countLabel = (
  count: number,
  singular: string,
  plural?: string,
) => `${count} ${count === 1 ? singular : plural || `${singular}s`}`

/**
 * Title `Kit Added`, description `Kit "Base" has been added.`;
 * `"Base" has been moved to "Wishlist".`; title `Kits Approved`, description
 * `3 kits in "GMK Olivia" have been approved.` (counts stay out of titles).
 */
export function successToast(
  action: SuccessAction,
  { entity, name, target, scope, plural }: SuccessSubject = {},
): ToastMessage {
  const verb = PAST_TENSE[action]
  const isPlural = plural ?? /^(?!1 )\d+ /.test(entity || '')

  const subject =
    [entity, name && quote(name), scope && `in ${quote(scope)}`]
      .filter(Boolean)
      .join(' ') || 'Item'
  const preposition = TARGET_PREPOSITION[action]
  const destination =
    target && preposition
      ? ` ${preposition} ${quote(target)}`
      : action === 'remove'
        ? ' from your collection'
        : ''

  // `3 kits` -> `Kits`; the count is only shown in the description.
  const titleEntity = entity?.replace(/^\d+ /, '') || 'Item'

  return {
    title: titleCase(`${titleEntity} ${verb}`),
    description: `${capitalize(subject)} ${isPlural ? 'have' : 'has'} been ${verb}${destination}.`,
    color: 'success',
  }
}

export type NoticeKey =
  | 'copied'
  | 'image_copied'
  | 'signed_out'
  | 'pins_saved'
  | 'order_saved'
  | 'feedback_sent'
  | 'submission_pending'
  | 'color_fetched'
  | 'already_in_collection'

const NOTICES: Record<NoticeKey, (detail?: string) => ToastMessage> = {
  copied: () => ({
    title: 'Copied to Clipboard',
    description: 'The text has been copied and is ready to paste.',
    color: 'success',
  }),
  image_copied: () => ({
    title: 'Image Copied',
    description: 'The image has been copied to your clipboard.',
    color: 'success',
  }),
  signed_out: () => ({
    title: 'Signed Out',
    description: 'You have been signed out. See you next time!',
    color: 'success',
  }),
  pins_saved: () => ({
    title: 'Pins Updated',
    description: 'Your pinned items have been saved.',
    color: 'success',
  }),
  order_saved: () => ({
    title: 'Sort Order Saved',
    description: 'Items will now appear in the order you arranged.',
    color: 'success',
  }),
  feedback_sent: () => ({
    title: 'Feedback Sent',
    description:
      'Your feedback is valuable to us. Thanks for taking the time to share it!',
    color: 'success',
  }),
  submission_pending: () => ({
    title: 'Thanks for Your Contribution!',
    description:
      'Your submission is pending review and shows a Pending Review badge until it is approved.',
    color: 'success',
  }),
  color_fetched: (detail) => ({
    title: 'Color Data Loaded',
    description: `The name and hex value${detail ? ` for ${detail}` : ''} have been filled in from the source.`,
    color: 'success',
  }),
  already_in_collection: (detail) => ({
    title: 'Already in Collection',
    description: `This item is already in ${detail ? `"${detail}"` : 'your collection'}. You have great taste!`,
    color: 'info',
  }),
}

/** Fixed app events that are not record changes (clipboard, auth, etc.). */
export function noticeToast(key: NoticeKey, detail?: string): ToastMessage {
  return NOTICES[key](detail)
}

/**
 * A notification that arrived in realtime, from `renderNotification()`; links
 * to its target when it has one.
 */
export function notificationToast({
  title,
  description,
  icon,
  color,
  to,
  onView,
}: {
  title: string
  description: string
  icon: string
  color: ToastColor
  to?: string
  onView?: () => void
}) {
  return {
    title,
    description,
    icon,
    color,
    actions: to
      ? [
          {
            label: 'View',
            to,
            onClick: onView,
            color: 'neutral' as const,
            variant: 'outline' as const,
          },
        ]
      : undefined,
  }
}

/** A client-side check failed; the message is shown verbatim. */
export function validationToast(
  message?: string,
  title = 'Invalid Input',
): ToastMessage {
  return {
    title,
    description: message || 'Please check the form and try again.',
    color: 'warning',
  }
}

interface ErrorToastOptions {
  /** Show the server's `statusMessage` instead of the generic status copy. */
  showOriginalMessage?: boolean
}

/** Maps a caught error to a toast and logs it for debugging. */
export function errorToast(
  error: any,
  options: ErrorToastOptions = {},
): ToastMessage {
  const status = error?.status || error?.statusCode || error?.response?.status
  const statusMessage =
    error?.statusMessage ||
    error?.data?.statusMessage ||
    error?.response?.data?.statusMessage ||
    error?.message

  // Full details only in development; keep production logs non-sensitive.
  if (process.env.NODE_ENV === 'development') {
    console.error('[Internal Error]', {
      message: error?.message,
      status,
      data: error?.data || error?.response?.data,
      stack: error?.stack,
    })
  } else {
    console.error('[Internal Error]', { message: error?.message, status })
  }

  if (options.showOriginalMessage && statusMessage) {
    return {
      title: 'Request Failed',
      description: String(statusMessage),
      color: 'error',
    }
  }

  if (status === 401) {
    return {
      title: 'Session Expired',
      description: 'Your session has ended. Please sign in again to continue.',
      color: 'warning',
    }
  }

  if (status === 403) {
    return {
      title: 'Permission Denied',
      description:
        'You do not have permission to perform this action. Contact an admin if you think this is a mistake.',
      color: 'warning',
    }
  }

  if (status === 404) {
    return {
      title: 'Not Found',
      description:
        'The requested item could not be found. It may have been moved or deleted.',
      color: 'error',
    }
  }

  if (status === 429) {
    return {
      title: 'Too Many Requests',
      description:
        'You are doing that a bit too fast. Please wait a moment and try again.',
      color: 'warning',
    }
  }

  if (status >= 500) {
    return {
      title: 'Server Error',
      description:
        'Our systems are having trouble right now. Please try again later, and contact support if the problem persists.',
      color: 'error',
    }
  }

  return {
    title: 'Something Went Wrong',
    description:
      'An unexpected error occurred. Please try again, and contact support if the problem persists.',
    color: 'error',
  }
}
