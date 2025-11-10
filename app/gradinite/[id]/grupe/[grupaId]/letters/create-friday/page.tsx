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
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';

interface MomentSpecial {
  text: string;
}

export default function CreateFridayLetterPage() {
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
  const [mondayLetter, setMondayLetter] = useState<any>(null);
  
  const [tema, setTema] = useState('');
  const [momenteSpeciale, setMomenteSpeciale] = useState<MomentSpecial[]>([
    { text: '' }
  ]);
  const [progresGeneral, setProgresGeneral] = useState('');
  const [activitatiWeekend, setActivitatiWeekend] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

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

      // Încarcă date grădiniță și grupă
      const gradinitaRef = doc(db, 'organizations', user.uid, 'locations', gradinitaId);
      const gradinitaSnap = await getDoc(gradinitaRef);

      if (gradinitaSnap.exists()) {
        const data = gradinitaSnap.data();
        const grupaData = data.grupe?.find((g: any) => g.id === grupaId);
        setGrupa(grupaData);

        // Încarcă scrisoarea de Luni (pentru a prelua activitățile)
        // Folosește săptămâna selectată sau calculează săptămâna curentă
        let weekId: string;
        if (selectedWeek) {
          weekId = selectedWeek;
        } else {
          const now = new Date();
          const weekNumber = getWeekNumber(now);
          weekId = `${now.getFullYear()}-W${weekNumber}`;
        }
        const mondayLetterId = `${weekId}-monday`;

        const mondayLetterRef = doc(
          db,
          'organizations',
          user.uid,
          'locations',
          gradinitaId,
          'weeklyLetters',
          mondayLetterId
        );
        const mondayLetterSnap = await getDoc(mondayLetterRef);

        if (mondayLetterSnap.exists()) {
          const mondayData = mondayLetterSnap.data();
          setMondayLetter(mondayData);
          setTema(mondayData.tema || '');
        } else {
          alert('⚠️ Nu există scrisoare de Luni pentru săptămâna aceasta. Te rog creează mai întâi scrisoarea de Luni!');
          router.push(`/gradinite/${gradinitaId}/grupe/${grupaId}/letters`);
        }
      }
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const addMoment = () => {
    setMomenteSpeciale([...momenteSpeciale, { text: '' }]);
  };

  const removeMoment = (index: number) => {
    if (momenteSpeciale.length > 1) {
      setMomenteSpeciale(momenteSpeciale.filter((_, i) => i !== index));
    }
  };

  const updateMoment = (index: number, value: string) => {
    const newMomente = [...momenteSpeciale];
    newMomente[index].text = value;
    setMomenteSpeciale(newMomente);
  };

  const handleGenerateWithAI = async () => {
    const hasEmptyMoments = momenteSpeciale.some(m => !m.text.trim());
    if (hasEmptyMoments) {
      alert('Te rog completează toate momentele speciale!');
      return;
    }

    setAiGenerating(true);

    try {
      const response = await fetch('/api/generate-letter-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'friday',
          tema,
          activitati: mondayLetter.activitati,
          momenteSpeciale: momenteSpeciale.map(m => m.text),
          progresGeneral,
          activitatiWeekend,
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
      const letterId = `${weekId}-friday`;

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
          type: 'friday',
          week: weekId,
          grupa: grupa?.nume,
          tema,
          momenteSpeciale: momenteSpeciale.map(m => m.text),
          progresGeneral,
          activitatiWeekend,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!mondayLetter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Nu există scrisoare de Luni pentru săptămâna aceasta</p>
          <button
            onClick={() => router.push(`/gradinite/${gradinitaId}/grupe/${grupaId}/letters/create-monday`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Creează Scrisoare Luni
          </button>
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
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <h1 className="text-4xl font-bold mb-2">🟢 Scrisoare Vineri - Ce am realizat</h1>
            <p className="text-white/90 text-xl">{grupa?.nume}</p>
            <p className="text-white/80 mt-2">Tema: {tema}</p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-blue-900 mb-2">📋 Activități planificate (din scrisoarea de Luni):</h3>
            <ul className="space-y-2">
              {mondayLetter.activitati?.map((act: any, i: number) => (
                <li key={i} className="text-blue-800">
                  • <strong>{act.zi}</strong>: {act.titlu}
                </li>
              ))}
            </ul>
          </div>

          {/* Formular */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            {/* Momente Speciale */}
            <div className="mb-8">
              <label className="block text-lg font-bold text-gray-900 mb-4">
                🌟 Momente Speciale ale Săptămânii *
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Descrie 3-5 momente speciale, realizări ale copiilor, sau evenimente memorabile din această săptămână
              </p>

              <div className="space-y-4">
                {momenteSpeciale.map((moment, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={moment.text}
                      onChange={(e) => updateMoment(index, e.target.value)}
                      placeholder={`Ex: "Andrei a numărat singur până la 10!"`}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {momenteSpeciale.length > 1 && (
                      <button
                        onClick={() => removeMoment(index)}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addMoment}
                className="mt-4 flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition"
              >
                <Plus className="w-5 h-5" />
                Adaugă Moment Special
              </button>
            </div>

            {/* Progres General */}
            <div className="mb-8">
              <label className="block text-lg font-bold text-gray-900 mb-2">
                📊 Progres General (opțional)
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Descrie progresul general al grupei: limbaj, motricitate, socializare, etc.
              </p>
              <textarea
                value={progresGeneral}
                onChange={(e) => setProgresGeneral(e.target.value)}
                placeholder="Ex: Toți copiii au participat activ la activități. Am observat progrese în numărare și recunoașterea culorilor."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Activități Weekend */}
            <div className="mb-8">
              <label className="block text-lg font-bold text-gray-900 mb-2">
                🏠 Activități pentru Weekend (opțional)
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Sugestii de activități pe care părinții le pot face acasă cu copiii
              </p>
              <textarea
                value={activitatiWeekend}
                onChange={(e) => setActivitatiWeekend(e.target.value)}
                placeholder="Ex: Plimbare în parc, colectare frunze, numărare obiecte, citit povești despre toamnă"
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Buton Generează AI */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                🤖 Generează Scrisoare cu AI
              </h3>
              <p className="text-gray-600 mb-4">
                AI va crea o scrisoare detaliată despre realizările săptămânii
              </p>
              <button
                onClick={handleGenerateWithAI}
                disabled={aiGenerating}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-sans text-gray-900"
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
