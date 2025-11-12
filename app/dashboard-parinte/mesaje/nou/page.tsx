'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, Timestamp, query, where } from 'firebase/firestore';
import { 
  ArrowLeft,
  Send,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import BrandHeader from '@/components/BrandHeader';

interface Educatoare {
  uid: string;
  nume: string;
  email: string;
}

export default function MesajNouParintePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [educatoare, setEducatoare] = useState<Educatoare | null>(null);
  const [organizationId, setOrganizationId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [grupaId, setGrupaId] = useState('');
  const [copilCnp, setCopilCnp] = useState('');
  const [copilNume, setCopilNume] = useState('');
  
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    incarcaEducatoare();
  }, []);

  const incarcaEducatoare = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      // Obține datele părintelui
      const parinteRef = doc(db, 'parinti', user.uid);
      const parinteSnap = await getDoc(parinteRef);

      if (!parinteSnap.exists()) {
        router.push('/login');
        return;
      }

      const parinteData = parinteSnap.data();
      setOrganizationId(parinteData.organizationId);
      setLocationId(parinteData.locationId);
      setGrupaId(parinteData.grupaId);
      setCopilCnp(parinteData.copilCnp);
      setCopilNume(parinteData.copilNume || 'Copil');

      // Găsește educatoarea din grupa copilului
      const educatoareRef = collection(db, 'educatoare');
      const educatoareSnap = await getDocs(educatoareRef);
      
      for (const educatoareDoc of educatoareSnap.docs) {
        const educatoareData = educatoareDoc.data();
        
        if (educatoareData.organizationId === parinteData.organizationId &&
            educatoareData.locationId === parinteData.locationId &&
            educatoareData.grupaId === parinteData.grupaId) {
          
          setEducatoare({
            uid: educatoareDoc.id,
            nume: educatoareData.nume || educatoareData.email,
            email: educatoareData.email
          });
          break;
        }
      }
    } catch (error) {
      console.error('Eroare încărcare educatoare:', error);
    } finally {
      setLoading(false);
    }
  };

  const trimiteMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!educatoare || !subject.trim() || !body.trim()) {
      alert('Te rog completează toate câmpurile!');
      return;
    }

    setSending(true);

    try {
      const user = auth.currentUser;
      if (!user) return;

      const parinteRef = doc(db, 'parinti', user.uid);
      const parinteSnap = await getDoc(parinteRef);
      const parinteData = parinteSnap.data();

      // Creează mesajul
      const messagesRef = collection(
        db,
        'organizations',
        organizationId,
        'locations',
        locationId,
        'messages'
      );

      const newMessage = {
        from: user.uid,
        fromName: parinteData?.nume || user.email || 'Părinte',
        fromRole: 'parinte',
        to: educatoare.uid,
        toName: educatoare.nume,
        toRole: 'educatoare',
        subject: subject.trim(),
        body: body.trim(),
        copilCnp: copilCnp,
        copilNume: copilNume,
        grupaId: grupaId,
        read: false,
        createdAt: Timestamp.now(),
        threadId: '',
        replyTo: null,
        threadCount: 1
      };

      const docRef = await addDoc(messagesRef, newMessage);
      await updateDoc(docRef, { threadId: docRef.id });

      alert('✅ Mesaj trimis cu succes!');
      router.push('/dashboard-parinte/mesaje');
    } catch (error) {
      console.error('Eroare trimitere mesaj:', error);
      alert('❌ Eroare la trimiterea mesajului');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Se încarcă...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <BrandHeader logoSize="xl" showTitle={false} />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-3xl mx-auto">
          
          {/* Breadcrumb */}
          <Link
            href="/dashboard-parinte/mesaje"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi la Mesaje
          </Link>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">✉️ Mesaj Nou</h1>

            {!educatoare ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Nu s-a găsit educatoarea grupei</p>
                <Link
                  href="/dashboard-parinte/mesaje"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Înapoi la Mesaje
                </Link>
              </div>
            ) : (
              <form onSubmit={trimiteMessage} className="space-y-6">
                
                {/* Către (read-only) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Către:
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                    👩‍🏫 {educatoare.nume} (Educatoare)
                  </div>
                </div>

                {/* Despre (read-only) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Despre:
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                    👶 {copilNume}
                  </div>
                </div>

                {/* Subiect */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subiect: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex: Absență mâine, Întrebare despre activitate..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={100}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {subject.length}/100 caractere
                  </p>
                </div>

                {/* Mesaj */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mesaj: <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Scrie mesajul tău aici..."
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    maxLength={2000}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {body.length}/2000 caractere
                  </p>
                </div>

                {/* Butoane */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={sending || !subject.trim() || !body.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Se trimite...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Trimite Mesaj
                      </>
                    )}
                  </button>

                  <Link
                    href="/dashboard-parinte/mesaje"
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                  >
                    Anulează
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
