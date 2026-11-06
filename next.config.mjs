const dev = process.env.NODE_ENV !== 'production'
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

/*
 * What the browser may load and do on these pages. Next's own inline bootstrap script and the theme script need
 * 'unsafe-inline' for scripts (a per-request nonce would make every page dynamic), so the policy's job is the rest:
 * no framing by other sites, nothing loaded from or sent to hosts we don't use, no plugins, forms only to ourselves.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${dev ? "'unsafe-eval' " : ''}https://challenges.cloudflare.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabase} https://*.supabase.co https://challenges.cloudflare.com https://vitals.vercel-insights.com${dev ? ' ws://localhost:* http://localhost:*' : ''}`,
  'frame-src https://challenges.cloudflare.com',
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "worker-src 'self' blob:",
  ...(dev ? [] : ['upgrade-insecure-requests']),
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ...(dev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]),
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 16.4 writes an AGENTS.md into the project on every dev start; this project doesn't use it.
  agentRules: false,
  // Lets a phone or another computer on the same network open the dev server by this address.
  allowedDevOrigins: ['192.168.178.163'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // The link-preview images read this picture from disk; make sure it ships with them.
  outputFileTracingIncludes: {
    '/opengraph-image': ['./app/og-bg.png'],
    '/twitter-image': ['./app/og-bg.png'],
    '/blog/**': ['./app/og-bg.png'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
