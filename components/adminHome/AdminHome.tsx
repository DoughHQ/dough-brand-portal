import Link from 'next/link'
import { selectAdminHomeModel } from '@/lib/adminHome/selectAdminHomeModel'
import type { AdminAttentionRow, AdminHomeSnapshot } from '@/lib/adminHome/types'
import BrandJump from './BrandJump'
import './adminHome.css'

function Glyph({
  name,
}: {
  name:
    | 'alert'
    | 'ok'
    | 'lab'
    | 'corrections'
    | 'applications'
    | 'ownership'
    | 'boxes'
    | 'studies'
    | 'chevron'
    | 'impersonate'
    | 'readiness'
    | 'report'
    | 'groups'
}) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': true as const,
  }
  const stroke = {
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (name) {
    case 'alert':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" {...stroke} />
          <path d="M12 8v5" {...stroke} />
          <path d="M12 16.5h.01" {...stroke} />
        </svg>
      )
    case 'ok':
      return (
        <svg {...common}>
          <path d="M20 6L9 17l-5-5" {...stroke} />
        </svg>
      )
    case 'lab':
      return (
        <svg {...common}>
          <path d="M9 3h6M10 3v6.5L5.5 19a2.5 2.5 0 002.2 3.5h8.6a2.5 2.5 0 002.2-3.5L14 9.5V3" {...stroke} />
        </svg>
      )
    case 'corrections':
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h10" {...stroke} />
        </svg>
      )
    case 'applications':
      return (
        <svg {...common}>
          <path d="M8 7h8M8 12h8M8 17h5M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" {...stroke} />
        </svg>
      )
    case 'ownership':
      return (
        <svg {...common}>
          <path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z" {...stroke} />
        </svg>
      )
    case 'boxes':
      return (
        <svg {...common}>
          <path d="M3 8l9-5 9 5v9l-9 5-9-5V8z" {...stroke} />
          <path d="M12 13V3M3 8l9 5 9-5" {...stroke} />
        </svg>
      )
    case 'studies':
      return (
        <svg {...common}>
          <path d="M8 4h8v16H8zM10 8h4" {...stroke} />
        </svg>
      )
    case 'chevron':
      return (
        <svg {...common} width="14" height="14">
          <path d="M9 5l5 5-5 5" {...stroke} />
        </svg>
      )
    case 'impersonate':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" {...stroke} />
          <path d="M5 19c1.2-3 3.6-4.5 7-4.5S17.8 16 19 19" {...stroke} />
        </svg>
      )
    case 'readiness':
      return (
        <svg {...common}>
          <path d="M4 19V9l8-6 8 6v10H4z" {...stroke} />
        </svg>
      )
    case 'report':
      return (
        <svg {...common}>
          <path d="M7 4h8l4 4v12H7z" {...stroke} />
          <path d="M15 4v4h4M10 12h6M10 16h4" {...stroke} />
        </svg>
      )
    case 'groups':
      return (
        <svg {...common}>
          <circle cx="8" cy="9" r="2.4" {...stroke} />
          <circle cx="16" cy="9" r="2.4" {...stroke} />
          <path d="M4 18c.6-2.2 2.2-3.4 4-3.4s3.4 1.2 4 3.4M12 18c.6-2.2 2.2-3.4 4-3.4s3.4 1.2 4 3.4" {...stroke} />
        </svg>
      )
  }
}

function AttentionRow({ row }: { row: AdminAttentionRow }) {
  return (
    <Link
      href={row.href}
      className={`ah-row${row.tone === 'stale' ? ' is-stale' : ''}`}
    >
      <span className="ah-row-icon">
        <Glyph name={row.key} />
      </span>
      <span className="ah-row-copy">
        <span className="ah-row-label">{row.label}</span>
        <span className="ah-row-detail">{row.detail}</span>
        {row.nextLabel ? <span className="ah-row-next">Next: {row.nextLabel}</span> : null}
      </span>
      <span className="ah-row-count">{row.count.toLocaleString()}</span>
      <span className="ah-row-chevron" aria-hidden>
        <Glyph name="chevron" />
      </span>
    </Link>
  )
}

export default function AdminHome({ snapshot }: { snapshot: AdminHomeSnapshot }) {
  const model = selectAdminHomeModel(snapshot)
  const highlight = model.research.highlight

  return (
    <div className={`ah-page${model.caughtUp ? ' is-calm' : ''}`}>
      <header className="ah-top">
        <div>
          <div className="ah-greet">{model.greeting}</div>
          <h1 className="ah-title">Platform home</h1>
          <p className="ah-lede">
            {model.caughtUp
              ? 'Queues are clear. Watch the pulse, then jump into a brand or a study.'
              : `${model.attentionTotal.toLocaleString()} item${model.attentionTotal === 1 ? '' : 's'} need you — oldest work is on top.`}
          </p>
        </div>
        <div className="ah-top-actions">
          <BrandJump />
          <Link href={model.research.newHref} className="ah-new-study">
            <span aria-hidden>+</span> New study
          </Link>
        </div>
        <div className="ah-art" aria-hidden>
          <svg viewBox="0 0 120 80" fill="none">
            <path
              d="M22 62c8-22 22-34 38-38 6 14-2 28-14 36-10 6-18 6-24 2z"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M70 18c12 4 26 18 30 34-16 2-28-6-34-18-4-8-4-14 4-16z"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path d="M48 70c10-16 8-32-2-44" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </div>
      </header>

      <section className="ah-pulse" aria-label="Platform pulse">
        <div className="ah-pulse-head">
          <div className="ah-pulse-kicker">
            Platform pulse
            <span>Consumer activity and brand coverage.</span>
          </div>
          <div className="ah-live">
            <span className="ah-live-dot" />
            Live data
          </div>
        </div>
        <div className="ah-pulse-grid">
          {model.pulse.map((cell) => {
            const className = `ah-pulse-cell${cell.href ? ' is-link' : ''}${cell.warn ? ' is-warn' : ''}`
            const inner = (
              <>
                <div className="ah-pulse-label">{cell.label}</div>
                <div className="ah-pulse-value">{cell.value}</div>
                <div className="ah-pulse-sub">{cell.sub}</div>
              </>
            )
            return cell.href ? (
              <Link key={cell.key} href={cell.href} className={className}>
                {inner}
              </Link>
            ) : (
              <div key={cell.key} className={className}>
                {inner}
              </div>
            )
          })}
        </div>
      </section>

      <Link href="/admin/categories" prefetch={false} className="ah-coverage">
        <div className="ah-coverage-main">
          <div className="ah-coverage-label">Category coverage</div>
          <div className="ah-pills">
            <span className="ah-pill">Distinct raters by L2</span>
          </div>
        </div>
        <div className="ah-coverage-next">Open readiness →</div>
      </Link>

      <div className="ah-grid">
        <section className={`ah-card${model.attention.some((r) => r.tone === 'stale') ? ' is-hot' : ''}`}>
          <div className="ah-card-head">
            <div className="ah-card-title">
              <span className={`ah-mark ${model.caughtUp ? 'is-ok' : 'is-alert'}`}>
                <Glyph name={model.caughtUp ? 'ok' : 'alert'} />
              </span>
              Needs attention
              <span>
                {model.caughtUp ? 'Nothing in queue' : `${model.attentionTotal.toLocaleString()} open`}
              </span>
            </div>
          </div>
          {model.caughtUp ? (
            <div className="ah-empty">
              <p>Corrections, applications, ownership, and box fulfillment are clear. This is the win.</p>
            </div>
          ) : (
            <div className="ah-rows">
              {model.attention.map((row) => (
                <AttentionRow key={row.key} row={row} />
              ))}
            </div>
          )}
        </section>

        <section className="ah-card">
          <div className="ah-card-head">
            <div className="ah-card-title">
              <span className="ah-mark is-lab">
                <Glyph name="lab" />
              </span>
              Research
              <span>
                {model.research.liveCount > 0
                  ? `${model.research.liveCount} live`
                  : 'Create and manage studies'}
              </span>
            </div>
            <Link href={model.research.studiesHref} style={{ fontSize: 13, color: 'var(--sage)', fontWeight: 500 }}>
              View all →
            </Link>
          </div>
          <div className="ah-launch">
            <div className="ah-launch-kicker">Launch a study</div>
            <h2>Concept tests and iHUT</h2>
            <p>Pick a type and go — this stays a shortcut, not the job of the home.</p>
            <Link href={model.research.newHref} className="ah-launch-btn">
              <span aria-hidden>+</span> New study
            </Link>
          </div>
          {highlight ? (
            <Link
              href={highlight.href}
              className={`ah-study${highlight.kind === 'stuck' ? ' is-stuck' : ''}`}
            >
              <span className="ah-row-icon">
                <Glyph name="studies" />
              </span>
              <span className="ah-row-copy">
                <span className="ah-row-label">{highlight.title}</span>
                <span className="ah-row-detail">{highlight.detail}</span>
              </span>
              <span className="ah-row-chevron" aria-hidden>
                <Glyph name="chevron" />
              </span>
            </Link>
          ) : (
            <Link href={model.research.studiesHref} className="ah-study">
              <span className="ah-row-icon">
                <Glyph name="studies" />
              </span>
              <span className="ah-row-copy">
                <span className="ah-row-label">Studies</span>
                <span className="ah-row-detail">Active research and reports</span>
              </span>
              <span className="ah-row-chevron" aria-hidden>
                <Glyph name="chevron" />
              </span>
            </Link>
          )}
        </section>
      </div>

      <section className="ah-tools" aria-label="Tools">
        <div className="ah-tools-label">
          Tools <span>Utilities that don’t belong in the queue.</span>
        </div>
        <div className="ah-tools-grid">
          {[
            { href: '/admin/impersonate', label: 'Impersonate a brand', icon: 'impersonate' as const, prefetch: false },
            { href: '/admin/categories', label: 'Category readiness', icon: 'readiness' as const, prefetch: false },
            { href: '/admin/report-preview', label: 'Report preview', icon: 'report' as const, prefetch: false },
            { href: '/admin/compare-groups', label: 'Compare Groups', icon: 'groups' as const, prefetch: false },
          ].map((tool) => (
            <Link key={tool.href} href={tool.href} prefetch={tool.prefetch} className="ah-tool">
              <span className="ah-tool-main">
                <span className="ah-row-icon" style={{ width: 32, height: 32 }}>
                  <Glyph name={tool.icon} />
                </span>
                <span className="ah-tool-copy">{tool.label}</span>
              </span>
              <span className="ah-row-chevron" aria-hidden>
                <Glyph name="chevron" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
