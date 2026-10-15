import type { Dispatch, SetStateAction } from 'react'
import type { FilterKey, Product } from './l3Model'

export function L3InsightCards({
  products,
  filter,
  setFilter,
  reachOut,
  overrated,
  meaningful,
}: {
  products: Product[]
  filter: FilterKey
  setFilter: Dispatch<SetStateAction<FilterKey>>
  reachOut: Product[]
  overrated: Product[]
  meaningful: Product[]
}) {
  return (
    <div style={{
      background: 'var(--paper)',
      border: '1px solid var(--ink-10)',
      borderRadius: 'var(--r-lg)',
      padding: '20px 24px',
      marginBottom: 24,
    }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 16 }}>
        Insights
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>

        {reachOut.length > 0 && (
          <div
            onClick={() => setFilter(filter === 'reach_out' ? 'all' : 'reach_out')}
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--r-md)',
              background: filter === 'reach_out' ? 'var(--sage-pale)' : 'var(--surface-1)',
              border: `1px solid ${filter === 'reach_out' ? 'rgba(74,124,89,0.3)' : 'var(--ink-10)'}`,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Reach out now · {reachOut.length}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
              {reachOut.map(p => p.brand_name).join(', ')} {reachOut.length === 1 ? 'has' : 'have'} meaningful battle data
              but no portal access.
            </div>
          </div>
        )}

        {overrated.length > 0 && (
          <div
            onClick={() => setFilter(filter === 'overrated' ? 'all' : 'overrated')}
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--r-md)',
              background: filter === 'overrated' ? '#FAEEDA' : 'var(--surface-1)',
              border: `1px solid ${filter === 'overrated' ? 'rgba(186,117,23,0.3)' : 'var(--ink-10)'}`,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 500, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Overrated · {overrated.length}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
              {overrated.length} product{overrated.length !== 1 ? 's' : ''} with high ELO but fewer
              than 5 battles. Sample too small to trust.
            </div>
          </div>
        )}

        <div
          onClick={() => setFilter(filter === 'meaningful' ? 'all' : 'meaningful')}
          style={{
            padding: '14px 16px',
            borderRadius: 'var(--r-md)',
            background: filter === 'meaningful' ? '#EEEDFE' : 'var(--surface-1)',
            border: `1px solid ${filter === 'meaningful' ? 'rgba(83,58,183,0.3)' : 'var(--ink-10)'}`,
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 500, color: '#533AB7', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Statistically meaningful · {meaningful.length}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
            {meaningful.length} product{meaningful.length !== 1 ? 's' : ''} with 10+ battles.
            ELO rankings are reliable for these.
          </div>
        </div>

        {products.length > meaningful.length && (
          <div style={{
            padding: '14px 16px',
            borderRadius: 'var(--r-md)',
            background: 'var(--surface-1)',
            border: '1px solid var(--ink-10)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-30)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Need more data · {products.length - meaningful.length}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.5 }}>
              {products.length - meaningful.length} product{products.length - meaningful.length !== 1 ? 's' : ''} with
              fewer than 10 battles. Rankings will shift as data builds.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
