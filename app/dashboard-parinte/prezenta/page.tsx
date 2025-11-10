'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { ArrowLeft, CheckCircle, XCircle, Clock, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';

interface AttendanceRecord {
  date: string;
  status: 'prezent' | 'absent' | 'intarziere';
  oraIntrare?: string;
  oraIesire?: string;
  observatii?: string;
}

export default function PrezentaParintePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [copilNume, setCopilNume] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadPrezenta();
  }, [selectedMonth, selectedYear]);

  const loadPrezenta = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const parinteRef = doc(db, 'parinti', user.uid);
      const parinteSnap = await getDoc(parinteRef);

      if (!parinteSnap.exists()) {
        router.push('/login');
        return;
      }

      const parinteData = parinteSnap.data();
      setCopilNume(parinteData.copilNume);

      // Încarcă prezența pentru luna selectată
      const attendanceData: AttendanceRecord[] = [];
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Verifică dacă există înregistrare pentru această zi
        const attendanceRef = doc(
          db,
          'organizations',
          parinteData.organizationId,
          'locations',
          parinteData.locationId,
          'attendance',
          dateStr,
          'grupe',
          parinteData.grupaId,
          'copii',
          parinteData.copilCnp
        );

        const attendanceSnap = await getDoc(attendanceRef);
        
        if (attendanceSnap.exists()) {
          attendanceData.push({
            date: dateStr,
            ...attendanceSnap.data() as any
          });
        }
      }

      setAttendance(attendanceData);
    } catch (error) {
      console.error('Eroare încărcare prezență:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'prezent':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'intarziere':
        return <Clock className="w-5 h-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prezent':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'intarziere':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'prezent':
        return 'Prezent';
      case 'absent':
        return 'Absent';
      case 'intarziere':
        return 'Întârziere';
      default:
        return '-';
    }
  };

  const calculateStats = () => {
    const total = attendance.length;
    const prezent = attendance.filter(a => a.status === 'prezent').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const intarzieri = attendance.filter(a => a.status === 'intarziere').length;
    const procent = total > 0 ? Math.round((prezent / total) * 100) : 0;

    return { total, prezent, absent, intarzieri, procent };
  };

  const stats = calculateStats();

  const months = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Se încarcă prezența...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard-parinte"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">✅ Prezență</h1>
              <p className="text-sm text-gray-600">{copilNume}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Selector Lună/An */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-4">
              <CalendarIcon className="w-6 h-6 text-gray-600" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Statistici */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <span className="text-3xl font-bold text-green-600">{stats.prezent}</span>
              </div>
              <p className="text-sm text-gray-600">Zile Prezent</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="w-8 h-8 text-red-500" />
                <span className="text-3xl font-bold text-red-600">{stats.absent}</span>
              </div>
              <p className="text-sm text-gray-600">Zile Absent</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-orange-500" />
                <span className="text-3xl font-bold text-orange-600">{stats.intarzieri}</span>
              </div>
              <p className="text-sm text-gray-600">Întârzieri</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <CalendarIcon className="w-8 h-8 text-blue-500" />
                <span className="text-3xl font-bold text-blue-600">{stats.procent}%</span>
              </div>
              <p className="text-sm text-gray-600">Prezență</p>
            </div>
          </div>

          {/* Listă Prezență */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Istoric Prezență - {months[selectedMonth]} {selectedYear}
              </h2>
            </div>

            {attendance.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">Nu există înregistrări pentru această lună</p>
              </div>
            ) : (
              <div className="divide-y">
                {attendance.map((record) => (
                  <div key={record.date} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(record.status)}
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(record.date).toLocaleDateString('ro-RO', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long'
                            })}
                          </p>
                          {record.oraIntrare && (
                            <p className="text-sm text-gray-600">
                              Intrare: {record.oraIntrare}
                              {record.oraIesire && ` • Ieșire: ${record.oraIesire}`}
                            </p>
                          )}
                          {record.observatii && (
                            <p className="text-sm text-gray-500 mt-1">{record.observatii}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${getStatusColor(record.status)}`}>
                        {getStatusLabel(record.status)}
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
