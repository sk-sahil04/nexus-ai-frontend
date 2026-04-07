import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://ai.sahilanalytics.me'),
  title: 'Sahilion AI – Advanced AI Chatbot by Sahil Analytics',
  description: 'Sahilion AI is an advanced AI chatbot developed by Sahil Analytics. Fast, intelligent and powerful assistant for chat, automation and smart solutions.',
  keywords: ['Sahilion AI', 'AI chatbot India', 'Sahil Analytics', 'smart AI assistant', 'chatbot app', 'AI assistant', 'automation AI'],
  authors: [{ name: 'Sahil Analytics' }],
  openGraph: {
    title: 'Sahilion AI – Advanced AI Chatbot by Sahil Analytics',
    description: 'Sahilion AI is an advanced AI chatbot developed by Sahil Analytics. Fast, intelligent and powerful assistant.',
    url: 'https://ai.sahilanalytics.me',
    siteName: 'Sahilion AI',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sahilion AI – Advanced AI Chatbot by Sahil Analytics',
    description: 'Fast, intelligent and powerful AI assistant by Sahil Analytics.',
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
