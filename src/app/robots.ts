import { MetadataRoute } from 'next'

export default function robots(): 
  MetadataRoute.Robots {
  
  const siteUrl = 
    process.env.NEXT_PUBLIC_SITE_URL || 
    'https://missashop.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/checkout/',
          '/cart/',
          '/_next/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
