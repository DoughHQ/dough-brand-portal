import type { AdminProductSearchResult } from '@/lib/queries'

export default function BoxProductSuggestion({
  item,
  taken,
}: {
  item: AdminProductSearchResult
  taken: Set<string>
}) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt=""
          width={28}
          height={28}
          style={{
            width: 28,
            height: 28,
            objectFit: 'contain',
            background: 'var(--surface-1)',
            borderRadius: 4,
            flexShrink: 0,
          }}
        />
      ) : (
        <span
          aria-hidden
          style={{
            width: 28,
            height: 28,
            borderRadius: 4,
            background: 'var(--surface-1)',
            flexShrink: 0,
          }}
        />
      )}
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 500, color: 'var(--ink)' }}>
          {item.product_name_clean}
        </span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-50)' }}>
          {item.brand_name}
          {item.l3_name ? ` · ${item.l3_name}` : ''}
          {taken.has(String(item.product_id)) ? ' · already in box' : ''}
        </span>
      </span>
    </span>
  )
}
