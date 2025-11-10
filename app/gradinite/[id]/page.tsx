'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Building, 
  Phone, 
  Mail, 
  Users, 
  Baby,
  Edit,
  Plus,
  Search,
  Calendar,
  Image as ImageIcon,
  FileText,
  CheckCircle,
  Palette,
  DollarSign,
  Utensils
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { getRepresentantLabel, getPersonPluralName, getPersonSingularName, getAddPersonLabel, getAddPersonUrl } from '@/lib/location-helpers';

interface Child {
  id: string;
  nume: string;
  cnp: string;
  grupa: string;
  varsta: number;
  parinte1: {
    nume: string;
    telefon: string;
  };
  parinte2?: {
    nume: string;
    telefon: string;
  };
  fotoUrl?: string;
}

export default function GradinitaDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const gradinitaId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [gradinita, setGradinita] = useState<any>(null);
  const [organizationType, setOrganizationType] = useState<'camin' | 'gradinita' | 'spital' | 'hotel'>('gradinita');
  const [children, setChildren] = useState<Child[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrupa, setSelectedGrupa] = useState('Toate');
  const [editingReprezentant, setEditingReprezentant] = useState(false);
  const [reprezentantData, setReprezentantData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadGradinitaData();
  }, [gradinitaId]);

  const loadGradinitaData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const organizationId = user.uid;
      const locationId = gradinitaId;

      // Citește tipul organizației
      const orgRef = doc(db, 'organizations', organizationId);
      const orgSnap = await getDoc(orgRef);
      if (orgSnap.exists()) {
        const orgType = orgSnap.data().type || 'gradinita';
        setOrganizationType(orgType);
      }

      // Încarcă date grădiniță
      const gradinitaRef = doc(db, 'organizations', organizationId, 'locations', locationId);
      const gradinitaSnap = await getDoc(gradinitaRef);

      if (gradinitaSnap.exists()) {
        const data = gradinitaSnap.data();
        setGradinita(data);
        setReprezentantData(data.reprezentant || { name: '', phone: '', email: '' });

        // Încarcă copii
        const childrenRef = collection(db, 'organizations', organizationId, 'locations', locationId, 'children');
        const childrenSnap = await getDocs(childrenRef);
        const childrenData = childrenSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Child[];
        
        setChildren(childrenData);
      } else {
        console.error('Grădinița nu există');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReprezentant = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const organizationId = user.uid;
      const locationId = gradinitaId;

      const gradinitaRef = doc(db, 'organizations', organizationId, 'locations', locationId);
      await updateDoc(gradinitaRef, {
        reprezentant: reprezentantData
      });

      setGradinita({ ...gradinita, reprezentant: reprezentantData });
      setEditingReprezentant(false);
      console.log('✅ Reprezentant actualizat!');
    } catch (error) {
      console.error('❌ Eroare actualizare reprezentant:', error);
    }
  };

  const filteredChildren = children.filter(child => {
    const matchesSearch = child.nume.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         child.cnp.includes(searchTerm);
    const matchesGrupa = selectedGrupa === 'Toate' || child.grupa === selectedGrupa;
    return matchesSearch && matchesGrupa;
  });

  const grupe = ['Toate', 'Grupă Mică', 'Grupă Mijlocie', 'Grupă Mare', 'Pregătitoare'];

  // Statistici
  const totalCopii = children.length;
  const prezentiAzi = 0; // TODO: Implementare prezență
  const procentPrezenta = totalCopii > 0 ? Math.round((prezentiAzi / totalCopii) * 100) : 0;
  const grupeActive = gradinita?.grupe?.length || 0;

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

  if (!gradinita) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Grădinița nu a fost găsită</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Înapoi la Dashboard
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
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi la Dashboard
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header Grădiniță */}
        <div className="bg-gradient-to-r from-blue-500 to-pink-500 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
              <Building className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{gradinita.name}</h1>
              <p className="text-white/90 text-lg">{gradinita.address}</p>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <Phone className="w-5 h-5 mb-2" />
              <p className="text-sm text-white/80">TELEFON</p>
              <p className="font-semibold">{gradinita.phone}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <Mail className="w-5 h-5 mb-2" />
              <p className="text-sm text-white/80">EMAIL</p>
              <p className="font-semibold text-sm">{gradinita.email}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <Users className="w-5 h-5 mb-2" />
              <p className="text-sm text-white/80">CAPACITATE</p>
              <p className="font-semibold">{gradinita.capacity} copii</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <Baby className="w-5 h-5 mb-2" />
              <p className="text-sm text-white/80">GRUPE</p>
              <p className="font-semibold">{gradinita.grupe?.length || 0} grupe</p>
            </div>
          </div>
        </div>

        {/* Acțiuni Rapide */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Acțiuni Rapide</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Link
              href={`/children/add?gradinitaId=${gradinitaId}`}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition flex items-center gap-3 text-white"
            >
              <Baby className="w-6 h-6" />
              <span className="font-semibold">Adaugă Copil</span>
            </Link>
            <Link
              href={`/gradinite/${gradinitaId}/menus`}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition flex items-center gap-3 text-white"
            >
              <Utensils className="w-6 h-6" />
              <span className="font-semibold">Meniuri Săptămânale</span>
            </Link>
            <Link
              href={`/activities?locationId=${gradinitaId}`}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition flex items-center gap-3 text-white"
            >
              <Palette className="w-6 h-6" />
              <span className="font-semibold">Activități</span>
            </Link>
            <Link
              href={`/attendance/overview?locationId=${gradinitaId}`}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition flex items-center gap-3 text-white"
            >
              <Calendar className="w-6 h-6" />
              <span className="font-semibold">Prezență</span>
            </Link>
            <Link
              href={`/reports/financial?locationId=${gradinitaId}`}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition flex items-center gap-3 text-white"
            >
              <DollarSign className="w-6 h-6" />
              <span className="font-semibold">Raport Financiar</span>
            </Link>
          </div>
        </div>

        {/* Reprezentant Grădiniță */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{getRepresentantLabel(organizationType)}</h2>
            </div>
            {!editingReprezentant && (
              <button
                onClick={() => setEditingReprezentant(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Edit className="w-4 h-4" />
                Editează
              </button>
            )}
          </div>

          {editingReprezentant ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nume Complet</label>
                <input
                  type="text"
                  value={reprezentantData.name}
                  onChange={(e) => setReprezentantData({ ...reprezentantData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={reprezentantData.phone}
                    onChange={(e) => setReprezentantData({ ...reprezentantData, phone: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={reprezentantData.email}
                    onChange={(e) => setReprezentantData({ ...reprezentantData, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateReprezentant}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Salvează
                </button>
                <button
                  onClick={() => {
                    setEditingReprezentant(false);
                    setReprezentantData(gradinita.reprezentant);
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Anulează
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Nume Complet</p>
                  <p className="font-semibold">{gradinita.reprezentant?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Telefon</p>
                  <p className="font-semibold">{gradinita.reprezentant?.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold">{gradinita.reprezentant?.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistici Rapide */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 font-medium">Total Copii</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalCopii}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 font-medium">Prezenți Azi</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{prezentiAzi}</p>
            <p className="text-xs text-gray-500 mt-1">Soon</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <p className="text-sm text-gray-600 font-medium">Prezență</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{procentPrezenta}%</p>
            <p className="text-xs text-gray-500 mt-1">Soon</p>
          </div>
          <Link
            href={`/gradinite/${gradinitaId}/grupe`}
            className="bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl shadow-lg p-6 border-l-4 border-pink-700 hover:shadow-2xl transition cursor-pointer"
          >
            <p className="text-sm text-white font-medium">Grupe Active</p>
            <p className="text-3xl font-bold text-white mt-2">{grupeActive}</p>
            <p className="text-xs text-white/80 mt-1">Click pentru gestionare</p>
          </Link>
        </div>

        {/* Lista Grupe */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              📚 Grupe ({gradinita?.grupe?.length || 0})
            </h2>
            <div className="flex gap-3">
              <Link
                href={`/gradinite/${gradinitaId}/grupe`}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition shadow-lg"
              >
                <Edit className="w-5 h-5" />
                Gestionează Grupe
              </Link>
              <Link
                href={getAddPersonUrl(organizationType, gradinitaId)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg"
              >
                <Plus className="w-5 h-5" />
                {getAddPersonLabel(organizationType)}
              </Link>
            </div>
          </div>

          {/* Card-uri Grupe */}
          {!gradinita?.grupe || gradinita.grupe.length === 0 ? (
            <div className="text-center py-12">
              <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium mb-2">
                Nu există grupe create încă
              </p>
              <p className="text-gray-500 mb-6">
                Creează prima grupă pentru a organiza copiii
              </p>
              <Link
                href={`/gradinite/${gradinitaId}/grupe`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                <Plus className="w-5 h-5" />
                Adaugă Prima Grupă
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gradinita.grupe.map((grupa: any) => {
                const copiiInGrupa = children.filter((c: any) => c.grupa === grupa.nume).length;
                const procent = Math.round((copiiInGrupa / grupa.capacitate) * 100);
                
                return (
                  <Link
                    key={grupa.id}
                    href={`/gradinite/${gradinitaId}/grupe/${grupa.id}`}
                    className="bg-gradient-to-br from-blue-50 to-pink-50 rounded-xl p-6 border-2 border-blue-200 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl">{grupa.emoji || '🎨'}</span>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{grupa.nume}</h3>
                        <p className="text-sm text-gray-600">{grupa.varsta}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Copii:</span>
                        <span className="font-bold text-gray-900">
                          {copiiInGrupa}/{grupa.capacitate} ({procent}%)
                        </span>
                      </div>

                      {grupa.sala && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 text-sm">Sala:</span>
                          <span className="font-semibold text-gray-900">{grupa.sala}</span>
                        </div>
                      )}

                      {grupa.educatori && grupa.educatori.length > 0 && (
                        <div>
                          <p className="text-gray-600 text-sm mb-1">Educatori:</p>
                          <div className="flex flex-wrap gap-1">
                            {grupa.educatori.map((edu: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full"
                              >
                                {edu}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            procent >= 90 ? 'bg-red-500' : procent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(procent, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold">
                      <span>Vezi Copii</span>
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
