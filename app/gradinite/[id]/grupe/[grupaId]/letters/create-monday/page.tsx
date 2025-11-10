'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  Eye
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface Activity {
  zi: string;
  titlu: string;
  descriere: string;
  domeniu: string;
}

export default function CreateMondayLetterPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gradinitaId = params.id as string;
  const grupaId = params.grupaId as string;
  
  // Citește săptămâna din URL sau folosește săptămâna curentă
  const selectedWeek = searchParams.get('week');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [grupa, setGrupa] = useState<any>(null);
  
  const [tema, setTema] = useState('');
  const [activitati, setActivitati] = useState<Activity[]>([
    { zi: 'Luni', titlu: '', descriere: '', domeniu: '' }
  ]);
  const [materiale, setMateriale] = useState('');
  const [anunturi, setAnunturi] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const zile = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri'];
  const domenii = [
    'DLC - Limbă și comunicare',
    'DȘ - Matematică și științe ale naturii',
    'DOS - Om și societate',
    'DEC - Estetic și creativ (arte, muzică, dramă)',
    'DPM - Psiho-motric (educație fizică, mișcare)'
  ];

  useEffect(() => {
    loadData();
  }, [gradinitaId, grupaId]);

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
        const data = gradinitaSnap.data();
        const grupaData = data.grupe?.find((g: any) => g.id === grupaId);
        setGrupa(grupaData);
      }
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

  const addActivity = () => {
    setActivitati([...activitati, { zi: 'Luni', titlu: '', descriere: '', domeniu: '' }]);
  };

  const removeActivity = (index: number) => {
    if (activitati.length > 1) {
      setActivitati(activitati.filter((_, i) => i !== index));
    }
  };

  const updateActivity = (index: number, field: keyof Activity, value: string) => {
    const newActivitati = [...activitati];
    newActivitati[index][field] = value;
    setActivitati(newActivitati);
  };

  const handleGenerateWithAI = async () => {
    if (!tema.trim()) {
      alert('Te rog completează tema săptămânii!');
      return;
    }

    const hasEmptyActivities = activitati.some(act => !act.titlu.trim() || !act.descriere.trim());
    if (hasEmptyActivities) {
      alert('Te rog completează toate activitățile (titlu și descriere)!');
      return;
    }

    setAiGenerating(true);

    try {
      const response = await fetch('/api/generate-letter-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'monday',
          tema,
          activitati,
          materiale,
          anunturi,
          grupa: grupa?.nume
        })
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedContent(data.content);
        setShowPreview(true);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Eroare generare AI:', error);
      alert('Eroare la generarea scrisorii cu AI. Te rog încearcă din nou.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedContent) {
      alert('Te rog generează scrisoarea cu AI mai întâi!');
      return;
    }

    setSaving(true);

    try {
      const user = auth.currentUser;
      if (!user) return;

      // Folosește săptămâna selectată sau calculează săptămâna curentă
      let weekId: string;
      if (selectedWeek) {
        weekId = selectedWeek;
      } else {
        const now = new Date();
        const weekNumber = getWeekNumber(now);
        weekId = `${now.getFullYear()}-W${weekNumber}`;
      }
      const letterId = `${weekId}-monday`;

      await setDoc(
        doc(
          db,
          'organizations',
          user.uid,
          'locations',
          gradinitaId,
          'weeklyLetters',
          letterId
        ),
        {
          type: 'monday',
          week: weekId,
          grupa: grupa?.nume,
          tema,
          activitati,
          materiale,
          anunturi,
          generatedContent,
          publishedAt: serverTimestamp(),
          publishedBy: user.email || 'Educatoare',
          isPlanned: !!selectedWeek // Flag pentru a marca dacă e planificare în avans
        }
      );

      alert('✅ Scrisoarea a fost publicată cu succes!');
      router.push(`/gradinite/${gradinitaId}/grupe/${grupaId}/letters`);
    } catch (error) {
      console.error('Eroare publicare:', error);
      alert('Eroare la publicare. Te rog încearcă din nou.');
    } finally {
      setSaving(false);
    }
  };

  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => router.push(`/gradinite/${gradinitaId}/grupe/${grupaId}/letters`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi la Scrisori
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <h1 className="text-4xl font-bold mb-2">📬 Scrisoare Luni - Planul Săptămânii</h1>
            <p className="text-white/90 text-xl">{grupa?.nume}</p>
          </div>

          {/* Formular */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            {/* Tema Săptămânii */}
            <div className="mb-8">
              <label className="block text-lg font-bold text-gray-900 mb-2">
                🎨 Tema Săptămânii *
              </label>
              <input
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder='Ex: "Toamna și Culorile Ei"'
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Activități */}
            <div className="mb-8">
              <label className="block text-lg font-bold text-gray-900 mb-4">
                📚 Activități Planificate *
              </label>

              <div className="space-y-6">
                {activitati.map((activitate, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-xl p-6 relative">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Activitate #{index + 1}</h3>
                      {activitati.length > 1 && (
                        <button
                          onClick={() => removeActivity(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Zi *
                        </label>
                        <select
                          value={activitate.zi}
                          onChange={(e) => updateActivity(index, 'zi', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {zile.map(zi => (
                            <option key={zi} value={zi}>{zi}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Domeniu (opțional)
                        </label>
                        <select
                          value={activitate.domeniu}
                          onChange={(e) => updateActivity(index, 'domeniu', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Selectează domeniu...</option>
                          {domenii.map(dom => (
                            <option key={dom} value={dom}>{dom}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Titlu Activitate *
                      </label>
                      <input
                        type="text"
                        value={activitate.titlu}
                        onChange={(e) => updateActivity(index, 'titlu', e.target.value)}
                        placeholder='Ex: "Colaj cu frunze uscate"'
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Descriere Scurtă *
                      </label>
                      <textarea
                        value={activitate.descriere}
                        onChange={(e) => updateActivity(index, 'descriere', e.target.value)}
                        placeholder="Ex: Copiii vor crea tablouri artistice folosind frunze reale uscate"
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addActivity}
                className="mt-4 flex items-center gap-2 px-6 py-3 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition"
              >
                <Plus className="w-5 h-5" />
                Adaugă Activitate
              </button>
            </div>

            {/* Materiale */}
            <div className="mb-8">
              <label className="block text-lg font-bold text-gray-900 mb-2">
                📦 Materiale Necesare (opțional)
              </label>
              <textarea
                value={materiale}
                onChange={(e) => setMateriale(e.target.value)}
                placeholder="Ex: Frunze uscate, mere, haine groase pentru exterior"
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Anunțuri */}
            <div className="mb-8">
              <label className="block text-lg font-bold text-gray-900 mb-2">
                📢 Anunțuri Importante (opțional)
              </label>
              <textarea
                value={anunturi}
                onChange={(e) => setAnunturi(e.target.value)}
                placeholder="Ex: Vineri - Ziua Toamnei. Veniți îmbrăcați în culori de toamnă!"
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Buton Generează AI */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                🤖 Generează Scrisoare cu AI
              </h3>
              <p className="text-gray-600 mb-4">
                AI va crea o scrisoare detaliată și prietenoasă pentru fiecare activitate
              </p>
              <button
                onClick={handleGenerateWithAI}
                disabled={aiGenerating}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
              >
                <Sparkles className="w-6 h-6" />
                {aiGenerating ? 'Se generează...' : '🤖 Generează cu AI'}
              </button>
            </div>
          </div>

          {/* Butoane Acțiuni */}
          <div className="flex gap-4">
            {generatedContent && (
              <>
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                >
                  <Eye className="w-5 h-5" />
                  Preview
                </button>
                <button
                  onClick={handlePublish}
                  disabled={saving}
                  className="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {saving ? 'Se publică...' : '✅ Publică Scrisoarea'}
                </button>
              </>
            )}
            <button
              onClick={() => router.push(`/gradinite/${gradinitaId}/grupe/${grupaId}/letters`)}
              className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
            >
              Anulează
            </button>
          </div>
        </div>
      </div>

      {/* Modal Preview */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl max-h-[85vh] overflow-y-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">👁️ Preview Scrisoare</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📝 Conținut Scrisoare (poți edita textul generat de AI)
              </label>
              <textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                rows={25}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans text-gray-900"
                style={{ whiteSpace: 'pre-wrap' }}
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 Poți edita textul generat de AI înainte de a publica scrisoarea
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePublish}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                {saving ? 'Se publică...' : '✅ Publică'}
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Închide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
