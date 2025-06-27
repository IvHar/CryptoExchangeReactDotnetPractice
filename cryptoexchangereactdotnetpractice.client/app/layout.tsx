import type React from "react"
import "./globals.css"
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'


const inter = Inter({ subsets: ["latin"] })


function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      {children}
    </ThemeProvider>
  )
}

export const metadata = {
  title: "TradeHub",
  description: "Buy, sell, and trade cryptocurrencies on the world's largest crypto exchange",
  generator: 'v0.dev',
  icons: {
      icon: "/icon.png"
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
