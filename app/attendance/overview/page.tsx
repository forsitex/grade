'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  Filter,
  Download
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

export default function AttendanceOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedGrupa, setSelectedGrupa] = useState('toate');
  const [viewMode, setViewMode] = useState<'today' | 'history'>('today');
  
  const [gradinite, setGradinite] = useState<any[]>([]);
  const [grupe, setGrupe] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>({});
  const [historyData, setHistoryData] = useState<any[]>([]);
  
  const [stats, setStats] = useState({
    totalChildren: 0,
    present: 0,
    absent: 0,
    medical: 0,
    vacation: 0,
    notMarked: 0
  });

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedMonth, viewMode]);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      // Încarcă toate grădinițele
      const locationsRef = collection(db, 'organizations', user.uid, 'locations');
      const locationsSnap = await getDocs(locationsRef);
      const locationsData = locationsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      setGradinite(locationsData);

      // Colectează toate grupele și copiii
      let allGrupe: any[] = [];
      let allChildren: any[] = [];

      for (const location of locationsData) {
        if (location.grupe) {
          allGrupe = [...allGrupe, ...location.grupe.map((g: any) => ({
            ...g,
            locationId: location.id,
            locationName: location.name
          }))];
        }

        // Încarcă copiii din această locație
        const childrenRef = collection(db, 'organizations', user.uid, 'locations', location.id, 'children');
        const childrenSnap = await getDocs(childrenRef);
        const locationChildren = childrenSnap.docs.map(doc => ({
          id: doc.id,
          locationId: location.id,
          ...doc.data()
        }));
        allChildren = [...allChildren, ...locationChildren];
      }

      setGrupe(allGrupe);
      setChildren(allChildren);

      if (viewMode === 'today') {
        // Încarcă prezența pentru data selectată
        await loadAttendanceForDate(user.uid, locationsData, allChildren, selectedDate);
      } else {
        // Încarcă istoric pentru luna selectată
        await loadAttendanceHistory(user.uid, locationsData, allChildren, selectedMonth);
      }
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceForDate = async (userId: string, locations: any[], allChildren: any[], date: string) => {
    const attendance: any = {};
    
    for (const location of locations) {
      for (const child of allChildren.filter(c => c.locationId === location.id)) {
        const attendanceRef = doc(db, 'organizations', userId, 'locations', location.id, 'children', child.id, 'attendance', date);
        const attendanceSnap = await getDoc(attendanceRef);
        
        if (attendanceSnap.exists()) {
          attendance[child.id] = attendanceSnap.data();
        }
      }
    }

    setAttendanceData(attendance);
    calculateStats(allChildren, attendance);
  };

  const loadAttendanceHistory = async (userId: string, locations: any[], allChildren: any[], month: string) => {
    const history: any[] = [];
    
    // Generează toate zilele din lună
    const year = parseInt(month.split('-')[0]);
    const monthNum = parseInt(month.split('-')[1]);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${month}-${day.toString().padStart(2, '0')}`;
      const dayData: any = {
        date,
        present: 0,
        absent: 0,
        medical: 0,
        vacation: 0,
        notMarked: 0
      };

      for (const location of locations) {
        for (const child of allChildren.filter(c => c.locationId === location.id)) {
          const attendanceRef = doc(db, 'organizations', userId, 'locations', location.id, 'children', child.id, 'attendance', date);
          const attendanceSnap = await getDoc(attendanceRef);
          
          if (attendanceSnap.exists()) {
            const status = attendanceSnap.data().status;
            dayData[status]++;
          } else {
            dayData.notMarked++;
          }
        }
      }

      history.push(dayData);
    }

    setHistoryData(history);
  };

  const calculateStats = (allChildren: any[], attendance: any) => {
    const stats = {
      totalChildren: allChildren.length,
      present: 0,
      absent: 0,
      medical: 0,
      vacation: 0,
      notMarked: 0
    };

    allChildren.forEach(child => {
      const att = attendance[child.id];
      if (att) {
        stats[att.status as keyof typeof stats]++;
      } else {
        stats.notMarked++;
      }
    });

    setStats(stats);
  };

  const handleMarkAllPresent = async () => {
    if (!confirm(`Sigur vrei să marchezi toți cei ${stats.totalChildren} copii ca PREZENȚI pentru ${selectedDate}?`)) {
      return;
    }

    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) return;

      for (const location of gradinite) {
        const locationChildren = children.filter(c => c.locationId === location.id);
        
        for (const child of locationChildren) {
          const attendanceRef = doc(db, 'organizations', user.uid, 'locations', location.id, 'children', child.id, 'attendance', selectedDate);
          
          await setDoc(attendanceRef, {
            date: selectedDate,
            status: 'present',
            checkInTime: '08:00',
            checkOutTime: '16:00',
            notes: 'Marcat automat - Toți prezenți',
            markedBy: user.email,
            markedAt: new Date()
          });
        }
      }

      alert('✅ Toți copiii au fost marcați ca prezenți!');
      loadData();
    } catch (error) {
      console.error('Eroare marcare:', error);
      alert('❌ Eroare la marcarea prezenței');
    } finally {
      setSaving(false);
    }
  };

  const getGrupaChildren = (grupaName: string) => {
    return children.filter(c => c.grupa === grupaName);
  };

  const getGrupaStats = (grupaName: string) => {
    const grupaChildren = getGrupaChildren(grupaName);
    const stats = {
      total: grupaChildren.length,
      present: 0,
      absent: 0,
      notMarked: 0
    };

    grupaChildren.forEach(child => {
      const att = attendanceData[child.id];
      if (att) {
        if (att.status === 'present') stats.present++;
        else stats.absent++;
      } else {
        stats.notMarked++;
      }
    });

    return stats;
  };

  const filteredHistory = historyData.filter(day => {
    if (selectedGrupa === 'toate') return true;
    // Filter logic pentru grupă specifică (implementare viitoare)
    return true;
  });

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
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <h1 className="text-4xl font-bold mb-2">📊 Prezență Generală</h1>
            <p className="text-white/90">Gestionare prezență pentru toate grădinițele</p>
          </div>

          {/* View Mode Toggle */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setViewMode('today')}
                className={`flex-1 px-6 py-3 rounded-lg font-bold transition ${
                  viewMode === 'today'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📅 Prezență Azi
              </button>
              <button
                onClick={() => setViewMode('history')}
                className={`flex-1 px-6 py-3 rounded-lg font-bold transition ${
                  viewMode === 'history'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📜 Istoric
              </button>
            </div>
          </div>

          {viewMode === 'today' ? (
            <>
              {/* Selector Dată */}
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CalendarIcon className="w-5 h-5 inline mr-2" />
                      Selectează Data
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 text-lg"
                    />
                  </div>
                  <button
                    onClick={handleMarkAllPresent}
                    disabled={saving}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition shadow-lg disabled:opacity-50"
                  >
                    {saving ? 'Se marchează...' : '✅ Marchează Toți Prezenți'}
                  </button>
                </div>
              </div>

              {/* Statistici Generale */}
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  📊 Statistici {selectedDate}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-blue-900">{stats.totalChildren}</p>
                    <p className="text-sm text-blue-700">Total Copii</p>
                  </div>
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-green-900">{stats.present}</p>
                    <p className="text-sm text-green-700">Prezenți</p>
                  </div>
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
                    <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-red-900">{stats.absent + stats.medical + stats.vacation}</p>
                    <p className="text-sm text-red-700">Absenți</p>
                  </div>
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 text-center">
                    <TrendingUp className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-yellow-900">
                      {stats.totalChildren > 0 ? Math.round((stats.present / stats.totalChildren) * 100) : 0}%
                    </p>
                    <p className="text-sm text-yellow-700">Procent Prezență</p>
                  </div>
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 text-center">
                    <Filter className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-gray-900">{stats.notMarked}</p>
                    <p className="text-sm text-gray-700">Nemarcați</p>
                  </div>
                </div>
              </div>

              {/* Prezență per Grupă */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  👥 Prezență per Grupă
                </h2>
                <div className="space-y-4">
                  {grupe.map((grupa) => {
                    const grupaStats = getGrupaStats(grupa.nume);
                    const percentage = grupaStats.total > 0 
                      ? Math.round((grupaStats.present / grupaStats.total) * 100) 
                      : 0;

                    return (
                      <div
                        key={grupa.id}
                        className="bg-gradient-to-r from-blue-50 to-pink-50 border-2 border-blue-200 rounded-xl p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-4xl">{grupa.emoji || '🎨'}</span>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{grupa.nume}</h3>
                              <p className="text-sm text-gray-600">{grupa.locationName}</p>
                            </div>
                          </div>
                          <Link
                            href={`/attendance/group/${grupa.id}?date=${selectedDate}`}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition shadow-lg"
                          >
                            Marchează Prezență
                          </Link>
                        </div>

                        <div className="grid grid-cols-4 gap-3 mb-3">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{grupaStats.total}</p>
                            <p className="text-xs text-gray-600">Total</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{grupaStats.present}</p>
                            <p className="text-xs text-gray-600">Prezenți</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{grupaStats.absent}</p>
                            <p className="text-xs text-gray-600">Absenți</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">{percentage}%</p>
                            <p className="text-xs text-gray-600">Prezență</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              percentage >= 90 ? 'bg-green-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Filtre Istoric */}
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  🔍 Filtre
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                </div>
              </div>

              {/* Tabel Istoric */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    📅 Istoric Prezență - {selectedMonth}
                  </h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Export PDF
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-gray-900">Data</th>
                        <th className="px-4 py-3 text-center font-bold text-gray-900">Total</th>
                        <th className="px-4 py-3 text-center font-bold text-green-900">Prezenți</th>
                        <th className="px-4 py-3 text-center font-bold text-red-900">Absenți</th>
                        <th className="px-4 py-3 text-center font-bold text-blue-900">Medical</th>
                        <th className="px-4 py-3 text-center font-bold text-purple-900">Concediu</th>
                        <th className="px-4 py-3 text-center font-bold text-yellow-900">Procent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((day, index) => {
                        const total = day.present + day.absent + day.medical + day.vacation + day.notMarked;
                        const percentage = total > 0 ? Math.round((day.present / total) * 100) : 0;
                        const dayName = new Date(day.date).toLocaleDateString('ro-RO', { weekday: 'short' });

                        return (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-semibold">{day.date}</p>
                                <p className="text-xs text-gray-600">{dayName}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-bold">{total}</td>
                            <td className="px-4 py-3 text-center font-bold text-green-600">{day.present}</td>
                            <td className="px-4 py-3 text-center font-bold text-red-600">{day.absent}</td>
                            <td className="px-4 py-3 text-center font-bold text-blue-600">{day.medical}</td>
                            <td className="px-4 py-3 text-center font-bold text-purple-600">{day.vacation}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-bold ${
                                percentage >= 90 ? 'text-green-600' : 
                                percentage >= 70 ? 'text-yellow-600' : 
                                'text-red-600'
                              }`}>
                                {percentage}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
