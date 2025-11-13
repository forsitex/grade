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
  Utensils,
  Eye,
  EyeOff,
  Edit2
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';

export default function MenusPage() {
  const router = useRouter();
  const params = useParams();
  const gradinitaId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [gradinita, setGradinita] = useState<any>(null);
  const [menus, setMenus] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'draft' | 'scheduled'>('draft');
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

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

      // Încărcă meniurile
      const menusRef = collection(db, 'organizations', user.uid, 'locations', gradinitaId, 'menus');
      const menusSnap = await getDocs(menusRef);
      
      const menusData = menusSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Verifică și mută automat meniurile expirate în draft
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const menu of menusData) {
        if (!menu.isDraft && menu.weekEnd) {
          const weekEndDate = new Date(menu.weekEnd);
          weekEndDate.setHours(23, 59, 59, 999);
          
          // Dacă săptămâna s-a terminat, mută în draft
          if (today > weekEndDate) {
            const menuDocRef = doc(db, 'organizations', user.uid, 'locations', gradinitaId, 'menus', menu.id);
            
            // Înlocuiește datele cu placeholder-uri în HTML
            let resetHtmlContent = menu.htmlContent;
            if (resetHtmlContent && menu.aiGenerated) {
              const days = ['LUNI', 'MARȚI', 'MIERCURI', 'JOI', 'VINERI'];
              days.forEach((day) => {
                // Regex care suportă caractere românești (ă, â, î, ș, ț)
                const regex = new RegExp(`${day}\\s*-\\s*\\d{1,2}\\s+[a-zA-ZăâîșțĂÂÎȘȚ]+\\s+\\d{4}`, 'gi');
                resetHtmlContent = resetHtmlContent.replace(regex, `${day} - [DATA]`);
              });
            }
            
            await updateDoc(menuDocRef, {
              isDraft: true,
              published: false,
              weekStart: null,
              weekEnd: null,
              weekId: null,
              year: null,
              weekNumber: null,
              htmlContent: resetHtmlContent,
              movedToDraftAt: new Date()
            });
            
            // Actualizează și în array-ul local
            menu.isDraft = true;
            menu.published = false;
            menu.weekStart = null;
            menu.weekEnd = null;
            menu.htmlContent = resetHtmlContent;
          }
        }
      }

      // Sortează după createdAt descrescător
      menusData.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
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

  const handleTogglePublish = async (menuId: string, currentStatus: boolean) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const menuRef = doc(db, 'organizations', user.uid, 'locations', gradinitaId, 'menus', menuId);
      await updateDoc(menuRef, {
        published: !currentStatus,
        updatedAt: new Date()
      });

      alert(currentStatus ? '❌ Meniu ascuns de la părinți' : '✅ Meniu publicat pentru părinți!');
      loadData();
    } catch (error) {
      console.error('Eroare actualizare:', error);
      alert('❌ Eroare la actualizarea meniului');
    }
  };

  const handleRenameMenu = async (menuId: string) => {
    if (!editingTitle.trim()) {
      alert('Te rugăm să introduci un titlu!');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const menuRef = doc(db, 'organizations', user.uid, 'locations', gradinitaId, 'menus', menuId);
      await updateDoc(menuRef, {
        title: editingTitle.trim(),
        updatedAt: new Date()
      });

      setEditingMenuId(null);
      setEditingTitle('');
      alert('✅ Titlu actualizat cu succes!');
      loadData();
    } catch (error) {
      console.error('Eroare redenumire:', error);
      alert('❌ Eroare la redenumirea meniului');
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

          {/* Tab-uri */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex gap-4 border-b-2 border-gray-200">
              <button
                onClick={() => setActiveTab('draft')}
                className={`px-6 py-3 font-bold transition relative ${
                  activeTab === 'draft'
                    ? 'text-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📋 Meniuri Draft
                {activeTab === 'draft' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-t" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`px-6 py-3 font-bold transition relative ${
                  activeTab === 'scheduled'
                    ? 'text-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📅 Meniuri Programate
                {activeTab === 'scheduled' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-t" />
                )}
              </button>
            </div>
          </div>

          {/* Lista Meniuri */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {activeTab === 'draft' ? '📋 Meniuri Draft' : '📅 Meniuri Programate'} ({menus.filter(m => activeTab === 'draft' ? m.isDraft : !m.isDraft).length})
            </h2>
            
            {menus.filter(m => activeTab === 'draft' ? m.isDraft : !m.isDraft).length === 0 ? (
              <div className="text-center py-12">
                <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {activeTab === 'draft' 
                    ? 'Nu există meniuri draft. Generează un meniu nou!' 
                    : 'Nu există meniuri programate. Programează un meniu draft pe calendar!'}
                </p>
                {activeTab === 'draft' && (
                  <Link
                    href={`/gradinite/${gradinitaId}/menus/add`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Generează Meniu
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {menus.filter(m => activeTab === 'draft' ? m.isDraft : !m.isDraft).map((menu) => (
                  <div
                    key={menu.id}
                    className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6 hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center text-white text-2xl">
                          🍽️
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            {editingMenuId === menu.id ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  className="px-3 py-2 border-2 border-purple-500 rounded-lg text-lg font-bold flex-1"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameMenu(menu.id);
                                    if (e.key === 'Escape') {
                                      setEditingMenuId(null);
                                      setEditingTitle('');
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => handleRenameMenu(menu.id)}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                                >
                                  ✅ Salvează
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingMenuId(null);
                                    setEditingTitle('');
                                  }}
                                  className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
                                >
                                  ❌ Anulează
                                </button>
                              </div>
                            ) : (
                              <>
                                <h3 className="text-xl font-bold text-gray-900">
                                  {menu.title || 'Meniu fără titlu'}
                                </h3>
                                <button
                                  onClick={() => {
                                    setEditingMenuId(menu.id);
                                    setEditingTitle(menu.title || '');
                                  }}
                                  className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                  title="Redenumeşte meniu"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {menu.isDraft ? (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                                📋 DRAFT
                              </span>
                            ) : (
                              <>
                                {menu.published ? (
                                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    Vizibil Părinți
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full flex items-center gap-1">
                                    <EyeOff className="w-3 h-3" />
                                    Ascuns
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            {menu.weekStart && menu.weekEnd ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatWeek(menu.weekStart, menu.weekEnd)}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Neprogramat</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Utensils className="w-4 h-4" />
                              <span>{menu.aiGenerated ? 'AI' : 'Manual'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {menu.isDraft ? (
                          <>
                            <Link
                              href={`/gradinite/${gradinitaId}/menus/calendar?menuId=${menu.id}`}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
                            >
                              <Calendar className="w-4 h-4" />
                              Programează
                            </Link>
                            <Link
                              href={`/gradinite/${gradinitaId}/menus/${menu.id}`}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Preview
                            </Link>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleTogglePublish(menu.id, menu.published)}
                              className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                                menu.published
                                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {menu.published ? (
                                <>
                                  <EyeOff className="w-4 h-4" />
                                  Ascunde
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4" />
                                  Publică
                                </>
                              )}
                            </button>
                            <Link
                              href={`/gradinite/${gradinitaId}/menus/${menu.id}`}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Editează
                            </Link>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(menu.id, menu.title || 'Meniu')}
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
