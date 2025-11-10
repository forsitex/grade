'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  Heart,
  Plane
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getOrgAndLocation } from '@/lib/firebase-helpers';

export default function AttendancePage() {
  const router = useRouter();
  const params = useParams();
  const cnp = params.cnp as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [child, setChild] = useState<any>(null);
  const [locationId, setLocationId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [monthStats, setMonthStats] = useState({
    present: 0,
    absent: 0,
    medical: 0,
    vacation: 0,
    total: 0
  });

  const [formData, setFormData] = useState({
    status: 'present',
    checkInTime: '',
    checkOutTime: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [cnp, selectedDate]);

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

      const organizationsRef = collection(db, 'organizations', orgData.organizationId, 'locations');
      const locationsSnap = await getDocs(organizationsRef);
      
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

      if (foundChild) {
        setChild(foundChild);
        setLocationId(foundLocationId);

        // Încarcă prezența pentru data selectată
        const attendanceRef = doc(db, 'organizations', orgData.organizationId, 'locations', foundLocationId, 'children', cnp, 'attendance', selectedDate);
        const attendanceSnap = await getDoc(attendanceRef);

        if (attendanceSnap.exists()) {
          const data = attendanceSnap.data();
          setFormData({
            status: data.status || 'present',
            checkInTime: data.checkInTime || '',
            checkOutTime: data.checkOutTime || '',
            notes: data.notes || ''
          });
        } else {
          // Reset pentru zi nouă
          setFormData({
            status: 'present',
            checkInTime: '',
            checkOutTime: '',
            notes: ''
          });
        }

        // Încarcă istoric prezență (ultimele 30 zile)
        const attendanceCollectionRef = collection(db, 'organizations', orgData.organizationId, 'locations', foundLocationId, 'children', cnp, 'attendance');
        const attendanceQuery = query(attendanceCollectionRef, orderBy('date', 'desc'));
        const historySnap = await getDocs(attendanceQuery);
        
        const history = historySnap.docs.map(doc => ({
          date: doc.id,
          ...doc.data()
        })) as any[];
        setAttendanceHistory(history);

        // Calculează statistici pentru luna curentă
        const currentMonth = selectedDate.substring(0, 7); // YYYY-MM
        const monthData = history.filter((h: any) => h.date.startsWith(currentMonth));
        
        const stats = {
          present: monthData.filter((h: any) => h.status === 'present').length,
          absent: monthData.filter((h: any) => h.status === 'absent').length,
          medical: monthData.filter((h: any) => h.status === 'medical').length,
          vacation: monthData.filter((h: any) => h.status === 'vacation').length,
          total: monthData.length
        };
        setMonthStats(stats);
      }
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user || !locationId) return;

      const orgData = await getOrgAndLocation(locationId);
      if (!orgData) return;

      const attendanceRef = doc(db, 'organizations', orgData.organizationId, 'locations', locationId, 'children', cnp, 'attendance', selectedDate);
      
      await setDoc(attendanceRef, {
        date: selectedDate,
        status: formData.status,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        notes: formData.notes,
        markedBy: user.email,
        markedAt: new Date()
      });

      alert('✅ Prezență salvată cu succes!');
      loadData(); // Reîncarcă pentru a actualiza istoricul
    } catch (error) {
      console.error('Eroare salvare prezență:', error);
      alert('❌ Eroare la salvarea prezenței');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'medical':
        return <Heart className="w-5 h-5 text-blue-600" />;
      case 'vacation':
        return <Plane className="w-5 h-5 text-purple-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return 'Prezent';
      case 'absent':
        return 'Absent';
      case 'medical':
        return 'Medical';
      case 'vacation':
        return 'Concediu';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'absent':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medical':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'vacation':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
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
        <div className="max-w-4xl mx-auto">
          {/* Header Copil */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-6 mb-6 text-white">
            <h1 className="text-3xl font-bold mb-2">📅 Prezență</h1>
            <p className="text-xl">{child?.nume}</p>
            <p className="text-white/80">CNP: {cnp}</p>
            <p className="text-white/80">Grupa: {child?.grupa}</p>
          </div>

          {/* Statistici Luna Curentă */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📊 Statistici {selectedDate.substring(0, 7)}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">{monthStats.present}</p>
                <p className="text-sm text-green-700">Prezent</p>
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-900">{monthStats.absent}</p>
                <p className="text-sm text-red-700">Absent</p>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                <Heart className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">{monthStats.medical}</p>
                <p className="text-sm text-blue-700">Medical</p>
              </div>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 text-center">
                <Plane className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-900">{monthStats.vacation}</p>
                <p className="text-sm text-purple-700">Concediu</p>
              </div>
            </div>
            {monthStats.total > 0 && (
              <div className="mt-4 text-center">
                <p className="text-gray-600">
                  Procent prezență: <span className="font-bold text-green-600">
                    {Math.round((monthStats.present / monthStats.total) * 100)}%
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Marcare Prezență */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              ✏️ Marchează Prezența
            </h2>

            {/* Selector Dată */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="w-5 h-5 inline mr-2" />
                Selectează Data
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 text-lg"
              />
            </div>

            {/* Status */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Status *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'present', label: 'Prezent', icon: CheckCircle, bgColor: 'bg-green-500', hoverColor: 'hover:bg-green-600', selectedBg: 'bg-green-600', iconColor: 'text-white' },
                  { value: 'absent', label: 'Absent', icon: XCircle, bgColor: 'bg-red-500', hoverColor: 'hover:bg-red-600', selectedBg: 'bg-red-600', iconColor: 'text-white' },
                  { value: 'medical', label: 'Medical', icon: Heart, bgColor: 'bg-blue-500', hoverColor: 'hover:bg-blue-600', selectedBg: 'bg-blue-600', iconColor: 'text-white' },
                  { value: 'vacation', label: 'Concediu', icon: Plane, bgColor: 'bg-purple-500', hoverColor: 'hover:bg-purple-600', selectedBg: 'bg-purple-600', iconColor: 'text-white' }
                ].map(({ value, label, icon: Icon, bgColor, hoverColor, selectedBg, iconColor }) => (
                  <button
                    key={value}
                    onClick={() => setFormData({ ...formData, status: value })}
                    className={`p-4 rounded-lg font-bold text-lg transition flex flex-col items-center gap-2 shadow-lg ${
                      formData.status === value
                        ? `${selectedBg} text-white scale-105`
                        : `${bgColor} ${hoverColor} text-white opacity-70 hover:opacity-100`
                    }`}
                  >
                    <Icon className={`w-8 h-8 ${iconColor}`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ore (doar dacă e prezent) */}
            {formData.status === 'present' && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Oră Sosire
                  </label>
                  <input
                    type="time"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Oră Plecare
                  </label>
                  <input
                    type="time"
                    value={formData.checkOutTime}
                    onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Note */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note (opțional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ex: A venit cu tata, Bolnav - febră, etc."
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
              />
            </div>

            {/* Buton Salvare */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-6 h-6" />
              {saving ? 'Se salvează...' : 'Salvează Prezența'}
            </button>
          </div>

          {/* Istoric Prezență */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📜 Istoric Prezență
            </h2>
            {attendanceHistory.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                Nu există înregistrări de prezență încă
              </p>
            ) : (
              <div className="space-y-3">
                {attendanceHistory.slice(0, 10).map((record) => (
                  <div
                    key={record.date}
                    className={`p-4 border-2 rounded-lg ${getStatusColor(record.status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(record.status)}
                        <div>
                          <p className="font-bold">
                            {new Date(record.date).toLocaleDateString('ro-RO', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-sm font-semibold">
                            {getStatusLabel(record.status)}
                          </p>
                        </div>
                      </div>
                      {record.status === 'present' && record.checkInTime && (
                        <div className="text-right">
                          <p className="text-sm">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {record.checkInTime}
                            {record.checkOutTime && ` - ${record.checkOutTime}`}
                          </p>
                        </div>
                      )}
                    </div>
                    {record.notes && (
                      <p className="text-sm mt-2 pl-8">
                        📝 {record.notes}
                      </p>
                    )}
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
