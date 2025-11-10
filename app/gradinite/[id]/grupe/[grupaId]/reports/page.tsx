'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Calendar,
  Users,
  UtensilsCrossed,
  Moon,
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Sparkles
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

interface Activity {
  id: string;
  nume: string;
  data: string;
  status: 'viitoare' | 'completata';
  descriere?: string;
}

interface Child {
  id: string;
  nume: string;
  cnp: string;
}

export default function GrupaReportsPage() {
  const params = useParams();
  const router = useRouter();
  const gradinitaId = params.id as string;
  const grupaId = params.grupaId as string;

  const [loading, setLoading] = useState(true);
  const [grupa, setGrupa] = useState<any>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>(''); // CNP copil selectat
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Statistici
  const [attendanceStats, setAttendanceStats] = useState<any>({});
  const [mealStats, setMealStats] = useState<any>({});
  const [sleepStats, setSleepStats] = useState<any>({});

  // AI Analysis
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [gradinitaId, grupaId]);

  useEffect(() => {
    if (selectedChild) {
      loadChildData();
    }
  }, [selectedChild, selectedMonth]);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      let orgId = '';
      let locId = gradinitaId;
      
      const educatoareRef = doc(db, 'educatoare', user.uid);
      const educatoareSnap = await getDoc(educatoareRef);
      
      if (educatoareSnap.exists()) {
        const educatoareData = educatoareSnap.data();
        orgId = educatoareData.organizationId;
        locId = educatoareData.locationId;
      } else {
        orgId = user.uid;
      }

      // Încarcă date grădiniță și grupă
      const gradinitaRef = doc(db, 'organizations', orgId, 'locations', locId);
      const gradinitaSnap = await getDoc(gradinitaRef);

      if (gradinitaSnap.exists()) {
        const data = gradinitaSnap.data();
        const grupaData = data.grupe?.find((g: any) => g.id === grupaId);
        setGrupa(grupaData);

        // Încarcă copii din grupă
        const childrenRef = collection(db, 'organizations', orgId, 'locations', locId, 'children');
        const childrenSnap = await getDocs(childrenRef);
        const childrenData = (childrenSnap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as any[])
          .filter((child: any) => child.grupa === grupaData?.nume);
        
        setChildren(childrenData);

        // Selectează primul copil automat
        if (childrenData.length > 0 && !selectedChild) {
          setSelectedChild(childrenData[0].cnp);
        }
      }
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildData = async () => {
    if (!selectedChild) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      let orgId = '';
      let locId = gradinitaId;
      
      const educatoareRef = doc(db, 'educatoare', user.uid);
      const educatoareSnap = await getDoc(educatoareRef);
      
      if (educatoareSnap.exists()) {
        const educatoareData = educatoareSnap.data();
        orgId = educatoareData.organizationId;
        locId = educatoareData.locationId;
      } else {
        orgId = user.uid;
      }

      // Încarcă activități pentru copilul selectat
      await loadActivities(orgId, locId);

      // Calculează statistici pentru copilul selectat
      await calculateStatsForChild(orgId, locId, selectedChild);
    } catch (error) {
      console.error('Eroare încărcare date copil:', error);
    }
  };

  const loadActivities = async (orgId: string, locId: string) => {
    try {
      const activitiesRef = collection(db, 'organizations', orgId, 'locations', locId, 'activities');
      const activitiesSnap = await getDocs(activitiesRef);
      
      const startOfMonth = new Date(selectedMonth + '-01');
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

      const activitiesData = activitiesSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((activity: any) => {
          if (activity.grupa !== grupa?.nume) return false;
          const activityDate = new Date(activity.data);
          return activityDate >= startOfMonth && activityDate <= endOfMonth;
        }) as Activity[];

      activitiesData.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      setActivities(activitiesData);
    } catch (error) {
      console.error('Eroare încărcare activități:', error);
    }
  };

  const calculateStatsForChild = async (orgId: string, locId: string, childCnp: string) => {
    try {
      const startDate = new Date(selectedMonth + '-01');
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      let totalPresent = 0;
      let totalAbsent = 0;
      let totalDays = 0;

      let mealData = {
        micDejun: { good: 0, total: 0 },
        pranz: { good: 0, total: 0 },
        gustare: { good: 0, total: 0 }
      };

      let sleepData = {
        odihnit: 0,
        neodihnit: 0,
        total: 0
      };

      // Prezență pentru copilul selectat
      const attendanceRef = collection(
        db,
        'organizations',
        orgId,
        'locations',
        locId,
        'children',
        childCnp,
        'attendance'
      );
      const attendanceSnap = await getDocs(attendanceRef);
      
      attendanceSnap.docs.forEach(doc => {
        const data = doc.data();
        const date = new Date(doc.id);
        
        if (date >= startDate && date <= endDate) {
          totalDays++;
          if (data.status === 'present') {
            totalPresent++;
          } else {
            totalAbsent++;
          }
        }
      });

      // Rapoarte zilnice pentru copilul selectat
      const reportsRef = collection(
        db,
        'organizations',
        orgId,
        'locations',
        locId,
        'children',
        childCnp,
        'dailyReports'
      );
      const reportsSnap = await getDocs(reportsRef);

      reportsSnap.docs.forEach(doc => {
        const data = doc.data();
        const date = new Date(doc.id);

        if (date >= startDate && date <= endDate) {
          // Mese
          if (data.mese) {
            if (data.mese.micDejun !== undefined) {
              mealData.micDejun.total++;
              if (data.mese.micDejun >= 70) mealData.micDejun.good++;
            }
            if (data.mese.pranz !== undefined) {
              mealData.pranz.total++;
              if (data.mese.pranz >= 70) mealData.pranz.good++;
            }
            if (data.mese.gustare1 !== undefined || data.mese.gustare2 !== undefined) {
              mealData.gustare.total++;
              const gustareAvg = ((data.mese.gustare1 || 0) + (data.mese.gustare2 || 0)) / 2;
              if (gustareAvg >= 70) mealData.gustare.good++;
            }
          }

          // Somn
          if (data.somn) {
            sleepData.total++;
            if (data.somn.odihnit) {
              sleepData.odihnit++;
            } else {
              sleepData.neodihnit++;
            }
          }
        }
      });

      setAttendanceStats({
        totalPresent,
        totalAbsent,
        totalDays,
        percentage: totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0
      });

      setMealStats(mealData);
      setSleepStats(sleepData);

    } catch (error) {
      console.error('Eroare calcul statistici:', error);
    }
  };

  const getMonthName = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
  };

  const handleAnalyzeWithAI = async () => {
    if (!selectedChild) return;

    setAiLoading(true);
    setShowAIAnalysis(true);

    try {
      const selectedChildData = children.find(c => c.cnp === selectedChild);
      
      const reportData = {
        copil: {
          nume: selectedChildData?.nume,
          varsta: 4, // TODO: Calculează din CNP
        },
        perioada: getMonthName(selectedMonth),
        prezenta: attendanceStats,
        mese: mealStats,
        somn: sleepStats,
        activitati: {
          total: activities.length,
          completate: activities.filter(a => a.status === 'completata').length,
        },
      };

      const response = await fetch('/api/analyze-report-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      const data = await response.json();

      if (data.success) {
        setAiAnalysis(data.analysis);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Eroare analiză AI:', error);
      setAiAnalysis('❌ Eroare la analiza AI. Te rog încearcă din nou.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Se încarcă raportul...</p>
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
            onClick={async () => {
              const user = auth.currentUser;
              if (user) {
                const educatoareRef = doc(db, 'educatoare', user.uid);
                const educatoareSnap = await getDoc(educatoareRef);
                if (educatoareSnap.exists()) {
                  router.push('/dashboard-educatoare');
                } else {
                  router.push(`/gradinite/${gradinitaId}/grupe/${grupaId}`);
                }
              }
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Raport */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <FileText className="w-12 h-12" />
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">📊 Raport Grupă</h1>
                <p className="text-white/90 text-xl">{grupa?.nume}</p>
              </div>
            </div>

            {/* Selector Lună */}
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <div className="flex items-center gap-2">
                <span className="text-white/90 font-semibold">Luna:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-white text-gray-900 font-semibold"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const monthStr = date.toISOString().slice(0, 7);
                    return (
                      <option key={monthStr} value={monthStr}>
                        {getMonthName(monthStr)}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Selector Copil */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">👶 Selectează Copilul</h2>
                <p className="text-gray-600">Alege copilul pentru a vedea raportul său</p>
              </div>
            </div>

            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
            >
              <option value="">Selectează un copil...</option>
              {children.map((child) => (
                <option key={child.cnp} value={child.cnp}>
                  {child.nume}
                </option>
              ))}
            </select>
          </div>

          {/* Raport Copil - Afișat doar dacă e selectat un copil */}
          {!selectedChild ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Selectează un copil pentru a vedea raportul
              </h3>
              <p className="text-gray-600">
                Alege un copil din lista de mai sus pentru a vizualiza statisticile sale
              </p>
            </div>
          ) : (
            <>
              {/* Header Raport Copil */}
              <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl shadow-xl p-6 mb-8 text-white">
                <h2 className="text-3xl font-bold">
                  📊 Raportul lui {children.find(c => c.cnp === selectedChild)?.nume}
                </h2>
                <p className="text-white/90 mt-2">{getMonthName(selectedMonth)}</p>
              </div>

          {/* 1. Activități Zilnice */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">🎨 Activități Zilnice Realizate</h2>
                <p className="text-gray-600">{getMonthName(selectedMonth)}</p>
              </div>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nu există activități în această perioadă</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                  >
                    <div className={`w-2 h-16 rounded-full ${
                      activity.status === 'completata' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{activity.nume}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          activity.status === 'completata'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {activity.status === 'completata' ? 'Completată' : 'Viitoare'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{activity.descriere || 'Fără descriere'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        📅 {new Date(activity.data).toLocaleDateString('ro-RO', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-900">Total activități:</span>
                <span className="text-2xl font-bold text-blue-600">{activities.length}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-blue-700">Completate:</span>
                <span className="font-semibold text-green-600">
                  {activities.filter(a => a.status === 'completata').length}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Prezență */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-100 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">✅ Prezență</h2>
                <p className="text-gray-600">Statistici {getMonthName(selectedMonth)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-6 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">Prezenți</span>
                </div>
                <p className="text-4xl font-bold text-green-600">{attendanceStats.totalPresent || 0}</p>
                <p className="text-sm text-green-600 mt-1">zile</p>
              </div>

              <div className="p-6 bg-red-50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="w-8 h-8 text-red-600" />
                  <span className="text-sm font-semibold text-red-700">Absenți</span>
                </div>
                <p className="text-4xl font-bold text-red-600">{attendanceStats.totalAbsent || 0}</p>
                <p className="text-sm text-red-600 mt-1">zile</p>
              </div>

              <div className="p-6 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">Procent Prezență</span>
                </div>
                <p className="text-4xl font-bold text-blue-600">{attendanceStats.percentage || 0}%</p>
                <p className="text-sm text-blue-600 mt-1">medie grupă</p>
              </div>
            </div>

            <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${attendanceStats.percentage || 0}%` }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-700">
                  {attendanceStats.totalPresent || 0} / {attendanceStats.totalDays || 0} zile
                </span>
              </div>
            </div>
          </div>

          {/* 3. Mese */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-orange-100 rounded-xl">
                <UtensilsCrossed className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">🍽️ Mese</h2>
                <p className="text-gray-600">Ce au mâncat bine</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-700">Mic Dejun</span>
                  <span className="text-sm text-gray-600">
                    {mealStats.micDejun?.good || 0} / {mealStats.micDejun?.total || 0} (
                    {mealStats.micDejun?.total > 0
                      ? Math.round((mealStats.micDejun.good / mealStats.micDejun.total) * 100)
                      : 0}%)
                  </span>
                </div>
                <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-orange-500"
                    style={{
                      width: `${
                        mealStats.micDejun?.total > 0
                          ? (mealStats.micDejun.good / mealStats.micDejun.total) * 100
                          : 0
                      }%`
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-700">Prânz</span>
                  <span className="text-sm text-gray-600">
                    {mealStats.pranz?.good || 0} / {mealStats.pranz?.total || 0} (
                    {mealStats.pranz?.total > 0
                      ? Math.round((mealStats.pranz.good / mealStats.pranz.total) * 100)
                      : 0}%)
                  </span>
                </div>
                <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-emerald-500"
                    style={{
                      width: `${
                        mealStats.pranz?.total > 0
                          ? (mealStats.pranz.good / mealStats.pranz.total) * 100
                          : 0
                      }%`
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-700">Gustări</span>
                  <span className="text-sm text-gray-600">
                    {mealStats.gustare?.good || 0} / {mealStats.gustare?.total || 0} (
                    {mealStats.gustare?.total > 0
                      ? Math.round((mealStats.gustare.good / mealStats.gustare.total) * 100)
                      : 0}%)
                  </span>
                </div>
                <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-400 to-pink-500"
                    style={{
                      width: `${
                        mealStats.gustare?.total > 0
                          ? (mealStats.gustare.good / mealStats.gustare.total) * 100
                          : 0
                      }%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Somn */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Moon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">😴 Somn</h2>
                <p className="text-gray-600">Statistici somn</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">Odihnit</span>
                </div>
                <p className="text-4xl font-bold text-green-600">{sleepStats.odihnit || 0}</p>
                <p className="text-sm text-green-600 mt-1">
                  {sleepStats.total > 0
                    ? Math.round((sleepStats.odihnit / sleepStats.total) * 100)
                    : 0}% din total
                </p>
              </div>

              <div className="p-6 bg-orange-50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-8 h-8 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-700">Neodihnit</span>
                </div>
                <p className="text-4xl font-bold text-orange-600">{sleepStats.neodihnit || 0}</p>
                <p className="text-sm text-orange-600 mt-1">
                  {sleepStats.total > 0
                    ? Math.round((sleepStats.neodihnit / sleepStats.total) * 100)
                    : 0}% din total
                </p>
              </div>
            </div>

            <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden mt-6">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500"
                style={{
                  width: `${
                    sleepStats.total > 0
                      ? (sleepStats.odihnit / sleepStats.total) * 100
                      : 0
                  }%`
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-700">
                  {sleepStats.odihnit || 0} / {sleepStats.total || 0} zile odihnit
                </span>
              </div>
            </div>
          </div>

          {/* 5. Observații Generale */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gray-100 rounded-xl">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">📝 Observații Generale</h2>
                <p className="text-gray-600">Rezumat și recomandări</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-blue-50 rounded-xl">
                <h3 className="font-bold text-blue-900 mb-2">📊 Rezumat Luna</h3>
                <ul className="space-y-2 text-blue-800">
                  <li>• Prezență medie: <strong>{attendanceStats.percentage || 0}%</strong></li>
                  <li>• Activități realizate: <strong>{activities.filter(a => a.status === 'completata').length}</strong></li>
                  <li>• Copii în grupă: <strong>{children.length}</strong></li>
                </ul>
              </div>

              <div className="p-6 bg-green-50 rounded-xl">
                <h3 className="font-bold text-green-900 mb-2">✅ Puncte Forte</h3>
                <ul className="space-y-2 text-green-800">
                  <li>• Prezența este constantă și bună</li>
                  <li>• Copiii participă activ la activități</li>
                  <li>• Somn de calitate pentru majoritatea copiilor</li>
                </ul>
              </div>

              <div className="p-6 bg-yellow-50 rounded-xl">
                <h3 className="font-bold text-yellow-900 mb-2">💡 Recomandări</h3>
                <ul className="space-y-2 text-yellow-800">
                  <li>• Continuați să încurajați participarea la activități</li>
                  <li>• Mențineți rutina zilnică pentru somn</li>
                  <li>• Comunicați constant cu părinții</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buton Analizează cu AI */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              🤖 Vrei o analiză detaliată AI?
            </h3>
            <p className="text-gray-600 mb-6 text-center max-w-2xl">
              Inteligența artificială va analiza raportul și va genera recomandări personalizate pentru {children.find(c => c.cnp === selectedChild)?.nume}
            </p>
            <button
              onClick={handleAnalyzeWithAI}
              disabled={aiLoading}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-6 h-6" />
              {aiLoading ? 'Se analizează...' : '🤖 Analizează cu AI'}
            </button>
          </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Analiză AI */}
      {showAIAnalysis && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl max-h-[85vh] overflow-y-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-600" />
                Analiză AI - {children.find(c => c.cnp === selectedChild)?.nume}
              </h2>
              <button
                onClick={() => setShowAIAnalysis(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <XCircle className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {aiLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
                <p className="text-gray-600">AI analizează raportul...</p>
                <p className="text-sm text-gray-500 mt-2">Acest proces poate dura 10-15 secunde</p>
              </div>
            ) : (
              <>
                <div className="prose prose-lg max-w-none mb-6">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 whitespace-pre-wrap text-gray-900">
                    {aiAnalysis}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      // TODO: Implementează trimitere email
                      alert('Feature în curând: Trimite pe email');
                    }}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    📧 Trimite pe Email
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implementează export PDF
                      alert('Feature în curând: Export PDF');
                    }}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    📄 Export PDF
                  </button>
                  <button
                    onClick={() => setShowAIAnalysis(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Închide
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
