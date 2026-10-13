type Props = {
  title: string | null
  whenLabel: string
}

export default function ResumeDraftCopy({ title, whenLabel }: Props) {
  const label = title?.trim() || 'Untitled study'

  return (
    <div style={{ minWidth: 0, flex: '1 1 200px' }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--heading)',
          marginBottom: 3,
        }}
      >
        Resume your draft?
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--ink-50)',
          lineHeight: 1.45,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
        <span style={{ color: 'var(--ink-30)' }}> · saved {whenLabel}</span>
      </div>
    </div>
  )
}
