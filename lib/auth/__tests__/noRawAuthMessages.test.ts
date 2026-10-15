import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(import.meta.dirname, '../../..')
const SCAN_DIRS = ['app', 'components']

/** Explicit allowlist entries: `relative/path:line` — start empty. */
const ALLOWLIST = new Set<string>()

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '__tests__') {
      continue
    }
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.test.tsx')) {
      out.push(full)
    }
  }
  return out
}

function importsSupabase(source: string): boolean {
  // Brief: files that import from `@supabase/` (the package), not `@/lib/supabase`.
  return /from\s+['"]@supabase\//.test(source)
}

describe('no raw Supabase auth messages in UI', () => {
  it('fails on setError(...*.message) / error: *.message in supabase-touching files', () => {
    const hits: string[] = []

    for (const dir of SCAN_DIRS) {
      const abs = path.join(ROOT, dir)
      if (!fs.existsSync(abs)) continue
      for (const file of walk(abs)) {
        const source = fs.readFileSync(file, 'utf8')
        if (!importsSupabase(source)) continue
        const rel = path.relative(ROOT, file)
        const lines = source.split('\n')
        lines.forEach((line, i) => {
          const n = i + 1
          const key = `${rel}:${n}`
          if (ALLOWLIST.has(key)) return
          if (/setError\s*\([^)]*\.message/.test(line)) {
            hits.push(`${key}: setError(...*.message)`)
          }
          if (/\berror\s*:\s*[^,\n]*\.message/.test(line)) {
            hits.push(`${key}: error: *.message`)
          }
        })
      }
    }

    expect(hits, hits.join('\n')).toEqual([])
  })
})
