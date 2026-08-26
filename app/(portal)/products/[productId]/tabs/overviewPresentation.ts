/** Visual-only split of `category_path`. Does not change stored values. */
export function splitCategoryPath(path: string | null | undefined): string[] {
  if (!path) return []
  const trimmed = path.trim()
  if (!trimmed) return []
  return trimmed
    .split(/\s*(?:>|›)\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
}
