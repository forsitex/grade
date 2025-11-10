'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, FileText, Loader2, Calendar, UtensilsCrossed, Moon, Smile, Activity as ActivityIcon, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface DailyReport {
  data: string;
  copilCnp: string;
  copilNume: string;
  grupaId: string;
  mese: {
    micDejun?: { mancat: string; alimente: string; emoji: string };
    gustare1?: { mancat: string; alimente: string; emoji: string };
    pranz?: { mancat: string; alimente: string; emoji: string };
    gustare2?: { mancat: string; alimente: string; emoji: string };
  };
  somn?: {
    aAdormit: string;
    aTrezit: string;
    durata: string;
    calitate: string;
  };
  igiena?: {
    schimbariScutec: number;
    schimbariHaine: number;
    toaleta: string;
    observatii: string;
  };
  comportament?: {
    dispozitie: string;
    interactiune: string;
    emoji: string;
  };
  activitati?: string[];
  observatii?: string;
  completatDe?: string;
  completatLa?: any;
}

export default function RapoarteParintePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [copilNume, setCopilNume] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedSections, setExpandedSections] = useState<string[]>(['mese', 'comportament']);

  useEffect(() => {
    loadRaport();
  }, [selectedDate]);

  const loadRaport = async () => {
    setLoading(true);
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

      // Citește raportul zilnic
      const reportRef = doc(
        db,
        'organizations',
        parinteData.organizationId,
        'locations',
        parinteData.locationId,
        'dailyReports',
        selectedDate,
        parinteData.copilCnp
      );

      const reportSnap = await getDoc(reportRef);

      if (reportSnap.exists()) {
        setReport(reportSnap.data() as DailyReport);
      } else {
        setReport(null);
      }
    } catch (error) {
      console.error('Eroare încărcare raport:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isExpanded = (section: string) => expandedSections.includes(section);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Se încarcă raportul...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
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
              <h1 className="text-2xl font-bold text-gray-900">📋 Rapoarte Zilnice</h1>
              <p className="text-sm text-gray-600">{copilNume}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Selector Dată */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-4">
              <Calendar className="w-6 h-6 text-gray-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>
          </div>

          {/* Raport */}
          {!report ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Raportul zilnic nu este disponibil încă
              </h3>
              <p className="text-gray-600">
                Educatoarea va completa raportul la sfârșitul zilei
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Mese */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('mese')}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <UtensilsCrossed className="w-6 h-6 text-orange-500" />
                    <h3 className="text-lg font-bold text-gray-900">🍽️ Mese</h3>
                  </div>
                  {isExpanded('mese') ? <ChevronUp /> : <ChevronDown />}
                </button>
                
                {isExpanded('mese') && report.mese && (
                  <div className="p-6 pt-0 space-y-4">
                    {report.mese.micDejun && (
                      <div className="border-l-4 border-yellow-500 pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{report.mese.micDejun.emoji}</span>
                          <p className="font-semibold text-gray-900">Mic Dejun</p>
                          <span className="ml-auto text-yellow-600 font-bold">{report.mese.micDejun.mancat}</span>
                        </div>
                        <p className="text-gray-600 text-sm">{report.mese.micDejun.alimente}</p>
                      </div>
                    )}

                    {report.mese.gustare1 && (
                      <div className="border-l-4 border-green-500 pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{report.mese.gustare1.emoji}</span>
                          <p className="font-semibold text-gray-900">Gustare 1</p>
                          <span className="ml-auto text-green-600 font-bold">{report.mese.gustare1.mancat}</span>
                        </div>
                        <p className="text-gray-600 text-sm">{report.mese.gustare1.alimente}</p>
                      </div>
                    )}

                    {report.mese.pranz && (
                      <div className="border-l-4 border-red-500 pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{report.mese.pranz.emoji}</span>
                          <p className="font-semibold text-gray-900">Prânz</p>
                          <span className="ml-auto text-red-600 font-bold">{report.mese.pranz.mancat}</span>
                        </div>
                        <p className="text-gray-600 text-sm">{report.mese.pranz.alimente}</p>
                      </div>
                    )}

                    {report.mese.gustare2 && (
                      <div className="border-l-4 border-blue-500 pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{report.mese.gustare2.emoji}</span>
                          <p className="font-semibold text-gray-900">Gustare 2</p>
                          <span className="ml-auto text-blue-600 font-bold">{report.mese.gustare2.mancat}</span>
                        </div>
                        <p className="text-gray-600 text-sm">{report.mese.gustare2.alimente}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Somn */}
              {report.somn && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('somn')}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Moon className="w-6 h-6 text-indigo-500" />
                      <h3 className="text-lg font-bold text-gray-900">😴 Somn</h3>
                    </div>
                    {isExpanded('somn') ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  
                  {isExpanded('somn') && (
                    <div className="p-6 pt-0">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">A adormit</p>
                          <p className="text-lg font-semibold text-gray-900">{report.somn.aAdormit}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">S-a trezit</p>
                          <p className="text-lg font-semibold text-gray-900">{report.somn.aTrezit}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Durata</p>
                          <p className="text-lg font-semibold text-gray-900">{report.somn.durata}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Calitate</p>
                          <p className="text-lg font-semibold text-gray-900 capitalize">{report.somn.calitate}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Comportament */}
              {report.comportament && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('comportament')}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Smile className="w-6 h-6 text-pink-500" />
                      <h3 className="text-lg font-bold text-gray-900">😊 Comportament</h3>
                    </div>
                    {isExpanded('comportament') ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  
                  {isExpanded('comportament') && (
                    <div className="p-6 pt-0">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-4xl">{report.comportament.emoji}</span>
                        <div>
                          <p className="text-sm text-gray-600">Dispoziție</p>
                          <p className="text-lg font-semibold text-gray-900 capitalize">{report.comportament.dispozitie}</p>
                        </div>
                      </div>
                      <p className="text-gray-700">{report.comportament.interactiune}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Activități */}
              {report.activitati && report.activitati.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('activitati')}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <ActivityIcon className="w-6 h-6 text-purple-500" />
                      <h3 className="text-lg font-bold text-gray-900">🎨 Activități</h3>
                    </div>
                    {isExpanded('activitati') ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  
                  {isExpanded('activitati') && (
                    <div className="p-6 pt-0">
                      <ul className="space-y-2">
                        {report.activitati.map((activitate, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            <span className="text-gray-700">{activitate}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Observații */}
              {report.observatii && (
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-xl p-6 text-white">
                  <h3 className="text-lg font-bold mb-3">💭 Observații Educatoare</h3>
                  <p className="text-white/90">{report.observatii}</p>
                  {report.completatDe && (
                    <p className="text-white/70 text-sm mt-4">
                      Completat de: {report.completatDe}
                    </p>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
