export default function BreadcrumbSEO({
  items,
}: {
  items: { name: string; url: string }[]
}) {
  const siteUrl = 
    process.env.NEXT_PUBLIC_SITE_URL || 
    'https://www.missashopp.com'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(
      (item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: item.url.startsWith('http')
          ? item.url
          : `${siteUrl}${item.url}`,
      })
    ),
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
