import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://sahilion-ai.vercel.app'),
  title: 'Sahilion AI – Smart AI Chatbot by Sahil Analytics',
  description: 'Sahilion AI is a powerful AI chatbot platform built by Sahil Analytics. Fast, smart and intelligent assistant for everyone.',
  keywords: ['Sahilion AI', 'Sahil AI', 'AI chatbot India', 'Sahil Analytics', 'smart AI assistant', 'chatbot by Sahil', 'AI chat', 'artificial intelligence', 'machine learning'],
  authors: [{ name: 'Sahil Analytics' }],
  openGraph: {
    title: 'Sahilion AI – Smart AI Chatbot by Sahil Analytics',
    description: 'Sahilion AI is a powerful AI chatbot platform built by Sahil Analytics. Fast, smart and intelligent assistant for everyone.',
    url: 'https://sahilion-ai.vercel.app',
    siteName: 'Sahilion AI',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sahilion AI – Smart AI Chatbot by Sahil Analytics',
    description: 'Sahilion AI is a powerful AI chatbot platform built by Sahil Analytics.',
    creator: '@sahilanalytics',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
