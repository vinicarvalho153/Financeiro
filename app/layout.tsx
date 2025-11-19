import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ConfigProvider } from '@/contexts/ConfigContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Controle Financeiro - Salários',
  description: 'Sistema de controle financeiro para duas pessoas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ConfigProvider>{children}</ConfigProvider>
      </body>
    </html>
  )
}
