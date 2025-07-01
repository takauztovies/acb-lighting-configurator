import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ACB Lighting Configurator',
  description: 'Professional lighting design and configuration tool',
  generator: 'Next.js',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
