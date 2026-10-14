import { applicationChip, type BrandApplication } from '@/lib/brandApplications'

export function StatusChip({ row }: { row: BrandApplication }) {
  const chip = applicationChip(row)
  const styles =
    chip.tone === 'amber'
      ? {
          background: 'var(--amber-pale, rgba(192,120,24,0.12))',
          color: 'var(--amber, #a66a14)',
          border: '1px solid rgba(192,120,24,0.28)',
        }
      : chip.tone === 'sage'
        ? {
            background: 'var(--sage-soft)',
            color: 'var(--heading)',
            border: '1px solid rgba(62,107,74,0.22)',
          }
        : {
            background: 'var(--surface-1)',
            color: 'var(--ink-50)',
            border: '1px solid var(--ink-10)',
          }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 999,
        ...styles,
      }}
    >
      {chip.label}
    </span>
  )
}
