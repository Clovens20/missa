'use client'
import { Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: Truck,
    title: 'Livraison Rapide',
    desc: 'Livraison internationale en un temps record',
    color: 'text-primary',
    bg: 'bg-orange-50',
  },
  {
    icon: ShieldCheck,
    title: 'Paiement Sécurisé',
    desc: 'Transactions 100% sécurisées et cryptées',
    color: 'text-secondary',
    bg: 'bg-green-50',
  },
  {
    icon: RotateCcw,
    title: 'Retours Faciles',
    desc: '30 jours pour changer d\'avis',
    color: 'text-primary',
    bg: 'bg-orange-50',
  },
  {
    icon: Headphones,
    title: 'Support 24/7',
    desc: 'Une équipe dédiée pour vous aider',
    color: 'text-secondary',
    bg: 'bg-green-50',
  },
]

export default function WhyUs() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center p-6 rounded-3xl hover:shadow-xl transition-shadow border border-gray-50">
              <div className={`w-16 h-16 ${f.bg} ${f.color} rounded-2xl flex items-center justify-center mb-4`}>
                <f.icon className="w-8 h-8"/>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
