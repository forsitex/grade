'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { getOrgAndLocation } from '@/lib/firebase-helpers';
import Step1GradinitaGrupa from '@/components/children/Step1GradinitaGrupa';
import Step2DateCopil from '@/components/children/Step2DateCopil';
import Step3Parinte1 from '@/components/children/Step3Parinte1';
import Step4Parinte2 from '@/components/children/Step4Parinte2';
import Step5Contract from '@/components/children/Step5Contract';

export default function EditChildPage() {
  const router = useRouter();
  const params = useParams();
  const cnp = params.cnp as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gradinite, setGradinite] = useState<any[]>([]);
  const [locationId, setLocationId] = useState('');
  
  const [formData, setFormData] = useState({
    // Step 1 - Grădiniță & Grupă
    gradinitaId: '',
    grupa: '',
    program: '',
    programOraStart: '08:00',
    programOraEnd: '16:00',
    
    // Step 2 - Date Copil
    nume: '',
    prenume: '',
    cnp: '',
    dataNasterii: '',
    varsta: 0,
    sex: '',
    adresa: '',
    alergii: '',
    conditiiMedicale: '',
    
    // Step 3 - Părinte 1 (flat structure)
    parinte1Nume: '',
    parinte1Cnp: '',
    parinte1Relatie: 'Mamă',
    parinte1Telefon: '',
    parinte1Email: '',
    parinte1Adresa: '',
    parinte1Parola: '',
    parinte1CiSerie: '',
    parinte1CiNumar: '',
    
    // Step 4 - Părinte 2 (flat structure)
    addParinte2: false,
    parinte2Nume: '',
    parinte2Cnp: '',
    parinte2Relatie: 'Tată',
    parinte2Telefon: '',
    parinte2Email: '',
    parinte2Adresa: '',
    parinte2CiSerie: '',
    parinte2CiNumar: '',
    
    // Step 5 - Contract
    dataInceput: new Date().toISOString().split('T')[0],
    durata: 'nedeterminata',
    dataSfarsit: '',
    tipAbonament: 'Normal',
    meseIncluse: {
      micDejun: true,
      pranz: true,
      gustare: true,
      cina: false
    },
    costLunar: 0,
    observatiiContract: ''
  });

  useEffect(() => {
    loadData();
  }, [cnp]);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      // Încarcă toate grădinițele
      const orgData = await getOrgAndLocation();
      if (!orgData) return;

      const locationsRef = collection(db, 'organizations', orgData.organizationId, 'locations');
      const locationsSnap = await getDocs(locationsRef);
      const locationsData = locationsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGradinite(locationsData);

      // Găsește copilul în toate locațiile
      let foundChild = null;
      let foundLocationId = '';

      for (const location of locationsData) {
        const childRef = doc(db, 'organizations', orgData.organizationId, 'locations', location.id, 'children', cnp);
        const childSnap = await getDoc(childRef);
        
        if (childSnap.exists()) {
          foundChild = childSnap.data();
          foundLocationId = location.id;
          break;
        }
      }

      if (foundChild) {
        setLocationId(foundLocationId);
        
        // Pre-populează formularul cu datele existente
        setFormData({
          // Step 1
          gradinitaId: foundLocationId,
          grupa: foundChild.grupa || '',
          program: foundChild.program || '',
          programOraStart: foundChild.programOraStart || '08:00',
          programOraEnd: foundChild.programOraEnd || '16:00',
          
          // Step 2
          nume: foundChild.nume || '',
          prenume: foundChild.prenume || '',
          cnp: foundChild.cnp || '',
          dataNasterii: foundChild.dataNasterii || '',
          varsta: foundChild.varsta || 0,
          sex: foundChild.sex || '',
          adresa: foundChild.adresa || '',
          alergii: foundChild.alergii || '',
          conditiiMedicale: foundChild.conditiiMedicale || '',
          
          // Step 3 - Părinte 1 (flat)
          parinte1Nume: foundChild.parinte1Nume || foundChild.parinte1?.nume || '',
          parinte1Cnp: foundChild.parinte1Cnp || foundChild.parinte1?.cnp || '',
          parinte1Relatie: foundChild.parinte1Relatie || foundChild.parinte1?.relatie || 'Mamă',
          parinte1Telefon: foundChild.parinte1Telefon || foundChild.parinte1?.telefon || '',
          parinte1Email: foundChild.parinte1Email || foundChild.parinte1?.email || '',
          parinte1Adresa: foundChild.parinte1Adresa || foundChild.parinte1?.adresa || '',
          parinte1Parola: foundChild.parinte1Parola || '',
          parinte1CiSerie: foundChild.parinte1CiSerie || foundChild.parinte1?.ciSerie || '',
          parinte1CiNumar: foundChild.parinte1CiNumar || foundChild.parinte1?.ciNumar || '',
          
          // Step 4 - Părinte 2 (flat)
          addParinte2: !!(foundChild.parinte2Nume || foundChild.parinte2?.nume),
          parinte2Nume: foundChild.parinte2Nume || foundChild.parinte2?.nume || '',
          parinte2Cnp: foundChild.parinte2Cnp || foundChild.parinte2?.cnp || '',
          parinte2Relatie: foundChild.parinte2Relatie || foundChild.parinte2?.relatie || 'Tată',
          parinte2Telefon: foundChild.parinte2Telefon || foundChild.parinte2?.telefon || '',
          parinte2Email: foundChild.parinte2Email || foundChild.parinte2?.email || '',
          parinte2Adresa: foundChild.parinte2Adresa || foundChild.parinte2?.adresa || '',
          parinte2CiSerie: foundChild.parinte2CiSerie || foundChild.parinte2?.ciSerie || '',
          parinte2CiNumar: foundChild.parinte2CiNumar || foundChild.parinte2?.ciNumar || '',
          
          // Step 5 - Contract
          dataInceput: foundChild.dataInceput || foundChild.dataInscriere || new Date().toISOString().split('T')[0],
          durata: foundChild.durata || 'nedeterminata',
          dataSfarsit: foundChild.dataSfarsit || '',
          tipAbonament: foundChild.tipAbonament || foundChild.program || 'Normal',
          meseIncluse: foundChild.meseIncluse || {
            micDejun: true,
            pranz: true,
            gustare: true,
            cina: false
          },
          costLunar: foundChild.costLunar || 0,
          observatiiContract: foundChild.observatiiContract || ''
        });
      } else {
        alert('Copilul nu a fost găsit!');
        router.back();
      }
    } catch (error) {
      console.error('Eroare încărcare date:', error);
      alert('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user || !locationId) return;

      // Actualizează copilul în Firebase
      const orgData = await getOrgAndLocation(locationId);
      if (!orgData) return;

      const childRef = doc(db, 'organizations', orgData.organizationId, 'locations', locationId, 'children', cnp);
      
      // Pregătește datele în structura corectă (nested pentru părinți)
      const updateData: any = {
        nume: formData.nume,
        prenume: formData.prenume,
        dataNasterii: formData.dataNasterii,
        varsta: formData.varsta,
        sex: formData.sex,
        adresa: formData.adresa,
        alergii: formData.alergii,
        conditiiMedicale: formData.conditiiMedicale,
        grupa: formData.grupa,
        program: formData.program,
        programOraStart: formData.programOraStart,
        programOraEnd: formData.programOraEnd,
        
        // Părinte 1 (nested structure)
        parinte1: {
          nume: formData.parinte1Nume,
          cnp: formData.parinte1Cnp,
          relatie: formData.parinte1Relatie,
          telefon: formData.parinte1Telefon,
          email: formData.parinte1Email,
          adresa: formData.parinte1Adresa || formData.adresa,
          ci: {
            serie: formData.parinte1CiSerie,
            numar: formData.parinte1CiNumar
          }
        },
        
        // Contract
        contract: {
          dataInceput: formData.dataInceput,
          durata: formData.durata,
          dataSfarsit: formData.dataSfarsit,
          costLunar: parseFloat(formData.costLunar.toString()),
          tipAbonament: formData.tipAbonament,
          meseIncluse: formData.meseIncluse
        },
        
        updatedAt: new Date(),
        updatedBy: user.email
      };
      
      // Adaugă Părinte 2 dacă există
      if (formData.addParinte2 && formData.parinte2Nume) {
        updateData.parinte2 = {
          nume: formData.parinte2Nume,
          cnp: formData.parinte2Cnp,
          relatie: formData.parinte2Relatie,
          telefon: formData.parinte2Telefon,
          email: formData.parinte2Email,
          adresa: formData.parinte2Adresa || formData.adresa,
          ci: {
            serie: formData.parinte2CiSerie,
            numar: formData.parinte2CiNumar
          }
        };
      }
      
      await updateDoc(childRef, updateData);
      console.log('✅ Copil actualizat în Firestore');
      
      // Creează/Actualizează cont Părinte 1
      if (formData.parinte1Email) {
        try {
          // Generează parolă dacă lipsește
          const generatePassword = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let password = '';
            for (let i = 0; i < 6; i++) {
              password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
          };

          const parolaParinte1 = formData.parinte1Parola || generatePassword();

          console.log('📝 Creating/updating parinte account...');
          const response = await fetch('/api/create-parinte', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.parinte1Email,
              password: parolaParinte1,
              nume: formData.parinte1Nume,
              telefon: formData.parinte1Telefon,
              organizationId: orgData.organizationId,
              locationId: locationId,
              copilCnp: cnp,
              copilNume: formData.nume,
              grupaId: formData.grupa,
            }),
          });

          const result = await response.json();
          
          if (response.ok) {
            console.log('✅ Parinte account created/updated:', result);
          } else {
            console.error('❌ Error creating/updating parinte:', result.error);
          }
        } catch (error) {
          console.error('❌ Error calling create-parinte API:', error);
        }
      }
      
      // Creează/Actualizează cont Părinte 2 (dacă există)
      if (formData.addParinte2 && formData.parinte2Email) {
        try {
          const generatePassword = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let password = '';
            for (let i = 0; i < 6; i++) {
              password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
          };

          const parolaParinte2 = generatePassword();

          console.log('📝 Creating/updating parinte 2 account...');
          const response = await fetch('/api/create-parinte', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.parinte2Email,
              password: parolaParinte2,
              nume: formData.parinte2Nume,
              telefon: formData.parinte2Telefon,
              organizationId: orgData.organizationId,
              locationId: locationId,
              copilCnp: cnp,
              copilNume: formData.nume,
              grupaId: formData.grupa,
            }),
          });

          const result = await response.json();
          
          if (response.ok) {
            console.log('✅ Parinte 2 account created/updated:', result);
          } else {
            console.error('❌ Error creating/updating parinte 2:', result.error);
          }
        } catch (error) {
          console.error('❌ Error calling create-parinte API for parinte 2:', error);
        }
      }

      alert('✅ Copil actualizat cu succes!');
      router.back();
    } catch (error) {
      console.error('Eroare salvare:', error);
      alert('❌ Eroare la salvarea modificărilor');
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
      <div className="bg-white shadow sticky top-0 z-10">
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
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <h1 className="text-3xl font-bold mb-2">✏️ Editează Copil</h1>
            <p className="text-white/90 text-xl">{formData.nume} {formData.prenume}</p>
            <p className="text-white/80 text-sm">CNP: {cnp}</p>
          </div>

          {/* Toate Secțiunile într-o singură pagină */}
          <div className="space-y-8">
            {/* Step 1 - Grădiniță & Grupă */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-blue-100">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Grădiniță & Grupă</h2>
              </div>
              <Step1GradinitaGrupa
                formData={formData}
                gradinite={gradinite}
                onChange={handleChange}
              />
            </div>

            {/* Step 2 - Date Copil */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-blue-100">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Date Copil</h2>
              </div>
              <Step2DateCopil
                formData={formData}
                onChange={handleChange}
              />
            </div>

            {/* Step 3 - Părinte 1 */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-green-100">
                <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Părinte 1 (Principal)</h2>
              </div>
              <Step3Parinte1
                formData={formData}
                onChange={handleChange}
              />
            </div>

            {/* Step 4 - Părinte 2 */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-purple-100">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Părinte 2 (Opțional)</h2>
              </div>
              <Step4Parinte2
                formData={formData}
                onChange={handleChange}
              />
            </div>

            {/* Step 5 - Contract */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-blue-100">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  5
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Date Contract</h2>
              </div>
              <Step5Contract
                formData={formData}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Buton Salvare Sticky la Final */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t-2 border-gray-200 rounded-t-2xl shadow-2xl p-6 mt-8">
            <div className="max-w-5xl mx-auto">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
              >
                <Save className="w-6 h-6" />
                {saving ? 'Se salvează modificările...' : '💾 Salvează Toate Modificările'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
