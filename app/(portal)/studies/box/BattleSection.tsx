'use client'

import { useEffect, useRef, useState } from 'react'
import type { BoxStudyDraft } from '@/lib/box/types'
import {
  BOX_BATTLE_QUESTION_FOOTER,
  BOX_BATTLE_QUESTION_INTRO,
  BOX_BATTLE_QUESTION_POINTS,
  BOX_BATTLE_QUESTION_TITLE,
  BOX_DEFAULT_BATTLE_QUESTION,
} from '@/lib/box/constants'
import { BOX_ANCHORS } from '@/lib/box/validity'

type Props = {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
}

export default function BattleSection({ draft, onChange }: Props) {
  return (
    <section id={BOX_ANCHORS.battle} style={card}>
      <div style={eyebrow}>Section 2 · The battle</div>
      <h2 className="cb-section-title" style={titleStyle}>
        The battle
      </h2>
      <p style={helpStyle}>
        The forced-choice prompt respondents see when they compare two products
        in the box. This is what the ranking is built on.
      </p>

      <div style={{ maxWidth: 560 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <label htmlFor={`${BOX_ANCHORS.battle}-input`} style={{ ...labelSm, marginBottom: 0 }}>
            Battle question (optional)
          </label>
          <BattleQuestionInfoButton />
        </div>
        <input
          id={`${BOX_ANCHORS.battle}-input`}
          className="cb-input"
          value={draft.battleQuestion}
          onChange={(ev) => onChange({ ...draft, battleQuestion: ev.target.value })}
          placeholder={BOX_DEFAULT_BATTLE_QUESTION}
          style={inputBase}
        />
        <p style={{ ...subHelp, marginTop: 6 }}>
          Leave blank to use the default: &lsquo;{BOX_DEFAULT_BATTLE_QUESTION}&rsquo;
        </p>
      </div>
    </section>
  )
}

function BattleQuestionInfoButton() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(ev: MouseEvent) {
      if (!rootRef.current?.contains(ev.target as Node)) setOpen(false)
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        aria-label="Writing a good battle question"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '1px solid var(--ink-10)',
          background: open ? 'var(--sage-soft)' : 'var(--white)',
          color: 'var(--ink-50)',
          cursor: 'pointer',
          fontFamily: 'var(--font-serif)',
          fontSize: 13,
          fontStyle: 'italic',
          fontWeight: 600,
          lineHeight: 1,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        i
      </button>
      {open ? (
        <div
          role="dialog"
          aria-labelledby="box-battle-q-title"
          style={{
            position: 'absolute',
            zIndex: 20,
            left: 0,
            top: '100%',
            marginTop: 8,
            width: 360,
            maxWidth: 'min(360px, 80vw)',
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--cb-shadow-popover)',
            padding: '14px 16px',
          }}
        >
          <div
            id="box-battle-q-title"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--ink-80)',
              marginBottom: 8,
            }}
          >
            {BOX_BATTLE_QUESTION_TITLE}
          </div>
          <p style={popoverP}>{BOX_BATTLE_QUESTION_INTRO}</p>
          <ul
            style={{
              margin: '0 0 10px',
              paddingLeft: 18,
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              lineHeight: 1.5,
              color: 'var(--ink-80)',
            }}
          >
            {BOX_BATTLE_QUESTION_POINTS.map((pt) => (
              <li key={pt.title} style={{ marginBottom: 8 }}>
                <strong>{pt.title}</strong> {pt.body}
              </li>
            ))}
          </ul>
          <p style={{ ...popoverP, margin: 0 }}>{BOX_BATTLE_QUESTION_FOOTER}</p>
        </div>
      ) : null}
    </div>
  )
}

const card = {
  background: 'var(--white)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-lg)',
  padding: 32,
  marginBottom: 24,
  boxShadow: 'var(--cb-shadow-card)',
}
const eyebrow = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: 'var(--ink-50)',
  marginBottom: 8,
}
const titleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: 26,
  fontWeight: 400,
  letterSpacing: '-0.02em',
  margin: '0 0 8px',
  color: 'var(--ink-80)',
}
const helpStyle = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink-50)',
  margin: '0 0 24px',
  lineHeight: 1.45,
  maxWidth: 640,
}
const labelSm = {
  display: 'block' as const,
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 8,
}
const inputBase = {
  width: '100%',
  boxSizing: 'border-box' as const,
  height: 48,
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-sm)',
  padding: '0 16px',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink)',
  background: 'var(--white)',
  outline: 'none',
}
const subHelp = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  color: 'var(--ink-50)',
  margin: 0,
  lineHeight: 1.4,
}
const popoverP = {
  margin: '0 0 10px',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  lineHeight: 1.5,
  color: 'var(--ink-80)',
}
