'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { ArrowLeft, UtensilsCrossed, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Menu {
  id: string;
  saptamana: string;
  zile: {
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
  const [menu, setMenu] = useState<Menu | null>(null);
  const [copilNume, setCopilNume] = useState('');
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

      // Citește meniul săptămânii curente
      const menusRef = collection(
        db,
        'organizations',
        parinteData.organizationId,
        'locations',
        parinteData.locationId,
        'menus'
      );

      const menusSnap = await getDocs(menusRef);
      
      if (!menusSnap.empty) {
        // Ia ultimul meniu (cel mai recent)
        const latestMenu = menusSnap.docs[menusSnap.docs.length - 1];
        setMenu({
          id: latestMenu.id,
          ...latestMenu.data()
        } as Menu);
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

          {/* Meniu */}
          {!menu ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Meniul nu este disponibil încă
              </h3>
              <p className="text-gray-600">
                Meniul săptămânii va fi publicat în curând
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-red-500 to-orange-500 text-white">
                <h2 className="text-2xl font-bold">{menu.saptamana}</h2>
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
                          const dayMenu = menu.zile[day.key as keyof typeof menu.zile];
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
