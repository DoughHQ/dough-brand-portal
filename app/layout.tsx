import type { Metadata } from 'next'
import { Lora, DM_Sans } from 'next/font/google'
import './globals.css'
const lora = Lora({ subsets:['latin'], variable:'--font-serif', display:'swap', weight:['400','500','600','700'], style:['normal','italic'] })
const dmSans = DM_Sans({ subsets:['latin'], variable:'--font-sans', display:'swap', weight:['300','400','500','600','700'] })
export const metadata: Metadata = { title:'dough. — Brand Intelligence', description:'Real consumer preference data for your brand.' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${lora.variable} ${dmSans.variable}`}>{children}</body>
    </html>
  )
}
