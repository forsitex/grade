'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { 
  LogOut, 
  Baby,
  Loader2,
  Edit,
  Image as ImageIcon,
  FileText,
  CheckCircle,
  Palette,
  ClipboardCheck,
  Camera,
  FileBarChart,
  UtensilsCrossed,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import BrandHeader from '@/components/BrandHeader';

interface EducatoareSesiune {
  email: string;
  organizationId: string;
  locationId: string;
  grupa: {
    id: string;
    nume: string;
    emoji?: string;
    gradinitaNume: string;
    varsta?: string;
    capacitate?: number;
    educatori?: string[];
    sala?: string;
  };
}

interface Child {
  id: string;
  nume: string;
  cnp: string;
  varsta: number;
  parinte1: {
    nume: string;
    telefon: string;
  };
  fotoUrl?: string;
}

export default function DashboardEducatoarePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [educatoare, setEducatoare] = useState<EducatoareSesiune | null>(null);
  const [copii, setCopii] = useState<Child[]>([]);

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

      // Citește documentul educatoare din Firestore
      const educatoareRef = doc(db, 'educatoare', user.uid);
      const educatoareSnap = await getDoc(educatoareRef);

      if (!educatoareSnap.exists()) {
        router.push('/login');
        return;
      }

      const educatoareData = educatoareSnap.data();
      
      // Citește datele grupei din Firestore
      const locationRef = doc(db, 'organizations', educatoareData.organizationId, 'locations', educatoareData.locationId);
      const locationSnap = await getDoc(locationRef);
      
      if (locationSnap.exists()) {
        const locationData = locationSnap.data();
        const grupa = locationData.grupe?.find((g: any) => g.id === educatoareData.grupaId);
        
        if (grupa) {
          const educatoareSesiune: EducatoareSesiune = {
            email: user.email || '',
            organizationId: educatoareData.organizationId,
            locationId: educatoareData.locationId,
            grupa: {
              ...grupa,
              gradinitaNume: locationData.name
            }
          };
          
          setEducatoare(educatoareSesiune);
          await incarcaCopii(educatoareSesiune);
        }
      }

    } catch (error) {
      console.error('Eroare verificare autentificare:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const incarcaCopii = async (educatoarData: EducatoareSesiune) => {
    try {
      const childrenRef = collection(
        db,
        'organizations',
        educatoarData.organizationId,
        'locations',
        educatoarData.locationId,
        'children'
      );
      
      const childrenSnap = await getDocs(childrenRef);
      
      // Filtrează doar copiii din grupa educatoarei
      const copiiGrupa = childrenSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((copil: any) => copil.grupa === educatoarData.grupa.nume) as Child[];

      setCopii(copiiGrupa);

    } catch (error) {
      console.error('Eroare încărcare copii:', error);
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

  if (!educatoare) {
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
              <span className="text-gray-600 text-sm sm:text-base truncate">{educatoare.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm sm:text-base whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Ieșire</span>
                <span className="sm:hidden">Ieș</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Grupă */}
          <div className="bg-gradient-to-r from-blue-500 to-pink-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl">{educatoare.grupa.emoji || '🎨'}</span>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{educatoare.grupa.nume}</h1>
                <p className="text-white/90">
                  {copii.length}/{educatoare.grupa.capacitate || 20} copii | Vârstă: {educatoare.grupa.varsta || '2-3 ani'}
                </p>
              </div>
            </div>

            {educatoare.grupa.educatori && educatoare.grupa.educatori.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-white/80">Educatori:</span>
                {educatoare.grupa.educatori.map((edu: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold"
                  >
                    {edu}
                  </span>
                ))}
              </div>
            )}

            {educatoare.grupa.sala && (
              <p className="text-white/80">📍 {educatoare.grupa.sala}</p>
            )}
          </div>

          {/* Acțiuni Rapide Grupă */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              ⚡ Acțiuni Rapide Grupă
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Link
                href="/activities"
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl hover:scale-105 transition shadow-lg"
              >
                <Palette className="w-8 h-8" />
                <span className="font-semibold text-center">Activități</span>
              </Link>
              
              <Link
                href={`/attendance/group/${educatoare.grupa.id}`}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl hover:scale-105 transition shadow-lg"
              >
                <ClipboardCheck className="w-8 h-8" />
                <span className="font-semibold text-center">Prezență</span>
              </Link>
              
              <Link
                href={`/gradinite/${educatoare.locationId}/grupe/${educatoare.grupa.id}/gallery`}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl hover:scale-105 transition shadow-lg"
              >
                <Camera className="w-8 h-8" />
                <span className="font-semibold text-center">Galerie</span>
              </Link>
              
              <Link
                href={`/gradinite/${educatoare.locationId}/grupe/${educatoare.grupa.id}/reports`}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl hover:scale-105 transition shadow-lg"
              >
                <FileBarChart className="w-8 h-8" />
                <span className="font-semibold text-center">Rapoarte</span>
              </Link>
              
              <Link
                href={`/gradinite/${educatoare.locationId}/grupe/${educatoare.grupa.id}/letters`}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl hover:scale-105 transition shadow-lg"
              >
                <Mail className="w-8 h-8" />
                <span className="font-semibold text-center">Scrisori</span>
              </Link>
              
              <Link
                href={`/gradinite/${educatoare.locationId}/menus`}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-xl hover:scale-105 transition shadow-lg"
              >
                <UtensilsCrossed className="w-8 h-8" />
                <span className="font-semibold text-center">Meniu</span>
              </Link>
            </div>
          </div>

          {/* Titlu Copii */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Copii ({copii.length})
            </h2>
          </div>

          {/* Lista Copii */}
          {copii.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Nu există copii în această grupă
              </h3>
              <p className="text-gray-600">
                Contactează administratorul pentru a adăuga copii
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {copii.map((child) => (
                <div
                  key={child.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition border-2 border-blue-100"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                      {child.fotoUrl ? (
                        <img
                          src={child.fotoUrl}
                          alt={child.nume}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Baby className="w-10 h-10 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{child.nume}</h3>
                      <p className="text-sm text-gray-600">Vârstă: {child.varsta} ani</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-700 mb-4">
                    <p>
                      <span className="font-medium">CNP:</span> {child.cnp}
                    </p>
                    <p>
                      <span className="font-medium">Părinți:</span> {child.parinte1.nume}
                    </p>
                    <p className="text-xs text-gray-500">{child.parinte1.telefon}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/children/${child.cnp}/edit`}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                    >
                      <Edit className="w-4 h-4" />
                      Editează
                    </Link>
                    <Link
                      href={`/children/${child.cnp}/gallery`}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-pink-600 text-white rounded-lg text-sm font-semibold hover:bg-pink-700 transition"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Galerie
                    </Link>
                    <Link
                      href={`/children/${child.cnp}/daily-report`}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                    >
                      <FileText className="w-4 h-4" />
                      Raport Zilnic
                    </Link>
                    <Link
                      href={`/children/${child.cnp}/attendance`}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Prezență
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
