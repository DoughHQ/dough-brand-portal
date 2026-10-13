'use client'

import {
  RENAME_NOTICE_BODY,
  RENAME_NOTICE_DISMISS_LABEL,
} from '@/lib/renameNotice'

type Props = {
  onDismiss: () => void
}

/** Slim chrome strip for brand tenants after the Dough → Runoff rename. */
export default function RenameNoticeBanner({ onDismiss }: Props) {
  return (
    <div className="portal-rename-notice" role="status">
      <p className="portal-rename-notice-body">{RENAME_NOTICE_BODY}</p>
      <button
        type="button"
        className="portal-rename-notice-dismiss"
        onClick={onDismiss}
      >
        {RENAME_NOTICE_DISMISS_LABEL}
      </button>
    </div>
  )
}
