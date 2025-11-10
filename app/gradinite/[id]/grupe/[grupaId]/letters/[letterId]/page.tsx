'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Calendar, User } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ViewLetterPage() {
  const params = useParams();
  const router = useRouter();
  const gradinitaId = params.id as string;
  const grupaId = params.grupaId as string;
  const letterId = params.letterId as string;

  const [loading, setLoading] = useState(true);
  const [letter, setLetter] = useState<any>(null);

  useEffect(() => {
    loadLetter();
  }, [letterId]);

  const loadLetter = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const letterRef = doc(
        db,
        'organizations',
        user.uid,
        'locations',
        gradinitaId,
        'weeklyLetters',
        letterId
      );
      const letterSnap = await getDoc(letterRef);

      if (letterSnap.exists()) {
        setLetter({ id: letterSnap.id, ...letterSnap.data() });
      }
    } catch (error) {
      console.error('Eroare încărcare scrisoare:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDateRange = (weekStr: string): string => {
    const [year, week] = weekStr.split('-W');
    const simple = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    
    const endDate = new Date(ISOweekStart);
    endDate.setDate(endDate.getDate() + 4);

    return `${ISOweekStart.getDate()} - ${endDate.getDate()} ${endDate.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Scrisoarea nu a fost găsită</p>
          <button
            onClick={() => router.push(`/gradinite/${gradinitaId}/grupe/${grupaId}/letters`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Înapoi la Scrisori
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
          {/* Header Scrisoare */}
          <div className={`bg-gradient-to-r ${
            letter.type === 'monday' 
              ? 'from-blue-500 to-purple-500' 
              : 'from-green-500 to-emerald-500'
          } rounded-2xl shadow-xl p-8 mb-8 text-white`}>
            <h1 className="text-4xl font-bold mb-2">
              {letter.type === 'monday' ? '🔵 Scrisoare Luni' : '🟢 Scrisoare Vineri'}
            </h1>
            <p className="text-white/90 text-xl mb-4">{letter.tema}</p>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Săptămâna {getWeekDateRange(letter.week)}
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Publicat de: {letter.publishedBy}
              </div>
            </div>
          </div>

          {/* Conținut Scrisoare */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
                {letter.generatedContent}
              </div>
            </div>
          </div>

          {/* Butoane Acțiuni */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => window.print()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              🖨️ Printează
            </button>
            <button
              onClick={() => router.push(`/gradinite/${gradinitaId}/grupe/${grupaId}/letters/${letterId}/edit`)}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              ✏️ Editează
            </button>
            <button
              onClick={() => router.push(`/gradinite/${gradinitaId}/grupe/${grupaId}/letters`)}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Înapoi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
