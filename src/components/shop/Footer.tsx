'use client'
import { useState, useEffect }
  from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone } from 'lucide-react'
import NewsletterWidget from './NewsletterWidget'

const PLATFORM_ICONS: Record<
  string, string
> = {
  facebook: '📘',
  instagram: '📸',
  tiktok: '🎵',
  youtube: '▶️',
  twitter: '𝕏',
  whatsapp: '💬',
  pinterest: '📌',
  snapchat: '👻',
  linkedin: '💼',
  threads: '🧵',
}

export default function Footer() {
  const [socialLinks, setSocialLinks] =
    useState<any[]>([])

  useEffect(() => {
    fetch('/api/shop/social-links')
      .then(r => r.json())
      .then(d => setSocialLinks(d.data || []))
      .catch(() => {})
  }, [])

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Missa Shop Logo" 
                fill 
                className="object-cover"
              />
            </div>
            <div>
              <span className="font-black text-lg text-primary">Missa</span>
              <span className="font-black text-lg text-secondary">Shop</span>
            </div>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            Votre boutique en ligne premium. Mode, beauté et lifestyle livrés partout.
          </p>
          <div className="flex gap-3">
            {socialLinks.length > 0 ? (
              <div className="flex gap-4
                items-center flex-wrap">
                {socialLinks.map(link => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.label}
                    className="w-10 h-10
                      bg-white/10 hover:bg-primary
                      rounded-xl flex items-center
                      justify-center text-lg
                      transition-all
                      hover:scale-110">
                    {PLATFORM_ICONS[link.platform]
                      || '🔗'}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-gray-500 italic">
                Suivez-nous sur nos réseaux
              </p>
            )}
          </div>
        </div>

        {/* Shop links */}
        <div>
          <h4 className="font-bold text-white mb-4">Boutique</h4>
          <ul className="space-y-2 text-sm">
            {['Femme', 'Homme', 'Enfants', 'Maison', 'Beauté', 'Promotions'].map(l => (
              <li key={l}>
                <Link href="#" className="hover:text-primary transition-colors">{l}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help links */}
        <div>
          <h4 className="font-bold text-white mb-4">Aide</h4>
          <ul className="space-y-2 text-sm">
            {['Mon compte', 'Mes commandes', 'Livraison', 'Retours', 'FAQ', 'Contact'].map(l => (
              <li key={l}>
                <Link href="#" className="hover:text-primary transition-colors">{l}</Link>
              </li>
            ))}
            <li>
              <Link href="/track" className="hover:text-primary transition-colors">Suivi de commande</Link>
            </li>
            <li>
              <Link href="/affiliates" className="hover:text-primary transition-colors">Programme affiliés</Link>
            </li>
            <li>
              <Link href="/wholesale" className="hover:text-primary transition-colors">Vente en gros</Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-6">
          <NewsletterWidget />
          
          <h4 className="font-bold text-white mb-4">Contact</h4>
          <ul className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-gray-400">
              <Mail className="w-5 h-5 text-primary" />
              <span>contact@missashopp.com</span>
            </div>
            <li className="flex gap-3">
              <Phone className="w-4 h-4 text-primary flex-shrink-0 mt-0.5"/>
              <span>+1 (555) 000-0000</span>
            </li>
          </ul>
          {/* Payment icons */}
          <div className="mt-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
              Paiements acceptés
            </p>
            <div className="flex items-center gap-2 flex-wrap">

              {/* VISA */}
              <div className="bg-white rounded-lg px-2 py-1.5 flex items-center justify-center h-8 w-14 shadow-sm">
                <svg viewBox="0 0 780 500" className="h-4 w-auto" xmlns="http://www.w3.org/2000/svg">
                  <path d="M293.2 348.7l33.4-195.6h53.4l-33.4 195.6h-53.4z" fill="#1A1F71"/>
                  <path d="M539.7 157.6c-10.6-4-27.2-8.3-48-8.3-52.9 0-90.2 26.5-90.5 64.5-.3 28.1 26.5 43.8 46.8 53.1 20.8 9.6 27.8 15.7 27.7 24.2-.1 13.1-16.6 19.1-32 19.1-21.4 0-32.8-3-50.4-10.3l-6.9-3.1-7.5 43.6c12.5 5.4 35.6 10.2 59.6 10.4 56.2 0 92.7-26.2 93.1-66.8.2-22.2-14-39.1-44.7-53.1-18.6-9-30-15-29.9-24.1 0-8.1 9.6-16.7 30.5-16.7 17.4-.3 30 3.5 39.8 7.4l4.8 2.2 7.2-43.1z" fill="#1A1F71"/>
                  <path d="M633.7 153.1h-41.4c-12.8 0-22.4 3.5-28 16.2l-79.4 179.4h56.2s9.2-24.1 11.3-29.4c6.1 0 60.7.1 68.5.1 1.6 6.9 6.5 29.3 6.5 29.3h49.7l-43.4-195.6zm-65.8 126.1c4.4-11.2 21.2-54.4 21.2-54.4s4.4-11.3 7-18.6l3.6 16.8s10.1 46.2 12.2 56.2h-44z" fill="#1A1F71"/>
                  <path d="M236.7 153.1l-52.4 133.4-5.6-27.2c-9.7-31.2-40-65-73.9-81.9l47.9 170.9 56.6-.1 84.2-195.1h-56.8z" fill="#1A1F71"/>
                  <path d="M131.4 153.1H46.2l-.7 4c66 16 109.7 54.5 127.8 100.8l-18.4-88.7c-3.2-12.3-12.5-15.7-23.5-16.1z" fill="#F9A51A"/>
                </svg>
              </div>

              {/* MASTERCARD */}
              <div className="bg-white rounded-lg px-2 py-1.5 flex items-center justify-center h-8 w-14 shadow-sm">
                <svg viewBox="0 0 131.39 86.9" className="h-5 w-auto" xmlns="http://www.w3.org/2000/svg">
                  <rect x="48.37" width="34.66" height="86.9" fill="#FF5F00"/>
                  <path d="M51.94 43.45a55.17 55.17 0 0 1 13.71-37.45 55.27 55.27 0 1 0 0 74.9 55.17 55.17 0 0 1-13.71-37.45z" fill="#EB001B"/>
                  <path d="M162.67 43.45a55.27 55.27 0 0 1-89.02 43.45 55.28 55.28 0 0 0 0-74.9 55.27 55.27 0 0 1 89.02 43.45z" fill="#F79E1B" transform="translate(-31.28)"/>
                </svg>
              </div>

              {/* PAYPAL */}
              <div className="bg-white rounded-lg px-2 py-1.5 flex items-center justify-center h-8 w-14 shadow-sm">
                <svg viewBox="0 0 124 33" className="h-4 w-auto" xmlns="http://www.w3.org/2000/svg">
                  <path d="M46.2 8.1h-7.8c-.5 0-1 .4-1.1.9l-3.2 20.2c-.1.4.2.8.6.8h3.7c.5 0 1-.4 1.1-.9l.9-5.5c.1-.5.5-.9 1.1-.9h2.5c5.1 0 8.1-2.5 8.8-7.4.4-2.2 0-3.9-1-5.1-1.2-1.3-3.2-2.1-5.6-2.1zm.9 7.3c-.4 2.8-2.6 2.8-4.6 2.8h-1.2l.8-5.1c.1-.3.3-.5.6-.5h.5c1.4 0 2.7 0 3.4.8.5.5.6 1.2.5 2z" fill="#253B80"/>
                  <path d="M73.2 15.3h-3.7c-.3 0-.6.2-.6.5l-.2 1-.3-.4c-.8-1.2-2.6-1.6-4.4-1.6-4.2 0-7.7 3.2-8.4 7.6-.4 2.2.1 4.3 1.3 5.7 1.1 1.3 2.7 1.9 4.6 1.9 3.3 0 5.2-2.1 5.2-2.1l-.2 1c-.1.4.2.8.6.8h3.4c.5 0 1-.4 1.1-.9l2-12.7c.1-.4-.2-.8-.6-.8l.1.2zm-5.2 7.4c-.4 2.1-2 3.5-4.2 3.5-1.1 0-1.9-.3-2.5-1-.6-.7-.8-1.6-.6-2.7.3-2.1 2-3.5 4.1-3.5 1.1 0 1.9.4 2.5 1 .6.7.9 1.7.7 2.7z" fill="#253B80"/>
                  <path d="M92.2 15.3h-3.8c-.3 0-.7.2-.8.5l-4.8 7.1-2-6.8c-.1-.5-.6-.8-1-.8h-3.7c-.4 0-.7.4-.6.8l3.8 11.2-3.6 5c-.3.4 0 .9.5.9h3.8c.3 0 .7-.2.8-.5l11.5-16.6c.3-.4 0-.8-.5-.8h.4z" fill="#253B80"/>
                  <path d="M104.2 8.1h-7.8c-.5 0-1 .4-1.1.9l-3.2 20.2c-.1.4.2.8.6.8h4c.4 0 .7-.3.8-.6l.9-5.8c.1-.5.5-.9 1.1-.9h2.5c5.1 0 8.1-2.5 8.8-7.4.4-2.2 0-3.9-1-5.1-1.2-1.3-3.2-2.1-5.6-2.1zm.9 7.3c-.4 2.8-2.6 2.8-4.6 2.8h-1.2l.8-5.1c.1-.3.3-.5.6-.5h.5c1.4 0 2.7 0 3.4.8.5.5.6 1.2.5 2z" fill="#179BD7"/>
                  <path d="M131.2 15.3h-3.7c-.3 0-.6.2-.6.5l-.2 1-.3-.4c-.8-1.2-2.6-1.6-4.4-1.6-4.2 0-7.7 3.2-8.4 7.6-.4 2.2.1 4.3 1.3 5.7 1.1 1.3 2.7 1.9 4.6 1.9 3.3 0 5.2-2.1 5.2-2.1l-.2 1c-.1.4.2.8.6.8h3.4c.5 0 1-.4 1.1-.9l2-12.7c.1-.4-.2-.8-.6-.8l.1.2zm-5.2 7.4c-.4 2.1-2 3.5-4.2 3.5-1.1 0-1.9-.3-2.5-1-.6-.7-.8-1.6-.6-2.7.3-2.1 2-3.5 4.1-3.5 1.1 0 1.9.4 2.5 1 .6.7.9 1.7.7 2.7z" fill="#179BD7"/>
                </svg>
              </div>

              {/* APPLE PAY */}
              <div className="bg-black rounded-lg px-2 py-1.5 flex items-center justify-center h-8 w-14 shadow-sm">
                <svg viewBox="0 0 165.52 105.96" className="h-4 w-auto" xmlns="http://www.w3.org/2000/svg">
                  <path d="M150.698 0H14.823C6.635 0 0 6.614 0 14.78v76.4c0 8.166 6.635 14.78 14.823 14.78h135.875c8.188 0 14.823-6.614 14.823-14.78V14.78C165.52 6.614 158.886 0 150.698 0z" fill="#000"/>
                  <path d="M30.75 35.155c1.68-2.107 2.814-4.983 2.504-7.887-2.42.12-5.357 1.612-7.096 3.72-1.557 1.797-2.926 4.74-2.565 7.53 2.7.21 5.452-1.368 7.157-3.363zM33.22 39.23c-3.948-.232-7.31 2.237-9.194 2.237-1.893 0-4.784-2.12-7.924-2.059-4.077.059-7.855 2.362-9.929 6.034-4.258 7.352-1.116 18.244 3.018 24.22 2.004 2.94 4.4 6.183 7.59 6.067 3.009-.12 4.192-1.95 7.852-1.95 3.664 0 4.725 1.95 7.924 1.887 3.29-.059 5.37-2.94 7.374-5.885 2.308-3.356 3.257-6.608 3.318-6.78-.065-.025-6.381-2.472-6.443-9.763-.057-6.1 4.972-9.018 5.204-9.179-2.851-4.214-7.28-4.699-8.79-4.83z" fill="#fff"/>
                  <path d="M72.007 31.945c8.892 0 15.088 6.14 15.088 15.059 0 8.948-6.323 15.117-15.304 15.117h-9.839V77.5h-7.15V31.945h17.205zm-10.055 24.04h8.156c6.197 0 9.72-3.337 9.72-9.01 0-5.673-3.523-8.98-9.691-8.98h-8.185v17.99zM89.274 66.52c0-5.732 4.39-9.248 12.18-9.693l8.98-.531v-2.54c0-3.663-2.47-5.762-6.617-5.762-3.91 0-6.352 1.86-6.943 4.784h-6.56c.384-6.108 5.614-10.611 13.74-10.611 8.067 0 13.267 4.27 13.267 10.937V77.5h-6.56V72.22h-.148c-1.924 3.516-6.106 5.762-10.434 5.762-6.47 0-10.905-4.006-10.905-11.462zm21.16-3.426v-2.6l-8.065.502c-4.024.266-6.285 1.978-6.285 4.9 0 2.984 2.35 4.784 5.938 4.784 4.714 0 8.412-3.218 8.412-7.586zM123.303 89.832c-1.335 4.21-4.71 7.076-9.958 7.076-1.068 0-1.923-.148-2.5-.296v-5.673c.591.12 1.357.21 2.13.21 2.617 0 4.036-1.157 4.627-2.985l.473-1.416-12.86-35.613h7.414l8.977 28.6h.117l8.977-28.6h7.294l-14.691 38.697z" fill="#fff"/>
                </svg>
              </div>

              {/* STRIPE */}
              <div className="bg-white rounded-lg px-2 py-1.5 flex items-center justify-center h-8 w-14 shadow-sm">
                <svg viewBox="0 0 60 25" className="h-4 w-auto" xmlns="http://www.w3.org/2000/svg">
                  <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.87zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66A11.2 11.2 0 0 1 0 19.46v-4.13c1.47.73 3.41 1.4 4.97 1.4 1.2 0 1.88-.48 1.88-1.16C6.85 14.48 0 14.26 0 9.5 0 6.72 2.07 5 5.29 5c1.43 0 2.83.23 4.28.68v4.1c-1.29-.6-2.93-1.1-4.1-1.1-1.1 0-1.7.36-1.7 1.13 0 1.37 6.4 1.03 6.4 6.21z" fill="#635BFF"/>
                </svg>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2026 Missa Shop. Tous droits réservés.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-primary transition-colors">Confidentialité</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
