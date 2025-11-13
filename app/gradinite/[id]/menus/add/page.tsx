'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Plus, X, Sparkles, Eye, EyeOff, FileText } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import MenuAnalysisUpload from '@/components/MenuAnalysisUpload';

const ZILE = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri'];

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
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysisData, setAiAnalysisData] = useState<any>(null);
  const [showExample, setShowExample] = useState(false);
  const [numarCopii, setNumarCopii] = useState<number>(20);

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

      // Calculează numărul de copii înscriși
      const childrenRef = collection(db, 'organizations', user.uid, 'locations', gradinitaId, 'children');
      const childrenSnap = await getDocs(childrenRef);
      const totalCopii = childrenSnap.size;
      
      if (totalCopii > 0) {
        setNumarCopii(totalCopii);
        console.log(`✅ Număr copii înscriși: ${totalCopii}`);
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

  const handleSaveAIMenu = async (htmlContent: string, metadata: any) => {
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
        published: true,
        // Salvare HTML generat de AI
        aiGenerated: true,
        htmlContent: htmlContent,
        numarCopii: metadata?.numarCopii || 20,
        generatedModel: metadata?.model || 'groq',
        generatedCost: metadata?.cost || '0',
        // Păstrare structură veche pentru compatibilitate
        luni: {},
        marti: {},
        miercuri: {},
        joi: {},
        vineri: {},
        sambata: {},
        duminica: {},
        createdBy: user.email,
        createdAt: new Date()
      });

      alert('✅ Meniu AI salvat cu succes!');
      router.push(`/gradinite/${gradinitaId}/menus`);
    } catch (error) {
      console.error('Eroare salvare:', error);
      alert('❌ Eroare la salvarea meniului');
    } finally {
      setSaving(false);
    }
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
        published: true,
        aiGenerated: false,
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">🍽️ Adaugă Meniu Săptămânal</h1>
                <p className="text-white/90">{gradinita?.name}</p>
              </div>
              <button
                onClick={() => setShowAIAnalysis(!showAIAnalysis)}
                className="px-6 py-3 bg-white text-orange-600 rounded-lg font-bold hover:bg-orange-50 transition shadow-lg flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {showAIAnalysis ? 'Mod Manual' : 'Generează cu AI'}
              </button>
            </div>
          </div>

          {/* AI Analysis Section */}
          {showAIAnalysis && (
            <>
              {/* Card Vezi Exemplu */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-purple-600" />
                    <h3 className="text-xl font-bold text-gray-900">Exemplu Meniu pentru AI</h3>
                  </div>
                  <button
                    onClick={() => setShowExample(!showExample)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center gap-2"
                  >
                    {showExample ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Ascunde
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Vezi Exemplu
                      </>
                    )}
                  </button>
                </div>
                
                {showExample && (
                  <div className="bg-white rounded-xl p-6 border-2 border-purple-100 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
{`LUNI

Mic dejun (8:00-8:30):
Lapte integral pasteurizat 3.5% grăsime
Corn flakes cu miere
Pâine albă proaspătă
Unt 82% grăsime
Gem de căpșuni

Gustare de dimineață (10:00):
Mere Golden proaspete
Biscuiți Petit Beurre

Masă de prânz (12:00-12:30):
Supă cremă de legume (morcovi, cartofi, țelină, ceapă, smântână 20%)
Piept de pui la grătar
Orez alb fiert
Salată de varză albă cu morcovi și ulei de floarea soarelui

Masă de prânz - felul 2:
Compot de mere cu scorțișoară

Gustare (15:00):
Iaurt natural 3.5% grăsime
Miere de albine
Banane

Masă de seară (17:00):
Omletă din 2 ouă cu brânză telemea și roșii proaspete
Pâine integrală

═══════════════════════════════════════════════════════════════

MARȚI

Mic dejun:
Lapte cald cu cacao Nesquik
Clătite cu brânză de vaci dulce și stafide
Zahăr pudră

Gustare de dimineață:
Portocale proaspete
Stafide sultanine

Masă de prânz:
Ciorbă de legume cu smântână (cartofi, morcovi, păstârnac, pătrunjel, ardei, smântână)
Chiftele din carne de vită tocată cu pâine și ou
Piure de cartofi cu lapte și unt
Salată de castraveți murați

Masă de prânz - felul 2:
Salată de castraveți proaspeți cu smântână

Gustare:
Brânză de vaci 5% grăsime
Smântână 20%
Pâine prăjită

Masă de seară:
Paste integrale penne cu sos de roșii (roșii, usturoi, busuioc, ulei măsline)
Parmezan ras
Salată verde (iceberg, rucola, ulei măsline, lămâie)

═══════════════════════════════════════════════════════════════

MIERCURI

Mic dejun:
Lapte integral
Fulgi de ovăz cu miere și nuci
Pâine graham
Miere poliflora

Gustare de dimineață:
Kiwi proaspăt
Biscuiți cu susan

Masă de prânz:
Supă de pui cu tăieței de casă (piept pui, morcovi, ceapă, pătrunjel, tăieței ouă)
File de pește pangasius la cuptor cu lămâie
Cartofi natur fierți
Salată de sfeclă roșie cu ulei

Masă de prânz - felul 2:
Salată de varză roșie cu mere

Gustare:
Budincă de vanilie Dr. Oetker
Pere Williams proaspete

Masă de seară:
Terci de griș cu lapte, scorțișoară și zahăr
Compot de prune uscate

═══════════════════════════════════════════════════════════════

JOI

Mic dejun:
Lapte cu miere
Pâine albă
Unt de arahide Nutella

Gustare de dimineață:
Struguri albi fără sâmburi
Nuci

Masă de prânz:
Ciorbă de fasole boabe cu afumătură (fasole albă, ciolan afumat, morcovi, ceapă, ardei, bulion)
Tocană de vită cu ceapă și ardei gras
Mămăligă

Masă de prânz - felul 2:
Murături asortate (gogonele, ardei, varză)

Gustare:
Brânză telemea
Roșii proaspete
Pâine albă

Masă de seară:
Orez cu legume (mazăre congelată, morcovi, porumb dulce conservă, ceapă, ulei)
Salată de varză albă cu lămâie

═══════════════════════════════════════════════════════════════

VINERI

Mic dejun:
Lapte integral
Cereale Nesquik ciocolată
Pâine albă
Gem de zmeură

Gustare de dimineață:
Mandarine proaspete
Biscuiți cu ovăz și ciocolată

Masă de prânz:
Supă cremă de ciuperci champignon cu smântână și crutoane
Pulpe de pui la cuptor cu condimente
Cartofi wedges la cuptor cu rozmarin
Salată de morcovi rasa cu lămâie și zahăr

Masă de prânz - felul 2:
Sos de usturoi cu smântână

Gustare:
Iaurt cu fructe de pădure (căpșuni, afine, zmeură)
Biscuiți digestivi

Masă de seară:
Pizza cu șuncă presată, mozzarella, sos roșii, oregano
Salată de roșii cu ulei măsline`}
                    </pre>
                  </div>
                )}
                
                <p className="text-sm text-purple-700 mt-4">
                  💡 <strong>Sfat:</strong> Folosește acest format când încarci fișierul pentru a obține cele mai bune rezultate de la AI!
                </p>
              </div>

              <div className="mb-6">
                <MenuAnalysisUpload
                initialNumarCopii={numarCopii}
                onSaveMenu={handleSaveAIMenu}
                onAnalysisComplete={(analysis) => {
                  setAiAnalysisData(analysis);
                  // Auto-populate menu data from AI analysis
                  if (analysis.preparate) {
                    const newMenuData: any = {
                      Luni: {},
                      Marți: {},
                      Miercuri: {},
                      Joi: {},
                      Vineri: {},
                      Sâmbătă: {},
                      Duminică: {}
                    };

                    analysis.preparate.forEach((preparat: any) => {
                      const zi = preparat.zi;
                      const categorieMap: any = {
                        'Mic dejun': 'micDejun',
                        'Gustare de dimineață': 'gustareDimineata',
                        'Masă de prânz': 'pranz',
                        'Masă de prânz (felul 2)': 'pranzFel2',
                        'Gustare': 'gustare',
                        'Masă de seară': 'seara'
                      };

                      const categorieId = categorieMap[preparat.categorie];
                      if (zi && categorieId && newMenuData[zi]) {
                        newMenuData[zi][categorieId] = {
                          nume: preparat.nume,
                          descriere: preparat.ingrediente?.map((i: any) => i.nume).join(', ') || '',
                          aiData: preparat
                        };
                      }
                    });

                    setMenuData(newMenuData);
                    alert('✅ Meniul a fost generat automat din analiza AI!');
                  }
                }}
              />
            </div>
            </>
          )}

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
