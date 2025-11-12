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
  Activity,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import BrandHeader from '@/components/BrandHeader';
import GroqChatWidget from '@/components/GroqChatWidget';

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
  const [unreadMessages, setUnreadMessages] = useState(0);

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
      await incarcaMesajeNecitite(parinteData);

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

  const incarcaMesajeNecitite = async (parinteData: any) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const messagesRef = collection(
        db,
        'organizations',
        parinteData.organizationId,
        'locations',
        parinteData.locationId,
        'messages'
      );
      
      const messagesSnap = await getDocs(messagesRef);
      
      const unread = messagesSnap.docs.filter(doc => {
        const data = doc.data();
        return data.to === user.uid && !data.read;
      }).length;

      setUnreadMessages(unread);

    } catch (error) {
      console.error('Eroare încărcare mesaje necitite:', error);
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

          {/* Quick Stats - Carduri 3D */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-5 shadow-[0_8px_0_rgb(22,163,74),0_13px_25px_rgba(22,163,74,0.4)] hover:shadow-[0_4px_0_rgb(22,163,74),0_8px_20px_rgba(22,163,74,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-green-400">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle className="w-10 h-10 text-white" />
                <span className="text-3xl font-bold text-white">✓</span>
              </div>
              <h3 className="text-green-100 text-xs font-semibold mb-1">Prezență Azi</h3>
              <p className="text-xl font-bold text-white">Prezent</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-5 shadow-[0_8px_0_rgb(37,99,235),0_13px_25px_rgba(37,99,235,0.4)] hover:shadow-[0_4px_0_rgb(37,99,235),0_8px_20px_rgba(37,99,235,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-blue-400">
              <div className="flex items-center justify-between mb-3">
                <ImageIcon className="w-10 h-10 text-white" />
                <span className="text-3xl font-bold text-white">{stats.pozeNoi}</span>
              </div>
              <h3 className="text-blue-100 text-xs font-semibold mb-1">Poze Noi</h3>
              <p className="text-sm text-blue-50">Ultima săptămână</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-5 shadow-[0_8px_0_rgb(147,51,234),0_13px_25px_rgba(147,51,234,0.4)] hover:shadow-[0_4px_0_rgb(147,51,234),0_8px_20px_rgba(147,51,234,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-purple-400">
              <div className="flex items-center justify-between mb-3">
                <FileText className="w-10 h-10 text-white" />
                <span className="text-3xl font-bold text-white">{stats.raportDisponibil ? '✓' : '—'}</span>
              </div>
              <h3 className="text-purple-100 text-xs font-semibold mb-1">Raport Zilnic</h3>
              <p className="text-sm text-purple-50">{stats.raportDisponibil ? 'Disponibil' : 'În așteptare'}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-5 shadow-[0_8px_0_rgb(234,88,12),0_13px_25px_rgba(234,88,12,0.4)] hover:shadow-[0_4px_0_rgb(234,88,12),0_8px_20px_rgba(234,88,12,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-orange-400">
              <div className="flex items-center justify-between mb-3">
                <Activity className="w-10 h-10 text-white" />
                <span className="text-3xl font-bold text-white">{stats.activitatiSaptamana}</span>
              </div>
              <h3 className="text-orange-100 text-xs font-semibold mb-1">Activități</h3>
              <p className="text-sm text-orange-50">Săptămâna aceasta</p>
            </div>
          </div>

          {/* Navigație Secțiuni - Butoane 3D Profesionale */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
            <Link
              href="/dashboard-parinte/galerie"
              className="group relative"
            >
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-5 shadow-[0_8px_0_rgb(37,99,235),0_13px_25px_rgba(37,99,235,0.4)] hover:shadow-[0_4px_0_rgb(37,99,235),0_8px_20px_rgba(37,99,235,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-blue-400">
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-white text-center">Galerie</span>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard-parinte/prezenta"
              className="group relative"
            >
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-5 shadow-[0_8px_0_rgb(22,163,74),0_13px_25px_rgba(22,163,74,0.4)] hover:shadow-[0_4px_0_rgb(22,163,74),0_8px_20px_rgba(22,163,74,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-green-400">
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-white text-center">Prezență</span>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard-parinte/rapoarte"
              className="group relative"
            >
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-5 shadow-[0_8px_0_rgb(147,51,234),0_13px_25px_rgba(147,51,234,0.4)] hover:shadow-[0_4px_0_rgb(147,51,234),0_8px_20px_rgba(147,51,234,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-purple-400">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-white text-center">Rapoarte</span>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard-parinte/activitati"
              className="group relative"
            >
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-5 shadow-[0_8px_0_rgb(234,88,12),0_13px_25px_rgba(234,88,12,0.4)] hover:shadow-[0_4px_0_rgb(234,88,12),0_8px_20px_rgba(234,88,12,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-orange-400">
                <div className="flex flex-col items-center gap-2">
                  <Activity className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-white text-center">Activități</span>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard-parinte/meniu"
              className="group relative"
            >
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-5 shadow-[0_8px_0_rgb(220,38,38),0_13px_25px_rgba(220,38,38,0.4)] hover:shadow-[0_4px_0_rgb(220,38,38),0_8px_20px_rgba(220,38,38,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-red-400">
                <div className="flex flex-col items-center gap-2">
                  <UtensilsCrossed className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-white text-center">Meniu</span>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard-parinte/mesaje"
              className="group relative"
            >
              <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-3xl p-5 shadow-[0_8px_0_rgb(79,70,229),0_13px_25px_rgba(79,70,229,0.4)] hover:shadow-[0_4px_0_rgb(79,70,229),0_8px_20px_rgba(79,70,229,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-indigo-400">
                {unreadMessages > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg z-20 border-2 border-white">
                    {unreadMessages}
                  </span>
                )}
                <div className="flex flex-col items-center gap-2">
                  <MessageCircle className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-white text-center">Mesaje</span>
                </div>
              </div>
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

      {/* Groq AI Assistant */}
      <GroqChatWidget
        systemPrompt="Ești un asistent AI pentru părinți. Ajuți cu: informații despre copilul lor, activități, meniu, prezență, rapoarte, sfaturi de creștere, și orice întrebări despre grădiniță. Răspunde în limba română, prietenos și empatic."
        title="Asistent Părinte"
        placeholder="Întreabă-mă despre copilul tău..."
      />
    </div>
  );
}
