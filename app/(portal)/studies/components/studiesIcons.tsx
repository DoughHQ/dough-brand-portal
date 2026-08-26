export const ICON_CLOCK = [
  'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
  'M12 6v6l4 2',
]

export const ICON_FILE = [
  'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
  'M14 3v5h5',
]

export const ICON_CHECK = ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4 12 14.01l-3-3']

export const ICON_FLASK = [
  'M10 2v7.5L4.2 19.2A2 2 0 0 0 5.9 22h12.2a2 2 0 0 0 1.7-2.8L14 9.5V2',
  'M8.5 2h7',
  'M7 14h10',
]

export const ICON_ARCHIVE = ['M21 8v13H3V8', 'M1 3h22v5H1z', 'M10 12h4']

export function StudiesGlyph({
  d,
  size = 16,
}: {
  d: string | string[]
  size?: number
}) {
  const paths = Array.isArray(d) ? d : [d]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {paths.map((path) => (
        <path
          key={path}
          d={path}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
