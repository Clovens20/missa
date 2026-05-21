'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Upload, FileSpreadsheet, 
  CheckCircle, XCircle, 
  AlertCircle, Download,
  ArrowLeft, Eye
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { toast } from 'sonner'
import { slugify } from '@/lib/utils'

interface ImportRow {
  row: number
  name: string
  category_name: string
  description: string
  short_description: string
  price: number
  compare_price: number
  sku: string
  tags: string
  sizes: string
  colors: string
  stock_quantity: number
  weight: number
  image_url: string
  is_featured: boolean
  is_new: boolean
  is_on_sale: boolean
  status: 'pending' | 'success' | 'error' | 'skip'
  ali_url?: string
  error?: string
}

const CSV_HEADERS = [
  'name', 'category_name', 'description', 'short_description', 'price', 'compare_price', 'sku', 'tags', 'sizes', 'colors', 'stock_quantity', 'weight', 'image_url', 'is_featured', 'is_new', 'is_on_sale', 'ali_url'
]

function parseCSV(text: string): any[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map((line, i) => {
    const values: string[] = []
    let current = ''; let inQuotes = false
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = '' }
      else current += char
    }
    values.push(current.trim())
    const row: any = { row: i + 2 }
    headers.forEach((h, idx) => { row[h] = values[idx] || '' })
    return row
  })
}

export default function ImportProductsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const fileRef = useRef<HTMLInputElement>(null)

  function downloadTemplate() {
    const template = [
      CSV_HEADERS.join(','),
      '"T-Shirt Premium Homme","homme","Description du produit","T-shirt confortable","29.99","49.99","TSH-001","t-shirt,homme,casual","S,M,L,XL,XXL","Rouge,Bleu,Noir","50","0.3","https://image-url.com/img.jpg","true","false","true","https://fr.aliexpress.com/item/12345.html"',
    ].join('\n')
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'missa-shop-import-template.csv'; a.click(); URL.revokeObjectURL(url)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    if (!f.name.endsWith('.csv')) { toast.error('Fichier CSV requis (.csv)'); return }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const parsed = parseCSV(text)
      const importRows: ImportRow[] = parsed.map((row, i) => ({
        row: i + 2,
        name: row.name || '',
        category_name: row.category_name || '',
        description: row.description || '',
        short_description: row.short_description || '',
        price: parseFloat(row.price) || 0,
        compare_price: parseFloat(row.compare_price) || 0,
        sku: row.sku || '',
        tags: row.tags || '',
        sizes: row.sizes || '',
        colors: row.colors || '',
        stock_quantity: parseInt(row.stock_quantity) || 0,
        weight: parseFloat(row.weight) || 0,
        image_url: row.image_url || '',
        is_featured: row.is_featured === 'true',
        is_new: row.is_new === 'true',
        is_on_sale: row.is_on_sale === 'true',
        ali_url: row.ali_url || '',
        status: !row.name || !row.price ? 'error' : 'pending',
        error: !row.name ? 'Nom manquant' : !row.price ? 'Prix manquant' : undefined,
      }))
      setRows(importRows); setStep('preview')
    }
    reader.readAsText(f, 'UTF-8')
  }

  async function startImport() {
    setImporting(true); setProgress(0)
    const { data: categories } = await supabase.from('categories').select('id, name, slug')
    const catMap: Record<string, string> = {}
    categories?.forEach(c => { catMap[c.name.toLowerCase()] = c.id; catMap[c.slug.toLowerCase()] = c.id })
    const validRows = rows.filter(r => r.status === 'pending'); let success = 0; let errors = 0
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      try {
        const catKey = row.category_name.toLowerCase().trim()
        let categoryId = catMap[catKey]
        if (!categoryId && row.category_name) {
          const { data: newCat } = await supabase.from('categories').insert({ name: row.category_name, slug: slugify(row.category_name), is_active: true, sort_order: 99 }).select().single()
          if (newCat) { categoryId = newCat.id; catMap[catKey] = newCat.id }
        }
        const sizes = row.sizes ? row.sizes.split(',').map(s => s.trim()).filter(Boolean) : []
        const colors = row.colors ? row.colors.split(',').map(c => c.trim()).filter(Boolean) : []
        const variants: any[] = []
        if (sizes.length || colors.length) {
          const stockPerVariant = sizes.length > 0 ? Math.floor(row.stock_quantity / Math.max(sizes.length, 1)) : row.stock_quantity
          if (sizes.length > 0) {
            sizes.forEach((size, si) => {
              if (colors.length > 0) { colors.forEach((color, ci) => { variants.push({ id: `${si}-${ci}`, size, color, stock: Math.floor(stockPerVariant / colors.length), price: row.price }) }) }
              else { variants.push({ id: `${si}`, size, stock: stockPerVariant, price: row.price }) }
            })
          }
        }
        const images = row.image_url ? [{ url: row.image_url, alt: row.name, is_primary: true }] : []
        let slug = slugify(row.name); if (row.sku) { slug = `${slug}-${row.sku.toLowerCase()}` }
        const { data: inserted, error } = await supabase.from('products').upsert({
          name: row.name, slug, description: row.description, short_description: row.short_description, price: row.price, compare_price: row.compare_price || null, sku: row.sku || null, category_id: categoryId || null, images, variants, tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [], stock_quantity: row.stock_quantity, weight: row.weight || null, is_featured: row.is_featured, is_new: row.is_new, is_on_sale: row.is_on_sale, is_active: true, low_stock_threshold: 5,
        }, { onConflict: 'sku' }).select('id').single()
        if (error) throw error

        // Import reviews if ali_url provided
        if (row.ali_url && row.ali_url.trim() !== '') {
          const res = await fetch('/api/scrape-reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aliUrl: row.ali_url, productName: row.name })
          })
          const data = await res.json()
          
          if (data.success && data.reviews.length > 0) {
            const reviewsToInsert = data.reviews.map((r: any) => ({
              product_id: inserted.id,
              customer_name: r.reviewer_name + (r.reviewer_country ? ` (${r.reviewer_country})` : ''),
              rating: r.rating,
              title: r.comment.length > 30 ? r.comment.substring(0, 30) + '...' : r.comment,
              body: r.comment,
              is_verified: r.is_verified,
              status: 'approved',
              created_at: new Date(r.review_date).toISOString()
            }))
            await supabase.from('product_reviews').insert(reviewsToInsert)

            const avg = reviewsToInsert.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsToInsert.length
            await supabase.from('products').update({
              rating: avg,
              review_avg: avg,
              review_count: reviewsToInsert.length
            }).eq('id', inserted.id)
          }
        }

        success++; setRows(prev => prev.map(r => r.row === row.row ? { ...r, status: 'success' } : r))
      } catch (err: any) {
        errors++; setRows(prev => prev.map(r => r.row === row.row ? { ...r, status: 'error', error: err.message } : r))
      }
      setProgress(Math.round(((i + 1) / validRows.length) * 100))
    }
    setImporting(false); setStep('done')
    toast.success(`✅ ${success} produits importés!` + (errors > 0 ? ` (${errors} erreurs)` : ''))
  }

  const validCount = rows.filter(r => r.status === 'pending' || r.status === 'success').length
  const errorCount = rows.filter(r => r.status === 'error').length
  const successCount = rows.filter(r => r.status === 'success').length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5"/></Link>
          <div><h1 className="text-2xl font-black text-white flex items-center gap-3"><div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center"><FileSpreadsheet className="w-5 h-5 text-secondary"/></div>Import Massif Produits</h1><p className="text-gray-500 text-sm mt-1">Importez des centaines de produits via fichier CSV</p></div>
        </div>
        <button onClick={downloadTemplate} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"><Download className="w-4 h-4"/>Télécharger le modèle CSV</button>
      </div>

      {step === 'upload' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="font-black text-white mb-4 flex items-center gap-2">📋 Format du fichier CSV</h2>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-700"><th className="text-left py-2 pr-4 text-gray-400 font-bold">Colonne</th><th className="text-left py-2 pr-4 text-gray-400 font-bold">Obligatoire</th><th className="text-left py-2 text-gray-400 font-bold">Exemple</th></tr></thead><tbody className="text-gray-300">{[['name', '✅ OUI', 'T-Shirt Premium'], ['category_name', '⭕ NON', 'homme'], ['description', '⭕ NON', 'Description complète...'], ['short_description', '⭕ NON', 'Courte description'], ['price', '✅ OUI', '29.99'], ['compare_price', '⭕ NON', '49.99'], ['sku', '⭕ NON', 'TSH-001-ROUGE'], ['tags', '⭕ NON', 'homme,casual,été'], ['sizes', '⭕ NON', 'S,M,L,XL,XXL'], ['colors', '⭕ NON', 'Rouge,Bleu,Noir'], ['stock_quantity', '✅ OUI', '100'], ['weight', '⭕ NON', '0.3'], ['image_url', '⭕ NON', 'https://...'], ['is_featured', '⭕ NON', 'true / false'], ['is_new', '⭕ NON', 'true / false'], ['is_on_sale', '⭕ NON', 'true / false'], ['ali_url', '⭕ NON', 'https://aliexpress...']].map(([col, req, ex]) => (<tr key={col} className="border-b border-gray-800/50"><td className="py-2 pr-4 font-mono text-primary text-xs">{col}</td><td className="py-2 pr-4 text-xs">{req}</td><td className="py-2 text-gray-500 text-xs">{ex}</td></tr>))}</tbody></table></div>
          </div>
          <div className="border-2 border-dashed border-gray-600 rounded-3xl p-16 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group" onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden"/>
            <div className="w-20 h-20 bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors"><Upload className="w-10 h-10 text-gray-400 group-hover:text-primary transition-colors"/></div>
            <h3 className="text-xl font-black text-white mb-2">Glissez votre fichier CSV ici</h3>
            <p className="text-gray-500 mb-4">ou cliquez pour parcourir</p>
            <span className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-sm inline-block group-hover:bg-primary-dark transition-colors">Choisir le fichier CSV</span>
            <p className="text-gray-600 text-xs mt-4">Format: CSV, max 10MB</p>
          </div>
        </motion.div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4 text-center"><p className="text-3xl font-black text-secondary">{validCount}</p><p className="text-sm text-gray-400 mt-1">Prêts à importer</p></div>
            <div className={`border rounded-2xl p-4 text-center ${errorCount > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-800 border-gray-700'}`}><p className={`text-3xl font-black ${errorCount > 0 ? 'text-red-400' : 'text-gray-500'}`}>{errorCount}</p><p className="text-sm text-gray-400 mt-1">Erreurs</p></div>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 text-center"><p className="text-3xl font-black text-white">{rows.length}</p><p className="text-sm text-gray-400 mt-1">Total lignes</p></div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800"><h2 className="font-bold text-white">Aperçu — {rows.length} lignes</h2><div className="flex gap-3"><button onClick={() => { setStep('upload'); setRows([]); setFile(null) }} className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-semibold transition-colors">Changer de fichier</button><button onClick={startImport} disabled={importing || validCount === 0} className="flex items-center gap-2 px-5 py-2 bg-secondary hover:bg-secondary-dark text-white font-black rounded-xl text-sm transition-all disabled:opacity-50">{importing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>{progress}%</> : <><Upload className="w-4 h-4"/>Importer {validCount} produits</>}</button></div></div>
            {importing && <div className="px-6 py-3 border-b border-gray-800"><div className="flex items-center gap-4 mb-2"><span className="text-xs text-gray-400">Importation en cours...</span><span className="text-xs font-bold text-secondary ml-auto">{progress}%</span></div><div className="h-2 bg-gray-800 rounded-full"><div className="h-2 bg-secondary rounded-full transition-all" style={{ width: `${progress}%` }}/></div></div>}
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto"><table className="w-full"><thead className="sticky top-0 bg-gray-900"><tr className="border-b border-gray-800">{['#', 'Statut', 'Nom', 'Catégorie', 'Prix', 'Promo', 'SKU', 'Stock', 'Tailles', 'Couleurs'].map(h => (<th key={h} className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wide">{h}</th>))}</tr></thead><tbody>{rows.map(row => (<tr key={row.row} className={`border-b border-gray-800/50 text-sm ${row.status === 'error' ? 'bg-red-500/5' : row.status === 'success' ? 'bg-secondary/5' : ''}`}><td className="px-4 py-3 text-gray-500 text-xs">{row.row}</td><td className="px-4 py-3">{row.status === 'success' ? <CheckCircle className="w-4 h-4 text-secondary"/> : row.status === 'error' ? <div className="flex items-center gap-1"><XCircle className="w-4 h-4 text-red-400"/><span className="text-xs text-red-400">{row.error}</span></div> : <div className="w-2 h-2 bg-gray-600 rounded-full"/>}</td><td className="px-4 py-3 text-white font-medium max-w-[200px] truncate">{row.name}</td><td className="px-4 py-3 text-gray-400 text-xs">{row.category_name}</td><td className="px-4 py-3 text-primary font-bold">${row.price}</td><td className="px-4 py-3 text-gray-500 text-xs line-through">{row.compare_price ? `$${row.compare_price}` : '-'}</td><td className="px-4 py-3 text-gray-500 text-xs font-mono">{row.sku || '-'}</td><td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.stock_quantity > 10 ? 'bg-secondary/20 text-secondary' : row.stock_quantity > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{row.stock_quantity}</span></td><td className="px-4 py-3 text-gray-400 text-xs max-w-[120px] truncate">{row.sizes || '-'}</td><td className="px-4 py-3 text-gray-400 text-xs max-w-[120px] truncate">{row.colors || '-'}</td></tr>))}</tbody></table></div>
          </div>
        </div>
      )}

      {step === 'done' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
          <div className="w-24 h-24 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-12 h-12 text-secondary"/></div>
          <h2 className="text-3xl font-black text-white mb-2">Import terminé!</h2>
          <p className="text-gray-400 mb-2"><span className="text-secondary font-black text-xl">{successCount}</span> produits importés avec succès</p>
          {errorCount > 0 && <p className="text-red-400 mb-6">{errorCount} erreurs — vérifiez les lignes en rouge</p>}
          <div className="flex gap-4 justify-center"><Link href="/admin/products" className="bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3 rounded-xl transition-colors">Voir les produits →</Link><button onClick={() => { setStep('upload'); setRows([]); setFile(null); setProgress(0) }} className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-8 py-3 rounded-xl transition-colors">Nouvel import</button></div>
        </motion.div>
      )}
    </div>
  )
}
