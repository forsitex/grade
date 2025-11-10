'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Utensils,
  Moon,
  Smile
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getOrgAndLocation } from '@/lib/firebase-helpers';

export default function DailyReportsHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const cnp = params.cnp as string;

  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [locationId, setLocationId] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      // Găsește copilul
      const orgData = await getOrgAndLocation();
      if (!orgData) return;

      const locationsRef = collection(db, 'organizations', orgData.organizationId, 'locations');
      const locationsSnap = await getDocs(locationsRef);
      
      let foundChild = null;
      let foundLocationId = '';

      for (const locationDoc of locationsSnap.docs) {
        const childRef = doc(db, 'organizations', orgData.organizationId, 'locations', locationDoc.id, 'children', cnp);
        const childSnap = await getDoc(childRef);
        
        if (childSnap.exists()) {
          foundChild = { id: childSnap.id, ...childSnap.data() };
          foundLocationId = locationDoc.id;
          break;
        }
      }

      if (!foundChild) {
        alert('Copilul nu a fost găsit!');
        router.back();
        return;
      }

      setChild(foundChild);
      setLocationId(foundLocationId);

      // Încarcă rapoartele pentru luna selectată
      const reportsRef = collection(db, 'organizations', orgData.organizationId, 'locations', foundLocationId, 'children', cnp, 'dailyReports');
      const reportsSnap = await getDocs(reportsRef);
      
      const allReports = reportsSnap.docs.map(doc => ({
        id: doc.id,
        date: doc.id,
        ...doc.data()
      }));

      // Filtrează după luna selectată
      const monthReports = allReports.filter(r => r.date.startsWith(selectedMonth));
      
      // Sortează descrescător
      monthReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setReports(monthReports);
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthStats = () => {
    if (reports.length === 0) return null;

    // Medie mese
    const avgMese = reports.reduce((sum, r) => {
      const total = (r.mese.micDejun + r.mese.gustare1 + r.mese.pranz + r.mese.gustare2 + r.mese.cina) / 5;
      return sum + total;
    }, 0) / reports.length;

    // Medie somn (în minute)
    const somnMinutes = reports
      .filter(r => r.somn.oraStart && r.somn.oraEnd)
      .map(r => {
        const [startH, startM] = r.somn.oraStart.split(':').map(Number);
        const [endH, endM] = r.somn.oraEnd.split(':').map(Number);
        const start = startH * 60 + startM;
        const end = endH * 60 + endM;
        return end - start;
      });
    
    const avgSomnMinutes = somnMinutes.length > 0 
      ? somnMinutes.reduce((a, b) => a + b, 0) / somnMinutes.length 
      : 0;

    // Dispoziție dominantă
    const dispozitii: any = {};
    reports.forEach(r => {
      dispozitii[r.dispozitie] = (dispozitii[r.dispozitie] || 0) + 1;
    });
    const dispozitieTop = Object.keys(dispozitii).sort((a, b) => dispozitii[b] - dispozitii[a])[0];

    return {
      avgMese: Math.round(avgMese),
      avgSomnHours: Math.floor(avgSomnMinutes / 60),
      avgSomnMinutes: Math.round(avgSomnMinutes % 60),
      dispozitieTop,
      totalReports: reports.length
    };
  };

  const getWeekComparison = (currentReport: any) => {
    const currentDate = new Date(currentReport.date);
    const weekAgo = new Date(currentDate);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const weekAgoReport = reports.find(r => r.date === weekAgoStr);
    if (!weekAgoReport) return null;

    // Comparație mese
    const currentMeseAvg = (currentReport.mese.micDejun + currentReport.mese.gustare1 + currentReport.mese.pranz + currentReport.mese.gustare2 + currentReport.mese.cina) / 5;
    const weekAgoMeseAvg = (weekAgoReport.mese.micDejun + weekAgoReport.mese.gustare1 + weekAgoReport.mese.pranz + weekAgoReport.mese.gustare2 + weekAgoReport.mese.cina) / 5;
    const meseDiff = Math.round(currentMeseAvg - weekAgoMeseAvg);

    // Comparație somn
    let somnDiff = 0;
    if (currentReport.somn.oraStart && weekAgoReport.somn.oraStart) {
      const [cStartH, cStartM] = currentReport.somn.oraStart.split(':').map(Number);
      const [cEndH, cEndM] = currentReport.somn.oraEnd.split(':').map(Number);
      const currentSomn = (cEndH * 60 + cEndM) - (cStartH * 60 + cStartM);

      const [wStartH, wStartM] = weekAgoReport.somn.oraStart.split(':').map(Number);
      const [wEndH, wEndM] = weekAgoReport.somn.oraEnd.split(':').map(Number);
      const weekAgoSomn = (wEndH * 60 + wEndM) - (wStartH * 60 + wStartM);

      somnDiff = currentSomn - weekAgoSomn;
    }

    return {
      meseDiff,
      somnDiff,
      dispozitieChanged: currentReport.dispozitie !== weekAgoReport.dispozitie,
      weekAgoDate: weekAgoStr
    };
  };

  const getTrendIcon = (diff: number) => {
    if (diff > 0) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (diff < 0) return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-gray-600" />;
  };

  const stats = getMonthStats();

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
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl">
                📊
              </div>
              <div>
                <h1 className="text-3xl font-bold">Istoric Rapoarte Zilnice</h1>
                <p className="text-white/90">{child?.nume}</p>
                <p className="text-sm text-white/80">CNP: {cnp}</p>
              </div>
            </div>
          </div>

          {/* Selector Lună */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="w-5 h-5 inline mr-2" />
                  Selectează Luna
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  max={new Date().toISOString().substring(0, 7)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 text-lg"
                />
              </div>
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition shadow-lg flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Statistici Luna */}
          {stats && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📈 Statistici {new Date(selectedMonth + '-01').toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                  <CalendarIcon className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-3xl font-bold">{stats.totalReports}</p>
                  <p className="text-sm text-white/80">Rapoarte</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                  <Utensils className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-3xl font-bold">{stats.avgMese}%</p>
                  <p className="text-sm text-white/80">Medie Mese</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                  <Moon className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-2xl font-bold">{stats.avgSomnHours}h {stats.avgSomnMinutes}m</p>
                  <p className="text-sm text-white/80">Medie Somn</p>
                </div>
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-4 text-white">
                  <Smile className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-2xl font-bold">{stats.dispozitieTop}</p>
                  <p className="text-sm text-white/80">Dispoziție</p>
                </div>
              </div>
            </div>
          )}

          {/* Lista Rapoarte */}
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <p className="text-gray-600">Nu există rapoarte pentru această lună</p>
              </div>
            ) : (
              reports.map((report) => {
                const comparison = getWeekComparison(report);
                const meseAvg = Math.round((report.mese.micDejun + report.mese.gustare1 + report.mese.pranz + report.mese.gustare2 + report.mese.cina) / 5);
                
                let somnDuration = '';
                if (report.somn.oraStart && report.somn.oraEnd) {
                  const [startH, startM] = report.somn.oraStart.split(':').map(Number);
                  const [endH, endM] = report.somn.oraEnd.split(':').map(Number);
                  const minutes = (endH * 60 + endM) - (startH * 60 + startM);
                  const hours = Math.floor(minutes / 60);
                  const mins = minutes % 60;
                  somnDuration = `${hours}h ${mins}m`;
                }

                return (
                  <div key={report.id} className="bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {new Date(report.date).toLocaleDateString('ro-RO', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h3>
                        {comparison && (
                          <p className="text-sm text-gray-600 mt-1">
                            Comparație cu {new Date(comparison.weekAgoDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/children/${cnp}/daily-report?date=${report.date}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
                      >
                        Vezi Detalii
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Mese */}
                      <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Utensils className="w-5 h-5 text-orange-600" />
                            <span className="font-bold text-gray-900">Mese</span>
                          </div>
                          {comparison && getTrendIcon(comparison.meseDiff)}
                        </div>
                        <p className="text-2xl font-bold text-orange-600">{meseAvg}%</p>
                        {comparison && comparison.meseDiff !== 0 && (
                          <p className="text-xs text-gray-600 mt-1">
                            {comparison.meseDiff > 0 ? '+' : ''}{comparison.meseDiff}% față de săptămâna trecută
                          </p>
                        )}
                      </div>

                      {/* Somn */}
                      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Moon className="w-5 h-5 text-purple-600" />
                            <span className="font-bold text-gray-900">Somn</span>
                          </div>
                          {comparison && comparison.somnDiff !== 0 && getTrendIcon(comparison.somnDiff)}
                        </div>
                        <p className="text-xl font-bold text-purple-600">{somnDuration || '—'}</p>
                        {comparison && comparison.somnDiff !== 0 && (
                          <p className="text-xs text-gray-600 mt-1">
                            {comparison.somnDiff > 0 ? '+' : ''}{comparison.somnDiff} min față de săptămâna trecută
                          </p>
                        )}
                      </div>

                      {/* Dispoziție */}
                      <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Smile className="w-5 h-5 text-pink-600" />
                            <span className="font-bold text-gray-900">Dispoziție</span>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-pink-600">{report.dispozitie}</p>
                        {comparison && comparison.dispozitieChanged && (
                          <p className="text-xs text-gray-600 mt-1">Schimbat față de săptămâna trecută</p>
                        )}
                      </div>
                    </div>

                    {report.noteEducatoare && (
                      <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                        <p className="text-sm text-gray-700">
                          <span className="font-bold">Note:</span> {report.noteEducatoare}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
