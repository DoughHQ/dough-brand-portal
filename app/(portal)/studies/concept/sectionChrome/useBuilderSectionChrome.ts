'use client'

import { useEffect, useState } from 'react'

export function useBuilderSectionChrome(id: string, done: boolean) {
  const [open, setOpen] = useState(!done)

  useEffect(() => {
    setOpen(!done)
  }, [done])

  useEffect(() => {
    const root = document.getElementById(id)
    if (!root) return
    function onExpand() {
      setOpen(true)
    }
    root.addEventListener('cb-expand-section', onExpand)
    return () => root.removeEventListener('cb-expand-section', onExpand)
  }, [id])

  return { open, setOpen }
}
