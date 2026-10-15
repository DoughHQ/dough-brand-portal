import { PRODUCT_NAME } from '@/lib/brand'
import { formatProducts, type Props } from './applyModel'
import type { ApplyBrandFlowState } from './useApplyBrandFlow'

export function ApplyDetailsStep({
  error,
  setError,
  setStep,
  styles,
  selectedBrand,
  typedBrandName,
  setTypedBrandName,
  contactName,
  setContactName,
  contactEmail,
  setContactEmail,
  roleTitle,
  setRoleTitle,
  linkedinUrl,
  setLinkedinUrl,
  brandWebsite,
  setBrandWebsite,
  submitting,
  signedInEmail,
  handleSubmit,
}: Pick<Props, 'error' | 'setError' | 'setStep' | 'styles'> & Pick<ApplyBrandFlowState, 'selectedBrand' | 'typedBrandName' | 'setTypedBrandName' | 'contactName' | 'setContactName' | 'contactEmail' | 'setContactEmail' | 'roleTitle' | 'setRoleTitle' | 'linkedinUrl' | 'setLinkedinUrl' | 'brandWebsite' | 'setBrandWebsite' | 'submitting' | 'signedInEmail' | 'handleSubmit'>) {
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 22,
            fontWeight: 400,
            color: 'var(--ink)',
            marginBottom: 8,
            lineHeight: 1.3,
          }}
        >
          Your details
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.6 }}>
          {selectedBrand ? (
            <>
              Applying for{' '}
              <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>
                {selectedBrand.brand_name}
              </strong>
              {selectedBrand.product_count > 0 ? (
                <>
                  {' '}
                  · {formatProducts(selectedBrand.product_count)} already in{' '}
                  {PRODUCT_NAME}
                </>
              ) : null}
              .
            </>
          ) : (
            <>Tell us who you are and what to call the brand.</>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {selectedBrand == null ? (
          <div>
            <div style={styles.labelStyle}>
              Brand name<span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>
            </div>
            <input
              type="text"
              className="auth-input"
              value={typedBrandName}
              onChange={(e) => setTypedBrandName(e.target.value)}
              placeholder="Your brand as you’d like it listed"
              style={styles.inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--sage)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(28, 38, 32, 0.14)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
        ) : null}

        <div>
          <div style={styles.labelStyle}>
            Your name<span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>
          </div>
          <input
            type="text"
            className="auth-input"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Jane Smith"
            style={styles.inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--sage)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(28, 38, 32, 0.14)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        <div>
          <div style={styles.labelStyle}>
            Work email<span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>
          </div>
          <input
            type="email"
            className="auth-input"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="jane@brand.com"
            autoComplete="email"
            style={styles.inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--sage)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(28, 38, 32, 0.14)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        <div>
          <div style={styles.labelStyle}>Your role at the brand</div>
          <input
            type="text"
            className="auth-input"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="Brand manager, founder…"
            style={styles.inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--sage)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(28, 38, 32, 0.14)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        <div>
          <div style={styles.labelStyle}>LinkedIn profile</div>
          <input
            type="text"
            className="auth-input"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="linkedin.com/in/you"
            style={styles.inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--sage)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(28, 38, 32, 0.14)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        <div>
          <div style={styles.labelStyle}>
            Brand website
            {selectedBrand == null ? (
              <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>
            ) : null}
          </div>
          <input
            type="text"
            className="auth-input"
            value={brandWebsite}
            onChange={(e) => setBrandWebsite(e.target.value)}
            placeholder="yourbrand.com"
            autoComplete="url"
            style={styles.inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--sage)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(28, 38, 32, 0.14)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {error ? (
          <div style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>{error}</div>
        ) : null}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting || Boolean(signedInEmail)}
          style={styles.primaryBtnStyle(submitting || Boolean(signedInEmail))}
        >
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setError(null)
              setStep('search')
            }}
            style={{
              fontSize: 12,
              color: 'var(--ink-30)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Back
          </button>
        </div>
      </div>
    </>
  )
}
