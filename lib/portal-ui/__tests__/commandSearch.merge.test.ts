import { describe, expect, it } from 'vitest'
import { filterCommandItems, type CommandSearchItem } from '../commandSearch'

describe('command search merge preference', () => {
  it('keeps nav pages discoverable alongside entity hits', () => {
    const nav: CommandSearchItem[] = [
      { id: 'nav-studies', label: 'Studies', href: '/studies', group: 'Research' },
      { id: 'nav-home', label: 'Home', href: '/dashboard', group: 'Overview' },
    ]
    const remote: CommandSearchItem[] = [
      {
        id: 'study-1',
        label: 'Garlic IHUT',
        href: '/studies/concept/1',
        group: 'Studies',
      },
    ]
    const filteredNav = filterCommandItems(nav, 'stud')
    const merged = [...remote, ...filteredNav]
    expect(merged.map((i) => i.id)).toEqual(['study-1', 'nav-studies'])
  })
})
