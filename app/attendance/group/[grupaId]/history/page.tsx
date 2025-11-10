'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  Users,
  TrendingUp,
  Download
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export default function GroupAttendanceHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const grupaId = params.grupaId as string;

  const [loading, setLoading] = useState(true);
  const [grupa, setGrupa] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>({});
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

      // Găsește grupa și locația
      const locationsRef = collection(db, 'organizations', user.uid, 'locations');
      const locationsSnap = await getDocs(locationsRef);
      
      let foundGrupa = null;
      let foundLocationId = '';
      let grupaChildren: any[] = [];

      for (const locationDoc of locationsSnap.docs) {
        const locationData = locationDoc.data();
        
        if (locationData.grupe) {
          const grupa = locationData.grupe.find((g: any) => g.id === grupaId);
          if (grupa) {
            foundGrupa = grupa;
            foundLocationId = locationDoc.id;
            
            // Încarcă copiii din această grupă
            const childrenRef = collection(db, 'organizations', user.uid, 'locations', locationDoc.id, 'children');
            const childrenSnap = await getDocs(childrenRef);
            
            grupaChildren = (childrenSnap.docs
              .map(doc => ({ id: doc.id, ...doc.data() })) as any[])
              .filter((child: any) => child.grupa === grupa.nume);
            
            break;
          }
        }
      }

      if (!foundGrupa) {
        alert('Grupa nu a fost găsită!');
        router.back();
        return;
      }

      setGrupa(foundGrupa);
      setLocationId(foundLocationId);
      setChildren(grupaChildren);

      // Încarcă prezența pentru luna selectată
      const attendanceMap: any = {};
      const daysInMonth = getDaysInMonth(selectedMonth);

      for (const child of grupaChildren) {
        attendanceMap[child.id] = {};
        
        for (const day of daysInMonth) {
          const attendanceRef = doc(db, 'organizations', user.uid, 'locations', foundLocationId, 'children', child.id, 'attendance', day);
          const attendanceSnap = await getDoc(attendanceRef);
          
          if (attendanceSnap.exists()) {
            attendanceMap[child.id][day] = attendanceSnap.data();
          }
        }
      }

      setAttendanceData(attendanceMap);
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const daysCount = new Date(year, month, 0).getDate();
    const days = [];
    
    for (let i = 1; i <= daysCount; i++) {
      const day = i.toString().padStart(2, '0');
      days.push(`${year}-${month.toString().padStart(2, '0')}-${day}`);
    }
    
    return days;
  };

  const getChildStats = (childId: string) => {
    const childAttendance = attendanceData[childId] || {};
    const days = Object.keys(childAttendance);
    const presentDays = days.filter(day => childAttendance[day]?.status === 'present').length;
    const absentDays = days.filter(day => childAttendance[day]?.status === 'absent').length;
    const totalDays = days.length;
    const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return { presentDays, absentDays, totalDays, percentage };
  };

  const getGroupStats = () => {
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalMarked = 0;

    children.forEach(child => {
      const stats = getChildStats(child.id);
      totalPresent += stats.presentDays;
      totalAbsent += stats.absentDays;
      totalMarked += stats.totalDays;
    });

    const avgPercentage = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

    return { totalPresent, totalAbsent, totalMarked, avgPercentage };
  };

  const getRecentDays = () => {
    const days = getDaysInMonth(selectedMonth);
    return days.slice(-7).reverse(); // Ultimele 7 zile
  };

  const groupStats = getGroupStats();
  const recentDays = getRecentDays();

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
        <div className="max-w-7xl mx-auto">
          {/* Header Grupă */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl">{grupa?.emoji || '🎨'}</span>
              <div>
                <h1 className="text-3xl font-bold">{grupa?.nume}</h1>
                <p className="text-white/90">Istoric Prezență</p>
              </div>
            </div>
          </div>

          {/* Selector Lună și Statistici */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-6">
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
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Excel
              </button>
            </div>

            {/* Statistici Luna */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <Users className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-2xl font-bold">{children.length}</p>
                <p className="text-sm text-white/80">Copii Activi</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-2xl font-bold">{groupStats.avgPercentage}%</p>
                <p className="text-sm text-white/80">Prezență Medie</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <CalendarIcon className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-2xl font-bold">{groupStats.totalPresent}</p>
                <p className="text-sm text-white/80">Total Prezențe</p>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white">
                <CalendarIcon className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-2xl font-bold">{groupStats.totalAbsent}</p>
                <p className="text-sm text-white/80">Total Absențe</p>
              </div>
            </div>
          </div>

          {/* Tabel Istoric */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📊 Tabel Prezență - Ultimele 7 Zile
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-900 sticky left-0 bg-gray-100">
                      Copil
                    </th>
                    {recentDays.map(day => (
                      <th key={day} className="px-4 py-3 text-center font-bold text-gray-900 min-w-[80px]">
                        <div className="text-xs">{new Date(day).toLocaleDateString('ro-RO', { weekday: 'short' })}</div>
                        <div className="text-sm">{new Date(day).getDate()}</div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center font-bold text-gray-900">%</th>
                  </tr>
                </thead>
                <tbody>
                  {children.map((child) => {
                    const stats = getChildStats(child.id);
                    const childAttendance = attendanceData[child.id] || {};

                    return (
                      <tr key={child.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 sticky left-0 bg-white">
                          <Link
                            href={`/children/${child.id}/attendance-history?grupaId=${grupaId}`}
                            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {child.nume}
                          </Link>
                        </td>
                        {recentDays.map(day => {
                          const dayData = childAttendance[day];
                          return (
                            <td key={day} className="px-4 py-3 text-center">
                              {dayData?.status === 'present' ? (
                                <span className="text-2xl" title={`${dayData.checkInTime} - ${dayData.checkOutTime}`}>✅</span>
                              ) : dayData?.status === 'absent' ? (
                                <span className="text-2xl">❌</span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            stats.percentage >= 90 ? 'bg-green-100 text-green-800' :
                            stats.percentage >= 75 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {stats.percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
