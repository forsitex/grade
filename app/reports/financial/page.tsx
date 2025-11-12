'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Loader2
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getOrgAndLocation } from '@/lib/firebase-helpers';

function FinancialReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationId = searchParams.get('locationId'); // ID grădiniță specifică
  
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedGrupa, setSelectedGrupa] = useState('toate');
  const [locationName, setLocationName] = useState('');
  
  const [children, setChildren] = useState<any[]>([]);
  const [grupe, setGrupe] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalIncasari: 0,
    totalMensualizari: 0,
    totalOptionale: 0,
    copiiActivi: 0,
    medieCopil: 0
  });
  const [optionaleBreakdown, setOptionaleBreakdown] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedGrupa]);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const orgData = await getOrgAndLocation();
      if (!orgData) return;

      let locationsData: any[] = [];

      // Dacă avem locationId, încarcă doar acea grădiniță
      if (locationId) {
        const locationRef = doc(db, 'organizations', orgData.organizationId, 'locations', locationId);
        const locationSnap = await getDoc(locationRef);
        
        if (locationSnap.exists()) {
          locationsData = [{
            id: locationSnap.id,
            ...locationSnap.data()
          }];
          setLocationName(locationSnap.data().name || '');
        }
      } else {
        // Încarcă toate grădinițele
        const locationsRef = collection(db, 'organizations', orgData.organizationId, 'locations');
        const locationsSnap = await getDocs(locationsRef);
        locationsData = locationsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];
      }

      let allGrupe: any[] = [];
      locationsData.forEach((location: any) => {
        if (location.grupe) {
          allGrupe = [...allGrupe, ...location.grupe];
        }
      });
      setGrupe(allGrupe);

      // Încarcă copiii
      let allChildren: any[] = [];
      for (const location of locationsData) {
        const childrenRef = collection(db, 'organizations', orgData.organizationId, 'locations', location.id, 'children');
        const childrenSnap = await getDocs(childrenRef);
        const locationChildren = childrenSnap.docs.map(doc => ({
          id: doc.id,
          locationId: location.id,
          ...doc.data()
        }));
        allChildren = [...allChildren, ...locationChildren];
      }

      // Filtrare după grupă
      if (selectedGrupa !== 'toate') {
        allChildren = allChildren.filter(c => c.grupa === selectedGrupa);
      }

      setChildren(allChildren);
      calculateStats(allChildren);
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (childrenData: any[]) => {
    let totalMensualizari = 0;
    let totalOptionale = 0;
    const optionaleMap = new Map();

    childrenData.forEach(child => {
      // Mensualizare (din contract)
      const costLunar = child.contract?.costLunar || child.taxaMensualitate || 0;
      totalMensualizari += parseFloat(costLunar) || 0;

      // Opționale
      if (child.optionale) {
        child.optionale.forEach((opt: any) => {
          const costTotal = opt.tip === 'lunar' ? opt.cost : opt.cost * opt.sedinte;
          totalOptionale += costTotal;

          // Breakdown per opțional
          if (optionaleMap.has(opt.nume)) {
            const existing = optionaleMap.get(opt.nume);
            optionaleMap.set(opt.nume, {
              ...existing,
              total: existing.total + costTotal,
              copii: existing.copii + 1
            });
          } else {
            optionaleMap.set(opt.nume, {
              nume: opt.nume,
              total: costTotal,
              copii: 1
            });
          }
        });
      }

      // Altele
      if (child.alteleOptionale) {
        child.alteleOptionale.forEach((alt: any) => {
          const costTotal = alt.tip === 'lunar' ? alt.cost : alt.cost * alt.sedinte;
          totalOptionale += costTotal;

          if (optionaleMap.has(alt.nume)) {
            const existing = optionaleMap.get(alt.nume);
            optionaleMap.set(alt.nume, {
              ...existing,
              total: existing.total + costTotal,
              copii: existing.copii + 1
            });
          } else {
            optionaleMap.set(alt.nume, {
              nume: alt.nume,
              total: costTotal,
              copii: 1
            });
          }
        });
      }
    });

    const totalIncasari = totalMensualizari + totalOptionale;
    const medieCopil = childrenData.length > 0 ? Math.round(totalIncasari / childrenData.length) : 0;

    setStats({
      totalIncasari,
      totalMensualizari,
      totalOptionale,
      copiiActivi: childrenData.length,
      medieCopil
    });

    // Sortează breakdown
    const breakdown = Array.from(optionaleMap.values()).sort((a, b) => b.total - a.total);
    setOptionaleBreakdown(breakdown);
  };

  const calculateChildTotal = (child: any) => {
    let total = parseFloat(child.contract?.costLunar || child.taxaMensualitate || 0);

    if (child.optionale) {
      child.optionale.forEach((opt: any) => {
        total += opt.tip === 'lunar' ? opt.cost : opt.cost * opt.sedinte;
      });
    }

    if (child.alteleOptionale) {
      child.alteleOptionale.forEach((alt: any) => {
        total += alt.tip === 'lunar' ? alt.cost : alt.cost * alt.sedinte;
      });
    }

    return total;
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
            onClick={() => locationId ? router.push(`/gradinite/${locationId}`) : router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            {locationId ? 'Înapoi la Grădiniță' : 'Înapoi la Dashboard'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <h1 className="text-4xl font-bold mb-2">
              💰 Raport Financiar {locationName && `- ${locationName}`}
            </h1>
            <p className="text-white/90">
              {locationId ? `Analiză financiară pentru ${locationName}` : 'Analiză completă încasări și opționale'}
            </p>
          </div>

          {/* Filtre */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">Filtre</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Selectează Luna
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  max={new Date().toISOString().substring(0, 7)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selectează Grupa
                </label>
                <select
                  value={selectedGrupa}
                  onChange={(e) => setSelectedGrupa(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                >
                  <option value="toate">Toate Grupele</option>
                  {grupe.map(grupa => (
                    <option key={grupa.id} value={grupa.nume}>
                      {grupa.nume}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  Export Excel
                </button>
              </div>
            </div>
          </div>

          {/* Statistici Generale */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📊 Rezumat General - {selectedMonth}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="text-4xl font-bold mb-2 opacity-80">RON</div>
                <p className="text-3xl font-bold">{stats.totalIncasari.toLocaleString()} RON</p>
                <p className="text-sm text-white/80 mt-1">Total Încasări</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="text-4xl font-bold mb-2 opacity-80">RON</div>
                <p className="text-3xl font-bold">{stats.totalMensualizari.toLocaleString()} RON</p>
                <p className="text-sm text-white/80 mt-1">Mensualizări</p>
                <p className="text-xs text-white/60 mt-1">
                  {stats.totalIncasari > 0 ? Math.round((stats.totalMensualizari / stats.totalIncasari) * 100) : 0}%
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="text-4xl font-bold mb-2 opacity-80">RON</div>
                <p className="text-3xl font-bold">{stats.totalOptionale.toLocaleString()} RON</p>
                <p className="text-sm text-white/80 mt-1">Opționale</p>
                <p className="text-xs text-white/60 mt-1">
                  {stats.totalIncasari > 0 ? Math.round((stats.totalOptionale / stats.totalIncasari) * 100) : 0}%
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <Users className="w-8 h-8 mb-2 opacity-80" />
                <p className="text-3xl font-bold">{stats.copiiActivi}</p>
                <p className="text-sm text-white/80 mt-1">Copii Activi</p>
              </div>
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-6 text-white">
                <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
                <p className="text-3xl font-bold">{stats.medieCopil.toLocaleString()} RON</p>
                <p className="text-sm text-white/80 mt-1">Medie/Copil</p>
              </div>
            </div>
          </div>

          {/* Breakdown Opționale */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📈 Încasări pe Categorii
            </h2>
            <div className="space-y-3">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">Mensualizări</p>
                    <p className="text-sm text-gray-600">{stats.copiiActivi} copii</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalMensualizari.toLocaleString()} RON
                  </p>
                </div>
              </div>

              {optionaleBreakdown.map((opt, index) => (
                <div
                  key={index}
                  className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{opt.nume}</p>
                      <p className="text-sm text-gray-600">{opt.copii} copii</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {opt.total.toLocaleString()} RON
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detalii per Copil */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              👥 Detalii per Copil
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-900">Nume</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-900">Grupă</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-900">Mensualizare</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-900">Opționale</th>
                    <th className="px-4 py-3 text-right font-bold text-green-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {children.map((child) => {
                    const total = calculateChildTotal(child);
                    const costLunar = parseFloat(child.contract?.costLunar || child.taxaMensualitate || 0);
                    const optionaleTotal = total - costLunar;

                    return (
                      <tr key={child.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold">{child.nume}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{child.grupa}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {costLunar.toLocaleString()} RON
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-purple-600">
                          {optionaleTotal.toLocaleString()} RON
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-green-600 text-lg">
                          {total.toLocaleString()} RON
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 font-bold text-gray-900">TOTAL</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {stats.totalMensualizari.toLocaleString()} RON
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-purple-900">
                      {stats.totalOptionale.toLocaleString()} RON
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-900 text-xl">
                      {stats.totalIncasari.toLocaleString()} RON
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function FinancialReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Se încarcă raportul...</p>
        </div>
      </div>
    }>
      <FinancialReportContent />
    </Suspense>
  );
}
