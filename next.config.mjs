/** @type {import('next').NextConfig} */
const allowedDevOrigins = [
  '100.79.137.17',
  ...(process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []),
]

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins,
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
