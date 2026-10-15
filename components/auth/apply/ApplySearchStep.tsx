import { PRODUCT_NAME } from '@/lib/brand'
import { formatProducts, type Props } from './applyModel'
import type { ApplyBrandFlowState } from './useApplyBrandFlow'

export function ApplySearchStep({
  error,
  onGoToLogin,
  styles,
  query,
  setQuery,
  searching,
  hits,
  selectBrand,
  searchTried,
  chooseNetNew,
}: Pick<Props, 'error' | 'onGoToLogin' | 'styles'> & Pick<ApplyBrandFlowState, 'query' | 'setQuery' | 'searching' | 'hits' | 'selectBrand' | 'searchTried' | 'chooseNetNew'>) {
  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 28,
            fontWeight: 400,
            color: 'var(--ink)',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          What’s your brand?
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.5 }}>
          {`${PRODUCT_NAME} is where shoppers compare real products — find your brand and apply.`}
        </div>
      </div>

      <input
        type="search"
        className="auth-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type your brand name"
        aria-label="Brand name"
        autoFocus
        style={styles.inputStyle}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--sage)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(28, 38, 32, 0.14)'
          e.target.style.boxShadow = 'none'
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
        {searching ? (
          <div style={{ fontSize: 13, color: 'var(--ink-50)' }}>Searching…</div>
        ) : null}

        {error ? (
          <div style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>{error}</div>
        ) : null}

        {hits.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {hits.map((hit) => (
              <button
                key={hit.brand_id}
                type="button"
                className="auth-hit"
                onClick={() => selectBrand(hit)}
              >
                <span className="auth-hit__name">{hit.brand_name}</span>
                <span className="auth-hit__count">
                  {formatProducts(hit.product_count)}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {!searching && searchTried && query.trim().length >= 2 && hits.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.5 }}>
            No brands matched — try another spelling, or say you don’t see your brand.
          </div>
        ) : null}

        <button
          type="button"
          onClick={chooseNetNew}
          style={{
            fontSize: 13,
            color: 'var(--sage)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            textAlign: 'left',
            padding: 0,
            marginTop: hits.length > 0 ? 4 : 0,
          }}
        >
          I don’t see my brand →
        </button>
      </div>

      <div className="auth-panel-foot">
        <button type="button" className="auth-panel-foot__btn" onClick={onGoToLogin}>
          Already have access? <span>Sign in</span>
        </button>
      </div>
    </>
  )
}
