import type { ProductResult } from './adminProductModel'
import type { useAdminProducts } from './useAdminProducts'

type Desk = ReturnType<typeof useAdminProducts>

export function AdminProductsSearch({
  searchQuery,
  searchResults,
  searching,
  productIdJump,
  setProductIdJump,
  handleSearch,
  openById,
  router,
  enterAsBrand,
  entering,
}: Pick<
  Desk,
  | 'searchQuery'
  | 'searchResults'
  | 'searching'
  | 'productIdJump'
  | 'setProductIdJump'
  | 'handleSearch'
  | 'openById'
  | 'router'
  | 'enterAsBrand'
  | 'entering'
> & { searchResults: ProductResult[] }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{ fontSize: 13, color: 'var(--ink-50)', marginBottom: 12, lineHeight: 1.45 }}>
        Search a product name or brand, open a milestone below, or jump by product ID.
        Row click opens the master product page.
      </p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search products or brands..."
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--ink-10)',
            background: 'var(--paper)',
            fontSize: 14,
            color: 'var(--ink)',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--ink-30)'}
          onBlur={e => e.target.style.borderColor = 'var(--ink-10)'}
        />
        <form
          onSubmit={e => {
            e.preventDefault()
            openById()
          }}
          style={{ display: 'flex', gap: 6, flexShrink: 0 }}
        >
          <input
            type="text"
            inputMode="numeric"
            value={productIdJump}
            onChange={e => setProductIdJump(e.target.value)}
            placeholder="Product ID"
            style={{
              width: 120,
              padding: '12px 12px',
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--ink-10)',
              background: 'var(--paper)',
              fontSize: 14,
              color: 'var(--ink)',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0 14px',
              borderRadius: 'var(--r-sm)',
              border: 'none',
              background: 'var(--sage)',
              color: 'white',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Open
          </button>
        </form>
      </div>

      {/* Search results */}
      {(searchResults.length > 0 || searching) && (
        <div style={{
          marginTop: 8,
          background: 'var(--paper)',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-md)',
          overflow: 'hidden',
        }}>
          {searching && (
            <div style={{ padding: '14px 20px', fontSize: 12, color: 'var(--ink-30)' }}>Searching...</div>
          )}
          {searchResults.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 160px 100px 80px 90px 90px 72px',
              padding: '8px 20px',
              background: 'var(--surface-1)',
              borderBottom: '1px solid var(--ink-10)',
            }}>
              {['Product', 'Brand', 'Category', 'Battles', 'Win rate', 'ELO', ''].map(h => (
                <div key={h || 'open'} style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-30)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h === 'Product' || h === 'Brand' || h === '' ? 'left' : 'right' }}>
                  {h}
                </div>
              ))}
            </div>
          )}
          {searchResults.map((product, i) => (
            <div
              key={product.product_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 160px 100px 80px 90px 90px 72px',
                padding: '12px 20px',
                borderBottom: i < searchResults.length - 1 ? '1px solid var(--ink-10)' : 'none',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => router.push(`/products/${product.product_id}`)}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {product.product_name_clean}
                </div>
                {product.milestone !== 'no battles' && (
                  <div style={{ fontSize: 10, color: 'var(--sage)', marginTop: 2, fontWeight: 500 }}>
                    {product.milestone}
                  </div>
                )}
              </div>
              <div
                style={{ fontSize: 12, color: 'var(--ink-50)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: entering ? 'default' : 'pointer' }}
                onClick={e => {
                  e.stopPropagation()
                  if (!entering) void enterAsBrand(product.brand_id, '/dashboard')
                }}
              >
                {product.brand_name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-30)', textAlign: 'right' }}>
                {product.l3_name ?? product.l2_name ?? '—'}
              </div>
              <div style={{ fontSize: 13, fontWeight: product.battles_total > 0 ? 500 : 400, color: product.battles_total > 0 ? 'var(--ink)' : 'var(--ink-30)', textAlign: 'right' }}>
                {product.battles_total > 0 ? product.battles_total : '—'}
              </div>
              <div style={{ fontSize: 13, color: product.win_rate_pct != null ? 'var(--ink)' : 'var(--ink-30)', textAlign: 'right' }}>
                {product.win_rate_pct != null ? `${product.win_rate_pct}%` : '—'}
              </div>
              <div style={{ fontSize: 13, fontFamily: 'var(--font-serif)', color: product.elo_score ? 'var(--ink)' : 'var(--ink-30)', textAlign: 'right' }}>
                {product.elo_score ? Math.round(Number(product.elo_score)) : '—'}
              </div>
              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    router.push(`/products/${product.product_id}`)
                  }}
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--sage)',
                    background: 'var(--sage-pale)',
                    border: '1px solid rgba(62,107,74,0.2)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-30)' }}>
          No products matched “{searchQuery}”. Try a product ID on the right.
        </div>
      )}
    </div>
  )
}
