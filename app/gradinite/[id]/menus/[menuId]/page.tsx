'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function EditMenuPage() {
  const router = useRouter();
  const params = useParams();
  const gradinitaId = params.id as string;
  const menuId = params.menuId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState<any>(null);
  const [gradinita, setGradinita] = useState<any>(null);
  const [editableHtml, setEditableHtml] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

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

      const gradinitaRef = doc(db, 'organizations', user.uid, 'locations', gradinitaId);
      const gradinitaSnap = await getDoc(gradinitaRef);

      if (gradinitaSnap.exists()) {
        setGradinita(gradinitaSnap.data());
      }

      const menuRef = doc(db, 'organizations', user.uid, 'locations', gradinitaId, 'menus', menuId);
      const menuSnap = await getDoc(menuRef);

      if (menuSnap.exists()) {
        const menuData = { id: menuSnap.id, ...menuSnap.data() };
        setMenu(menuData);
        setEditableHtml(menuData.htmlContent || '');
      }
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) return;

      const menuRef = doc(db, 'organizations', user.uid, 'locations', gradinitaId, 'menus', menuId);
      
      await updateDoc(menuRef, {
        htmlContent: editableHtml,
        updatedAt: new Date()
      });

      setIsEditing(false);
      alert('✅ Meniu actualizat cu succes!');
    } catch (error) {
      console.error('Eroare salvare:', error);
      alert('❌ Eroare la salvarea meniului');
    } finally {
      setSaving(false);
    }
  };

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    setEditableHtml(e.currentTarget.innerHTML);
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

  if (!menu) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Meniu nu a fost găsit</p>
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
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">📝 Editează Meniu</h1>
                <p className="text-white/90">{gradinita?.name}</p>
                <p className="text-sm text-white/80">
                  Săptămâna {menu.weekStart} - {menu.weekEnd}
                </p>
              </div>
              <div className="flex gap-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition shadow-lg"
                  >
                    ✏️ Editează
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-3 bg-white text-green-600 rounded-lg font-bold hover:bg-green-50 transition shadow-lg flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-5 h-5" />
                      {saving ? 'Se salvează...' : 'Salvează'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditableHtml(menu.htmlContent || '');
                      }}
                      className="px-6 py-3 bg-white text-red-600 rounded-lg font-bold hover:bg-red-50 transition shadow-lg"
                    >
                      ❌ Anulează
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Menu Content */}
          {menu.aiGenerated && menu.htmlContent ? (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              {isEditing && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 font-semibold">
                    ⚠️ Mod editare activ - Click pe text pentru a edita
                  </p>
                </div>
              )}
              <div 
                contentEditable={isEditing}
                onInput={handleContentChange}
                dangerouslySetInnerHTML={{ __html: editableHtml }}
                className={isEditing ? 'border-2 border-blue-300 rounded-lg p-4 focus:outline-none focus:border-blue-500' : ''}
                suppressContentEditableWarning
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <p className="text-gray-600">
                Acest meniu a fost creat manual și nu poate fi editat aici.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
