'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Calendar as CalendarIcon, Check } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

export default function MenuCalendarPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const gradinitaId = params.id as string;
  const preselectedMenuId = searchParams.get('menuId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gradinita, setGradinita] = useState<any>(null);
  const [draftMenus, setDraftMenus] = useState<any[]>([]);
  const [scheduledMenus, setScheduledMenus] = useState<any[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>(preselectedMenuId || '');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState<{ start: Date; end: Date } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const gradinitaRef = doc(db, 'organizations', user.uid, 'locations', gradinitaId);
      const gradinitaSnap = await getDoc(gradinitaRef);

      if (gradinitaSnap.exists()) {
        setGradinita(gradinitaSnap.data());
      }

      const menusRef = collection(db, 'organizations', user.uid, 'locations', gradinitaId, 'menus');
      const menusSnap = await getDocs(menusRef);
      
      const menusData = menusSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      setDraftMenus(menusData.filter(m => m.isDraft));
      setScheduledMenus(menusData.filter(m => !m.isDraft));
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

  const replaceDatePlaceholders = (htmlContent: string, weekStart: Date): string => {
    const days = ['LUNI', 'MARȚI', 'MIERCURI', 'JOI', 'VINERI'];
    let updatedHtml = htmlContent;

    days.forEach((day, index) => {
      const currentDay = new Date(weekStart);
      currentDay.setDate(weekStart.getDate() + index);
      
      const formattedDate = `${currentDay.getDate()} ${currentDay.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}`;
      
      // Înlocuiește placeholder-ul [DATA] pentru ziua respectivă
      const regex = new RegExp(`${day}\\s*-\\s*\\[DATA\\]`, 'gi');
      updatedHtml = updatedHtml.replace(regex, `${day} - ${formattedDate}`);
    });

    return updatedHtml;
  };

  const handleScheduleMenu = async () => {
    if (!selectedMenuId || !selectedWeek) {
      alert('Te rugăm să selectezi un meniu și o săptămână!');
      return;
    }

    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) return;

      const weekStart = selectedWeek.start.toISOString().split('T')[0];
      const weekEnd = selectedWeek.end.toISOString().split('T')[0];

      const isOverlap = scheduledMenus.some(m => {
        if (!m.weekStart || !m.weekEnd) return false;
        const existingStart = new Date(m.weekStart);
        const existingEnd = new Date(m.weekEnd);
        return (
          (selectedWeek.start >= existingStart && selectedWeek.start <= existingEnd) ||
          (selectedWeek.end >= existingStart && selectedWeek.end <= existingEnd)
        );
      });

      if (isOverlap) {
        if (!confirm('⚠️ Există deja un meniu programat în această săptămână. Vrei să continui?')) {
          setSaving(false);
          return;
        }
      }

      // Citește meniul curent pentru a obține htmlContent
      const menuRef = doc(db, 'organizations', user.uid, 'locations', gradinitaId, 'menus', selectedMenuId);
      const menuSnap = await getDoc(menuRef);
      
      if (!menuSnap.exists()) {
        alert('❌ Meniul nu a fost găsit!');
        setSaving(false);
        return;
      }

      const menuData = menuSnap.data();
      let updatedHtmlContent = menuData.htmlContent;

      // Înlocuiește placeholder-urile [DATA] cu datele reale
      if (updatedHtmlContent && menuData.aiGenerated) {
        updatedHtmlContent = replaceDatePlaceholders(updatedHtmlContent, selectedWeek.start);
      }
      
      await updateDoc(menuRef, {
        isDraft: false,
        published: true,
        weekStart: weekStart,
        weekEnd: weekEnd,
        year: selectedWeek.start.getFullYear(),
        weekNumber: getWeekNumber(selectedWeek.start),
        weekId: `${selectedWeek.start.getFullYear()}-W${getWeekNumber(selectedWeek.start)}`,
        htmlContent: updatedHtmlContent,
        assignedAt: new Date(),
        updatedAt: new Date()
      });

      alert('✅ Meniu programat cu succes!');
      router.push(`/gradinite/${gradinitaId}/menus`);
    } catch (error) {
      console.error('Eroare programare:', error);
      alert('❌ Eroare la programarea meniului');
    } finally {
      setSaving(false);
    }
  };

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const getMonthWeeks = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const weeks: { start: Date; end: Date; days: Date[] }[] = [];
    let currentWeekStart = new Date(firstDay);
    
    currentWeekStart.setDate(firstDay.getDate() - firstDay.getDay() + 1);
    
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);
      
      const days: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(currentWeekStart);
        day.setDate(currentWeekStart.getDate() + i);
        days.push(day);
      }
      
      weeks.push({
        start: new Date(currentWeekStart),
        end: weekEnd,
        days
      });
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  };

  const formatWeek = (start: Date, end: Date) => {
    return `${start.getDate()} ${start.toLocaleDateString('ro-RO', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('ro-RO', { month: 'short' })}`;
  };

  const isWeekScheduled = (start: Date, end: Date) => {
    return scheduledMenus.some(m => {
      if (!m.weekStart || !m.weekEnd) return false;
      const existingStart = new Date(m.weekStart);
      const existingEnd = new Date(m.weekEnd);
      return start.getTime() === existingStart.getTime() && end.getTime() === existingEnd.getTime();
    });
  };

  const weeks = getMonthWeeks();

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
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <h1 className="text-4xl font-bold mb-2">📅 Programare Meniu</h1>
            <p className="text-white/90">{gradinita?.name}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Selector Meniu */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">1️⃣ Selectează Meniu</h2>
                
                {draftMenus.length === 0 ? (
                  <p className="text-gray-600 text-sm">Nu există meniuri draft disponibile</p>
                ) : (
                  <div className="space-y-3">
                    {draftMenus.map((menu) => (
                      <button
                        key={menu.id}
                        onClick={() => setSelectedMenuId(menu.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition ${
                          selectedMenuId === menu.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-gray-900">{menu.title}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {menu.aiGenerated ? '🤖 AI' : '✍️ Manual'}
                            </p>
                          </div>
                          {selectedMenuId === menu.id && (
                            <Check className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedMenuId && selectedWeek && (
                  <button
                    onClick={handleScheduleMenu}
                    disabled={saving}
                    className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition shadow-lg disabled:opacity-50"
                  >
                    {saving ? 'Se programează...' : '✅ Programează Meniu'}
                  </button>
                )}
              </div>
            </div>

            {/* Calendar */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">2️⃣ Selectează Săptămâna</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                      ←
                    </button>
                    <div className="px-4 py-2 bg-purple-100 text-purple-900 rounded-lg font-bold">
                      {currentMonth.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                    </div>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                      →
                    </button>
                  </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map((day) => (
                    <div key={day} className="text-center text-sm font-bold text-gray-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Weeks */}
                <div className="space-y-4">
                  {weeks.map((week, idx) => {
                    const isScheduled = isWeekScheduled(week.start, week.end);
                    const isSelected = selectedWeek?.start.getTime() === week.start.getTime();
                    
                    return (
                      <div key={idx} className="space-y-2">
                        <button
                          onClick={() => setSelectedWeek(week)}
                          disabled={!selectedMenuId}
                          className={`w-full p-4 rounded-lg border-2 transition ${
                            isSelected
                              ? 'border-purple-500 bg-purple-50'
                              : isScheduled
                              ? 'border-orange-300 bg-orange-50'
                              : 'border-gray-200 hover:border-purple-300'
                          } ${!selectedMenuId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-gray-900">
                              Săptămâna {formatWeek(week.start, week.end)}
                            </span>
                            {isScheduled && (
                              <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded-full">
                                📅 Ocupată
                              </span>
                            )}
                            {isSelected && (
                              <Check className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {week.days.map((day, dayIdx) => {
                              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                              return (
                                <div
                                  key={dayIdx}
                                  className={`text-center text-sm py-1 rounded ${
                                    isCurrentMonth
                                      ? 'text-gray-900'
                                      : 'text-gray-400'
                                  }`}
                                >
                                  {day.getDate()}
                                </div>
                              );
                            })}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
