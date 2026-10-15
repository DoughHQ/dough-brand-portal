import type { useCategoryIntelligence } from './useCategoryIntelligence'

type Intel = ReturnType<typeof useCategoryIntelligence>

export function CategoryIntelHeader({
  l2Name,
  scopeNote,
  loadError,
  router,
}: {
  l2Name: string
  scopeNote?: string | null
  loadError?: string | null
  router: Intel['router']
}) {
  return (
    <>
      <div
        onClick={() => router.push('/products')}
        style={{ fontSize: 12, color: 'var(--ink-50)', marginBottom: 28, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        ← Products
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Category intelligence
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 400, color: 'var(--ink)', marginBottom: 4 }}>
          {l2Name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-30)' }}>
          Ranked by declared consumer preference · Click a product for the master page
        </div>
        {scopeNote && (
          <div style={{ fontSize: 12, color: 'var(--amber)', marginTop: 8 }}>{scopeNote}</div>
        )}
        {loadError && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--clay, #a6543c)',
              marginTop: 8,
              padding: '10px 12px',
              background: 'var(--surface)',
              borderRadius: 8,
              border: '1px solid var(--ink-10)',
            }}
          >
            Couldn’t load rankings: {loadError}
          </div>
        )}
      </div>
    </>
  )
}
