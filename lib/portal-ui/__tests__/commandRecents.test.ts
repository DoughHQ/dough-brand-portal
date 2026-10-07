import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  commandRecentsAsItems,
  listCommandRecents,
  pushCommandRecent,
  recordPathVisit,
} from '../commandRecents'

describe('commandRecents', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    const localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v)
      },
      removeItem: (k: string) => {
        store.delete(k)
      },
    }
    vi.stubGlobal('localStorage', localStorage)
    vi.stubGlobal('window', { localStorage })
  })

  it('pushes and dedupes by href', () => {
    pushCommandRecent({
      id: 'a',
      label: 'Studies',
      href: '/studies',
      group: 'Research',
    })
    pushCommandRecent({
      id: 'b',
      label: 'Studies again',
      href: '/studies',
      group: 'Research',
    })
    const list = listCommandRecents()
    expect(list).toHaveLength(1)
    expect(list[0]?.label).toBe('Studies again')
  })

  it('exposes Recent group for empty palette', () => {
    pushCommandRecent({
      id: 'p1',
      label: 'Garlic sauce',
      href: '/products/1',
      group: 'Products',
    })
    expect(commandRecentsAsItems()[0]?.group).toBe('Recent')
  })

  it('recordPathVisit skips login', () => {
    recordPathVisit({ pathname: '/login', label: 'Login' })
    expect(listCommandRecents()).toHaveLength(0)
    recordPathVisit({ pathname: '/categories/42', label: 'Snacks' })
    expect(listCommandRecents()[0]?.href).toBe('/categories/42')
  })
})
