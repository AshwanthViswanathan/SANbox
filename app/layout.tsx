import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { FloatingChat } from '@/components/app/floating-chat'
import './globals.css'

export const metadata: Metadata = {
  title: 'SANbox - AI Learning Companion',
  description:
    'SANbox is a voice-first AI learning companion for K-5 students with parent visibility, lesson tracking, and built-in safeguards.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        <FloatingChat />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
