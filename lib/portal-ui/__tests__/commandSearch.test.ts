import { describe, expect, it } from 'vitest'
import { filterCommandItems, type CommandSearchItem } from '../commandSearch'

describe('filterCommandItems', () => {
  const items: CommandSearchItem[] = [
    { id: '1', label: 'Home', href: '/dashboard', group: 'Overview' },
    {
      id: '2',
      label: 'Studies',
      href: '/studies',
      group: 'Research',
      keywords: 'ihut concept',
    },
    { id: '3', label: 'Products', href: '/products', group: 'Catalog' },
  ]

  it('returns all items when query is empty', () => {
    expect(filterCommandItems(items, '')).toHaveLength(3)
  })

  it('matches label', () => {
    expect(filterCommandItems(items, 'stud')).toEqual([items[1]])
  })

  it('matches keywords and group', () => {
    expect(filterCommandItems(items, 'ihut')).toEqual([items[1]])
    expect(filterCommandItems(items, 'catalog')).toEqual([items[2]])
  })
})
