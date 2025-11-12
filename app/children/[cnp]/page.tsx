'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
  ArrowLeft, 
  User,
  Calendar,
  FileDown,
  Banknote,
  GraduationCap
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

interface ChildData {
  cnp: string;
  nume: string;
  grupa: string;
  taxaLunara: number;
}

interface Optional {
  nume: string;
  pret: number;
  icon: string;
}

export default function ChildDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const cnp = params.cnp as string;

  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState<ChildData | null>(null);
  const [optionale, setOptionale] = useState<Optional[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [totalOptionale, setTotalOptionale] = useState(0);

  useEffect(() => {
    const now = new Date();
    setSelectedMonth(String(now.getMonth() + 1).padStart(2, '0'));
    setSelectedYear(String(now.getFullYear()));
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      loadChildData();
    }
  }, [cnp, selectedMonth, selectedYear]);

  const loadChildData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const organizationId = user.uid;

      // Caută copilul în toate locațiile
      const locationsRef = collection(db, 'organizations', organizationId, 'locations');
      const locationsSnap = await getDocs(locationsRef);

      let childData: ChildData | null = null;
      let locationId = '';

      for (const locationDoc of locationsSnap.docs) {
        const childrenRef = collection(db, 'organizations', organizationId, 'locations', locationDoc.id, 'children');
        const childrenSnap = await getDocs(childrenRef);

        const childDoc = childrenSnap.docs.find(doc => doc.data().cnp === cnp);
        if (childDoc) {
          const data = childDoc.data();
          const taxa = data.costLunar || data['Cost Lunar'] || data.taxaLunara || data.taxa || 0;
          
          childData = {
            cnp: data.cnp,
            nume: data.nume,
            grupa: data.grupa || 'Fără grupă',
            taxaLunara: Number(taxa) || 0
          };
          
          locationId = locationDoc.id;
          break;
        }
      }

      if (!childData || !locationId) {
        console.error('Copilul nu a fost găsit');
        return;
      }

      setChild(childData);

      // Încarcă opționalele la care este înscris copilul
      const optionaleRef = collection(db, 'organizations', organizationId, 'locations', locationId, 'optionale');
      const optionaleSnap = await getDocs(optionaleRef);

      const optionaleData: Optional[] = [];
      let totalOpt = 0;

      optionaleSnap.docs.forEach(optionalDoc => {
        const optionalData = optionalDoc.data();
        const copiiInscrisi = optionalData.copii || [];

        if (copiiInscrisi.includes(cnp)) {
          const pret = optionalData.pret || 0;
          optionaleData.push({
            nume: optionalData.nume,
            pret: pret,
            icon: optionalData.icon || '🎓'
          });
          totalOpt += pret;
        }
      });

      setOptionale(optionaleData);
      setTotalOptionale(totalOpt);

    } catch (error) {
      console.error('Eroare încărcare date copil:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!child) return;

    const monthName = months.find(m => m.value === selectedMonth)?.label || '';

    // Creează datele pentru Excel
    const data = [
      ['RAPORT FINANCIAR'],
      [''],
      ['Copil:', child.nume],
      ['Luna:', `${monthName} ${selectedYear}`],
      [''],
      ['DETALII PLĂȚI'],
      [''],
      ['Descriere', 'Sumă (RON)'],
      ['Taxa lunară (conform programului)', child.taxaLunara],
      ...optionale.map(opt => [`Opțional ${opt.nume}`, opt.pret]),
      [''],
      ['TOTAL', child.taxaLunara + totalOptionale]
    ];

    // Creează workbook și worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Raport Financiar');

    // Setează lățimi coloane
    ws['!cols'] = [
      { wch: 40 },
      { wch: 15 }
    ];

    // Exportă fișierul
    XLSX.writeFile(wb, `Raport_Financiar_${child.nume.replace(/\s+/g, '_')}_${monthName}_${selectedYear}.xlsx`);
  };

  const exportToWord = async () => {
    if (!child) return;

    const monthName = months.find(m => m.value === selectedMonth)?.label || '';

    // Creează documentul Word
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: 'RAPORT FINANCIAR',
            heading: 'Heading1',
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Copil: ', bold: true }),
              new TextRun(child.nume)
            ],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Luna: ', bold: true }),
              new TextRun(`${monthName} ${selectedYear}`)
            ],
            spacing: { after: 400 }
          }),
          new Paragraph({
            text: 'DETALII PLĂȚI',
            heading: 'Heading2',
            spacing: { before: 200, after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Taxa lunară (conform programului): ', bold: true }),
              new TextRun(`${child.taxaLunara.toLocaleString()} RON`)
            ],
            spacing: { after: 200 }
          }),
          ...optionale.map(opt => new Paragraph({
            children: [
              new TextRun({ text: `Opțional ${opt.nume}: `, bold: true }),
              new TextRun(`${opt.pret.toLocaleString()} RON`)
            ],
            spacing: { after: 200 }
          })),
          new Paragraph({
            text: '',
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'TOTAL: ', bold: true, size: 28 }),
              new TextRun({ text: `${(child.taxaLunara + totalOptionale).toLocaleString()} RON`, size: 28 })
            ],
            spacing: { before: 200 }
          })
        ]
      }]
    });

    // Exportă fișierul
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Raport_Financiar_${child.nume.replace(/\s+/g, '_')}_${monthName}_${selectedYear}.docx`);
  };

  const months = [
    { value: '01', label: 'Ianuarie' },
    { value: '02', label: 'Februarie' },
    { value: '03', label: 'Martie' },
    { value: '04', label: 'Aprilie' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Iunie' },
    { value: '07', label: 'Iulie' },
    { value: '08', label: 'August' },
    { value: '09', label: 'Septembrie' },
    { value: '10', label: 'Octombrie' },
    { value: '11', label: 'Noiembrie' },
    { value: '12', label: 'Decembrie' }
  ];

  const years = [2024, 2025, 2026];

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

  if (!child) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Copilul nu a fost găsit.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Înapoi
          </button>
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
      <div className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header Copil */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl shadow-[0_10px_0_rgba(59,130,246,0.3),0_15px_30px_rgba(59,130,246,0.3)] p-8 text-white border-4 border-white/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold drop-shadow-lg">{child.nume}</h1>
              <p className="text-white/90 text-lg drop-shadow-md">Grupa: {child.grupa}</p>
            </div>
          </div>
        </div>

        {/* Selector Perioadă */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            📅 Selectează Perioada
          </h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Luna</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Anul</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Raport Financiar */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              💰 Raport Financiar
            </h2>
            <div className="flex gap-3">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition shadow-lg"
              >
                <FileDown className="w-5 h-5" />
                Export Excel
              </button>
              <button
                onClick={exportToWord}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition shadow-lg"
              >
                <FileDown className="w-5 h-5" />
                Export Word
              </button>
            </div>
          </div>

          {/* Taxa Lunară */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Banknote className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="font-bold text-gray-900 text-lg">Taxa lunară</p>
                  <p className="text-sm text-gray-600">(conform programului)</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-orange-900">{child.taxaLunara.toLocaleString()} RON</p>
            </div>
          </div>

          {/* Opționale */}
          {optionale.length > 0 && (
            <div className="space-y-3 mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Opționale
              </h3>
              {optionale.map((opt, index) => (
                <div 
                  key={index}
                  className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{opt.icon}</span>
                      <p className="font-bold text-gray-900">{opt.nume}</p>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{opt.pret.toLocaleString()} RON</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold mb-1">TOTAL {months.find(m => m.value === selectedMonth)?.label.toUpperCase()}</p>
                <p className="text-4xl font-bold">{(child.taxaLunara + totalOptionale).toLocaleString()} RON</p>
              </div>
              <div className="text-5xl">💰</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
