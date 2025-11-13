import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building, Baby, Palette, Calendar, Users, Plus, TrendingUp, Activity, Utensils, BarChart3, MessageCircle, Banknote, HelpCircle, ChevronDown, ChevronUp, Phone, Mail, User } from 'lucide-react';
import { getLocationDetailsUrl, getAddLocationUrl, getAddPersonUrl, getAddPersonLabel } from '@/lib/location-helpers';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

interface GradinitaDashboardProps {
  locations: any[];
  onDelete: (id: string, name: string) => void;
}

function SupportCard() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-pink-50 rounded-3xl p-6 shadow-[0_8px_0_rgba(59,130,246,0.3),0_12px_24px_rgba(59,130,246,0.2)] hover:shadow-[0_4px_0_rgba(59,130,246,0.4),0_8px_20px_rgba(59,130,246,0.3)] hover:translate-y-1 transition-all duration-200 border-2 border-blue-200">
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Phone className="w-7 h-7 text-white" />
        </div>
        <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-md">
          📞 Suport
        </span>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">Contact Suport</h3>
      <p className="text-gray-600 text-sm mb-4 font-medium">Echipa noastră este aici pentru tine!</p>

      <div className="space-y-3 mb-4 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">Nume</p>
            <p className="text-sm font-bold text-gray-900">Ionut Stancu</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Phone className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">Telefon</p>
            <a href="tel:0785598779" className="text-sm font-bold text-green-600 hover:text-green-700 transition">
              0785 598 779
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">Email</p>
            <a href="mailto:suport@gradinita.app" className="text-sm font-bold text-purple-600 hover:text-purple-700 transition">
              suport@gradinita.app
            </a>
          </div>
        </div>
      </div>

      <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-100">
        <p className="text-xs text-gray-600 text-center">
          ⏰ <strong>Program:</strong> Luni - Vineri, 9:00 - 18:00
        </p>
      </div>
    </div>
  );
}

function FAQCard() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Cum fac import din SIIIR?",
      answer: "Click pe 'Import SIIIR' din dashboard → Upload fișierul .xls exportat din SIIIR → Verifică preview → Confirmă import. Grupele și copiii se creează automat!"
    },
    {
      question: "Cum adaug detalii părinți?",
      answer: "Click pe un copil → Editează → Secțiunea 'Părinte 1/2' → Completează nume, telefon, email, CNP → Salvează. Părintele va primi acces la dashboard."
    },
    {
      question: "Cum marchează educatoarea prezența?",
      answer: "Educatoarea → Login → Click 'Prezență' → Bifează copiii prezenți → Salvează. Prezența se actualizează automat în dashboard."
    },
    {
      question: "Cum generez rapoarte financiare?",
      answer: "Dashboard → 'Raport Financiar TOTAL' sau 'Raport Financiar GRUPE' → Selectează luna → Vezi încasări, restanțe, statistici → Export Excel/PDF."
    },
    {
      question: "Cum adaug un copil manual?",
      answer: "Dashboard grădiniță → 'Adaugă Copil' → Completează CNP, nume, grupă, date părinți, contract → Salvează. Copilul apare instant în sistem."
    }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-pink-50 rounded-3xl p-6 shadow-[0_8px_0_rgba(59,130,246,0.3),0_12px_24px_rgba(59,130,246,0.2)] hover:shadow-[0_4px_0_rgba(59,130,246,0.4),0_8px_20px_rgba(59,130,246,0.3)] hover:translate-y-1 transition-all duration-200 border-2 border-blue-200">
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <HelpCircle className="w-7 h-7 text-white" />
        </div>
        <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-md">
          💡 Ajutor
        </span>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">Întrebări Frecvente</h3>
      <p className="text-gray-600 text-sm mb-4 font-medium">Ghid rapid pentru funcționalități</p>

      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white/60 backdrop-blur-sm rounded-xl border border-blue-100 overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-blue-50 transition"
            >
              <span className="font-semibold text-gray-800 text-sm pr-2">
                {faq.question}
              </span>
              {openIndex === index ? (
                <ChevronUp className="w-4 h-4 text-purple-600 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>
            
            {openIndex === index && (
              <div className="px-4 py-3 bg-purple-50 border-t border-purple-100">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GradinitaDashboard({ locations, onDelete }: GradinitaDashboardProps) {
  const totalCapacity = locations.reduce((sum, loc) => sum + (loc.capacity || 0), 0);
  const totalChildren = locations.reduce((sum, loc) => sum + (loc.childrenCount || 0), 0);
  const [prezentiAzi, setPrezentiAzi] = useState(0);
  const [procentPrezenta, setProcentPrezenta] = useState(0);

  // Încarcă prezența azi pentru toate grădinițele
  useEffect(() => {
    if (locations.length > 0) {
      loadGlobalAttendance();
    }
  }, [locations]);

  const loadGlobalAttendance = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      let totalPresent = 0;
      let totalChildrenCount = 0;

      // Parcurge toate grădinițele
      for (const location of locations) {
        const childrenRef = collection(db, 'organizations', user.uid, 'locations', location.id, 'children');
        const childrenSnap = await getDocs(childrenRef);
        
        totalChildrenCount += childrenSnap.size;

        // Verifică prezența pentru fiecare copil
        for (const childDoc of childrenSnap.docs) {
          const attendanceRef = doc(db, 'organizations', user.uid, 'locations', location.id, 'children', childDoc.id, 'attendance', today);
          const attendanceSnap = await getDoc(attendanceRef);
          
          if (attendanceSnap.exists()) {
            const data = attendanceSnap.data();
            if (data.status === 'present') {
              totalPresent++;
            }
          }
        }
      }

      setPrezentiAzi(totalPresent);
      setProcentPrezenta(totalChildrenCount > 0 ? Math.round((totalPresent / totalChildrenCount) * 100) : 0);
    } catch (error) {
      console.error('Eroare încărcare prezență:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Statistici Cards - 3D (SaaS: 3 carduri) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-3xl p-5 shadow-[0_8px_0_rgb(236,72,153),0_13px_25px_rgba(236,72,153,0.4)] hover:shadow-[0_4px_0_rgb(236,72,153),0_8px_20px_rgba(236,72,153,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-pink-400">
          <div className="flex items-center justify-between mb-3">
            <Baby className="w-10 h-10 text-white" />
            <span className="text-3xl font-bold text-white">{totalCapacity}</span>
          </div>
          <h3 className="text-pink-100 text-xs font-semibold mb-1">Capacitate Totală</h3>
          <p className="text-sm text-pink-50">Locuri disponibile</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-5 shadow-[0_8px_0_rgb(22,163,74),0_13px_25px_rgba(22,163,74,0.4)] hover:shadow-[0_4px_0_rgb(22,163,74),0_8px_20px_rgba(22,163,74,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-green-400">
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-10 h-10 text-white" />
            <span className="text-3xl font-bold text-white">{totalChildren}</span>
          </div>
          <h3 className="text-green-100 text-xs font-semibold mb-1">Copii Înscriși</h3>
          <p className="text-sm text-green-50">din {totalCapacity} locuri</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-5 shadow-[0_8px_0_rgb(147,51,234),0_13px_25px_rgba(147,51,234,0.4)] hover:shadow-[0_4px_0_rgb(147,51,234),0_8px_20px_rgba(147,51,234,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-purple-400">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-10 h-10 text-white" />
            <span className="text-3xl font-bold text-white">{procentPrezenta}%</span>
          </div>
          <h3 className="text-purple-100 text-xs font-semibold mb-1">Prezență Azi</h3>
          <p className="text-sm text-purple-50">{prezentiAzi} din {totalChildren} copii</p>
        </div>
      </div>

      {/* Acțiuni Rapide Globale - Butoane 3D (SaaS: fără Adaugă Grădiniță) */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          ⚡ Acțiuni Rapide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/reports/financial"
            className="group relative"
          >
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-5 shadow-[0_6px_0_rgb(22,163,74),0_10px_20px_rgba(22,163,74,0.4)] hover:shadow-[0_3px_0_rgb(22,163,74),0_6px_15px_rgba(22,163,74,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-green-400">
              <div className="flex flex-col items-center gap-2">
                <Banknote className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-white text-center">Raport Financiar TOTAL</span>
              </div>
            </div>
          </Link>
          <Link
            href="/reports/financial-groups"
            className="group relative"
          >
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-5 shadow-[0_6px_0_rgb(147,51,234),0_10px_20px_rgba(147,51,234,0.4)] hover:shadow-[0_3px_0_rgb(147,51,234),0_6px_15px_rgba(147,51,234,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-purple-400">
              <div className="flex flex-col items-center gap-2">
                <BarChart3 className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-white text-center">Raport Financiar GRUPE</span>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/mesaje"
            className="group relative"
          >
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl p-5 shadow-[0_6px_0_rgb(79,70,229),0_10px_20px_rgba(79,70,229,0.4)] hover:shadow-[0_3px_0_rgb(79,70,229),0_6px_15px_rgba(79,70,229,0.5)] hover:translate-y-1 transition-all duration-200 border-2 border-indigo-400">
              <div className="flex flex-col items-center gap-2">
                <MessageCircle className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-white text-center">Mesaje</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Grădinița Ta + FAQ + Support - 3 coloane egale */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Grădinița Ta - 1 coloană */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🏫 Grădinița Ta</h2>
          </div>

          {locations.map((location, index) => (
            <div 
              key={`location-${location.id}-${index}`} 
              className="bg-gradient-to-br from-blue-50 via-white to-pink-50 rounded-3xl p-6 shadow-[0_8px_0_rgba(59,130,246,0.3),0_12px_24px_rgba(59,130,246,0.2)] hover:shadow-[0_4px_0_rgba(59,130,246,0.4),0_8px_20px_rgba(59,130,246,0.3)] hover:translate-y-1 transition-all duration-200 border-2 border-blue-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Building className="w-7 h-7 text-white" />
                </div>
                <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-md">
                  ✓ Activ
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{location.name}</h3>
              <p className="text-gray-600 text-sm mb-3 font-medium">{location.address}</p>
              <div className="space-y-2 mb-5 bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-blue-100">
                <p className="text-gray-700 text-sm font-semibold flex items-center gap-2">
                  <span className="text-lg">👶</span> Capacitate: <span className="text-blue-600">{location.capacity || 0} copii</span>
                </p>
                <p className="text-gray-700 text-sm font-semibold flex items-center gap-2">
                  <span className="text-lg">✅</span> Înscriși: <span className="text-green-600">{location.childrenCount || 0} copii</span>
                </p>
                <p className="text-gray-700 text-sm font-semibold flex items-center gap-2">
                  <span className="text-lg">🎨</span> Total Grupe: <span className="text-purple-600">{location.grupe?.length || 0}</span>
                </p>
                {location.program && (
                  <p className="text-gray-700 text-sm font-semibold flex items-center gap-2">
                    <span className="text-lg">🕐</span> Program: <span className="text-pink-600">
                      {location.program} ({location.programOraStart || '08:00'} - {location.programOraEnd || '16:00'})
                    </span>
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Link
                  href={getLocationDetailsUrl('gradinita', location.id)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-center font-bold hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl"
                >
                  👁️ Vezi detalii
                </Link>
                <Link
                  href={`/gradinite/${location.id}/edit`}
                  className="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-bold hover:from-purple-600 hover:to-purple-700 transition shadow-lg hover:shadow-xl flex items-center gap-2"
                  title="Editează grădiniță"
                >
                  ✏️
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Card - 1 coloană */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">❓ Ajutor Rapid</h2>
          </div>
          <FAQCard />
        </div>

        {/* Support Card - 1 coloană */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">📞 Contact</h2>
          </div>
          <SupportCard />
        </div>
      </div>
    </div>
  );
}
