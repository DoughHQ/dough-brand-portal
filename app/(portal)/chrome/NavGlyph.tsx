import type { NavIcon } from './navModel'

export function NavGlyph({ name }: { name: NavIcon }) {
  const stroke = {
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  return (
    <svg className="portal-nav-glyph" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      {name === 'home' ? <path d="M4 11l8-7 8 7v8H4v-8zM9 19v-6h6v6" {...stroke} /> : null}
      {name === 'readiness' ? <path d="M4 19V9l8-6 8 6v10H4z" {...stroke} /> : null}
      {name === 'report' ? (
        <>
          <path d="M7 4h8l4 4v12H7z" {...stroke} />
          <path d="M15 4v4h4M10 12h6M10 16h4" {...stroke} />
        </>
      ) : null}
      {name === 'groups' ? (
        <>
          <circle cx="8" cy="9" r="2.4" {...stroke} />
          <circle cx="16" cy="9" r="2.4" {...stroke} />
          <path d="M4 18c.6-2.2 2.2-3.4 4-3.4s3.4 1.2 4 3.4M12 18c.6-2.2 2.2-3.4 4-3.4s3.4 1.2 4 3.4" {...stroke} />
        </>
      ) : null}
      {name === 'impersonate' ? (
        <>
          <circle cx="12" cy="8" r="3.2" {...stroke} />
          <path d="M5 19c1.2-3 3.6-4.5 7-4.5S17.8 16 19 19" {...stroke} />
        </>
      ) : null}
      {name === 'safety' ? (
        <>
          <path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z" {...stroke} />
          <path d="M12 11v3M12 16.5h.01" {...stroke} />
        </>
      ) : null}
      {name === 'corrections' ? <path d="M4 7h16M4 12h16M4 17h10" {...stroke} /> : null}
      {name === 'ownership' ? <path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z" {...stroke} /> : null}
      {name === 'applications' ? (
        <path d="M8 7h8M8 12h8M8 17h5M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" {...stroke} />
      ) : null}
      {name === 'boxes' ? (
        <>
          <path d="M3 8l9-5 9 5v9l-9 5-9-5V8z" {...stroke} />
          <path d="M12 13V3M3 8l9 5 9-5" {...stroke} />
        </>
      ) : null}
      {name === 'studies' ? <path d="M8 4h8v16H8zM10 8h4" {...stroke} /> : null}
      {name === 'products' ? <path d="M4 7h16M4 12h16M4 17h10" {...stroke} /> : null}
      {name === 'prototypes' ? (
        <>
          <path d="M7 4h7l3 3v13H7z" {...stroke} />
          <path d="M14 4v3h3M10 12h4M10 16h3" {...stroke} />
        </>
      ) : null}
      {name === 'categories' ? <path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z" {...stroke} /> : null}
      {name === 'reports' ? <path d="M5 19V9M10 19V5M15 19v-7M20 19V8" {...stroke} /> : null}
      {name === 'moon' ? <path d="M16 4.5A8 8 0 1110 20 6.5 6.5 0 0016 4.5z" {...stroke} /> : null}
      {name === 'sun' ? (
        <>
          <circle cx="12" cy="12" r="4" {...stroke} />
          <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" {...stroke} />
        </>
      ) : null}
      {name === 'logout' ? (
        <>
          <path d="M10 7V5a2 2 0 012-2h7v18h-7a2 2 0 01-2-2v-2" {...stroke} />
          <path d="M4 12h11M12 9l3 3-3 3" {...stroke} />
        </>
      ) : null}
      {name === 'search' ? (
        <>
          <circle cx="11" cy="11" r="6.5" {...stroke} />
          <path d="M16 16l4 4" {...stroke} />
        </>
      ) : null}
      {name === 'chevron' ? <path d="M8 10l4 4 4-4" {...stroke} /> : null}
      {name === 'settings' ? (
        <>
          <circle cx="12" cy="12" r="3" {...stroke} />
          <path
            d="M12 3v2.2M12 18.8V21M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M3 12h2.2M18.8 12H21M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"
            {...stroke}
          />
        </>
      ) : null}
    </svg>
  )
}
