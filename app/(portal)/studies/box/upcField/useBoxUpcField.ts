'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { BoxFieldRow } from '@/lib/box/types'
import { barcodeDigits, looksLikeBarcode } from '@/lib/concept/barcodes'

const IDENTIFY = 'Identify the barcode on this package.'

export function useBoxUpcField(
  row: BoxFieldRow,
  onSelectUpc: (upc: string) => void,
  error?: string | null,
) {
  const options = row.barcodeOptions ?? []
  const needsChoice = options.length > 1
  const [manual, setManual] = useState(row.upc ?? '')
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmed = !!row.upc?.trim() && !needsChoice && !editing
  const digits = barcodeDigits(manual)
  const canSave = looksLikeBarcode(digits)
  const inputId = `box-upc-manual-${row.localId}`
  const showDuplicateIdentify = error === IDENTIFY && !row.upc && !needsChoice

  useEffect(() => {
    setManual(row.upc ?? '')
    setEditing(false)
  }, [row.upc, row.localId])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function commitManual() {
    const next = barcodeDigits(manual)
    if (!looksLikeBarcode(next)) return
    onSelectUpc(next)
    setEditing(false)
  }

  function onManualKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitManual()
    }
    if (e.key === 'Escape' && editing && row.upc) {
      e.preventDefault()
      setEditing(false)
      setManual(row.upc)
    }
  }

  return {
    options,
    needsChoice,
    manual,
    setManual,
    editing,
    setEditing,
    inputRef,
    confirmed,
    digits,
    canSave,
    inputId,
    showDuplicateIdentify,
    commitManual,
    onManualKeyDown,
  }
}
