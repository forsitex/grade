'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { ArrowLeft, Calendar as CalendarIcon, Loader2, Activity, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Event {
  date: string;
  type: 'activity' | 'attendance' | 'report';
  title: string;
  description?: string;
  status?: string;
}

export default function CalendarParintePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [copilNume, setCopilNume] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadCalendar();
  }, [selectedMonth, selectedYear]);

  const loadCalendar = async () => {
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

      const allEvents: Event[] = [];

      // Încarcă activități
      const activitiesRef = collection(
        db,
        'organizations',
        parinteData.organizationId,
        'locations',
        parinteData.locationId,
        'activities'
      );

      const activitiesSnap = await getDocs(activitiesRef);
      activitiesSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.grupaId === parinteData.grupaId && data.data) {
          const date = new Date(data.data.seconds * 1000);
          if (date.getMonth() === selectedMonth && date.getFullYear() === selectedYear) {
            allEvents.push({
              date: date.toISOString().split('T')[0],
              type: 'activity',
              title: data.nume,
              description: data.descriere,
            });
          }
        }
      });

      // Sortează evenimente după dată
      allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setEvents(allEvents);
    } catch (error) {
      console.error('Eroare încărcare calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'activity':
        return <Activity className="w-5 h-5 text-purple-500" />;
      case 'attendance':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'report':
        return <CalendarIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <CalendarIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'activity':
        return 'border-purple-500 bg-purple-50';
      case 'attendance':
        return 'border-green-500 bg-green-50';
      case 'report':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const months = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Se încarcă calendarul...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
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
              <h1 className="text-2xl font-bold text-gray-900">📅 Calendar</h1>
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
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Statistici */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 mb-1">Evenimente în {months[selectedMonth]}</p>
                <p className="text-4xl font-bold">{events.length}</p>
              </div>
              <CalendarIcon className="w-16 h-16 text-white/30" />
            </div>
          </div>

          {/* Listă Evenimente */}
          {events.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Nu există evenimente în această lună
              </h3>
              <p className="text-gray-600">
                Evenimente și activități vor apărea aici
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={index} className={`bg-white rounded-xl shadow-lg overflow-hidden border-l-4 ${getEventColor(event.type)}`}>
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                          <span className="text-sm text-gray-500">
                            {new Date(event.date).toLocaleDateString('ro-RO', {
                              day: 'numeric',
                              month: 'long'
                            })}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-gray-600">{event.description}</p>
                        )}
                        {event.status && (
                          <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            {event.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
