import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import Image from 'next/image'
import localFont from 'next/font/local'
import './globals.css'
import 'katex/dist/katex.min.css'

const beachVibe = localFont({
  src: '../public/fonts/BeachVibe.ttf',
  variable: '--font-beach-vibe-local',
  display: 'swap',
})

const surfsUp = localFont({
  src: '../public/fonts/SurfsUp.ttf',
  variable: '--font-surfs-up-local',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SANbox - AI Learning Companion',
  description:
    'SANbox is a voice-first AI learning companion for K-5 students with parent visibility, lesson tracking, and built-in safeguards.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/sans-faces/San-Normal-Thinking-Listening.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/sans-faces/San-Normal-Thinking-Listening.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`relative min-h-screen font-sans antialiased ${beachVibe.variable} ${surfsUp.variable}`}
        suppressHydrationWarning
      >
        <div aria-hidden="true" className="fixed inset-0 -z-20 overflow-hidden">
          <Image
            src="/beach-aerial-view.jpg"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="stitch-shell absolute inset-0 opacity-80 mix-blend-multiply" />
        </div>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
