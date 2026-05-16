import CollectionAlertPopup from '@/components/shop/CollectionAlertPopup'
import MobileNav from '@/components/shop/MobileNav'
import PixelsInjector from '@/components/shop/PixelsInjector'
import { supabaseServer as supabase } from '@/lib/supabase-server'

function OrganizationSchema() {
  const siteUrl = 
    process.env.NEXT_PUBLIC_SITE_URL || 
    'https://missashop.com'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Missa Shop',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: 
      'Boutique de mode premium en ligne. ' +
      'Livraison au Canada, USA et Haïti.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CA',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['French', 'English'],
    },
    sameAs: [
      'https://www.facebook.com/missashop',
      'https://www.instagram.com/missashop',
      'https://www.tiktok.com/@missashop',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  )
}

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch active pixels
  const { data: rawPixelData } = await supabase
    .from('tracking_pixels')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single()

  const pixelData = rawPixelData as any

  const pixels = {
    facebook: pixelData?.facebook_enabled ? {
      tag: pixelData.facebook_domain_tag,
      script: pixelData.facebook_pixel_script,
    } : null,
    tiktok: pixelData?.tiktok_enabled ? {
      tag: pixelData.tiktok_domain_tag,
      script: pixelData.tiktok_pixel_script,
    } : null,
    google: pixelData?.google_enabled ? {
      tag: pixelData.google_domain_tag,
      script: pixelData.google_pixel_script,
    } : null,
    snapchat: pixelData?.snapchat_enabled ? {
      tag: pixelData.snapchat_domain_tag,
      script: pixelData.snapchat_pixel_script,
    } : null,
    pinterest: pixelData?.pinterest_enabled ? {
      tag: pixelData.pinterest_domain_tag,
      script: pixelData.pinterest_pixel_script,
    } : null,
    twitter: pixelData?.twitter_enabled ? {
      tag: pixelData.twitter_domain_tag,
      script: pixelData.twitter_pixel_script,
    } : null,
    customHead: pixelData?.custom_enabled ? pixelData.custom_head_scripts : null,
    customBody: pixelData?.custom_enabled ? pixelData.custom_body_scripts : null,
  }

  return (
    <>
      <OrganizationSchema/>
      <PixelsInjector pixels={pixels}/>
      {children}
      <CollectionAlertPopup />
      <MobileNav />
    </>
  )
}
