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
  const [currentStep, setCurrentStep] = useState(1);
  const [gradinite, setGradinite] = useState<any[]>([]);
  const [locationId, setLocationId] = useState('');
  
  const [formData, setFormData] = useState({
    // Step 1
    gradinitaId: '',
    grupa: '',
    program: '',
    
    // Step 2
    nume: '',
    prenume: '',
    cnp: '',
    dataNasterii: '',
    varsta: 0,
    sex: '',
    
    // Step 3
    parinte1: {
      nume: '',
      prenume: '',
      telefon: '',
      email: '',
      cnp: '',
      adresa: '',
      ocupatie: '',
      locMunca: ''
    },
    
    // Step 4
    parinte2: {
      nume: '',
      prenume: '',
      telefon: '',
      email: '',
      cnp: '',
      adresa: '',
      ocupatie: '',
      locMunca: ''
    },
    
    // Step 5
    dataInscriere: new Date().toISOString().split('T')[0],
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
          gradinitaId: foundLocationId,
          grupa: foundChild.grupa || '',
          program: foundChild.program || '',
          nume: foundChild.nume || '',
          prenume: foundChild.prenume || '',
          cnp: foundChild.cnp || '',
          dataNasterii: foundChild.dataNasterii || '',
          varsta: foundChild.varsta || 0,
          sex: foundChild.sex || '',
          parinte1: {
            nume: foundChild.parinte1?.nume || '',
            prenume: foundChild.parinte1?.prenume || '',
            telefon: foundChild.parinte1?.telefon || '',
            email: foundChild.parinte1?.email || '',
            cnp: foundChild.parinte1?.cnp || '',
            adresa: foundChild.parinte1?.adresa || '',
            ocupatie: foundChild.parinte1?.ocupatie || '',
            locMunca: foundChild.parinte1?.locMunca || ''
          },
          parinte2: {
            nume: foundChild.parinte2?.nume || '',
            prenume: foundChild.parinte2?.prenume || '',
            telefon: foundChild.parinte2?.telefon || '',
            email: foundChild.parinte2?.email || '',
            cnp: foundChild.parinte2?.cnp || '',
            adresa: foundChild.parinte2?.adresa || '',
            ocupatie: foundChild.parinte2?.ocupatie || '',
            locMunca: foundChild.parinte2?.locMunca || ''
          },
          dataInscriere: foundChild.dataInscriere || new Date().toISOString().split('T')[0],
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
      
      await updateDoc(childRef, {
        ...formData,
        updatedAt: new Date(),
        updatedBy: user.email
      });

      alert('✅ Copil actualizat cu succes!');
      router.back();
    } catch (error) {
      console.error('Eroare salvare:', error);
      alert('❌ Eroare la salvarea modificărilor');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <h1 className="text-3xl font-bold mb-2">✏️ Editează Copil</h1>
            <p className="text-white/90">{formData.nume} {formData.prenume}</p>
            <p className="text-white/80 text-sm">CNP: {cnp}</p>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                      currentStep >= step
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 5 && (
                    <div
                      className={`w-12 h-1 mx-2 transition ${
                        currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-gray-600 font-medium">
              Pasul {currentStep} din 5
            </p>
          </div>

          {/* Form Steps */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
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
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                ← Înapoi
              </button>
            )}
            {currentStep < 5 ? (
              <button
                onClick={nextStep}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Următorul →
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Se salvează...' : 'Salvează Modificările'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
