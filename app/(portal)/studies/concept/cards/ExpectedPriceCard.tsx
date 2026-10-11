import {
  formatPriceDisplay,
  normalizeExpectedPrice,
} from '@/lib/concept/priceBands'
import { previewPriceBands, templateFieldAnchor } from '@/lib/concept/templateConfig'
import { inputBase, labelSm } from '../conceptStyles'
import { BandStrip } from './BandStrip'
import type { CardProps } from './cardTypes'
import { QCard } from './QCard'

/**
 * Expected-price anchor + read-only generated band preview.
 * In price mode this anchors the willingness-to-pay scale; the copy differs
 * slightly but the mechanic is identical, so a `helpOverride` is accepted.
 */
export function ExpectedPriceCard({
  config,
  patchConfig,
  errorByField,
  helpOverride,
  labelOverride,
}: CardProps & { helpOverride?: string; labelOverride?: string }) {
  const bandPreview = previewPriceBands(config)
  return (
    <QCard
      id={templateFieldAnchor('expected_price')}
      title="Price expectation"
      help={
        helpOverride ??
        'What retail price should respondents expect? Answer bands generate from this anchor.'
      }
    >
      <label style={labelSm} htmlFor="expected_price">
        {labelOverride ?? 'Expected retail price'}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          maxWidth: 200,
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-sm)',
          background: 'var(--paper)',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            padding: '9px 0 9px 11px',
            fontSize: 13,
            color: 'var(--ink-50)',
            userSelect: 'none',
          }}
        >
          $
        </span>
        <input
          id="expected_price"
          value={config.expected_price}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, '')
            patchConfig({
              expected_price: raw,
              price_display: formatPriceDisplay(raw),
            })
          }}
          onBlur={() => {
            const normalized = normalizeExpectedPrice(config.expected_price)
            if (normalized !== config.expected_price) {
              patchConfig({
                expected_price: normalized,
                price_display: formatPriceDisplay(normalized),
              })
            }
          }}
          placeholder="4.99"
          inputMode="decimal"
          style={{ ...inputBase, border: 'none', borderRadius: 0, paddingLeft: 4 }}
        />
      </div>
      {normalizeExpectedPrice(config.expected_price) ? (
        <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--ink-30)' }}>
          Shown as {formatPriceDisplay(config.expected_price)}
        </p>
      ) : null}
      <BandStrip bands={bandPreview} />
      {errorByField.get('expected_price') ? (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--red)' }}>
          {errorByField.get('expected_price')}
        </p>
      ) : null}
    </QCard>
  )
}
