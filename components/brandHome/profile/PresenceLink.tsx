import {
  displaySocialValue,
  socialOutboundUrl,
  type SocialLinkKey,
} from '@/lib/brandHome/socialLinks'
import { SocialPlatformIcon } from '@/components/brandHome/socialIcons'

export function PresenceLink({
  linkKey,
  stored,
}: {
  linkKey: SocialLinkKey
  stored: string
}) {
  const href = socialOutboundUrl(linkKey, stored)
  const display = displaySocialValue(linkKey, stored)
  if (!href || !display) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="bp-presence-link"
    >
      <SocialPlatformIcon platform={linkKey} />
      <span>{display}</span>
    </a>
  )
}
