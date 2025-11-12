'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { 
  ArrowLeft, 
  Users, 
  TrendingUp,
  Calendar,
  GraduationCap
} from 'lucide-react';

interface Grupa {
  id: string;
  nume: string;
  emoji: string;
  varsta: string;
  copiiCount: number;
  optionaleCount: number;
  totalVenitOptionale: number;
  totalVenitTaxe: number;
  totalVenit: number;
}

export default function FinancialGroupsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [grupe, setGrupe] = useState<Grupa[]>([]);
  useEffect(() => {
    loadGrupeData();
  }, []);

  const loadGrupeData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const organizationId = user.uid;

      // Încarcă toate locațiile
      const locationsRef = collection(db, 'organizations', organizationId, 'locations');
      const locationsSnap = await getDocs(locationsRef);

      const allGrupe: Grupa[] = [];

      // Pentru fiecare locație, încarcă grupele
      for (const locationDoc of locationsSnap.docs) {
        const locationData = locationDoc.data();
        const locationId = locationDoc.id;
        const grupe = locationData.grupe || [];

        // Pentru fiecare grupă, calculează datele
        for (const grupa of grupe) {
          // Numără copiii din grupă
          const childrenRef = collection(db, 'organizations', organizationId, 'locations', locationId, 'children');
          const childrenSnap = await getDocs(childrenRef);
          const copiiInGrupa = childrenSnap.docs.filter(doc => doc.data().grupa === grupa.nume);
          const copiiCount = copiiInGrupa.length;

          // Calculează venit din TAXE pentru această grupă
          let totalVenitTaxe = 0;
          copiiInGrupa.forEach(copilDoc => {
            const copilData = copilDoc.data();
            // Caută în toate câmpurile posibile pentru cost lunar
            const taxaLunara = copilData.costLunar || copilData['Cost Lunar'] || copilData.taxaLunara || copilData.taxa || 0;
            console.log(`👶 Copil ${copilData.nume}: Taxa = ${taxaLunara}, Tip: ${typeof taxaLunara}`);
            const taxaNumar = Number(taxaLunara) || 0;
            console.log(`   Convertit la număr: ${taxaNumar}`);
            totalVenitTaxe += taxaNumar;
          });
          console.log(`💰 Total taxe grupa ${grupa.nume}: ${totalVenitTaxe} lei`);

          // Calculează venit din OPȚIONALE pentru această grupă
          const optionaleRef = collection(db, 'organizations', organizationId, 'locations', locationId, 'optionale');
          const optionaleSnap = await getDocs(optionaleRef);
          
          let totalVenitOptionale = 0;
          let optionaleCount = 0;

          optionaleSnap.docs.forEach(optionalDoc => {
            const optionalData = optionalDoc.data();
            const copiiInOptional = optionalData.copii || [];
            
            // Numără câți copii din această grupă sunt în opțional
            const copiiDinGrupaInOptional = copiiInOptional.filter((cnp: string) => {
              return copiiInGrupa.some(copilDoc => copilDoc.data().cnp === cnp);
            });

            if (copiiDinGrupaInOptional.length > 0) {
              optionaleCount++;
              totalVenitOptionale += copiiDinGrupaInOptional.length * (optionalData.pret || 0);
            }
          });

          // TOTAL = TAXE + OPȚIONALE
          const totalVenitGrupa = totalVenitTaxe + totalVenitOptionale;

          allGrupe.push({
            id: grupa.id,
            nume: grupa.nume,
            emoji: grupa.emoji || '📚',
            varsta: grupa.varsta || '',
            copiiCount,
            optionaleCount,
            totalVenitOptionale,
            totalVenitTaxe,
            totalVenit: totalVenitGrupa
          });
        }
      }

      setGrupe(allGrupe);
    } catch (error) {
      console.error('Eroare încărcare grupe:', error);
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
        {/* Header Pagină */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-3xl shadow-[0_10px_0_rgba(147,51,234,0.3),0_15px_30px_rgba(147,51,234,0.3)] p-8 text-white border-4 border-white/20">
          <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">💰 Raport Financiar pe Grupe</h1>
          <p className="text-white/90 text-lg drop-shadow-md">Încasări din opționale per grupă</p>
        </div>


        {/* Carduri Grupe */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grupe.map((grupa, index) => {
            const gradients = [
              'from-blue-500 to-cyan-500',
              'from-purple-500 to-pink-500',
              'from-orange-500 to-red-500',
              'from-green-500 to-emerald-500',
              'from-indigo-500 to-purple-500',
              'from-pink-500 to-rose-500'
            ];
            const gradient = gradients[index % gradients.length];

            return (
              <Link
                key={grupa.id}
                href={`/reports/financial-groups/${grupa.id}`}
                className="group relative"
              >
                <div className={`bg-gradient-to-br ${gradient} rounded-3xl p-6 shadow-[0_8px_0_rgba(0,0,0,0.2),0_12px_24px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_0_rgba(0,0,0,0.3),0_8px_20px_rgba(0,0,0,0.2)] hover:translate-y-1 transition-all duration-200 border-2 border-white/30`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-5xl">{grupa.emoji}</div>
                    <div className="px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full">
                      <span className="text-xs font-bold text-white">{grupa.varsta}</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">{grupa.nume}</h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-white/90">
                      <Users className="w-5 h-5" />
                      <span className="font-semibold">{grupa.copiiCount} copii</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <GraduationCap className="w-5 h-5" />
                      <span className="font-semibold">{grupa.optionaleCount} opționale</span>
                    </div>
                  </div>

                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30">
                    <p className="text-xs text-white/80 font-semibold mb-1">VENIT TOTAL</p>
                    <p className="text-3xl font-bold text-white">{grupa.totalVenit.toLocaleString()} RON</p>
                  </div>

                  <div className="mt-4 text-center">
                    <span className="text-sm font-bold text-white group-hover:underline">
                      👁️ Vezi detalii →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {grupe.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">Nu există grupe create încă.</p>
          </div>
        )}
      </div>
    </div>
  );
}
