import Link from 'next/link'
import { humanizeRpcError, type RpcErrorLike } from '@/lib/productMaster/errors'

type Props = {
  productId: number
  error: RpcErrorLike
  hint: string | null
}

/** Visible failure state — never a silent Next.js 404 for diagnosable RPC errors. */
export function ProductLoadError({ productId, error, hint }: Props) {
  const message = humanizeRpcError(error)
  const raw = error.message?.trim()
  const looksMissingFn =
    /could not find the function|schema cache|PGRST202/i.test(raw ?? '') ||
    hint === 'FUNCTION_NOT_FOUND'

  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        maxWidth: 640,
        margin: '48px auto',
        padding: 24,
        color: 'var(--ink)',
      }}
    >
      <Link href="/products" style={{ fontSize: 12, color: 'var(--ink-50)', textDecoration: 'none' }}>
        ← Products
      </Link>
      <h1
        style={{
          fontFamily: 'var(--font-serif, var(--font-display))',
          fontSize: 24,
          fontWeight: 400,
          margin: '20px 0 12px',
        }}
      >
        Couldn’t open this product
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 12 }}>{message}</p>
      {looksMissingFn && (
        <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--amber)', marginBottom: 12 }}>
          The portal expects <code>get_product_master</code> on this database. If migrations
          aren’t applied yet, every product page will fail here.
        </p>
      )}
      <dl
        style={{
          fontSize: 12,
          color: 'var(--ink-50)',
          lineHeight: 1.6,
          background: 'var(--cream, #faf8f3)',
          border: '1px solid var(--ink-10)',
          borderRadius: 8,
          padding: '12px 14px',
          margin: '0 0 16px',
        }}
      >
        <div>
          <dt style={{ display: 'inline', fontWeight: 600 }}>Product ID: </dt>
          <dd style={{ display: 'inline', margin: 0 }}>{productId}</dd>
        </div>
        {hint && (
          <div>
            <dt style={{ display: 'inline', fontWeight: 600 }}>Hint: </dt>
            <dd style={{ display: 'inline', margin: 0 }}>
              <code>{hint}</code>
            </dd>
          </div>
        )}
        {raw && raw !== message && (
          <div>
            <dt style={{ display: 'inline', fontWeight: 600 }}>Detail: </dt>
            <dd style={{ display: 'inline', margin: 0 }}>{raw}</dd>
          </div>
        )}
      </dl>
      <Link href="/products" style={{ color: 'var(--sage)', fontSize: 13 }}>
        Back to products
      </Link>
    </div>
  )
}
