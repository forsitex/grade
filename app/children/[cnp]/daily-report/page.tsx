'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save,
  Calendar as CalendarIcon,
  Utensils,
  Droplet,
  Moon,
  Palette,
  Smile,
  Thermometer,
  FileText
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { getOrgAndLocation } from '@/lib/firebase-helpers';

export default function DailyReportPage() {
  const router = useRouter();
  const params = useParams();
  const cnp = params.cnp as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [child, setChild] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [existingReports, setExistingReports] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    // Mese
    micDejun: 0,
    gustare1: 0,
    pranz: 0,
    gustare2: 0,
    cina: 0,
    // Igienă
    scaun: false,
    oraScaun: '',
    pipi: 'normal',
    schimbat: 0,
    // Somn
    odihnit: false,
    oraStartSomn: '',
    oraEndSomn: '',
    calitateSomn: 'bine',
    // Activități
    activitati: '',
    // Dispoziție
    dispozitie: 'vesel',
    // Note
    noteEducatoare: '',
    // Sănătate (opțional)
    areTemperatura: false,
    temperatura: '',
    medicamente: false,
    observatiiSanatate: ''
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

      // Găsește copilul în toate locațiile
      const orgData = await getOrgAndLocation();
      if (!orgData) return;

      const organizationsRef = collection(db, 'organizations', orgData.organizationId, 'locations');
      const locationsSnap = await getDocs(organizationsRef);
      
      let foundChild = null;
      let locationId = '';

      for (const locationDoc of locationsSnap.docs) {
        const childRef = doc(db, 'organizations', orgData.organizationId, 'locations', locationDoc.id, 'children', cnp);
        const childSnap = await getDoc(childRef);
        
        if (childSnap.exists()) {
          foundChild = { id: childSnap.id, ...childSnap.data() };
          locationId = locationDoc.id;
          break;
        }
      }

      if (foundChild) {
        setChild(foundChild);

        // Încarcă raportul pentru data selectată (dacă există)
        const reportRef = doc(db, 'organizations', orgData.organizationId, 'locations', locationId, 'children', cnp, 'dailyReports', selectedDate);
        const reportSnap = await getDoc(reportRef);

        if (reportSnap.exists()) {
          const data = reportSnap.data();
          setFormData({
            micDejun: data.mese?.micDejun || 0,
            gustare1: data.mese?.gustare1 || 0,
            pranz: data.mese?.pranz || 0,
            gustare2: data.mese?.gustare2 || 0,
            cina: data.mese?.cina || 0,
            scaun: data.igiena?.scaun || false,
            oraScaun: data.igiena?.oraScaun || '',
            pipi: data.igiena?.pipi || 'normal',
            schimbat: data.igiena?.schimbat || 0,
            odihnit: data.somn?.odihnit || false,
            oraStartSomn: data.somn?.oraStart || '',
            oraEndSomn: data.somn?.oraEnd || '',
            calitateSomn: data.somn?.calitate || 'bine',
            activitati: data.activitati?.join('\n') || '',
            dispozitie: data.dispozitie || 'vesel',
            noteEducatoare: data.noteEducatoare || '',
            areTemperatura: !!data.sanatate?.temperatura,
            temperatura: data.sanatate?.temperatura?.toString() || '',
            medicamente: data.sanatate?.medicamente || false,
            observatiiSanatate: data.sanatate?.observatii || ''
          });
        } else {
          // Reset formular pentru zi nouă
          setFormData({
            micDejun: 0,
            gustare1: 0,
            pranz: 0,
            gustare2: 0,
            cina: 0,
            scaun: false,
            oraScaun: '',
            pipi: 'normal',
            schimbat: 0,
            odihnit: false,
            oraStartSomn: '',
            oraEndSomn: '',
            calitateSomn: 'bine',
            activitati: '',
            dispozitie: 'vesel',
            noteEducatoare: '',
            areTemperatura: false,
            temperatura: '',
            medicamente: false,
            observatiiSanatate: ''
          });
        }

        // Încarcă lista cu rapoarte existente
        const reportsRef = collection(db, 'organizations', orgData.organizationId, 'locations', locationId, 'children', cnp, 'dailyReports');
        const reportsSnap = await getDocs(reportsRef);
        const dates = reportsSnap.docs.map(doc => doc.id);
        setExistingReports(dates);
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
      if (!user) return;

      // Găsește locația copilului
      const orgData = await getOrgAndLocation();
      if (!orgData) return;

      const organizationsRef = collection(db, 'organizations', orgData.organizationId, 'locations');
      const locationsSnap = await getDocs(organizationsRef);
      
      let locationId = '';
      for (const locationDoc of locationsSnap.docs) {
        const childRef = doc(db, 'organizations', orgData.organizationId, 'locations', locationDoc.id, 'children', cnp);
        const childSnap = await getDoc(childRef);
        if (childSnap.exists()) {
          locationId = locationDoc.id;
          break;
        }
      }

      if (!locationId) {
        alert('Eroare: Copilul nu a fost găsit');
        return;
      }

      // Salvează raportul
      const reportRef = doc(db, 'organizations', orgData.organizationId, 'locations', locationId, 'children', cnp, 'dailyReports', selectedDate);
      
      const reportData = {
        date: selectedDate,
        mese: {
          micDejun: formData.micDejun,
          gustare1: formData.gustare1,
          pranz: formData.pranz,
          gustare2: formData.gustare2,
          cina: formData.cina
        },
        igiena: {
          scaun: formData.scaun,
          oraScaun: formData.oraScaun,
          pipi: formData.pipi,
          schimbat: formData.schimbat
        },
        somn: {
          odihnit: formData.odihnit,
          oraStart: formData.oraStartSomn,
          oraEnd: formData.oraEndSomn,
          calitate: formData.calitateSomn
        },
        activitati: formData.activitati.split('\n').filter(Boolean),
        dispozitie: formData.dispozitie,
        noteEducatoare: formData.noteEducatoare,
        sanatate: {
          temperatura: formData.areTemperatura ? parseFloat(formData.temperatura) : null,
          medicamente: formData.medicamente,
          observatii: formData.observatiiSanatate
        },
        createdBy: user.email,
        updatedAt: new Date()
      };

      await setDoc(reportRef, reportData);
      
      // Întreabă user-ul ce vrea să facă
      const goToHistory = confirm('✅ Raport salvat cu succes!\n\nVrei să vezi istoricul rapoartelor?\n\nOK = Vezi Istoric\nAnulează = Adaugă alt raport');
      
      if (goToHistory) {
        router.push(`/children/${cnp}/daily-reports-history`);
      } else {
        // Schimbă data la următoarea zi
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        
        // Setează data la următoarea zi doar dacă nu depășește azi
        if (nextDayStr <= today) {
          setSelectedDate(nextDayStr);
        } else {
          // Dacă nu putem avansa data, resetează formularul manual
          setFormData({
            micDejun: 0,
            gustare1: 0,
            pranz: 0,
            gustare2: 0,
            cina: 0,
            scaun: false,
            oraScaun: '',
            pipi: 'normal',
            schimbat: 0,
            odihnit: false,
            oraStartSomn: '',
            oraEndSomn: '',
            calitateSomn: 'bine',
            activitati: '',
            dispozitie: 'vesel',
            noteEducatoare: '',
            areTemperatura: false,
            temperatura: '',
            medicamente: false,
            observatiiSanatate: ''
          });
        }
        
        // Reîncarcă pentru a actualiza lista de rapoarte și formularul pentru noua dată
        await loadData();
      }
    } catch (error) {
      console.error('Eroare salvare raport:', error);
      alert('❌ Eroare la salvarea raportului');
    } finally {
      setSaving(false);
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
          <div className="bg-gradient-to-r from-blue-500 to-pink-500 rounded-2xl shadow-xl p-6 mb-6 text-white">
            <h1 className="text-3xl font-bold mb-2">📊 Raport Zilnic</h1>
            <p className="text-xl">{child?.nume}</p>
            <p className="text-white/80">CNP: {cnp}</p>
          </div>

          {/* Selector Dată și Istoric */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end mb-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-3">
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
              <Link
                href={`/children/${cnp}/daily-reports-history`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg whitespace-nowrap flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Vezi Istoric
              </Link>
            </div>
            {existingReports.includes(selectedDate) && (
              <p className="mt-2 text-sm text-green-600">✅ Raport existent pentru această dată</p>
            )}
          </div>

          {/* Formular Raport */}
          <div className="space-y-6">
            {/* Mese */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Utensils className="w-6 h-6 text-orange-600" />
                🍽️ Mese
              </h2>
              <div className="space-y-4">
                {[
                  { key: 'micDejun', label: 'Mic Dejun' },
                  { key: 'gustare1', label: 'Gustare 1' },
                  { key: 'pranz', label: 'Prânz' },
                  { key: 'gustare2', label: 'Gustare 2' },
                  { key: 'cina', label: 'Cină' }
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {label}: {formData[key as keyof typeof formData]}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={formData[key as keyof typeof formData] as number}
                      onChange={(e) => setFormData({ ...formData, [key]: parseInt(e.target.value) })}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${formData[key as keyof typeof formData]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Igienă */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Droplet className="w-6 h-6 text-blue-600" />
                💩 Igienă
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.scaun}
                    onChange={(e) => setFormData({ ...formData, scaun: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <label className="text-gray-700 font-medium">A avut scaun</label>
                </div>
                {formData.scaun && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ora:</label>
                    <input
                      type="time"
                      value={formData.oraScaun}
                      onChange={(e) => setFormData({ ...formData, oraScaun: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pipi:</label>
                  <select
                    value={formData.pipi}
                    onChange={(e) => setFormData({ ...formData, pipi: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="frecvent">Frecvent</option>
                    <option value="rar">Rar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schimbat scutec/îmbrăcăminte: {formData.schimbat} ori
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.schimbat}
                    onChange={(e) => setFormData({ ...formData, schimbat: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Somn */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Moon className="w-6 h-6 text-purple-600" />
                😴 Somn
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.odihnit}
                    onChange={(e) => setFormData({ ...formData, odihnit: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                  <label className="text-gray-700 font-medium">S-a odihnit</label>
                </div>
                {formData.odihnit && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ora Start:</label>
                      <input
                        type="time"
                        value={formData.oraStartSomn}
                        onChange={(e) => setFormData({ ...formData, oraStartSomn: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ora End:</label>
                      <input
                        type="time"
                        value={formData.oraEndSomn}
                        onChange={(e) => setFormData({ ...formData, oraEndSomn: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Calitate somn:</label>
                  <select
                    value={formData.calitateSomn}
                    onChange={(e) => setFormData({ ...formData, calitateSomn: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                  >
                    <option value="excelent">😊 Excelent</option>
                    <option value="bine">🙂 Bine</option>
                    <option value="agitat">😐 Agitat</option>
                    <option value="nu-a-dormit">😢 Nu a dormit</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Activități */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Palette className="w-6 h-6 text-pink-600" />
                🎨 Activități
              </h2>
              <textarea
                value={formData.activitati}
                onChange={(e) => setFormData({ ...formData, activitati: e.target.value })}
                placeholder="Ex: Desen cu acuarele (10:00-11:00)&#10;Joacă în curte (11:30-12:30)"
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2">O activitate per linie</p>
            </div>

            {/* Dispoziție */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Smile className="w-6 h-6 text-yellow-600" />
                😊 Dispoziție
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'vesel', label: '😊 Vesel', bgColor: 'bg-green-500', hoverColor: 'hover:bg-green-600', selectedBg: 'bg-green-600' },
                  { value: 'normal', label: '😐 Normal', bgColor: 'bg-blue-500', hoverColor: 'hover:bg-blue-600', selectedBg: 'bg-blue-600' },
                  { value: 'trist', label: '😢 Trist', bgColor: 'bg-gray-500', hoverColor: 'hover:bg-gray-600', selectedBg: 'bg-gray-600' },
                  { value: 'obosit', label: '😴 Obosit', bgColor: 'bg-purple-500', hoverColor: 'hover:bg-purple-600', selectedBg: 'bg-purple-600' }
                ].map(({ value, label, bgColor, hoverColor, selectedBg }) => (
                  <button
                    key={value}
                    onClick={() => setFormData({ ...formData, dispozitie: value })}
                    className={`p-4 rounded-lg font-bold text-lg transition shadow-lg ${
                      formData.dispozitie === value
                        ? `${selectedBg} text-white scale-105`
                        : `${bgColor} ${hoverColor} text-white opacity-70 hover:opacity-100`
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Educatoare */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-600" />
                📝 Note Educatoare
              </h2>
              <textarea
                value={formData.noteEducatoare}
                onChange={(e) => setFormData({ ...formData, noteEducatoare: e.target.value })}
                placeholder="Observații despre comportament, progres, interacțiuni..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
              />
            </div>

            {/* Sănătate (Opțional) */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Thermometer className="w-6 h-6 text-red-600" />
                🌡️ Sănătate (Opțional)
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.areTemperatura}
                    onChange={(e) => setFormData({ ...formData, areTemperatura: e.target.checked })}
                    className="w-5 h-5 text-red-600 rounded"
                  />
                  <label className="text-gray-700 font-medium">Temperatură măsurată</label>
                </div>
                {formData.areTemperatura && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Temperatură (°C):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.temperatura}
                      onChange={(e) => setFormData({ ...formData, temperatura: e.target.value })}
                      placeholder="36.5"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.medicamente}
                    onChange={(e) => setFormData({ ...formData, medicamente: e.target.checked })}
                    className="w-5 h-5 text-red-600 rounded"
                  />
                  <label className="text-gray-700 font-medium">A primit medicamente</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observații sănătate:</label>
                  <textarea
                    value={formData.observatiiSanatate}
                    onChange={(e) => setFormData({ ...formData, observatiiSanatate: e.target.value })}
                    placeholder="Ex: Totul OK, fără probleme"
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Buton Salvare */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-pink-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-6 h-6" />
              {saving ? 'Se salvează...' : 'Salvează Raportul Zilnic'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
