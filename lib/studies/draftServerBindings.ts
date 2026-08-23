/**
 * Maps local wizard draftId (edit URL / localStorage key) → study_drafts.id.
 * Survives remounts when /new → /edit without treating localStorage as SoT
 * for draft_json.
 */

const KEY = 'dough.studyDraftServerIds.v1'

type BindingMap = Record<string, string>

function readMap(): BindingMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as BindingMap
    }
    return {}
  } catch {
    return {}
  }
}

function writeMap(map: BindingMap): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    // Quota failures must never crash the builder.
  }
}

export function getBoundServerDraftId(localDraftId: string): string | null {
  const id = readMap()[localDraftId]
  return typeof id === 'string' && id.length > 0 ? id : null
}

export function bindServerDraftId(localDraftId: string, serverDraftId: string): void {
  if (!localDraftId || !serverDraftId) return
  const map = readMap()
  map[localDraftId] = serverDraftId
  writeMap(map)
}

export function unbindServerDraftId(localDraftId: string): void {
  const map = readMap()
  if (!(localDraftId in map)) return
  delete map[localDraftId]
  writeMap(map)
}

/** Clear any local↔server bindings pointing at this server draft id. */
export function unbindByServerDraftId(serverDraftId: string): void {
  if (!serverDraftId) return
  const map = readMap()
  let changed = false
  for (const [localId, bound] of Object.entries(map)) {
    if (bound === serverDraftId) {
      delete map[localId]
      changed = true
    }
  }
  if (changed) writeMap(map)
}
