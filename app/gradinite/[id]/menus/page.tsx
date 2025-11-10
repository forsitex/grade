'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Utensils
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';

export default function MenusPage() {
  const router = useRouter();
  const params = useParams();
  const gradinitaId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [gradinita, setGradinita] = useState<any>(null);
  const [menus, setMenus] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      // Încarcă grădinița
      const gradinitaRef = doc(db, 'organizations', user.uid, 'locations', gradinitaId);
      const gradinitaSnap = await getDoc(gradinitaRef);

      if (gradinitaSnap.exists()) {
        setGradinita(gradinitaSnap.data());
      }

      // Încarcă meniurile
      const menusRef = collection(db, 'organizations', user.uid, 'locations', gradinitaId, 'menus');
      const menusSnap = await getDocs(menusRef);
      
      const menusData = menusSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Sortează după weekStart descrescător
      menusData.sort((a: any, b: any) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
      
      setMenus(menusData);
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (menuId: string, weekStart: string) => {
    if (!confirm(`Sigur vrei să ștergi meniul pentru săptămâna ${weekStart}?`)) {
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      await deleteDoc(doc(db, 'organizations', user.uid, 'locations', gradinitaId, 'menus', menuId));
      alert('✅ Meniu șters cu succes!');
      loadData();
    } catch (error) {
      console.error('Eroare ștergere:', error);
      alert('❌ Eroare la ștergerea meniului');
    }
  };

  const formatWeek = (weekStart: string, weekEnd: string) => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    
    return `${start.getDate()} ${start.toLocaleDateString('ro-RO', { month: 'long' })} - ${end.getDate()} ${end.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}`;
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
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">🍽️ Meniuri Săptămânale</h1>
                <p className="text-white/90">{gradinita?.name}</p>
                <p className="text-sm text-white/80">Valabil pentru toate grupele</p>
              </div>
              <Link
                href={`/gradinite/${gradinitaId}/menus/add`}
                className="px-6 py-3 bg-white text-orange-600 rounded-lg font-bold hover:bg-orange-50 transition shadow-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Adaugă Meniu
              </Link>
            </div>
          </div>

          {/* Lista Meniuri */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📅 Meniuri Active ({menus.length})
            </h2>
            
            {menus.length === 0 ? (
              <div className="text-center py-12">
                <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Nu există meniuri create încă</p>
                <Link
                  href={`/gradinite/${gradinitaId}/menus/add`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition"
                >
                  <Plus className="w-5 h-5" />
                  Adaugă Primul Meniu
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {menus.map((menu) => (
                  <div
                    key={menu.id}
                    className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6 hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center text-white text-2xl">
                          🍽️
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Săptămâna {formatWeek(menu.weekStart, menu.weekEnd)}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>7 zile</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Utensils className="w-4 h-4" />
                              <span>6 categorii/zi</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/gradinite/${gradinitaId}/menus/${menu.id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Editează
                        </Link>
                        <button
                          onClick={() => handleDelete(menu.id, formatWeek(menu.weekStart, menu.weekEnd))}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Șterge
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
