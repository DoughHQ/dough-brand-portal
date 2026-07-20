import { isOwnConceptIntent, monogramFromName } from '@/lib/conceptReport/copy'

type Props = {
  name: string
  battleIntent: string
  imageUrl?: string | null
  size?: number
}

/** Monogram-primary portrait. Image only if present — never an empty photo slot. */
export function CombatantPortrait({ name, battleIntent, imageUrl, size = 64 }: Props) {
  const own = isOwnConceptIntent(battleIntent)
  const mono = monogramFromName(name)

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: 'cover',
          borderRadius: 8,
          display: 'block',
          background: own ? 'var(--bg-pro)' : 'var(--surface-1)',
        }}
      />
    )
  }

  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: own ? 'var(--bg-pro)' : 'var(--surface-1)',
        color: own ? 'var(--text-pro)' : 'var(--ink-muted)',
        fontFamily: 'var(--font-display)',
        fontSize: size * 0.36,
        fontWeight: 400,
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      {mono}
    </div>
  )
}
