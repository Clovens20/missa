'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import BundleCard from './BundleCard'

function BundlesSection() {
  const [bundles, setBundles] = useState<any[]>([])
  const [featureOn, setFeatureOn] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function load() {
      try {
        const { data: setting } = await supabase.from('site_settings').select('value').eq('key', 'feature_bundles').single()
        if (setting?.value === true || setting?.value === 'true') {
          setFeatureOn(true)
          const { data } = await supabase.from('bundles').select('*').eq('is_active', true).order('is_featured', { ascending: false }).limit(6)
          setBundles(data || [])
        }
      } catch (e) {
        console.error('Bundles load error:', e)
      }
    }
    load()
  }, [])

  if (!mounted || !featureOn || bundles.length === 0) return null

  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">🎁 Bundles — Économisez gros</h2>
          <p className="text-gray-500">Des ensembles soigneusement sélectionnés à prix réduit</p>
          <div className="w-16 h-1 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mt-4"/>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle, i) => (
            <motion.div key={bundle.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <BundleCard bundle={bundle}/>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default BundlesSection
