import type { Metadata, Viewport } from 'next'
import { PRODUCT_NAME } from '@/lib/brand'
import { fontVariables } from './fonts'
import './fonts.css'
import './globals.css'

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} — Brand Intelligence`,
  description: 'Real consumer preference data for your brand.',
}

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: '#243d2c',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={fontVariables}
    >
      <body>{children}</body>
    </html>
  )
}
