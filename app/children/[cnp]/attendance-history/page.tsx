'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getOrgAndLocation } from '@/lib/firebase-helpers';

export default function ChildAttendanceHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const cnp = params.cnp as string;
  const grupaId = searchParams.get('grupaId');

  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
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

      // Încarcă prezența pentru luna selectată
      const daysInMonth = getDaysInMonth(selectedMonth);
      const history: any[] = [];

      for (const day of daysInMonth) {
        const attendanceRef = doc(db, 'organizations', orgData.organizationId, 'locations', foundLocationId, 'children', cnp, 'attendance', day);
        const attendanceSnap = await getDoc(attendanceRef);
        
        if (attendanceSnap.exists()) {
          history.push({
            date: day,
            ...attendanceSnap.data()
          });
        }
      }

      // Sortează descrescător (cel mai recent primul)
      history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAttendanceHistory(history);
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

  const getMonthStats = () => {
    const presentDays = attendanceHistory.filter(a => a.status === 'present').length;
    const absentDays = attendanceHistory.filter(a => a.status === 'absent').length;
    const totalDays = attendanceHistory.length;
    const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Calculează medie check-in și check-out
    const presentRecords = attendanceHistory.filter(a => a.status === 'present' && a.checkInTime);
    let avgCheckIn = '—';
    let avgCheckOut = '—';

    if (presentRecords.length > 0) {
      const checkInMinutes = presentRecords.map(r => {
        const [h, m] = r.checkInTime.split(':').map(Number);
        return h * 60 + m;
      });
      const checkOutMinutes = presentRecords.map(r => {
        const [h, m] = r.checkOutTime.split(':').map(Number);
        return h * 60 + m;
      });

      const avgCheckInMin = Math.round(checkInMinutes.reduce((a, b) => a + b, 0) / checkInMinutes.length);
      const avgCheckOutMin = Math.round(checkOutMinutes.reduce((a, b) => a + b, 0) / checkOutMinutes.length);

      avgCheckIn = `${Math.floor(avgCheckInMin / 60).toString().padStart(2, '0')}:${(avgCheckInMin % 60).toString().padStart(2, '0')}`;
      avgCheckOut = `${Math.floor(avgCheckOutMin / 60).toString().padStart(2, '0')}:${(avgCheckOutMin % 60).toString().padStart(2, '0')}`;
    }

    return { presentDays, absentDays, totalDays, percentage, avgCheckIn, avgCheckOut };
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
            onClick={() => grupaId ? router.push(`/attendance/group/${grupaId}/history`) : router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Copil */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl">
                👶
              </div>
              <div>
                <h1 className="text-3xl font-bold">{child?.nume}</h1>
                <p className="text-white/90">Istoric Prezență</p>
                <p className="text-sm text-white/80">Grupa: {child?.grupa}</p>
              </div>
            </div>
          </div>

          {/* Selector Lună */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
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

          {/* Statistici Luna */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📊 Statistici {new Date(selectedMonth + '-01').toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                <CheckCircle className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-3xl font-bold">{stats.presentDays}</p>
                <p className="text-sm text-white/80">Zile Prezent</p>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white">
                <XCircle className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-3xl font-bold">{stats.absentDays}</p>
                <p className="text-sm text-white/80">Zile Absent</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-3xl font-bold">{stats.percentage}%</p>
                <p className="text-sm text-white/80">Prezență</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <Clock className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-2xl font-bold">{stats.avgCheckIn}</p>
                <p className="text-sm text-white/80">Medie Check-In</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-4 text-white">
                <Clock className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-2xl font-bold">{stats.avgCheckOut}</p>
                <p className="text-sm text-white/80">Medie Check-Out</p>
              </div>
              <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg p-4 text-white">
                <CalendarIcon className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-3xl font-bold">{stats.totalDays}</p>
                <p className="text-sm text-white/80">Total Zile</p>
              </div>
            </div>
          </div>

          {/* Istoric Detaliat */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📅 Istoric Detaliat
            </h2>
            {attendanceHistory.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                Nu există înregistrări pentru această lună
              </p>
            ) : (
              <div className="space-y-3">
                {attendanceHistory.map((record) => (
                  <div
                    key={record.date}
                    className={`p-4 border-2 rounded-lg ${
                      record.status === 'present'
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900">
                          {new Date(record.date).toLocaleDateString('ro-RO', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        {record.status === 'present' && record.checkInTime && (
                          <p className="text-sm text-gray-600 mt-1">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {record.checkInTime} - {record.checkOutTime}
                          </p>
                        )}
                      </div>
                      <span className={`px-4 py-2 rounded-full font-bold ${
                        record.status === 'present'
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}>
                        {record.status === 'present' ? '✅ Prezent' : '❌ Absent'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
