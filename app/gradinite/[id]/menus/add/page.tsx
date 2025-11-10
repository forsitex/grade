'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

const ZILE = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];

const CATEGORII = [
  { id: 'micDejun', label: 'Mic dejun' },
  { id: 'gustareDimineata', label: 'Gustare de dimineață' },
  { id: 'pranz', label: 'Masă de prânz' },
  { id: 'pranzFel2', label: 'Masă de prânz (felul 2)' },
  { id: 'gustare', label: 'Gustare' },
  { id: 'seara', label: 'Masă de seară' }
];

export default function AddMenuPage() {
  const router = useRouter();
  const params = useParams();
  const gradinitaId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gradinita, setGradinita] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedDay, setSelectedDay] = useState('Luni');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newPreparat, setNewPreparat] = useState({ nume: '', descriere: '' });

  const [menuData, setMenuData] = useState<any>({
    Luni: {},
    Marți: {},
    Miercuri: {},
    Joi: {},
    Vineri: {},
    Sâmbătă: {},
    Duminică: {}
  });

  useEffect(() => {
    loadData();
    // Setează săptămâna curentă
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    setSelectedWeek(monday.toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const gradinitaRef = doc(db, 'organizations', user.uid, 'locations', gradinitaId);
      const gradinitaSnap = await getDoc(gradinitaRef);

      if (gradinitaSnap.exists()) {
        setGradinita(gradinitaSnap.data());
      }
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPreparat = () => {
    if (!selectedCategory || !newPreparat.nume.trim()) {
      alert('Te rugăm să completezi numele preparatului!');
      return;
    }

    setMenuData((prev: any) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [selectedCategory]: {
          nume: newPreparat.nume,
          descriere: newPreparat.descriere
        }
      }
    }));

    setNewPreparat({ nume: '', descriere: '' });
    setShowModal(false);
    setSelectedCategory(null);
  };

  const handleRemovePreparat = (category: string) => {
    setMenuData((prev: any) => {
      const newDayData = { ...prev[selectedDay] };
      delete newDayData[category];
      return {
        ...prev,
        [selectedDay]: newDayData
      };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) return;

      if (!selectedWeek) {
        alert('Te rugăm să selectezi săptămâna!');
        return;
      }

      // Calculează weekEnd
      const weekStart = new Date(selectedWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekId = `${weekStart.getFullYear()}-W${getWeekNumber(weekStart)}`;

      const menusRef = collection(db, 'organizations', user.uid, 'locations', gradinitaId, 'menus');
      
      await addDoc(menusRef, {
        weekId,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        year: weekStart.getFullYear(),
        weekNumber: getWeekNumber(weekStart),
        luni: menuData.Luni,
        marti: menuData.Marți,
        miercuri: menuData.Miercuri,
        joi: menuData.Joi,
        vineri: menuData.Vineri,
        sambata: menuData.Sâmbătă,
        duminica: menuData.Duminică,
        createdBy: user.email,
        createdAt: new Date()
      });

      alert('✅ Meniu salvat cu succes!');
      router.push(`/gradinite/${gradinitaId}/menus`);
    } catch (error) {
      console.error('Eroare salvare:', error);
      alert('❌ Eroare la salvarea meniului');
    } finally {
      setSaving(false);
    }
  };

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const currentDayData = menuData[selectedDay] || {};

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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <h1 className="text-3xl font-bold">🍽️ Adaugă Meniu Săptămânal</h1>
            <p className="text-white/90">{gradinita?.name}</p>
          </div>

          {/* Selector Săptămână */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selectează Săptămâna (Luni):
            </label>
            <input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 text-lg"
            />
          </div>

          {/* Tab-uri Zile */}
          <div className="bg-white rounded-t-2xl shadow-xl p-4 mb-0">
            <div className="flex gap-2 overflow-x-auto">
              {ZILE.map((zi) => (
                <button
                  key={zi}
                  onClick={() => setSelectedDay(zi)}
                  className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition ${
                    selectedDay === zi
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {zi}
                </button>
              ))}
            </div>
          </div>

          {/* Conținut Principal */}
          <div className="bg-white rounded-b-2xl shadow-xl p-0 flex">
            {/* Sidebar Categorii */}
            <div className="w-64 border-r border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-4">Categorii:</h3>
              <div className="space-y-2">
                {CATEGORII.map((cat) => {
                  const hasPreparat = currentDayData[cat.id];
                  return (
                    <div
                      key={cat.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition ${
                        hasPreparat ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setShowModal(true);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!hasPreparat}
                        readOnly
                        className="w-5 h-5"
                      />
                      <span className="text-sm text-gray-700">{cat.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Zona Principală */}
            <div className="flex-1 p-6">
              {Object.keys(currentDayData).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">
                    Nu există meniu în această zi. Clic pe butonul verde pentru a adăuga un preparat.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory(CATEGORII[0].id);
                      setShowModal(true);
                    }}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Adaugă preparat
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {CATEGORII.map((cat) => {
                    const preparat = currentDayData[cat.id];
                    if (!preparat) return null;

                    return (
                      <div key={cat.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-gray-900">{cat.label}</h4>
                            <p className="text-lg text-gray-800 mt-1">{preparat.nume}</p>
                            {preparat.descriere && (
                              <p className="text-sm text-gray-600 mt-1">{preparat.descriere}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemovePreparat(cat.id)}
                            className="text-red-600 hover:text-red-800 transition"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Buton Salvare */}
          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold text-lg hover:from-orange-700 hover:to-red-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-6 h-6" />
              {saving ? 'Se salvează...' : 'Salvează Meniu Săptămânal'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Adaugă Preparat */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Adaugă Preparat - {CATEGORII.find(c => c.id === selectedCategory)?.label}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nume preparat *
                </label>
                <input
                  type="text"
                  value={newPreparat.nume}
                  onChange={(e) => setNewPreparat({ ...newPreparat, nume: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500"
                  placeholder="Ex: Lapte + Corn flakes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descriere (opțional)
                </label>
                <textarea
                  value={newPreparat.descriere}
                  onChange={(e) => setNewPreparat({ ...newPreparat, descriere: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500"
                  placeholder="Detalii despre preparat..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewPreparat({ nume: '', descriere: '' });
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition"
              >
                Anulează
              </button>
              <button
                onClick={handleAddPreparat}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
              >
                Adaugă
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
