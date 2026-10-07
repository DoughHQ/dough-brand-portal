export type CommandSearchItem = {
  id: string
  label: string
  href: string
  group: string
  keywords?: string
  /** Server study_drafts UUID — CommandPalette hydrates via openServerStudyDraft. */
  draftId?: string
}

export function filterCommandItems(
  items: CommandSearchItem[],
  query: string,
): CommandSearchItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter((item) => {
    const hay = `${item.label} ${item.group} ${item.keywords ?? ''} ${item.href}`.toLowerCase()
    return hay.includes(q)
  })
}
