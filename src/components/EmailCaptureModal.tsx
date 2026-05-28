'use client';
import { useState } from 'react';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  productName?: string;
}

export default function EmailCaptureModal({ 
  isOpen, onClose, onSubmit, productName 
}: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Veuillez entrer un email valide');
      return;
    }
    setLoading(true);
    
    // Save email as lead in Supabase
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          source: 'product_click',
          product: productName 
        }),
      });
    } catch (err) {
      console.error('Failed to save lead:', err);
    }

    onSubmit(email);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 relative">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-black"
        >
          &times;
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🛍️</div>
          <h2 className="text-2xl font-bold text-gray-900">
            Presque là !
          </h2>
          <p className="text-gray-500 mt-2">
            Entrez votre email pour continuer votre achat
            {productName && (
              <span className="block font-medium text-gray-700 mt-1">
                "{productName}"
              </span>
            )}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="votre@email.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl 
                         focus:border-orange-400 focus:outline-none text-lg text-gray-900"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-1 font-bold">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white 
                       font-bold py-3 px-6 rounded-xl text-lg transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Chargement...' : 'Continuer mon achat →'}
          </button>
        </form>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
          <span>🔒 100% sécurisé</span>
          <span>•</span>
          <span>✉️ Pas de spam</span>
          <span>•</span>
          <span>🚚 Livraison rapide</span>
        </div>
      </div>
    </div>
  );
}
