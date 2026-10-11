/** @type {import('next').NextConfig} */
const inviteHeaders = [
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
]

const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
  async headers() {
    return [
      {
        source: '/marketing/workspace/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "frame-ancestors 'self' https://itsarunoff.com https://www.itsarunoff.com https://godough.co https://www.godough.co https://*.vercel.app",
          },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      // Invite links carry a secret in the path: no referrer leak, no indexing, no framing.
      { source: '/invite/:path*', headers: inviteHeaders },
      { source: '/welcome/:path*', headers: inviteHeaders },
    ]
  },
}
export default nextConfig
