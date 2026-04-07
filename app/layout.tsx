import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nexus AI - Next Generation AI Assistant',
  description: 'Experience the power of AI with Nexus AI. Chat, create, and explore with our advanced language models.',
  keywords: ['AI', 'ChatGPT', 'Artificial Intelligence', 'Machine Learning', 'Natural Language Processing'],
  authors: [{ name: 'Nexus AI' }],
  openGraph: {
    title: 'Nexus AI - Next Generation AI Assistant',
    description: 'Experience the power of AI with Nexus AI.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexus AI - Next Generation AI Assistant',
    description: 'Experience the power of AI with Nexus AI.',
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
