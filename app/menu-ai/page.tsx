'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { 
  Utensils, 
  Loader2, 
  ChefHat,
  Apple,
  Heart,
  Droplet,
  User,
  Beef,
  Calendar,
  Trash2,
  Download,
  Plus,
  Sparkles
} from 'lucide-react';

interface MenuItem {
  name: string;
  ingredients: string[];
  ingredientsWithQuantities?: Array<{
    name: string;
    quantity: string;
  }>;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  preparation: string;
}

interface MenuType {
  type: 'normal' | 'diabet' | 'hiposodat' | 'varstnic' | 'carne';
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  description: string;
  micDejun: MenuItem;
  pranz: MenuItem;
  cina: MenuItem;
  proteinLevel?: 'mic' | 'mediu' | 'mare';
}

interface SavedMenu {
  id: string;
  ingredients: string;
  menus: MenuType[];
  createdAt: Date;
}

export default function MenuAIPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [ingredients, setIngredients] = useState('');
  const [generatedMenus, setGeneratedMenus] = useState<MenuType[]>([]);
  const [savedMenus, setSavedMenus] = useState<SavedMenu[]>([]);
  const [organizationType, setOrganizationType] = useState<string>('camin');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      try {
        const organizationRef = doc(db, 'organizations', currentUser.uid);
        const organizationSnap = await getDoc(organizationRef);
        
        if (organizationSnap.exists()) {
          const orgData = organizationSnap.data();
          setOrganizationType(orgData.type || 'camin');
        }

        await loadSavedMenus(currentUser.uid);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadSavedMenus = async (userId: string) => {
    try {
      const menusRef = collection(db, 'organizations', userId, 'menus');
      const snapshot = await getDocs(menusRef);
      
      const loaded: SavedMenu[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as SavedMenu));

      setSavedMenus(loaded.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error loading menus:', error);
    }
  };

  const handleGenerate = async () => {
    if (!ingredients.trim() || !auth.currentUser) return;

    setGenerating(true);

    try {
      const response = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ingredients.trim(),
          organizationType,
        }),
      });

      if (!response.ok) {
        throw new Error('Eroare la generarea meniurilor');
      }

      const result = await response.json();
      setGeneratedMenus(result.menus);

      // Salvează în Firebase
      const menusRef = collection(db, 'organizations', auth.currentUser.uid, 'menus');
      await addDoc(menusRef, {
        ingredients: ingredients.trim(),
        menus: result.menus,
        createdAt: Timestamp.now(),
      });

      await loadSavedMenus(auth.currentUser.uid);
      alert('Meniuri generate cu succes!');
    } catch (error) {
      console.error('Error generating menus:', error);
      alert('Eroare la generarea meniurilor. Vă rugăm să încercați din nou.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (menuId: string) => {
    if (!auth.currentUser || !confirm('Sigur doriți să ștergeți acest meniu?')) return;

    try {
      await deleteDoc(doc(db, 'organizations', auth.currentUser.uid, 'menus', menuId));
      await loadSavedMenus(auth.currentUser.uid);
    } catch (error) {
      console.error('Error deleting menu:', error);
      alert('Eroare la ștergerea meniului.');
    }
  };

  const getMenuIcon = (type: string) => {
    switch (type) {
      case 'normal': return Apple;
      case 'diabet': return Heart;
      case 'hiposodat': return Droplet;
      case 'varstnic': return User;
      case 'carne': return Beef;
      default: return Utensils;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Înapoi
          </button>
          <div className="flex items-center gap-3 mb-2">
            <ChefHat className="w-10 h-10 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Meniu AI
            </h1>
            <Sparkles className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-gray-600">
            Generează meniuri personalizate bazate pe ingredientele disponibile
          </p>
        </div>

        {/* Generator Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Plus className="w-6 h-6 text-orange-600" />
            Generează Meniuri Noi
          </h2>

          <div className="space-y-6">
            {/* Exemplu de utilizare */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Exemplu de cerere către AI:
              </h3>
              <div className="bg-white rounded-lg p-4 text-sm text-gray-700 space-y-2">
                <p className="font-semibold text-gray-900">
                  "Creează-mi următoarele meniuri complete (mic dejun, prânz, cină):
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>3 meniuri pentru diete speciale:</strong> normal, diabet, hiposodat</li>
                  <li><strong>1 meniu pentru vârstnici</strong> - optimizat pentru calorii, proteine și nutrienți esențiali</li>
                  <li><strong>3 meniuri cu carne</strong> - cu nivel de proteine mic, mediu și mare</li>
                </ul>
                <p className="mt-3">
                  IMPORTANT: La masa de prânz trebuie să ai și ciorbă obligatoriu!
                </p>
                <p className="mt-3">
                  <strong>Ingrediente disponibile:</strong> cartofi, morcovi, ceapă, usturoi, orez, paste, pui, vită, pește, ouă, lapte, brânză, ulei, făină, mălai, fasole, linte, varză, dovlecel, mere, pâine integrală"
                </p>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                💡 Copiați și adaptați acest exemplu sau scrieți cererea dvs. personalizată mai jos
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cererea dvs. către AI <span className="text-red-500">*</span>
              </label>
              <textarea
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="Scrieți aici ce tipuri de meniuri doriți și ce ingrediente aveți disponibile..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all resize-none text-gray-900"
                rows={8}
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Fiți cât mai specific: menționați tipurile de meniuri dorite și toate ingredientele disponibile
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !ingredients.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-lg font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {generating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Se generează meniurile...
                </>
              ) : (
                <>
                  <ChefHat className="w-6 h-6" />
                  Generează Meniuri cu AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated Menus Display */}
        {generatedMenus.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-600" />
              Meniuri Generate
            </h2>
            <div className="grid gap-6">
              {generatedMenus.map((menu, idx) => {
                const Icon = getMenuIcon(menu.type);
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl shadow-xl p-6 border-l-4"
                    style={{ borderColor: menu.color }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 ${menu.bgColor} rounded-lg`}>
                        <Icon className="w-6 h-6" style={{ color: menu.color }} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{menu.label}</h3>
                        <p className="text-sm text-gray-600">{menu.description}</p>
                        {menu.proteinLevel && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full mt-1 inline-block">
                            Proteine: {menu.proteinLevel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Mic Dejun */}
                      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4">
                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                          🌅 Mic Dejun
                        </h4>
                        <p className="font-semibold text-gray-800 mb-2">{menu.micDejun.name}</p>
                        
                        {/* Cantități ingrediente */}
                        {menu.micDejun.ingredientsWithQuantities && menu.micDejun.ingredientsWithQuantities.length > 0 ? (
                          <div className="mb-3 space-y-1">
                            <p className="text-xs font-semibold text-gray-700 mb-1">📋 Cantități necesare:</p>
                            {menu.micDejun.ingredientsWithQuantities.map((ing: any, i: number) => (
                              <div key={i} className="text-xs text-gray-600 bg-white rounded px-2 py-1">
                                • <strong>{ing.name}:</strong> {ing.quantity}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-600 mb-2">{menu.micDejun.ingredients.join(', ')}</p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white rounded px-2 py-1">
                            <span className="text-gray-500">Cal:</span> <strong className="text-gray-900">{menu.micDejun.calories}</strong>
                          </div>
                          <div className="bg-white rounded px-2 py-1">
                            <span className="text-gray-500">Prot:</span> <strong className="text-gray-900">{menu.micDejun.protein}g</strong>
                          </div>
                        </div>
                      </div>

                      {/* Pranz */}
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4">
                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                          ☀️ Prânz
                        </h4>
                        <p className="font-semibold text-gray-800 mb-2">{menu.pranz.name}</p>
                        
                        {/* Cantități ingrediente */}
                        {menu.pranz.ingredientsWithQuantities && menu.pranz.ingredientsWithQuantities.length > 0 ? (
                          <div className="mb-3 space-y-1">
                            <p className="text-xs font-semibold text-gray-700 mb-1">📋 Cantități necesare:</p>
                            {menu.pranz.ingredientsWithQuantities.map((ing: any, i: number) => (
                              <div key={i} className="text-xs text-gray-600 bg-white rounded px-2 py-1">
                                • <strong>{ing.name}:</strong> {ing.quantity}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-600 mb-2">{menu.pranz.ingredients.join(', ')}</p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white rounded px-2 py-1">
                            <span className="text-gray-500">Cal:</span> <strong className="text-gray-900">{menu.pranz.calories}</strong>
                          </div>
                          <div className="bg-white rounded px-2 py-1">
                            <span className="text-gray-500">Prot:</span> <strong className="text-gray-900">{menu.pranz.protein}g</strong>
                          </div>
                        </div>
                      </div>

                      {/* Cina */}
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4">
                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                          🌙 Cină
                        </h4>
                        <p className="font-semibold text-gray-800 mb-2">{menu.cina.name}</p>
                        
                        {/* Cantități ingrediente */}
                        {menu.cina.ingredientsWithQuantities && menu.cina.ingredientsWithQuantities.length > 0 ? (
                          <div className="mb-3 space-y-1">
                            <p className="text-xs font-semibold text-gray-700 mb-1">📋 Cantități necesare:</p>
                            {menu.cina.ingredientsWithQuantities.map((ing: any, i: number) => (
                              <div key={i} className="text-xs text-gray-600 bg-white rounded px-2 py-1">
                                • <strong>{ing.name}:</strong> {ing.quantity}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-600 mb-2">{menu.cina.ingredients.join(', ')}</p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white rounded px-2 py-1">
                            <span className="text-gray-500">Cal:</span> <strong className="text-gray-900">{menu.cina.calories}</strong>
                          </div>
                          <div className="bg-white rounded px-2 py-1">
                            <span className="text-gray-500">Prot:</span> <strong className="text-gray-900">{menu.cina.protein}g</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Saved Menus */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-orange-600" />
            Meniuri Salvate ({savedMenus.length})
          </h2>

          {savedMenus.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Nu aveți meniuri salvate încă. Generați primul meniu cu AI!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {savedMenus.map((saved) => (
                <div key={saved.id} className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        {saved.createdAt.toLocaleDateString('ro-RO', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-gray-700">
                        <strong>Ingrediente:</strong> {saved.ingredients}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(saved.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={() => setGeneratedMenus(saved.menus)}
                    className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-2"
                  >
                    Vezi meniurile →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
