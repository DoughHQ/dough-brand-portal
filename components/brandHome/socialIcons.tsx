import type { CSSProperties, ReactNode } from 'react'
import type { SocialLinkKey } from '@/lib/brandHome/socialLinks'

const iconStyle: CSSProperties = {
  width: 16,
  height: 16,
  display: 'block',
}

function Svg({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      style={iconStyle}
      role="img"
    >
      <title>{label}</title>
      {children}
    </svg>
  )
}

export function SocialPlatformIcon({ platform }: { platform: SocialLinkKey }) {
  switch (platform) {
    case 'brand_website_url':
      return (
        <Svg label="Website">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm7.4 9h-3.1a15.4 15.4 0 0 0-1.3-5 8 8 0 0 1 4.4 5ZM12 4c.8 0 2.2 1.8 2.9 5H9.1C9.8 5.8 11.2 4 12 4ZM4.6 13h3.1a15.4 15.4 0 0 0 1.3 5 8 8 0 0 1-4.4-5Zm3.1-2H4.6a8 8 0 0 1 4.4-5 15.4 15.4 0 0 0-1.3 5Zm2.4 0h3.8c-.3 1.7-.9 3.3-1.9 4.6-.5.7-1 1.2-1.4 1.5-.4-.3-.9-.8-1.4-1.5-1-1.3-1.6-2.9-1.9-4.6Zm0-2c.3-1.7.9-3.3 1.9-4.6.5-.7 1-1.2 1.4-1.5.4.3.9.8 1.4 1.5 1 1.3 1.6 2.9 1.9 4.6H9.1Zm5.8 7a15.4 15.4 0 0 0 1.3-5h3.1a8 8 0 0 1-4.4 5Z" />
        </Svg>
      )
    case 'instagram_handle':
      return (
        <Svg label="Instagram">
          <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2Zm0 7.9A3.1 3.1 0 1 1 12 8.9a3.1 3.1 0 0 1 0 6.2Zm5.3-8.2a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Zm3.1 1.2A5.7 5.7 0 0 0 18.6 4a5.7 5.7 0 0 0-3.9-1.8c-1.5-.1-6.1-.1-7.6 0A5.7 5.7 0 0 0 3.2 4 5.7 5.7 0 0 0 1.4 7.9c-.1 1.5-.1 6.1 0 7.6A5.7 5.7 0 0 0 3.2 19.4a5.7 5.7 0 0 0 3.9 1.8c1.5.1 6.1.1 7.6 0a5.7 5.7 0 0 0 3.9-1.8 5.7 5.7 0 0 0 1.8-3.9c.1-1.5.1-6.1 0-7.6ZM19.3 17a3.6 3.6 0 0 1-2 2c-1.4.6-4.6.4-6.3.4s-4.9.1-6.3-.4a3.6 3.6 0 0 1-2-2c-.6-1.4-.4-4.6-.4-6.3s-.1-4.9.4-6.3a3.6 3.6 0 0 1 2-2c1.4-.6 4.6-.4 6.3-.4s4.9-.1 6.3.4a3.6 3.6 0 0 1 2 2c.6 1.4.4 4.6.4 6.3s.2 4.9-.4 6.3Z" />
        </Svg>
      )
    case 'tiktok_handle':
      return (
        <Svg label="TikTok">
          <path d="M19.6 7.2a5.5 5.5 0 0 1-3.2-1.1v7.1a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.8a2.9 2.9 0 1 0 2 2.8V2.5h2.8a5.5 5.5 0 0 0 3.2 3.1v1.6Z" />
        </Svg>
      )
    case 'youtube_handle':
      return (
        <Svg label="YouTube">
          <path d="M23.5 7.2a3 3 0 0 0-2.1-2.1C19.5 4.5 12 4.5 12 4.5s-7.5 0-9.4.6A3 3 0 0 0 .5 7.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-4.8ZM9.8 15.5v-7l6.3 3.5-6.3 3.5Z" />
        </Svg>
      )
    case 'x_handle':
      return (
        <Svg label="X">
          <path d="M18.2 2.3h3.2l-7 8 8.2 11.4h-6.4l-5-6.6-5.7 6.6H2.3l7.5-8.6L2 2.3h6.6l4.5 6 5.1-6Zm-1.1 17.5h1.8L7 4.1H5.1l12 15.7Z" />
        </Svg>
      )
    case 'linkedin_url':
      return (
        <Svg label="LinkedIn">
          <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5ZM3.5 9.5h3V21h-3V9.5Zm6 0h2.9v1.6h.1c.4-.8 1.4-1.7 3-1.7 3.2 0 3.8 2.1 3.8 4.8V21h-3v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21h-3V9.5Z" />
        </Svg>
      )
    default:
      return null
  }
}
