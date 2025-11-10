'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Palette } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, getDoc, doc, addDoc } from 'firebase/firestore';

export default function AddActivityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gradinite, setGradinite] = useState<any[]>([]);
  const [grupe, setGrupe] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    titlu: '',
    tip: 'Artă',
    gradinitaId: '',
    grupa: '',
    grupaId: '',
    data: new Date().toISOString().split('T')[0],
    locatie: '',
    descriere: '',
    materialeNecesare: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.gradinitaId) {
      const selectedGradinita = gradinite.find(g => g.id === formData.gradinitaId);
      if (selectedGradinita?.grupe) {
        setGrupe(selectedGradinita.grupe);
      } else {
        setGrupe([]);
      }
    }
  }, [formData.gradinitaId, gradinite]);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      let organizationId = '';
      let locationId = '';
      
      // Verifică dacă e educatoare
      const educatoareRef = doc(db, 'educatoare', user.uid);
      const educatoareSnap = await getDoc(educatoareRef);
      
      if (educatoareSnap.exists()) {
        // E educatoare - încarcă doar grădinița ei
        const educatoareData = educatoareSnap.data();
        organizationId = educatoareData.organizationId;
        locationId = educatoareData.locationId;
        
        const locationsRef = collection(db, 'organizations', organizationId, 'locations');
        const locationsSnap = await getDocs(locationsRef);
        const locationData = locationsSnap.docs
          .filter(doc => doc.id === locationId)
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        
        setGradinite(locationData);
        if (locationData.length > 0) {
          setFormData(prev => ({ ...prev, gradinitaId: locationData[0].id }));
        }
      } else {
        // E admin - încarcă toate grădinițele
        organizationId = user.uid;
        
        const locationsRef = collection(db, 'organizations', organizationId, 'locations');
        const locationsSnap = await getDocs(locationsRef);
        const locationsData = locationsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setGradinite(locationsData);
        
        if (locationsData.length > 0) {
          setFormData(prev => ({ ...prev, gradinitaId: locationsData[0].id }));
        }
      }
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.titlu || !formData.gradinitaId || !formData.grupa) {
      alert('Te rugăm să completezi toate câmpurile obligatorii!');
      return;
    }

    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) return;

      let organizationId = '';
      
      // Verifică dacă e educatoare
      const educatoareRef = doc(db, 'educatoare', user.uid);
      const educatoareSnap = await getDoc(educatoareRef);
      
      if (educatoareSnap.exists()) {
        const educatoareData = educatoareSnap.data();
        organizationId = educatoareData.organizationId;
      } else {
        organizationId = user.uid;
      }

      const activitiesRef = collection(db, 'organizations', organizationId, 'locations', formData.gradinitaId, 'activities');
      
      await addDoc(activitiesRef, {
        titlu: formData.titlu,
        tip: formData.tip,
        grupa: formData.grupa,
        grupaId: formData.grupaId,
        data: formData.data,
        locatie: formData.locatie,
        descriere: formData.descriere,
        materialeNecesare: formData.materialeNecesare,
        status: 'planificat',
        participanti: [],
        poze: [],
        noteEducatoare: '',
        publicat: false,
        createdBy: user.email || '',
        createdAt: new Date()
      });

      alert('✅ Activitate adăugată cu succes!');
      router.push('/activities');
    } catch (error) {
      console.error('Eroare salvare:', error);
      alert('❌ Eroare la salvarea activității');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <div className="flex items-center gap-4">
              <Palette className="w-12 h-12" />
              <div>
                <h1 className="text-3xl font-bold">Adaugă Activitate Nouă</h1>
                <p className="text-white/90">Creează o activitate pentru grupă</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Titlu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titlu Activitate *
              </label>
              <input
                type="text"
                value={formData.titlu}
                onChange={(e) => setFormData({ ...formData, titlu: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                placeholder="Ex: Pictură cu Acuarele"
              />
            </div>

            {/* Tip */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tip Activitate *
              </label>
              <select
                value={formData.tip}
                onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
              >
                <option value="Artă">🎨 Artă</option>
                <option value="Sport">⚽ Sport</option>
                <option value="Muzică">🎵 Muzică</option>
                <option value="Dans">💃 Dans</option>
                <option value="Educație">📚 Educație</option>
                <option value="Excursie">🚌 Excursie</option>
                <option value="Altele">🎯 Altele</option>
              </select>
            </div>

            {/* Grădiniță */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grădiniță *
              </label>
              <select
                value={formData.gradinitaId}
                onChange={(e) => setFormData({ ...formData, gradinitaId: e.target.value, grupa: '', grupaId: '' })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
              >
                {gradinite.map(grad => (
                  <option key={grad.id} value={grad.id}>
                    {grad.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Grupă */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grupă *
              </label>
              {grupe.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                  Această grădiniță nu are grupe create.
                </div>
              ) : (
                <select
                  value={formData.grupa}
                  onChange={(e) => {
                    const selectedGrupa = grupe.find(g => g.nume === e.target.value);
                    setFormData({ 
                      ...formData, 
                      grupa: e.target.value,
                      grupaId: selectedGrupa?.id || ''
                    });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                >
                  <option value="">Selectează grupa</option>
                  {grupe.map(grupa => (
                    <option key={grupa.id} value={grupa.nume}>
                      {grupa.emoji} {grupa.nume}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data *
              </label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
              />
            </div>

            {/* Locație */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locație (opțional)
              </label>
              <input
                type="text"
                value={formData.locatie}
                onChange={(e) => setFormData({ ...formData, locatie: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                placeholder="Ex: Sala de Artă, Curtea grădiniței"
              />
            </div>

            {/* Descriere */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descriere
              </label>
              <textarea
                value={formData.descriere}
                onChange={(e) => setFormData({ ...formData, descriere: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                placeholder="Descrie activitatea..."
              />
            </div>

            {/* Materiale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Materiale Necesare (opțional)
              </label>
              <textarea
                value={formData.materialeNecesare}
                onChange={(e) => setFormData({ ...formData, materialeNecesare: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                placeholder="Ex: Acuarele, pensule, hârtie..."
              />
            </div>

            {/* Buton Salvare */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-pink-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-6 h-6" />
              {saving ? 'Se salvează...' : 'Salvează Activitatea'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
