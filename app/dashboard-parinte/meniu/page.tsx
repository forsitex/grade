'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { ArrowLeft, UtensilsCrossed, Loader2, AlertTriangle, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Menu {
  id: string;
  weekId?: string;
  weekStart?: string;
  weekEnd?: string;
  published?: boolean;
  htmlContent?: string;
  aiGenerated?: boolean;
  isDraft?: boolean;
  title?: string;
  // Structură veche (compatibilitate)
  saptamana?: string;
  zile?: {
    luni?: DayMenu;
    marti?: DayMenu;
    miercuri?: DayMenu;
    joi?: DayMenu;
    vineri?: DayMenu;
  };
}

interface DayMenu {
  micDejun?: string;
  gustare1?: string;
  pranz?: string;
  gustare2?: string;
  cina?: string;
}

export default function MeniuParintePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>('');
  const [copilNume, setCopilNume] = useState('');
  const [gradinitaNume, setGradinitaNume] = useState('');
  const [alergii, setAlergii] = useState<string[]>([]);

  useEffect(() => {
    loadMeniu();
  }, []);

  const loadMeniu = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const parinteRef = doc(db, 'parinti', user.uid);
      const parinteSnap = await getDoc(parinteRef);

      if (!parinteSnap.exists()) {
        router.push('/login');
        return;
      }

      const parinteData = parinteSnap.data();
      setCopilNume(parinteData.copilNume);

      // Încarcă numele grădiniței
      const gradinitaRef = doc(
        db,
        'organizations',
        parinteData.organizationId,
        'locations',
        parinteData.locationId
      );
      const gradinitaSnap = await getDoc(gradinitaRef);
      if (gradinitaSnap.exists()) {
        setGradinitaNume(gradinitaSnap.data().name || '');
      }

      // Citește datele copilului pentru alergii
      const copilRef = doc(
        db,
        'organizations',
        parinteData.organizationId,
        'locations',
        parinteData.locationId,
        'children',
        parinteData.copilCnp
      );

      const copilSnap = await getDoc(copilRef);
      if (copilSnap.exists()) {
        const copilData = copilSnap.data();
        if (copilData.alergii) {
          setAlergii(copilData.alergii.split(',').map((a: string) => a.trim().toLowerCase()));
        }
      }

      // Citește TOATE meniurile publicate
      const menusRef = collection(
        db,
        'organizations',
        parinteData.organizationId,
        'locations',
        parinteData.locationId,
        'menus'
      );

      const menusSnap = await getDocs(menusRef);
      
      // Filtrează doar meniurile publicate și sortează descrescător
      const publishedMenus = menusSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Menu))
        .filter(menu => menu.published === true && !menu.isDraft)
        .sort((a, b) => {
          const dateA = a.weekStart ? new Date(a.weekStart).getTime() : 0;
          const dateB = b.weekStart ? new Date(b.weekStart).getTime() : 0;
          return dateB - dateA;
        });

      setMenus(publishedMenus);
      
      // Selectează automat meniul săptămânii curente
      const today = new Date();
      const currentWeekMenu = publishedMenus.find(menu => {
        if (!menu.weekStart || !menu.weekEnd) return false;
        const start = new Date(menu.weekStart);
        const end = new Date(menu.weekEnd);
        return today >= start && today <= end;
      });
      
      if (currentWeekMenu) {
        setSelectedMenuId(currentWeekMenu.id);
      } else if (publishedMenus.length > 0) {
        // Dacă nu există meniu pentru săptămâna curentă, selectează cel mai recent
        setSelectedMenuId(publishedMenus[0].id);
      }
    } catch (error) {
      console.error('Eroare încărcare meniu:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAllergy = (food: string) => {
    if (!food || alergii.length === 0) return false;
    const foodLower = food.toLowerCase();
    return alergii.some(alergie => foodLower.includes(alergie));
  };

  const formatWeek = (weekStart: string, weekEnd: string) => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    
    return `${start.getDate()} ${start.toLocaleDateString('ro-RO', { month: 'long' })} - ${end.getDate()} ${end.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}`;
  };

  const selectedMenu = menus.find(m => m.id === selectedMenuId);

  const days = [
    { key: 'luni', label: 'Luni' },
    { key: 'marti', label: 'Marți' },
    { key: 'miercuri', label: 'Miercuri' },
    { key: 'joi', label: 'Joi' },
    { key: 'vineri', label: 'Vineri' },
  ];

  const meals = [
    { key: 'micDejun', label: 'Mic Dejun', icon: '🌅', color: 'yellow' },
    { key: 'gustare1', label: 'Gustare 1', icon: '🍎', color: 'green' },
    { key: 'pranz', label: 'Prânz', icon: '🍽️', color: 'red' },
    { key: 'gustare2', label: 'Gustare 2', icon: '🍪', color: 'blue' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Se încarcă meniul...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard-parinte"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🍽️ Meniu Săptămânal</h1>
              <p className="text-sm text-gray-600">{copilNume}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Alergii Warning */}
          {alergii.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-red-900 mb-2">⚠️ Alergii Înregistrate</h3>
                  <p className="text-red-700">
                    Copilul are alergii la: <strong>{alergii.join(', ')}</strong>
                  </p>
                  <p className="text-red-600 text-sm mt-1">
                    Alimentele care conțin aceste ingrediente vor fi marcate cu roșu
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selector Istoric Meniuri */}
          {menus.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-orange-600" />
                <label className="text-sm font-bold text-gray-900">
                  Selectează săptămâna:
                </label>
              </div>
              <select
                value={selectedMenuId}
                onChange={(e) => setSelectedMenuId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-gray-900 font-medium"
              >
                {menus.map((menu, idx) => (
                  <option key={menu.id} value={menu.id}>
                    {idx === 0 ? '📍 ' : ''}
                    {menu.weekStart && menu.weekEnd ? formatWeek(menu.weekStart, menu.weekEnd) : menu.saptamana}
                    {idx === 0 ? ' (Curent)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Meniu */}
          {!selectedMenu ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Meniul nu este disponibil încă
              </h3>
              <p className="text-gray-600">
                Meniul săptămânii va fi publicat în curând
              </p>
            </div>
          ) : selectedMenu.htmlContent ? (
            // Afișare HTML generat de AI
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-red-500 to-orange-500 text-white">
                <h2 className="text-2xl font-bold">
                  🍽️ {selectedMenu.weekStart && selectedMenu.weekEnd ? formatWeek(selectedMenu.weekStart, selectedMenu.weekEnd) : selectedMenu.saptamana}
                </h2>
                <p className="text-white/90 text-sm mt-1">{gradinitaNume}</p>
              </div>
              <div 
                className="p-6 prose max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedMenu.htmlContent }}
              />
            </div>
          ) : (
            // Afișare tabel tradițional
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-red-500 to-orange-500 text-white">
                <h2 className="text-2xl font-bold">
                  {selectedMenu.weekStart && selectedMenu.weekEnd ? formatWeek(selectedMenu.weekStart, selectedMenu.weekEnd) : selectedMenu.saptamana}
                </h2>
                <p className="text-white/90 text-sm mt-1">{gradinitaNume}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Masa
                      </th>
                      {days.map(day => (
                        <th key={day.key} className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {meals.map(meal => (
                      <tr key={meal.key} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{meal.icon}</span>
                            <span className="font-medium text-gray-900">{meal.label}</span>
                          </div>
                        </td>
                        {days.map(day => {
                          const dayMenu = selectedMenu.zile?.[day.key as keyof typeof selectedMenu.zile];
                          const food = dayMenu?.[meal.key as keyof DayMenu];
                          const hasAllergen = food && hasAllergy(food);

                          return (
                            <td key={day.key} className="px-6 py-4 text-center">
                              {food ? (
                                <div className={`${hasAllergen ? 'bg-red-100 border-2 border-red-500' : 'bg-gray-50'} rounded-lg p-3`}>
                                  <p className={`text-sm ${hasAllergen ? 'text-red-900 font-bold' : 'text-gray-700'}`}>
                                    {food}
                                  </p>
                                  {hasAllergen && (
                                    <p className="text-xs text-red-600 mt-1 flex items-center justify-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      Alergen!
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
