'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { 
  ArrowLeft,
  Send,
  Loader2,
  User,
  Baby
} from 'lucide-react';
import Link from 'next/link';
import BrandHeader from '@/components/BrandHeader';

interface Parinte {
  uid: string;
  nume: string;
  email: string;
  copilCnp: string;
  copilNume: string;
}

export default function MesajNouEducatoarePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [parinti, setParinti] = useState<Parinte[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [grupaId, setGrupaId] = useState('');
  
  const [selectedParinte, setSelectedParinte] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    incarcaParinti();
  }, []);

  const incarcaParinti = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      // Obține datele educatoarei
      const educatoareRef = doc(db, 'educatoare', user.uid);
      const educatoareSnap = await getDoc(educatoareRef);

      if (!educatoareSnap.exists()) {
        router.push('/login');
        return;
      }

      const educatoareData = educatoareSnap.data();
      setOrganizationId(educatoareData.organizationId);
      setLocationId(educatoareData.locationId);
      setGrupaId(educatoareData.grupaId);

      // Obține numele grupei
      const locationRef = doc(db, 'organizations', educatoareData.organizationId, 'locations', educatoareData.locationId);
      const locationSnap = await getDoc(locationRef);
      const locationData = locationSnap.data();
      const grupa = locationData?.grupe?.find((g: any) => g.id === educatoareData.grupaId);
      const grupaNume = grupa?.nume || '';

      // Încărcă toți părinții din colecția parinti
      const parintiRef = collection(db, 'parinti');
      const parintiSnap = await getDocs(parintiRef);
      
      // Încărcă copiii din grupă pentru a găsi părinții
      const childrenRef = collection(
        db,
        'organizations',
        educatoareData.organizationId,
        'locations',
        educatoareData.locationId,
        'children'
      );
      const childrenSnap = await getDocs(childrenRef);
      
      // Filtrează copiii din grupa educatoarei
      const copiiGrupa = childrenSnap.docs
        .map(doc => doc.data())
        .filter((copil: any) => copil.grupa === grupaNume);
      
      // Creează lista de părinți din grupa educatoarei
      const parintiList: Parinte[] = [];
      
      for (const parinteDoc of parintiSnap.docs) {
        const parinteData = parinteDoc.data();
        
        // Verifică dacă părintele are un copil în grupa educatoarei
        const areCopilInGrupa = copiiGrupa.some((copil: any) => 
          copil.cnp === parinteData.copilCnp
        );
        
        if (parinteData.organizationId === educatoareData.organizationId &&
            parinteData.locationId === educatoareData.locationId &&
            areCopilInGrupa) {
          
          parintiList.push({
            uid: parinteDoc.id,
            nume: parinteData.nume || parinteData.email,
            email: parinteData.email,
            copilCnp: parinteData.copilCnp,
            copilNume: parinteData.copilNume || 'Copil'
          });
        }
      }

      setParinti(parintiList);
      console.log('👨‍👩‍👧 Părinți găsiți:', parintiList.length);
    } catch (error) {
      console.error('Eroare încărcare părinți:', error);
    } finally {
      setLoading(false);
    }
  };

  const trimiteMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedParinte || !subject.trim() || !body.trim()) {
      alert('Te rog completează toate câmpurile!');
      return;
    }

    setSending(true);

    try {
      const user = auth.currentUser;
      if (!user) return;

      const parinteSelectat = parinti.find(p => p.uid === selectedParinte);
      if (!parinteSelectat) return;

      const educatoareRef = doc(db, 'educatoare', user.uid);
      const educatoareSnap = await getDoc(educatoareRef);
      const educatoareData = educatoareSnap.data();

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
        fromName: educatoareData?.nume || user.email || 'Educatoare',
        fromRole: 'educatoare',
        to: selectedParinte,
        toName: parinteSelectat.nume,
        toRole: 'parinte',
        subject: subject.trim(),
        body: body.trim(),
        copilCnp: parinteSelectat.copilCnp,
        copilNume: parinteSelectat.copilNume,
        grupaId: grupaId,
        read: false,
        createdAt: Timestamp.now(),
        threadId: '', // Va fi setat după creare
        replyTo: null,
        threadCount: 1
      };

      const docRef = await addDoc(messagesRef, newMessage);
      
      // Actualizează threadId cu ID-ul documentului
      await updateDoc(docRef, { threadId: docRef.id });

      alert('✅ Mesaj trimis cu succes!');
      router.push('/dashboard-educatoare/mesaje');
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
            href="/dashboard-educatoare/mesaje"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi la Mesaje
          </Link>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">✉️ Mesaj Nou</h1>

            <form onSubmit={trimiteMessage} className="space-y-6">
              
              {/* Către */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Către: <span className="text-red-500">*</span>
                </label>
                
                {/* Search Input */}
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="🔍 Căutați părinte sau copil..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                />
                
                {/* Dropdown filtrat */}
                <select
                  value={selectedParinte}
                  onChange={(e) => setSelectedParinte(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  size={parinti.filter(p => 
                    searchTerm === '' ||
                    p.nume.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.copilNume.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length + 1}
                >
                  <option value="">Selectează părinte...</option>
                  {parinti
                    .filter(p => 
                      searchTerm === '' ||
                      p.nume.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.copilNume.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((parinte) => (
                      <option key={parinte.uid} value={parinte.uid}>
                        👤 {parinte.nume} - 👶 {parinte.copilNume}
                      </option>
                    ))}
                </select>
                
                {parinti.length === 0 ? (
                  <p className="text-sm text-red-500 mt-2 font-semibold">
                    ⚠️ Nu există părinți în grupa ta
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">
                    {parinti.filter(p => 
                      searchTerm === '' ||
                      p.nume.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.copilNume.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length} părinți găsiți din {parinti.length} total
                  </p>
                )}
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
                  disabled={sending || !selectedParinte || !subject.trim() || !body.trim()}
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
                  href="/dashboard-educatoare/mesaje"
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Anulează
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
