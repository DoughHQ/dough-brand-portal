/** Stroke glyphs for Facets tab — 24×24 paths, currentColor, Studies-style. */

const PATHS = {
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.3-4.3'],
  info: ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M12 16v-4', 'M12 8h.01'],
  chevron: ['M9 18l6-6-6-6'],
  generic: [
    'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    'M8 12h8',
    'M12 8v8',
  ],
  leaf: [
    'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z',
    'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
  ],
  bars: ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  jar: [
    'M8 2h8',
    'M9 2v2.5L7.5 6.5A2 2 0 0 0 7 7.8V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7.8a2 2 0 0 0-.5-1.3L15 4.5V2',
    'M8 10h8',
  ],
  medal: [
    'M8.5 14.5 7 22l5-3 5 3-1.5-7.5',
    'M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  ],
  globe: [
    'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    'M2 12h20',
    'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  ],
  cube: [
    'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
    'M3.27 6.96 12 12.01l8.73-5.05',
    'M12 22.08V12',
  ],
  package: [
    'M16.5 9.4 7.55 4.24',
    'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
    'M3.27 6.96 12 12.01l8.73-5.05',
    'M12 22.08V12',
  ],
  snowflake: [
    'M12 2v20',
    'M2 12h20',
    'm4.93 4.93 14.14 14.14',
    'm19.07 4.93-14.14 14.14',
  ],
  factory: [
    'M2 20h20',
    'M5 20V10l5 4V10l5 4V4h4v16',
  ],
  ruler: [
    'M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z',
    'm14.5 12.5 2-2',
    'm11.5 9.5 2-2',
    'm8.5 6.5 2-2',
    'm17.5 15.5 2-2',
  ],
  waves: ['M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0', 'M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0', 'M2 7c2-2 4-2 6 0s4 2 6 0 4-2 6 0'],
  freeFrom: [
    'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    'm4.9 4.9 14.2 14.2',
  ],
  dietary: [
    'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z',
    'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
  ],
  flavor: [
    'M12 2c-1.5 4-4 6.5-4 10a4 4 0 0 0 8 0c0-3.5-2.5-6-4-10z',
    'M12 18v4',
  ],
  preparation: [
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    'M14 2v6h6',
    'M12 18v-6',
    'M9 15h6',
  ],
} as const

const TYPE_PATHS: Record<string, readonly string[]> = {
  additive: PATHS.leaf,
  nutrition_claim: PATHS.bars,
  sweetener: PATHS.jar,
  certification: PATHS.medal,
  country_of_origin: PATHS.globe,
  form_factor: PATHS.cube,
  packaging: PATHS.package,
  preservation: PATHS.snowflake,
  production_style: PATHS.factory,
  size_tier: PATHS.ruler,
  texture: PATHS.waves,
  free_from: PATHS.freeFrom,
  dietary: PATHS.dietary,
  flavor: PATHS.flavor,
  preparation: PATHS.preparation,
}

function GlyphSvg({
  paths,
  size,
}: {
  paths: readonly string[]
  size: number
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {paths.map((d) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}

export function FacetGlyph({
  type,
  size = 16,
}: {
  type: string
  size?: number
}) {
  return <GlyphSvg paths={TYPE_PATHS[type] ?? PATHS.generic} size={size} />
}

export function FacetSearchGlyph({ size = 18 }: { size?: number }) {
  return <GlyphSvg paths={PATHS.search} size={size} />
}

export function FacetInfoGlyph({ size = 14 }: { size?: number }) {
  return <GlyphSvg paths={PATHS.info} size={size} />
}

export function FacetChevronGlyph({ size = 16 }: { size?: number }) {
  return <GlyphSvg paths={PATHS.chevron} size={size} />
}
