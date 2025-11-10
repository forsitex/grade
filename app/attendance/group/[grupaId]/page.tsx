'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Save,
  Calendar as CalendarIcon,
  Users,
  CheckCircle
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';

export default function GroupAttendancePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const grupaId = params.grupaId as string;
  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dateParam);
  const [grupa, setGrupa] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<{ [key: string]: { 
    status: 'present' | 'absent' | 'not_marked',
    checkIn: string,
    checkOut: string
  } }>({});
  const [locationId, setLocationId] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      let orgId = '';
      let locId = '';
      
      const educatoareRef = doc(db, 'educatoare', user.uid);
      const educatoareSnap = await getDoc(educatoareRef);
      
      if (educatoareSnap.exists()) {
        const educatoareData = educatoareSnap.data();
        orgId = educatoareData.organizationId;
        locId = educatoareData.locationId;
      } else {
        orgId = user.uid;
      }

      // Găsește grupa și locația
      let foundGrupa = null;
      let foundLocationId = '';
      let grupaChildren: any[] = [];

      if (locId) {
        // Educatoare - citește direct locația ei
        const locationRef = doc(db, 'organizations', orgId, 'locations', locId);
        const locationSnap = await getDoc(locationRef);
        
        if (locationSnap.exists()) {
          const locationData = locationSnap.data();
          const grupa = locationData.grupe?.find((g: any) => g.id === grupaId);
          
          if (grupa) {
            foundGrupa = grupa;
            foundLocationId = locId;
            
            const childrenRef = collection(db, 'organizations', orgId, 'locations', locId, 'children');
            const childrenSnap = await getDocs(childrenRef);
            
            grupaChildren = (childrenSnap.docs
              .map(doc => ({ id: doc.id, ...doc.data() })) as any[])
              .filter((child: any) => child.grupa === grupa.nume);
          }
        }
      } else {
        // Admin - caută în toate locațiile
        const locationsRef = collection(db, 'organizations', orgId, 'locations');
        const locationsSnap = await getDocs(locationsRef);
        
        for (const locationDoc of locationsSnap.docs) {
          const locationData = locationDoc.data();
          
          if (locationData.grupe) {
            const grupa = locationData.grupe.find((g: any) => g.id === grupaId);
            if (grupa) {
              foundGrupa = grupa;
              foundLocationId = locationDoc.id;
              
              const childrenRef = collection(db, 'organizations', orgId, 'locations', locationDoc.id, 'children');
              const childrenSnap = await getDocs(childrenRef);
              
              grupaChildren = (childrenSnap.docs
                .map(doc => ({ id: doc.id, ...doc.data() })) as any[])
                .filter((child: any) => child.grupa === grupa.nume);
              
              break;
            }
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

      // Încarcă prezența existentă pentru data selectată
      const attendanceMap: { [key: string]: { status: 'present' | 'absent' | 'not_marked', checkIn: string, checkOut: string } } = {};
      for (const child of grupaChildren) {
        const attendanceRef = doc(db, 'organizations', user.uid, 'locations', foundLocationId, 'children', child.id, 'attendance', selectedDate);
        const attendanceSnap = await getDoc(attendanceRef);
        
        if (attendanceSnap.exists()) {
          const data = attendanceSnap.data();
          attendanceMap[child.id] = {
            status: data.status || 'not_marked',
            checkIn: data.checkInTime || '08:00',
            checkOut: data.checkOutTime || '16:00'
          };
        } else {
          attendanceMap[child.id] = {
            status: 'not_marked',
            checkIn: '08:00',
            checkOut: '16:00'
          };
        }
      }
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (childId: string, status: 'present' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [childId]: {
        ...prev[childId],
        status
      }
    }));
  };

  const handleTimeChange = (childId: string, field: 'checkIn' | 'checkOut', value: string) => {
    setAttendance(prev => ({
      ...prev,
      [childId]: {
        ...prev[childId],
        [field]: value
      }
    }));
  };

  const handleMarkAllPresent = () => {
    const allPresent: { [key: string]: { status: 'present' | 'absent' | 'not_marked', checkIn: string, checkOut: string } } = {};
    children.forEach(child => {
      allPresent[child.id] = {
        status: 'present',
        checkIn: '08:00',
        checkOut: '16:00'
      };
    });
    setAttendance(allPresent);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user || !locationId) return;

      // Salvează prezența pentru fiecare copil
      for (const child of children) {
        const attendanceRef = doc(db, 'organizations', user.uid, 'locations', locationId, 'children', child.id, 'attendance', selectedDate);
        const childAttendance = attendance[child.id];
        
        await setDoc(attendanceRef, {
          date: selectedDate,
          status: childAttendance.status,
          checkInTime: childAttendance.status === 'present' ? childAttendance.checkIn : '',
          checkOutTime: childAttendance.status === 'present' ? childAttendance.checkOut : '',
          notes: '',
          markedBy: user.email,
          markedAt: new Date()
        });
      }

      alert('✅ Prezență salvată cu succes!');
      router.push('/attendance/overview');
    } catch (error) {
      console.error('Eroare salvare:', error);
      alert('❌ Eroare la salvarea prezenței');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter(a => a.status === 'present').length;
  const absentCount = Object.values(attendance).filter(a => a.status === 'absent').length;
  const totalCount = children.length;

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
            onClick={async () => {
              const user = auth.currentUser;
              if (user) {
                const educatoareRef = doc(db, 'educatoare', user.uid);
                const educatoareSnap = await getDoc(educatoareRef);
                if (educatoareSnap.exists()) {
                  router.push('/dashboard-educatoare');
                } else {
                  router.back();
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
        <div className="max-w-4xl mx-auto">
          {/* Header Grupă */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl">{grupa?.emoji || '🎨'}</span>
              <div>
                <h1 className="text-3xl font-bold">{grupa?.nume}</h1>
                <p className="text-white/90">Marchează Prezența</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{totalCount} copii în grupă</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span className="font-bold">{presentCount} prezenți</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 text-red-300">✕</span>
                <span className="font-bold">{absentCount} absenți</span>
              </div>
            </div>
          </div>

          {/* Selector Dată și Butoane */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 text-lg"
                />
              </div>
              <button
                onClick={handleMarkAllPresent}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition shadow-lg whitespace-nowrap"
              >
                ✅ Marchează Toți Prezenți
              </button>
              <Link
                href={`/attendance/group/${grupaId}/history`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg whitespace-nowrap"
              >
                📊 Vezi Istoric
              </Link>
            </div>
          </div>

          {/* Lista Copii */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              👥 Lista Copii ({totalCount})
            </h2>
            
            {children.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                Nu există copii în această grupă
              </p>
            ) : (
              <div className="space-y-4">
                {children.map((child) => {
                  const childAttendance = attendance[child.id] || { status: 'not_marked', checkIn: '08:00', checkOut: '16:00' };
                  const isPresent = childAttendance.status === 'present';
                  const isAbsent = childAttendance.status === 'absent';

                  return (
                    <div
                      key={child.id}
                      className={`p-4 border-2 rounded-lg transition ${
                        isPresent
                          ? 'border-green-500 bg-green-50'
                          : isAbsent
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-4 mb-3">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-lg">{child.nume}</p>
                          <p className="text-sm text-gray-600">CNP: {child.cnp}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusChange(child.id, 'present')}
                            className={`px-4 py-2 rounded-lg font-bold transition ${
                              isPresent
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                            }`}
                          >
                            ✓ Prezent
                          </button>
                          <button
                            onClick={() => handleStatusChange(child.id, 'absent')}
                            className={`px-4 py-2 rounded-lg font-bold transition ${
                              isAbsent
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                            }`}
                          >
                            ✕ Absent
                          </button>
                        </div>
                      </div>

                      {isPresent && (
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-green-200">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Check-In
                            </label>
                            <input
                              type="time"
                              value={childAttendance.checkIn}
                              onChange={(e) => handleTimeChange(child.id, 'checkIn', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Check-Out
                            </label>
                            <input
                              type="time"
                              value={childAttendance.checkOut}
                              onChange={(e) => handleTimeChange(child.id, 'checkOut', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Buton Salvare */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-6 h-6" />
            {saving ? 'Se salvează...' : `Salvează Prezența (${presentCount}/${totalCount} prezenți)`}
          </button>
        </div>
      </div>
    </div>
  );
}
