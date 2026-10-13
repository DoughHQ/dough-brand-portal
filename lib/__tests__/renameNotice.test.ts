import { describe, expect, it } from 'vitest'
import {
  RENAME_NOTICE_BODY,
  RENAME_NOTICE_STORAGE_KEY,
  renameNoticeVisibleFromStored,
} from '@/lib/renameNotice'
import { PRODUCT_NAME } from '@/lib/brand'

describe('renameNotice', () => {
  it('keeps a stable dough. storage key', () => {
    expect(RENAME_NOTICE_STORAGE_KEY).toBe('dough.renameNotice.v1')
  })

  it('is visible until dismissed', () => {
    expect(renameNoticeVisibleFromStored(null)).toBe(true)
    expect(renameNoticeVisibleFromStored(undefined)).toBe(true)
    expect(renameNoticeVisibleFromStored('')).toBe(true)
    expect(renameNoticeVisibleFromStored('dismissed')).toBe(false)
  })

  it('names Runoff in the notice body', () => {
    expect(RENAME_NOTICE_BODY).toContain(PRODUCT_NAME)
  })
})
