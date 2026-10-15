import { type ReactNode } from 'react'
import { type CategoryLauncherRow } from '@/lib/categoryLauncher'
import { n } from './launcherModel'

export function StatusChip({ status }: { status: 'live' | 'building' | 'empty' }) {
  const label =
    status === 'live' ? 'Live dashboard' : status === 'building' ? 'Building signal' : 'No battles yet'
  return (
    <span className={`cat-chip cat-chip-${status}`}>
      <span className="cat-chip-dot" aria-hidden />
      {label}
    </span>
  )
}

export function MetricCells({
  row,
  size,
}: {
  row: CategoryLauncherRow
  size: 'lg' | 'sm'
}) {
  const items = [
    { value: row.total_products, label: 'Products' },
    { value: row.products_with_battles, label: 'Products with battles' },
    { value: row.total_battles, label: size === 'lg' ? 'Total battles' : 'Battles' },
  ]
  return (
    <div className={`cat-metrics${size === 'sm' ? ' cat-metrics-sm' : ''}`}>
      {items.map((item) => (
        <div key={item.label} className="cat-metric">
          <div className={`cat-metric-n ${size === 'lg' ? 'cat-metric-n-lg' : 'cat-metric-n-sm'}`}>
            {n(item.value)}
          </div>
          <div className="cat-metric-label">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

export function SectionHead({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="cat-section-head">
      <h2 className="cat-section-title">{title}</h2>
      {typeof sub === 'string' ? <p className="cat-section-sub">{sub}</p> : sub}
    </div>
  )
}

export function SageGlyph({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
