import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import Providers from './providers'
import { Toaster } from '@/components/ui/toaster'
import { AppShell } from '@/components/AppShell'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dynasty Trade Evaluator',
  description: 'Evaluate fantasy football dynasty trades',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} min-h-screen bg-background text-foreground`}>
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}