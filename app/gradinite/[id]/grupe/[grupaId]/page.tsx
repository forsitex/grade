'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Baby,
  Image as ImageIcon,
  FileText,
  CheckCircle,
  Palette,
  ClipboardCheck,
  Camera,
  FileBarChart,
  UtensilsCrossed,
  Mail,
  GraduationCap
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

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

export default function GrupaChildrenPage() {
  const router = useRouter();
  const params = useParams();
  const gradinitaId = params.id as string;
  const grupaId = params.grupaId as string;

  const [loading, setLoading] = useState(true);
  const [gradinita, setGradinita] = useState<any>(null);
  const [grupa, setGrupa] = useState<any>(null);
  const [children, setChildren] = useState<Child[]>([]);

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

      const organizationId = user.uid;
      const locationId = gradinitaId;

      const gradinitaRef = doc(db, 'organizations', organizationId, 'locations', locationId);
      const gradinitaSnap = await getDoc(gradinitaRef);

      if (gradinitaSnap.exists()) {
        const data = gradinitaSnap.data();
        setGradinita(data);

        const grupaData = data.grupe?.find((g: any) => g.id === grupaId);
        setGrupa(grupaData);

        const childrenRef = collection(db, 'organizations', organizationId, 'locations', locationId, 'children');
        const childrenSnap = await getDocs(childrenRef);
        const childrenData = childrenSnap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter((child: any) => child.grupa === grupaData?.nume) as Child[];
        
        setChildren(childrenData);
      }
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (!grupa) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Grupa nu a fost găsită</p>
          <Link
            href={`/gradinite/${gradinitaId}`}
            className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi la Grădiniță
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => router.push(`/gradinite/${gradinitaId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi la Grădiniță
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500 to-pink-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl">{grupa.emoji || '🎨'}</span>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{grupa.nume}</h1>
                <p className="text-white/90">
                  {children.length}/{grupa.capacitate} copii | Vârstă: {grupa.varsta}
                </p>
              </div>
            </div>

            {grupa.educatori && grupa.educatori.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-white/80">Educatori:</span>
                {grupa.educatori.map((edu: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold"
                  >
                    {edu}
                  </span>
                ))}
              </div>
            )}

            {grupa.sala && (
              <p className="text-white/80">📍 {grupa.sala}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              ⚡ Acțiuni Rapide Grupă
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
              <Link
                href={`/activities/add?gradinitaId=${gradinitaId}&grupaId=${grupaId}`}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl hover:scale-105 transition shadow-lg"
              >
                <Palette className="w-8 h-8" />
                <span className="font-semibold text-center">Activități</span>
              </Link>
              
              <Link
                href={`/attendance/group/${grupaId}`}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl hover:scale-105 transition shadow-lg"
              >
                <ClipboardCheck className="w-8 h-8" />
                <span className="font-semibold text-center">Prezență</span>
              </Link>
              
              <Link
                href={`/gradinite/${gradinitaId}/grupe/${grupaId}/gallery`}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl hover:scale-105 transition shadow-lg"
              >
                <Camera className="w-8 h-8" />
                <span className="font-semibold text-center">Galerie</span>
              </Link>
              
              <Link
                href={`/gradinite/${gradinitaId}/grupe/${grupaId}/reports`}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl hover:scale-105 transition shadow-lg"
              >
                <FileBarChart className="w-8 h-8" />
                <span className="font-semibold text-center">Rapoarte</span>
              </Link>
              
              <Link
                href={`/gradinite/${gradinitaId}/grupe/${grupaId}/letters`}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl hover:scale-105 transition shadow-lg"
              >
                <Mail className="w-8 h-8" />
                <span className="font-semibold text-center">Scrisori</span>
              </Link>
              
              <Link
                href={`/gradinite/${gradinitaId}/menus`}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-xl hover:scale-105 transition shadow-lg"
              >
                <UtensilsCrossed className="w-8 h-8" />
                <span className="font-semibold text-center">Meniu</span>
              </Link>
              
              <Link
                href={`/gradinite/${gradinitaId}/optionale`}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-xl hover:scale-105 transition shadow-lg"
              >
                <GraduationCap className="w-8 h-8" />
                <span className="font-semibold text-center">Opționale</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Copii ({children.length})
            </h2>
            <div className="flex gap-3">
              <Link
                href={`/gradinite/${gradinitaId}/grupe`}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition shadow-lg"
              >
                <Edit className="w-5 h-5" />
                Editează Grupa
              </Link>
              <Link
                href={`/children/add?gradinitaId=${gradinitaId}&grupaId=${grupaId}`}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Adaugă Copil în Grupă
              </Link>
            </div>
          </div>

          {children.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Nu există copii în această grupă
              </h3>
              <p className="text-gray-600 mb-6">
                Adaugă primul copil pentru a începe
              </p>
              <Link
                href={`/children/add?gradinitaId=${gradinitaId}&grupaId=${grupaId}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                Adaugă Primul Copil
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child) => (
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
