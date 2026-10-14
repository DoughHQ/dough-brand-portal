import type { Ref } from 'react'

export type PublishingDockNeed = {
  message: string
  anchor: string | null
}

type Props = {
  ready: boolean
  needs: PublishingDockNeed[]
  holdLabel?: string
  readyFacts: string | null
  listOpen: boolean
  panelId: string
  statusRef: Ref<HTMLDivElement>
  onToggleList: () => void
  onGoTo: (anchor: string | null) => void
}

export default function PublishingDockStatus({
  ready,
  needs,
  holdLabel,
  readyFacts,
  listOpen,
  panelId,
  statusRef,
  onToggleList,
  onGoTo,
}: Props) {
  const next = needs[0] ?? null
  const count = needs.length
  const statusTone = holdLabel || ready ? 'ok' : 'warn'
  const statusLabel =
    holdLabel ??
    (ready
      ? readyFacts?.trim() || 'Ready to publish'
      : count === 1
        ? '1 left'
        : `${count} left`)

  return (
    <div className="cb-dock-status" ref={statusRef}>
      <button
        type="button"
        className="cb-dock-status-btn"
        data-tone={statusTone}
        aria-expanded={listOpen}
        aria-controls={count > 0 ? panelId : undefined}
        disabled={count === 0 || !!holdLabel}
        onClick={() => {
          if (count === 0) return
          onToggleList()
        }}
      >
        <span className="cb-dock-status-icon" data-tone={statusTone} aria-hidden>
          {holdLabel || ready ? '✓' : '!'}
        </span>
        <span className="cb-dock-status-label">{statusLabel}</span>
        {count > 0 && !holdLabel ? (
          <span className="cb-dock-status-chevron" aria-hidden>
            {listOpen ? '▴' : '▾'}
          </span>
        ) : null}
      </button>

      {!holdLabel && !ready && next ? (
        <button
          type="button"
          className="cb-dock-next"
          title={next.message}
          onClick={() => onGoTo(next.anchor)}
        >
          <span className="cb-dock-next-dot" aria-hidden />
          <span className="cb-dock-next-text">{next.message}</span>
        </button>
      ) : null}

      {listOpen && count > 0 ? (
        <div className="cb-dock-panel" id={panelId} role="listbox" aria-label="Still needed">
          <ul className="cb-dock-panel-list">
            {needs.map((item) => (
              <li key={item.message}>
                <button
                  type="button"
                  className="cb-dock-panel-item"
                  role="option"
                  aria-selected={false}
                  onClick={() => onGoTo(item.anchor)}
                >
                  <span className="cb-dock-next-dot" aria-hidden />
                  {item.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
