'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Baby, Save, CheckCircle } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { getOrgAndLocation } from '@/lib/firebase-helpers';

// Componente pentru fiecare step
import Step1GradinitaGrupa from '@/components/children/Step1GradinitaGrupa';
import Step2DateCopil from '@/components/children/Step2DateCopil';
import Step3Parinte1 from '@/components/children/Step3Parinte1';
import Step4Parinte2 from '@/components/children/Step4Parinte2';
import Step5Contract from '@/components/children/Step5Contract';

type OrganizationType = 'camin' | 'gradinita' | 'spital' | 'hotel';

function AddChildContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gradinitaIdFromUrl = searchParams.get('gradinitaId');

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gradinite, setGradinite] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    // Step 1
    gradinitaId: gradinitaIdFromUrl || '',
    grupa: '',
    program: '',
    programOraStart: '08:00',
    programOraEnd: '16:00',
    
    // Step 2
    nume: '',
    cnp: '',
    dataNasterii: '',
    adresa: '',
    alergii: '',
    conditiiMedicale: '',
    fotoUrl: '',
    
    // Step 3
    parinte1Nume: '',
    parinte1Cnp: '',
    parinte1Relatie: 'Mamă',
    parinte1Telefon: '',
    parinte1Email: '',
    parinte1Adresa: '',
    parinte1CiSerie: '',
    parinte1CiNumar: '',
    parinte1Parola: '',
    
    // Step 4
    addParinte2: false,
    parinte2Nume: '',
    parinte2Cnp: '',
    parinte2Relatie: 'Tată',
    parinte2Telefon: '',
    parinte2Email: '',
    parinte2Adresa: '',
    parinte2CiSerie: '',
    parinte2CiNumar: '',
    
    // Step 5
    dataInceput: '',
    durata: 'nedeterminata',
    dataSfarsit: '',
    costLunar: '',
    tipAbonament: 'Normal',
    meseIncluse: {
      micDejun: true,
      pranz: true,
      gustare: true,
      cina: false
    }
  });

  useEffect(() => {
    loadGradinite();
  }, []);

  const loadGradinite = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const orgData = await getOrgAndLocation();
      if (!orgData) return;

      const locationsRef = collection(db, 'organizations', orgData.organizationId, 'locations');
      const locationsSnap = await getDocs(locationsRef);
      const gradiniteData = locationsSnap.docs
        .filter(doc => doc.data().type === 'gradinita')
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      
      setGradinite(gradiniteData);
    } catch (error) {
      console.error('Eroare încărcare grădinițe:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Validări per step
    if (currentStep === 1) {
      if (!formData.gradinitaId || !formData.grupa || !formData.program) {
        setError('Te rugăm să completezi toate câmpurile obligatorii.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.nume || !formData.cnp || !formData.adresa) {
        setError('Te rugăm să completezi toate câmpurile obligatorii.');
        return;
      }
      if (formData.cnp.length !== 13) {
        setError('CNP-ul trebuie să aibă 13 cifre.');
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.parinte1Nume || !formData.parinte1Cnp || !formData.parinte1Telefon || !formData.parinte1Email) {
        setError('Te rugăm să completezi toate câmpurile obligatorii pentru Părinte 1.');
        return;
      }
    }
    if (currentStep === 5) {
      if (!formData.dataInceput || !formData.costLunar) {
        setError('Te rugăm să completezi toate câmpurile obligatorii.');
        return;
      }
    }

    setError('');
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      // Calculare vârstă din CNP
      const an = parseInt(formData.cnp.substring(1, 3));
      const luna = parseInt(formData.cnp.substring(3, 5));
      const zi = parseInt(formData.cnp.substring(5, 7));
      
      let anNastere = an;
      const primaCifra = parseInt(formData.cnp[0]);
      if (primaCifra === 1 || primaCifra === 2) {
        anNastere += 1900;
      } else if (primaCifra === 5 || primaCifra === 6) {
        anNastere += 2000;
      }
      
      const dataNasterii = new Date(anNastere, luna - 1, zi);
      const varsta = Math.floor((Date.now() - dataNasterii.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      // Salvare copil în Firestore
      const orgData = await getOrgAndLocation(formData.gradinitaId);
      if (!orgData) return;

      const childRef = doc(db, 'organizations', orgData.organizationId, 'locations', formData.gradinitaId, 'children', formData.cnp);
      await setDoc(childRef, {
        nume: formData.nume.toUpperCase(),
        cnp: formData.cnp,
        dataNasterii: dataNasterii.toISOString().split('T')[0],
        varsta: varsta,
        adresa: formData.adresa,
        alergii: formData.alergii,
        conditiiMedicale: formData.conditiiMedicale,
        fotoUrl: formData.fotoUrl,
        grupa: formData.grupa,
        program: formData.program,
        programOraStart: formData.programOraStart,
        programOraEnd: formData.programOraEnd,
        parinte1: {
          nume: formData.parinte1Nume.toUpperCase(),
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
        ...(formData.addParinte2 && {
          parinte2: {
            nume: formData.parinte2Nume.toUpperCase(),
            cnp: formData.parinte2Cnp,
            relatie: formData.parinte2Relatie,
            telefon: formData.parinte2Telefon,
            email: formData.parinte2Email,
            adresa: formData.parinte2Adresa || formData.adresa,
            ci: {
              serie: formData.parinte2CiSerie,
              numar: formData.parinte2CiNumar
            }
          }
        }),
        contract: {
          dataInceput: formData.dataInceput,
          durata: formData.durata,
          dataSfarsit: formData.dataSfarsit,
          costLunar: parseFloat(formData.costLunar),
          tipAbonament: formData.tipAbonament,
          meseIncluse: formData.meseIncluse
        },
        createdAt: Date.now()
      });

      console.log('✅ Copil adăugat cu succes!');
      
      // Creează cont părinte (Părinte 1)
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

          console.log('📝 Creating parinte account...');
          const response = await fetch('/api/create-parinte', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.parinte1Email,
              password: parolaParinte1,
              nume: formData.parinte1Nume,
              telefon: formData.parinte1Telefon,
              organizationId: orgData.organizationId,
              locationId: formData.gradinitaId,
              copilCnp: formData.cnp,
              copilNume: formData.nume,
              grupaId: formData.grupa,
            }),
          });

          const result = await response.json();
          
          if (response.ok) {
            console.log('✅ Parinte account created:', result);
            // Afișează parola generată (dacă a fost generată automat)
            if (!formData.parinte1Parola) {
              alert(`✅ Copil adăugat cu succes!\n\n👨‍👩‍👧 Date Login Părinte:\nEmail: ${formData.parinte1Email}\nParolă: ${parolaParinte1}\n\n⚠️ Notează aceste date și comunică-le părintelui!`);
            }
          } else {
            console.error('❌ Error creating parinte:', result.error);
          }
        } catch (error) {
          console.error('❌ Error calling create-parinte API:', error);
        }
      }
      
      // Redirect la pagina de succes
      router.push(`/children/success?cnp=${formData.cnp}&gradinitaId=${formData.gradinitaId}`);
    } catch (err: any) {
      console.error('❌ Eroare salvare copil:', err);
      setError('Eroare la salvarea copilului. Te rugăm să încerci din nou.');
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Grădiniță & Grupă' },
    { number: 2, title: 'Date Copil' },
    { number: 3, title: 'Părinte 1' },
    { number: 4, title: 'Părinte 2' },
    { number: 5, title: 'Contract' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi la Dashboard
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          {/* Desktop Progress */}
          <div className="hidden md:flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition ${
                    currentStep > step.number
                      ? 'bg-green-500 text-white'
                      : currentStep === step.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.number ? <CheckCircle className="w-6 h-6" /> : step.number}
                  </div>
                  <p className={`mt-2 text-sm font-medium ${
                    currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-4 transition ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Mobile Progress */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Pasul {currentStep} din {steps.length}
              </span>
              <span className="text-sm font-medium text-blue-600">
                {Math.round((currentStep / steps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-center text-sm font-medium text-gray-900">
              {steps[currentStep - 1].title}
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Step Components */}
            {currentStep === 1 && (
              <Step1GradinitaGrupa
                formData={formData}
                gradinite={gradinite}
                onChange={handleChange}
              />
            )}
            {currentStep === 2 && (
              <Step2DateCopil
                formData={formData}
                onChange={handleChange}
              />
            )}
            {currentStep === 3 && (
              <Step3Parinte1
                formData={formData}
                onChange={handleChange}
              />
            )}
            {currentStep === 4 && (
              <Step4Parinte2
                formData={formData}
                onChange={handleChange}
              />
            )}
            {currentStep === 5 && (
              <Step5Contract
                formData={formData}
                onChange={handleChange}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8 pt-6 border-t">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Înapoi
                </button>
              )}
              
              {currentStep < 5 ? (
                <button
                  onClick={handleNext}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  Următorul
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Se salvează...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Salvează și Generează Documente
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AddChildPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă...</p>
        </div>
      </div>
    }>
      <AddChildContent />
    </Suspense>
  );
}
