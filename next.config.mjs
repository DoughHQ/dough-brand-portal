/** @type {import('next').NextConfig} */
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
              "frame-ancestors 'self' https://godough.co https://www.godough.co https://*.vercel.app",
          },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ]
  },
}
export default nextConfig
