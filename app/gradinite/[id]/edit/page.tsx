'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Building, MapPin, Users, Clock, Phone, Mail } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function EditGradinitaPage() {
  const router = useRouter();
  const params = useParams();
  const gradinitaId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    capacity: 0,
    program: 'Normal',
    phone: '',
    email: '',
    reprezentant: {
      name: '',
      phone: '',
      email: ''
    }
  });

  useEffect(() => {
    loadGradinita();
  }, []);

  const loadGradinita = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const gradinitaRef = doc(db, 'organizations', user.uid, 'locations', gradinitaId);
      const gradinitaSnap = await getDoc(gradinitaRef);

      if (gradinitaSnap.exists()) {
        const data = gradinitaSnap.data();
        setFormData({
          name: data.name || '',
          address: data.address || '',
          capacity: data.capacity || 0,
          program: data.program || 'Normal',
          phone: data.phone || '',
          email: data.email || '',
          reprezentant: {
            name: data.reprezentant?.name || '',
            phone: data.reprezentant?.phone || '',
            email: data.reprezentant?.email || ''
          }
        });
      } else {
        alert('Grădinița nu a fost găsită!');
        router.back();
      }
    } catch (error) {
      console.error('Eroare încărcare:', error);
      alert('Eroare la încărcarea datelor!');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.address) {
      alert('⚠️ Completează câmpurile obligatorii: Nume și Adresă!');
      return;
    }

    setSaving(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const gradinitaRef = doc(db, 'organizations', user.uid, 'locations', gradinitaId);
      await updateDoc(gradinitaRef, {
        name: formData.name,
        address: formData.address,
        capacity: parseInt(formData.capacity.toString()),
        program: formData.program,
        phone: formData.phone,
        email: formData.email,
        reprezentant: {
          name: formData.reprezentant.name,
          phone: formData.reprezentant.phone,
          email: formData.reprezentant.email
        },
        updatedAt: new Date()
      });

      alert('✅ Grădinița a fost actualizată cu succes!');
      router.push(`/gradinite/${gradinitaId}`);
    } catch (error) {
      console.error('Eroare salvare:', error);
      alert('❌ Eroare la salvarea datelor!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Editează Grădinița
            </h1>
            <p className="text-gray-600 mt-1">Actualizează informațiile grădiniței tale</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Informații Generale */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Informații Generale
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nume Grădiniță *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                  placeholder="Ex: Grădinița Soare"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Capacitate (nr. copii)
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                  placeholder="Ex: 100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Adresă *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                  placeholder="Ex: Strada Florilor, Nr. 10, București"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Program
                </label>
                <select
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                >
                  <option value="Normal">Normal (8:00 - 16:00)</option>
                  <option value="Prelungit">Prelungit (7:00 - 18:00)</option>
                  <option value="Flexibil">Flexibil</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-600" />
              Contact Grădiniță
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                  placeholder="Ex: 0721234567"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                  placeholder="Ex: contact@gradinita.ro"
                />
              </div>
            </div>
          </div>

          {/* Reprezentant */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Director/Manager
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nume Complet
                </label>
                <input
                  type="text"
                  value={formData.reprezentant.name}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    reprezentant: { ...formData.reprezentant, name: e.target.value }
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                  placeholder="Ex: Maria Popescu"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.reprezentant.phone}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    reprezentant: { ...formData.reprezentant, phone: e.target.value }
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                  placeholder="Ex: 0721234567"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.reprezentant.email}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    reprezentant: { ...formData.reprezentant, email: e.target.value }
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                  placeholder="Ex: maria@gradinita.ro"
                />
              </div>
            </div>
          </div>

          {/* Butoane */}
          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Se salvează...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvează Modificările
                </>
              )}
            </button>

            <button
              onClick={() => router.back()}
              className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
            >
              Anulează
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
