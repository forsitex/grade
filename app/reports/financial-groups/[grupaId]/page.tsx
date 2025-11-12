'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { 
  ArrowLeft, 
  Users, 
  Calendar,
  GraduationCap,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Copil {
  cnp: string;
  nume: string;
  taxa: number;
  platit: boolean;
}

interface Optional {
  id: string;
  nume: string;
  pret: number;
  icon: string;
  copiiInscrisi: number;
  totalVenit: number;
  copiiLista: string[]; // Lista cu numele copiilor
}

export default function GrupaDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const grupaId = params.grupaId as string;

  const [loading, setLoading] = useState(true);
  const [grupaNume, setGrupaNume] = useState('');
  const [grupaEmoji, setGrupaEmoji] = useState('📚');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  const [copii, setCopii] = useState<Copil[]>([]);
  const [optionale, setOptionale] = useState<Optional[]>([]);
  
  const [totalTaxe, setTotalTaxe] = useState(0);
  const [totalOptionale, setTotalOptionale] = useState(0);
  const [taxePlătite, setTaxePlătite] = useState(0);
  const [taxeRestante, setTaxeRestante] = useState(0);

  useEffect(() => {
    // Setează luna și anul curent
    const now = new Date();
    setSelectedMonth(String(now.getMonth() + 1).padStart(2, '0'));
    setSelectedYear(String(now.getFullYear()));
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      loadGrupaData();
    }
  }, [selectedMonth, selectedYear, grupaId]);

  const loadGrupaData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const organizationId = user.uid;

      // Încarcă toate locațiile pentru a găsi grupa
      const locationsRef = collection(db, 'organizations', organizationId, 'locations');
      const locationsSnap = await getDocs(locationsRef);

      let grupaGasita = null;
      let locationId = '';

      // Caută grupa în toate locațiile
      for (const locationDoc of locationsSnap.docs) {
        const locationData = locationDoc.data();
        const grupe = locationData.grupe || [];
        
        const grupa = grupe.find((g: any) => g.id === grupaId);
        if (grupa) {
          grupaGasita = grupa;
          locationId = locationDoc.id;
          setGrupaNume(grupa.nume);
          setGrupaEmoji(grupa.emoji || '📚');
          break;
        }
      }

      if (!grupaGasita || !locationId) {
        console.error('Grupa nu a fost găsită');
        return;
      }

      // Încarcă copiii din grupă
      const childrenRef = collection(db, 'organizations', organizationId, 'locations', locationId, 'children');
      const childrenSnap = await getDocs(childrenRef);
      
      const copiiInGrupa = childrenSnap.docs
        .filter(doc => doc.data().grupa === grupaGasita.nume)
        .map(doc => {
          const data = doc.data();
          const taxa = data.costLunar || data['Cost Lunar'] || data.taxaLunara || data.taxa || 0;
          return {
            cnp: data.cnp,
            nume: data.nume,
            taxa: Number(taxa) || 0,
            platit: false // TODO: Implementare sistem plăți
          };
        });

      setCopii(copiiInGrupa);

      // Calculează taxe
      const totalTaxeCalculat = copiiInGrupa.reduce((sum, copil) => sum + copil.taxa, 0);
      setTotalTaxe(totalTaxeCalculat);
      
      // TODO: Calculează plătite/restante când avem sistem de plăți
      setTaxePlătite(0);
      setTaxeRestante(totalTaxeCalculat);

      // Încarcă opționalele
      const optionaleRef = collection(db, 'organizations', organizationId, 'locations', locationId, 'optionale');
      const optionaleSnap = await getDocs(optionaleRef);

      const optionaleData: Optional[] = [];
      let totalOptCalculat = 0;

      optionaleSnap.docs.forEach(optionalDoc => {
        const optionalData = optionalDoc.data();
        const copiiInOptional = optionalData.copii || [];
        
        // Numără câți copii din această grupă sunt în opțional
        const copiiDinGrupaInOptional = copiiInOptional.filter((cnp: string) => {
          return copiiInGrupa.some(copil => copil.cnp === cnp);
        });

        if (copiiDinGrupaInOptional.length > 0) {
          const venitOptional = copiiDinGrupaInOptional.length * (optionalData.pret || 0);
          totalOptCalculat += venitOptional;

          // Găsește numele copiilor înscriși
          const numeleCopii = copiiDinGrupaInOptional.map((cnp: string) => {
            const copil = copiiInGrupa.find(c => c.cnp === cnp);
            return copil ? copil.nume : 'Necunoscut';
          });

          optionaleData.push({
            id: optionalDoc.id,
            nume: optionalData.nume,
            pret: optionalData.pret || 0,
            icon: optionalData.icon || '🎓',
            copiiInscrisi: copiiDinGrupaInOptional.length,
            totalVenit: venitOptional,
            copiiLista: numeleCopii
          });
        }
      });

      setOptionale(optionaleData);
      setTotalOptionale(totalOptCalculat);

    } catch (error) {
      console.error('Eroare încărcare date grupă:', error);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    { value: '01', label: 'Ianuarie' },
    { value: '02', label: 'Februarie' },
    { value: '03', label: 'Martie' },
    { value: '04', label: 'Aprilie' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Iunie' },
    { value: '07', label: 'Iulie' },
    { value: '08', label: 'August' },
    { value: '09', label: 'Septembrie' },
    { value: '10', label: 'Octombrie' },
    { value: '11', label: 'Noiembrie' },
    { value: '12', label: 'Decembrie' }
  ];

  const years = [2024, 2025, 2026];

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
            onClick={() => router.push('/reports/financial-groups')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi la Grupe
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header Grupă */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-3xl shadow-[0_10px_0_rgba(147,51,234,0.3),0_15px_30px_rgba(147,51,234,0.3)] p-8 text-white border-4 border-white/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">{grupaEmoji}</div>
            <div>
              <h1 className="text-4xl font-bold drop-shadow-lg">{grupaNume}</h1>
              <p className="text-white/90 text-lg drop-shadow-md">{copii.length} copii înscriși</p>
            </div>
          </div>
        </div>

        {/* Selector Perioadă */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            📅 Selectează Perioada
          </h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Luna</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Anul</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              onClick={loadGrupaData}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition shadow-lg"
            >
              Aplică
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 shadow-[0_8px_0_rgb(37,99,235),0_13px_25px_rgba(37,99,235,0.4)] border-2 border-blue-400">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-10 h-10 text-white" />
              <span className="text-3xl font-bold text-white">{copii.length}</span>
            </div>
            <h3 className="text-blue-100 text-xs font-semibold mb-1">Total Copii</h3>
            <p className="text-sm text-blue-50">În grupă</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 shadow-[0_8px_0_rgb(234,88,12),0_13px_25px_rgba(234,88,12,0.4)] border-2 border-orange-400">
            <div className="flex items-center justify-between mb-3">
              <div className="text-4xl font-bold text-white">RON</div>
              <span className="text-3xl font-bold text-white">{totalTaxe.toLocaleString()}</span>
            </div>
            <h3 className="text-orange-100 text-xs font-semibold mb-1">Venit din Taxe</h3>
            <p className="text-sm text-orange-50">RON taxe lunare</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-6 shadow-[0_8px_0_rgb(22,163,74),0_13px_25px_rgba(22,163,74,0.4)] border-2 border-green-400">
            <div className="flex items-center justify-between mb-3">
              <div className="text-4xl font-bold text-white">RON</div>
              <span className="text-3xl font-bold text-white">{totalOptionale.toLocaleString()}</span>
            </div>
            <h3 className="text-green-100 text-xs font-semibold mb-1">Venit din Opționale</h3>
            <p className="text-sm text-green-50">RON opționale</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 shadow-[0_8px_0_rgb(147,51,234),0_13px_25px_rgba(147,51,234,0.4)] border-2 border-purple-400">
            <div className="flex items-center justify-between mb-3">
              <div className="text-4xl font-bold text-white">RON</div>
              <span className="text-3xl font-bold text-white">{(totalTaxe + totalOptionale).toLocaleString()}</span>
            </div>
            <h3 className="text-purple-100 text-xs font-semibold mb-1">Total General</h3>
            <p className="text-sm text-purple-50">Taxe + Opționale</p>
          </div>
        </div>

        {/* Taxe Lunare */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            💵 Taxe Lunare per Copil
          </h2>
          <div className="space-y-3">
            {copii.map((copil) => (
              <div 
                key={copil.cnp}
                className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{copil.nume}</p>
                    <p className="text-sm text-gray-600">CNP: {copil.cnp}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-900">{copil.taxa.toLocaleString()} RON</p>
                  <p className="text-xs text-gray-500">Taxa lunară</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold mb-1">TOTAL TAXE LUNARE</p>
                <p className="text-4xl font-bold">{totalTaxe.toLocaleString()} RON</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>
        </div>

        {/* Opționale */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            🎓 Opționale Active
          </h2>
          {optionale && optionale.length > 0 ? (
            <div className="space-y-3">
              {optionale.map((optional) => (
                <div 
                  key={optional.id}
                  className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{optional.icon}</div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{optional.nume}</p>
                        <p className="text-sm text-gray-600">
                          {optional.copiiInscrisi} copii × {optional.pret.toLocaleString()} RON
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-900">{optional.totalVenit.toLocaleString()} RON</p>
                      <p className="text-xs text-gray-500">Venit total</p>
                    </div>
                  </div>
                  
                  {/* Lista copii înscriși */}
                  <div className="mt-3 pt-3 border-t-2 border-green-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">👶 Copii înscriși:</p>
                    <div className="flex flex-wrap gap-2">
                      {optional.copiiLista.map((nume, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border border-green-300"
                        >
                          {nume}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Nu există opționale active pentru această grupă.</p>
            </div>
          )}
          
          {optionale.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold mb-1">TOTAL OPȚIONALE</p>
                  <p className="text-4xl font-bold">{totalOptionale.toLocaleString()} RON</p>
                </div>
                <div className="text-4xl">🎓</div>
              </div>
            </div>
          )}
        </div>

        {/* Total General */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl shadow-xl p-8 text-white text-center">
          <p className="text-xl font-semibold mb-2">💰 TOTAL GENERAL {grupaNume}</p>
          <p className="text-5xl font-bold mb-2">{(totalTaxe + totalOptionale).toLocaleString()} RON</p>
          <p className="text-white/90">
            {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <p className="text-white/80">Taxe</p>
              <p className="text-2xl font-bold">{totalTaxe.toLocaleString()} RON</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <p className="text-white/80">Opționale</p>
              <p className="text-2xl font-bold">{totalOptionale.toLocaleString()} RON</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
