'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Baby, Save } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function AddGradinitaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    capacity: '',
    numarGrupe: '',
    program: '',
    reprezentantName: '',
    reprezentantPhone: '',
    reprezentantEmail: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      // Generare ID unic pentru grădiniță
      const gradinitaId = formData.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
      
      // Salvare grădiniță în Firestore
      const locationRef = doc(db, 'organizations', user.uid, 'locations', gradinitaId);
      await setDoc(locationRef, {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        capacity: parseInt(formData.capacity) || 0,
        numarGrupe: parseInt(formData.numarGrupe) || 0,
        program: formData.program,
        type: 'gradinita',
        reprezentant: {
          name: formData.reprezentantName,
          phone: formData.reprezentantPhone,
          email: formData.reprezentantEmail,
        },
        createdAt: Date.now(),
      });

      console.log('✅ Grădiniță adăugată cu succes!');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('❌ Eroare salvare grădiniță:', err);
      setError('Eroare la salvarea grădiniței. Te rugăm să încerci din nou.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi la Dashboard
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Icon */}
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Baby className="w-10 h-10 text-blue-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
              Adaugă Grădiniță Nouă
            </h1>
            <p className="text-gray-600 text-center mb-8">
              Completează informațiile despre grădiniță
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informații Grădiniță */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Informații Grădiniță</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nume Grădiniță *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="ex: Grădinița Copilului Fericit"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresă *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="ex: Str. Principală 123, București"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="ex: 0212345678"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="ex: contact@gradinita.ro"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacitate (copii) *
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => handleChange('capacity', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="ex: 100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Program *
                    </label>
                    <select
                      value={formData.program}
                      onChange={(e) => handleChange('program', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Selectează program</option>
                      <option value="Normal">Normal (8:00-16:00)</option>
                      <option value="Prelungit">Prelungit (7:00-18:00)</option>
                      <option value="Săptămânal">Săptămânal (cu cazare)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Reprezentant */}
              <div className="space-y-4 pt-6 border-t">
                <h2 className="text-lg font-semibold text-gray-900">Reprezentant Grădiniță</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nume Complet
                  </label>
                  <input
                    type="text"
                    value={formData.reprezentantName}
                    onChange={(e) => handleChange('reprezentantName', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="ex: Ion Popescu"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.reprezentantPhone}
                      onChange={(e) => handleChange('reprezentantPhone', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="ex: 0712345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.reprezentantEmail}
                      onChange={(e) => handleChange('reprezentantEmail', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="ex: ion@gradinita.ro"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Se salvează...' : 'Salvează Grădiniță'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
