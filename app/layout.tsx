import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProvider } from '@clerk/nextjs'
import { AppNav } from '@/components/AppNav'
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
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ClerkProvider>
          <AppNav />
          {children}
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  )
}