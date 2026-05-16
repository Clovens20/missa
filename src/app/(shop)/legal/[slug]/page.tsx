import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function LegalPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { data: page } = await supabase
    .from('legal_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!page) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">

      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-primary transition-colors">
          Accueil
        </Link>
        <span>→</span>
        <span className="text-gray-600 font-medium">{page.title}</span>
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-gray-100">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-8">
          {page.title}
        </h1>

        <div
          className="prose prose-gray max-w-none 
            prose-headings:text-gray-900 prose-headings:font-black
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-6
            prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900 prose-strong:font-bold
            prose-ul:list-disc prose-ul:pl-5 prose-ul:mb-6
            prose-li:text-gray-600 prose-li:mb-2"
          dangerouslySetInnerHTML={{
            __html: page.content
          }}
        />

        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            Dernière mise à jour :{' '}
            {new Date(page.updated_at).toLocaleDateString('fr-CA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <Link 
            href="/contact" 
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5"
          >
            Une question ? Contactez-nous
          </Link>
        </div>
      </div>
    </div>
  )
}
