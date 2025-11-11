'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { 
  LogOut, 
  Baby,
  Loader2,
  Image as ImageIcon,
  CheckCircle,
  FileText,
  Calendar,
  UtensilsCrossed,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import BrandHeader from '@/components/BrandHeader';

interface ParinteSesiune {
  email: string;
  nume: string;
  telefon: string;
  organizationId: string;
  locationId: string;
  copilCnp: string;
  copilNume: string;
  grupaId: string;
  copil?: {
    nume: string;
    varsta: number;
    grupa: string;
    fotoUrl?: string;
    parinte1: any;
  };
  gradinita?: {
    name: string;
  };
}

export default function DashboardParintePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [parinte, setParinte] = useState<ParinteSesiune | null>(null);
  const [stats, setStats] = useState({
    pozeNoi: 0,
    raportDisponibil: false,
    activitatiSaptamana: 0
  });

  useEffect(() => {
    verificaAutentificare();
  }, []);

  const verificaAutentificare = async () => {
    try {
      // Verifică Firebase Auth
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      // Citește documentul părinte din Firestore
      const parinteRef = doc(db, 'parinti', user.uid);
      const parinteSnap = await getDoc(parinteRef);

      if (!parinteSnap.exists()) {
        router.push('/login');
        return;
      }

      const parinteData = parinteSnap.data();
      
      // Citește datele copilului
      const copilRef = doc(
        db, 
        'organizations', 
        parinteData.organizationId, 
        'locations', 
        parinteData.locationId,
        'children',
        parinteData.copilCnp
      );
      const copilSnap = await getDoc(copilRef);

      // Citește datele grădiniței
      const gradinitaRef = doc(
        db,
        'organizations',
        parinteData.organizationId,
        'locations',
        parinteData.locationId
      );
      const gradinitaSnap = await getDoc(gradinitaRef);

      const parinteSesiune: ParinteSesiune = {
        ...parinteData,
        copil: copilSnap.exists() ? copilSnap.data() as any : undefined,
        gradinita: gradinitaSnap.exists() ? gradinitaSnap.data() as any : undefined,
      } as ParinteSesiune;
      
      setParinte(parinteSesiune);

      // Calculează statistici
      await calculateStats(parinteData);

    } catch (error) {
      console.error('Eroare verificare autentificare:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async (parinteData: any) => {
    try {
      // 1. Poze noi (ultima săptămână)
      const galleryRef = collection(
        db,
        'organizations',
        parinteData.organizationId,
        'locations',
        parinteData.locationId,
        'gallery'
      );

      const gallerySnap = await getDocs(galleryRef);
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      
      const pozeNoi = gallerySnap.docs.filter(doc => {
        const data = doc.data();
        const uploadedAt = data.uploadedAt?.seconds * 1000 || 0;
        return data.children && 
               data.children.includes(parinteData.copilCnp) && 
               uploadedAt > oneWeekAgo;
      }).length;

      // 2. Raport zilnic disponibil (azi)
      const today = new Date().toISOString().split('T')[0];
      
      // Verifică dacă există raport (path corect cu număr par de segmente)
      let raportDisponibil = false;
      try {
        const reportRef = doc(
          db,
          'organizations',
          parinteData.organizationId,
          'locations',
          parinteData.locationId,
          'dailyReports',
          `${today}-${parinteData.copilCnp}` // Combinăm data și CNP-ul
        );
        const reportSnap = await getDoc(reportRef);
        raportDisponibil = reportSnap.exists();
      } catch (error) {
        console.log('Raport zilnic nu există încă');
        raportDisponibil = false;
      }

      // 3. Activități săptămâna aceasta
      const activitiesRef = collection(
        db,
        'organizations',
        parinteData.organizationId,
        'locations',
        parinteData.locationId,
        'activities'
      );

      const activitiesSnap = await getDocs(activitiesRef);
      const activitatiSaptamana = activitiesSnap.docs.filter(doc => {
        const data = doc.data();
        const activityDate = data.data?.seconds * 1000 || 0;
        return data.grupaId === parinteData.grupaId && 
               activityDate > oneWeekAgo;
      }).length;

      setStats({
        pozeNoi,
        raportDisponibil,
        activitatiSaptamana
      });
    } catch (error) {
      console.error('Eroare calcul statistici:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Eroare logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Se încarcă dashboard-ul...</p>
        </div>
      </div>
    );
  }

  if (!parinte || !parinte.copil) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="w-32 sm:w-56 flex-shrink-0">
              <BrandHeader logoSize="xl" showTitle={false} />
            </div>
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <span className="text-gray-600 text-sm sm:text-base truncate">{parinte.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm sm:text-base whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Deconectare</span>
                <span className="sm:hidden">Ieș</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Card Copil */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden">
                {parinte.copil.fotoUrl ? (
                  <img 
                    src={parinte.copil.fotoUrl} 
                    alt={parinte.copil.nume}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Baby className="w-12 h-12 text-purple-500" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{parinte.copil.nume}</h2>
                <div className="flex items-center gap-4 text-white/90">
                  <span>👶 {parinte.copil.varsta} ani</span>
                  <span>•</span>
                  <span>🎨 {parinte.copil.grupa}</span>
                  <span>•</span>
                  <span>🏫 {parinte.gradinita?.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <span className="text-2xl font-bold text-green-600">✓</span>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">Prezență Azi</h3>
              <p className="text-2xl font-bold text-gray-900">Prezent</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <ImageIcon className="w-8 h-8 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">{stats.pozeNoi}</span>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">Poze Noi</h3>
              <p className="text-sm text-gray-500">Ultima săptămână</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-8 h-8 text-purple-500" />
                <span className="text-2xl font-bold text-purple-600">{stats.raportDisponibil ? '✓' : '—'}</span>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">Raport Zilnic</h3>
              <p className="text-sm text-gray-500">{stats.raportDisponibil ? 'Disponibil' : 'În așteptare'}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 text-orange-500" />
                <span className="text-2xl font-bold text-orange-600">{stats.activitatiSaptamana}</span>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">Activități</h3>
              <p className="text-sm text-gray-500">Săptămâna aceasta</p>
            </div>
          </div>

          {/* Navigație Secțiuni */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <Link
              href="/dashboard-parinte/galerie"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group"
            >
              <ImageIcon className="w-12 h-12 text-blue-500 mb-4 group-hover:scale-110 transition" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Galerie Foto</h3>
              <p className="text-sm text-gray-600">Pozele copilului tău</p>
            </Link>

            <Link
              href="/dashboard-parinte/prezenta"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group"
            >
              <CheckCircle className="w-12 h-12 text-green-500 mb-4 group-hover:scale-110 transition" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Prezență</h3>
              <p className="text-sm text-gray-600">Istoric prezență</p>
            </Link>

            <Link
              href="/dashboard-parinte/rapoarte"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group"
            >
              <FileText className="w-12 h-12 text-purple-500 mb-4 group-hover:scale-110 transition" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Rapoarte Zilnice</h3>
              <p className="text-sm text-gray-600">Ce a făcut azi</p>
            </Link>

            <Link
              href="/dashboard-parinte/activitati"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group"
            >
              <Activity className="w-12 h-12 text-orange-500 mb-4 group-hover:scale-110 transition" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Activități</h3>
              <p className="text-sm text-gray-600">Activități educaționale</p>
            </Link>

            <Link
              href="/dashboard-parinte/meniu"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group"
            >
              <UtensilsCrossed className="w-12 h-12 text-red-500 mb-4 group-hover:scale-110 transition" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Meniu</h3>
              <p className="text-sm text-gray-600">Ce mănâncă la grădiniță</p>
            </Link>

            <Link
              href="/dashboard-parinte/calendar"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group"
            >
              <Calendar className="w-12 h-12 text-indigo-500 mb-4 group-hover:scale-110 transition" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Calendar</h3>
              <p className="text-sm text-gray-600">Evenimente și activități</p>
            </Link>
          </div>

          {/* Raport Zilnic Preview */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Raport Zilnic - Azi</h2>
            
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Raportul zilnic va fi disponibil în curând</p>
              <p className="text-sm">Educatoarea va completa raportul la sfârșitul zilei</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
