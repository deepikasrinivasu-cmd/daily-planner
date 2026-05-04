import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Family HQ',
  description: 'Family day planner — missions, rewards, schedule & groceries',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Family HQ',
  },
}

export const viewport: Viewport = {
  themeColor: '#1E1B4B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}
