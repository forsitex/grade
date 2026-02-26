'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Calendar, Users, CheckSquare, MessageSquare, LogOut, Search } from 'lucide-react';

export default function DashboardProfesorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profesor, setProfesor] = useState<any>(null);
  const [optional, setOptional] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrupa, setSelectedGrupa] = useState('Toate');
  const [prezenteAzi, setPrezenteAzi] = useState<Record<string, boolean>>({});
  
  // Prezențe
  const [showPrezente, setShowPrezente] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [prezente, setPrezente] = useState<Record<string, boolean>>({});
  
  // Comentarii
  const [showComentarii, setShowComentarii] = useState(false);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [comentariuText, setComentariuText] = useState('');
  const [comentarii, setComentarii] = useState<any[]>([]);

  // Statistici
  const [stats, setStats] = useState({ totalCopii: 0, prezenteSaptamana: 0, comentariiLuna: 0 });

  const zile = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri'];

  useEffect(() => {
    verificaAutentificare();
  }, []);

  const verificaAutentificare = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const profesorRef = doc(db, 'profesori', user.uid);
      const profesorSnap = await getDoc(profesorRef);

      if (!profesorSnap.exists()) {
        router.push('/login');
        return;
      }

      const profesorData = profesorSnap.data();
      setProfesor(profesorData);

      await loadOptional(profesorData);
      await loadChildren(profesorData);
      await loadStats(profesorData, user.uid);
      await loadPrezenteAzi(user.uid);

    } catch (error) {
      console.error('Eroare verificare autentificare:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadOptional = async (profesorData: any) => {
    try {
      const optionalRef = doc(db, 'organizations', profesorData.organizationId, 'locations', profesorData.locationId, 'optionale', profesorData.optionalId);
      const optionalSnap = await getDoc(optionalRef);
      if (optionalSnap.exists()) {
        setOptional({ id: optionalSnap.id, ...optionalSnap.data() });
      }
    } catch (error) {
      console.error('Eroare încărcare opțional:', error);
    }
  };

  const loadChildren = async (profesorData: any) => {
    try {
      const childrenRef = collection(db, 'organizations', profesorData.organizationId, 'locations', profesorData.locationId, 'children');
      const childrenSnap = await getDocs(childrenRef);

      const allChildren: any[] = [];
      childrenSnap.docs.forEach(doc => {
        allChildren.push({ id: doc.id, ...doc.data() });
      });

      const optionalRef = doc(db, 'organizations', profesorData.organizationId, 'locations', profesorData.locationId, 'optionale', profesorData.optionalId);
      const optionalSnap = await getDoc(optionalRef);

      if (optionalSnap.exists()) {
        const optionalData = optionalSnap.data();
        const copiiInscrisi = optionalData.copii || [];
        
        const childrenInscrisi = allChildren.filter(child => 
          copiiInscrisi.some((c: any) => typeof c === 'string' ? c === child.id : c.id === child.id)
        );

        setChildren(childrenInscrisi);
      }
    } catch (error) {
      console.error('Eroare încărcare copii:', error);
    }
  };

  const loadPrezenteAzi = async (profesorId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const prezenteRef = collection(db, 'prezente');
      const prezenteQuery = query(prezenteRef, where('profesorId', '==', profesorId), where('data', '==', today));
      const prezenteSnap = await getDocs(prezenteQuery);

      const prezenteMap: Record<string, boolean> = {};
      prezenteSnap.docs.forEach(doc => {
        const data = doc.data();
        prezenteMap[data.copilId] = data.prezent;
      });

      setPrezenteAzi(prezenteMap);
    } catch (error) {
      console.error('Eroare încărcare prezențe azi:', error);
    }
  };

  const loadStats = async (profesorData: any, profesorId: string) => {
    try {
      const optionalRef = doc(db, 'organizations', profesorData.organizationId, 'locations', profesorData.locationId, 'optionale', profesorData.optionalId);
      const optionalSnap = await getDoc(optionalRef);
      const totalCopii = optionalSnap.exists() ? (optionalSnap.data().copii || []).length : 0;

      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const prezenteRef = collection(db, 'prezente');
      const prezenteQuery = query(prezenteRef, where('profesorId', '==', profesorId), where('data', '>=', weekStartStr));
      const prezenteSnap = await getDocs(prezenteQuery);
      const prezenteSaptamana = prezenteSnap.docs.filter(d => d.data().prezent).length;

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const comentariiRef = collection(db, 'comentarii');
      const comentariiQuery = query(comentariiRef, where('profesorId', '==', profesorId), where('data', '>=', monthStartStr));
      const comentariiSnap = await getDocs(comentariiQuery);

      setStats({ totalCopii, prezenteSaptamana, comentariiLuna: comentariiSnap.size });
    } catch (error) {
      console.error('Eroare încărcare statistici:', error);
    }
  };

  const handleOpenPrezente = async () => {
    setShowPrezente(true);
    
    try {
      if (!profesor) return;

      const prezenteRef = collection(db, 'prezente');
      const prezenteQuery = query(prezenteRef, where('profesorId', '==', auth.currentUser?.uid), where('data', '==', selectedDate));
      const prezenteSnap = await getDocs(prezenteQuery);

      const prezenteMap: Record<string, boolean> = {};
      prezenteSnap.docs.forEach(doc => {
        const data = doc.data();
        prezenteMap[data.copilId] = data.prezent;
      });

      setPrezente(prezenteMap);
    } catch (error) {
      console.error('Eroare încărcare prezențe:', error);
    }
  };

  const handleSavePrezente = async () => {
    try {
      if (!profesor || !auth.currentUser) return;

      for (const child of children) {
        const prezent = prezente[child.id] ?? false;

        await addDoc(collection(db, 'prezente'), {
          copilId: child.id,
          copilNume: child.nume,
          data: selectedDate,
          prezent: prezent,
          profesorId: auth.currentUser.uid,
          optionalId: profesor.optionalId,
          createdAt: new Date()
        });
      }

      alert('✅ Prezențe salvate cu succes!');
      setShowPrezente(false);
      setPrezente({});
      
      await loadStats(profesor, auth.currentUser.uid);
      await loadPrezenteAzi(auth.currentUser.uid);
    } catch (error) {
      console.error('Eroare salvare prezențe:', error);
      alert('❌ Eroare la salvarea prezențelor');
    }
  };

  const handleOpenComentarii = async (child: any) => {
    setSelectedChild(child);
    setShowComentarii(true);
    setComentariuText('');

    try {
      if (!profesor) return;

      const comentariiRef = collection(db, 'comentarii');
      const comentariiQuery = query(comentariiRef, where('copilId', '==', child.id), where('optionalId', '==', profesor.optionalId), orderBy('createdAt', 'desc'));
      const comentariiSnap = await getDocs(comentariiQuery);

      const comentariiData: any[] = [];
      comentariiSnap.docs.forEach(doc => {
        comentariiData.push({ id: doc.id, ...doc.data() });
      });

      setComentarii(comentariiData);
    } catch (error) {
      console.error('Eroare încărcare comentarii:', error);
    }
  };

  const handleSaveComentariu = async () => {
    try {
      if (!profesor || !auth.currentUser || !selectedChild || !comentariuText.trim()) {
        alert('Te rugăm să completezi comentariul!');
        return;
      }

      await addDoc(collection(db, 'comentarii'), {
        copilId: selectedChild.id,
        copilNume: selectedChild.nume,
        text: comentariuText,
        data: new Date().toISOString().split('T')[0],
        profesorId: auth.currentUser.uid,
        profesorNume: profesor.nume,
        optionalId: profesor.optionalId,
        optionalNume: optional?.nume || '',
        createdAt: new Date()
      });

      alert('✅ Comentariu adăugat cu succes!');
      setComentariuText('');
      
      await handleOpenComentarii(selectedChild);
      await loadStats(profesor, auth.currentUser.uid);
    } catch (error) {
      console.error('Eroare salvare comentariu:', error);
      alert('❌ Eroare la salvarea comentariului');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Eroare logout:', error);
    }
  };

  const filteredChildren = children.filter(child => {
    const matchesSearch = child.nume.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrupa = selectedGrupa === 'Toate' || child.grupa === selectedGrupa;
    return matchesSearch && matchesGrupa;
  });

  const grupe = ['Toate', ...Array.from(new Set(children.map((c: any) => c.grupa)))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">👨‍🏫 Dashboard Profesor</h1>
              <p className="text-sm text-gray-600">{profesor?.nume} • {profesor?.email}</p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
              <LogOut className="w-4 h-4" />
              Ieșire
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Opțional Info */}
        {optional && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <div className="flex items-center gap-4">
              <span className="text-6xl">{optional.icon}</span>
              <div>
                <h2 className="text-3xl font-bold">{optional.nume}</h2>
                <p className="text-white/90">{optional.pret} lei{optional.tipPret === 'sedinta' ? '/ședință' : '/lună'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistici */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
              <div>
                <p className="text-sm text-gray-600">Total Copii</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCopii}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg"><CheckSquare className="w-6 h-6 text-green-600" /></div>
              <div>
                <p className="text-sm text-gray-600">Prezențe Săptămână</p>
                <p className="text-2xl font-bold text-gray-900">{stats.prezenteSaptamana}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg"><MessageSquare className="w-6 h-6 text-purple-600" /></div>
              <div>
                <p className="text-sm text-gray-600">Comentarii Lună</p>
                <p className="text-2xl font-bold text-gray-900">{stats.comentariiLuna}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Program Săptămânal */}
        {optional?.program && optional.program.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Program Săptămânal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {zile.map(zi => {
                const programZi = optional.program?.filter((p: any) => p.zi === zi) || [];
                return (
                  <div key={zi} className="border-2 border-gray-200 rounded-lg p-4">
                    <p className="font-bold text-gray-900 mb-2">{zi}</p>
                    {programZi.length > 0 ? (
                      programZi.map((p: any, idx: number) => (
                        <div key={idx} className="bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-sm mb-2">
                          {p.oraStart} - {p.oraEnd}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm">Liber</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Acțiuni Rapide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <button onClick={handleOpenPrezente} className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition text-left">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg"><CheckSquare className="w-8 h-8 text-green-600" /></div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Marchează Prezențe</h3>
                <p className="text-sm text-gray-600">Înregistrează prezența copiilor</p>
              </div>
            </div>
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg"><MessageSquare className="w-8 h-8 text-purple-600" /></div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Comentarii</h3>
                <p className="text-sm text-gray-600">Selectează un copil din listă</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista Copii */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Copii Înscriși ({children.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Caută copil..."
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>

            <select value={selectedGrupa} onChange={(e) => setSelectedGrupa(e.target.value)} className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none">
              {grupe.map(grupa => (
                <option key={grupa} value={grupa}>{grupa}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nume</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Grupă</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tip Preț</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ședințe/Lună</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status Azi</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {filteredChildren.map(child => {
                  const copilData = optional?.copii.find((c: any) => typeof c === 'string' ? c === child.id : c.id === child.id);
                  const numarSedinte = typeof copilData === 'object' ? copilData?.numarSedinte : undefined;
                  const statusAzi = prezenteAzi[child.id];
                  const areStatus = statusAzi !== undefined;

                  return (
                    <tr key={child.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{child.nume}</td>
                      <td className="py-3 px-4 text-gray-600">{child.grupa}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${optional?.tipPret === 'sedinta' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {optional?.tipPret === 'sedinta' ? 'Per ședință' : 'Lunar'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{optional?.tipPret === 'sedinta' ? numarSedinte || '-' : '-'}</td>
                      <td className="py-3 px-4">
                        {areStatus ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusAzi ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {statusAzi ? '✓ Prezent' : '✗ Absent'}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                            - Nemarcat
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button onClick={() => handleOpenComentarii(child)} className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition">
                          Comentarii
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredChildren.length === 0 && <p className="text-center text-gray-600 py-8">Nu s-au găsit copii</p>}
          </div>
        </div>
      </div>

      {/* Modal Prezențe */}
      {showPrezente && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Marchează Prezențe</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none" />
            </div>

            <div className="space-y-2 mb-6">
              {children.map(child => (
                <label key={child.id} className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer transition">
                  <input type="checkbox" checked={prezente[child.id] ?? false} onChange={(e) => setPrezente({ ...prezente, [child.id]: e.target.checked })} className="w-5 h-5 text-purple-600 rounded" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{child.nume}</p>
                    <p className="text-sm text-gray-600">{child.grupa}</p>
                  </div>
                  <span className={`text-sm font-semibold ${prezente[child.id] ? 'text-green-600' : 'text-red-600'}`}>
                    {prezente[child.id] ? '✓ Prezent' : '✗ Absent'}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={handleSavePrezente} className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition">
                Salvează Prezențe
              </button>
              <button onClick={() => { setShowPrezente(false); setPrezente({}); }} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition">
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Comentarii */}
      {showComentarii && selectedChild && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Comentarii</h2>
            <p className="text-gray-600 mb-4">{selectedChild.nume} • {selectedChild.grupa}</p>

            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comentariu Nou</label>
              <textarea
                value={comentariuText}
                onChange={(e) => setComentariuText(e.target.value)}
                placeholder="Scrie un comentariu despre progresul copilului..."
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                rows={4}
              />
              <button onClick={handleSaveComentariu} className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition">
                Adaugă Comentariu
              </button>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-3">Istoric Comentarii</h3>
              {comentarii.length > 0 ? (
                <div className="space-y-3">
                  {comentarii.map(com => (
                    <div key={com.id} className="p-4 border-2 border-gray-200 rounded-lg">
                      <p className="text-gray-900 mb-2">{com.text}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(com.data).toLocaleDateString('ro-RO')} • {profesor?.nume}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nu există comentarii încă</p>
              )}
            </div>

            <button onClick={() => { setShowComentarii(false); setSelectedChild(null); setComentariuText(''); }} className="w-full mt-4 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition">
              Închide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
