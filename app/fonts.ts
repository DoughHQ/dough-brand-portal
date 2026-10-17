import type { CSSProperties } from 'react'
import localFont from 'next/font/local'

/**
 * DM fonts ship from the repo so builds never fetch from Google. The files are
 * the latin and latin-ext subsets next/font/google downloaded. next/font/local
 * cannot split one family by unicode-range, so each subset is its own face and
 * the CSS variables chain latin, then latin-ext, then the metric-adjusted
 * fallback in fonts.css. Only latin is preloaded, as before. DM Sans keeps four discrete
 * faces over one variable file so 550 and 650 still round to 600 and 700.
 *
 * next/font arguments must be literals, so the ranges repeat below.
 */

const serifLatin = localFont({
  src: './fonts/dm-serif-display-400-latin.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  adjustFontFallback: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
})

const serifLatinExt = localFont({
  src: './fonts/dm-serif-display-400-latin-ext.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
    },
  ],
})

const sansLatin = localFont({
  src: [
    { path: './fonts/dm-sans-variable-latin.woff2', weight: '400', style: 'normal' },
    { path: './fonts/dm-sans-variable-latin.woff2', weight: '500', style: 'normal' },
    { path: './fonts/dm-sans-variable-latin.woff2', weight: '600', style: 'normal' },
    { path: './fonts/dm-sans-variable-latin.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  adjustFontFallback: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
})

const sansLatinExt = localFont({
  src: [
    { path: './fonts/dm-sans-variable-latin-ext.woff2', weight: '400', style: 'normal' },
    { path: './fonts/dm-sans-variable-latin-ext.woff2', weight: '500', style: 'normal' },
    { path: './fonts/dm-sans-variable-latin-ext.woff2', weight: '600', style: 'normal' },
    { path: './fonts/dm-sans-variable-latin-ext.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
    },
  ],
})

const monoLatin = localFont({
  src: [
    { path: './fonts/dm-mono-400-latin.woff2', weight: '400', style: 'normal' },
    { path: './fonts/dm-mono-500-latin.woff2', weight: '500', style: 'normal' },
  ],
  display: 'swap',
  adjustFontFallback: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
})

const monoLatinExt = localFont({
  src: [
    { path: './fonts/dm-mono-400-latin-ext.woff2', weight: '400', style: 'normal' },
    { path: './fonts/dm-mono-500-latin-ext.woff2', weight: '500', style: 'normal' },
  ],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
    },
  ],
})

/** Inline style for <html>: the variables lib/portal-ui/tokens.css reads. */
export const fontVariables = {
  '--font-serif-display': `${serifLatin.style.fontFamily}, ${serifLatinExt.style.fontFamily}, 'DM Serif Display Fallback'`,
  '--font-dm-sans': `${sansLatin.style.fontFamily}, ${sansLatinExt.style.fontFamily}, 'DM Sans Fallback'`,
  '--font-dm-mono': `${monoLatin.style.fontFamily}, ${monoLatinExt.style.fontFamily}, 'DM Mono Fallback'`,
} as CSSProperties
