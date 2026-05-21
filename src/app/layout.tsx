import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/contexts/CartContext'
import { WishlistProvider } from '@/contexts/WishlistContext'
import { CountryProvider } from '@/contexts/CountryContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { Toaster } from 'sonner'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 
    'https://www.missashopp.com'
  ),
  title: {
    default: `${process.env.NEXT_PUBLIC_SITE_NAME || 'Missa Shop'} — Tendances & Lifestyle | Livraison Canada 🇨🇦`,
    template: `%s | ${process.env.NEXT_PUBLIC_SITE_NAME || 'Missa Shop'}`,
  },
  description: 
    'Découvrez les produits tendance: beauté, maison, mode & gadgets. Prix imbattables. Livraison rapide au Canada, USA et ailleur. Paiement sécurisé. Retour 30 jours.',
  keywords: [
    'produits tendance', 'beauté pas cher', 'gadgets maison',
    'livraison Canada', 'livraison partout dans le monde',
    'boutique en ligne', 'Missa Shop',
    'dropshipping Canada'
  ],
  authors: [{ name: process.env.NEXT_PUBLIC_SITE_NAME || 'Missa Shop' }],
  creator: process.env.NEXT_PUBLIC_SITE_NAME || 'Missa Shop',
  publisher: process.env.NEXT_PUBLIC_SITE_NAME || 'Missa Shop',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_CA',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://www.missashopp.com',
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Missa Shop',
    title: `${process.env.NEXT_PUBLIC_SITE_NAME || 'Missa Shop'} — Tendances & Lifestyle | Livraison Canada 🇨🇦`,
    description: 
      'Découvrez les produits tendance: beauté, maison, mode & gadgets. Prix imbattables. Livraison rapide au Canada, USA et ailleur. Paiement sécurisé. Retour 30 jours.',
    images: [{
      url: 'https://www.missashopp.com/api/og',
      width: 1200,
      height: 630,
      alt: 'Missa Shop — Tendances & Lifestyle',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: process.env.NEXT_PUBLIC_SITE_NAME || 'Missa Shop',
    description: 
      'Découvrez les produits tendance: beauté, maison, mode & gadgets.',
    images: ['https://www.missashopp.com/api/og'],
    creator: '@missashop',
  },
  verification: {
    // google: 'your-google-verification',
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || 'https://www.missashopp.com',
    languages: {
      'fr-CA': process.env.NEXT_PUBLIC_APP_URL || 'https://www.missashopp.com',
      'fr-FR': process.env.NEXT_PUBLIC_APP_URL || 'https://www.missashopp.com',
      'en-US': (process.env.NEXT_PUBLIC_APP_URL || 'https://www.missashopp.com') + '/en',
    },
  },
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SettingsProvider>
          <CurrencyProvider>
            <CartProvider>
              <WishlistProvider>
                <CountryProvider>
                  {children}
                  <Toaster 
                    position="top-right"
                    richColors
                  />
                </CountryProvider>
              </WishlistProvider>
            </CartProvider>
          </CurrencyProvider>
        </SettingsProvider>
      </body>
    </html>
  )
}
