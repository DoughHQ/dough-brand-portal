/** Dismissible portal rename notice after Train B. Prefix stays `dough.`. */
export const RENAME_NOTICE_STORAGE_KEY = 'dough.renameNotice.v1'

const DISMISSED = 'dismissed'

export const RENAME_NOTICE_BODY =
  'Dough is now Runoff. Your workspace URL and login are unchanged.'

export const RENAME_NOTICE_DISMISS_LABEL = 'Got it'

export function renameNoticeVisibleFromStored(
  raw: string | null | undefined
): boolean {
  return raw !== DISMISSED
}

export function readRenameNoticeVisible(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return renameNoticeVisibleFromStored(
      window.localStorage.getItem(RENAME_NOTICE_STORAGE_KEY)
    )
  } catch {
    return true
  }
}

export function dismissRenameNotice(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(RENAME_NOTICE_STORAGE_KEY, DISMISSED)
  } catch {
    // ignore quota / private mode
  }
}
