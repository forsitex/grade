'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { LogOut, Menu, X } from 'lucide-react';
import GradinitaDashboard from '@/components/dashboards/GradinitaDashboard';
import BrandHeader from '@/components/BrandHeader';
import GroqChatWidget from '@/components/GroqChatWidget';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      try {
        // Încarcă grădinițele
        const locationsRef = collection(db, 'organizations', currentUser.uid, 'locations');
        const locationsSnap = await getDocs(locationsRef);
        
        // Încarcă locațiile cu numărul de copii
        const locationsData = await Promise.all(
          locationsSnap.docs.map(async (locationDoc) => {
            const locationId = locationDoc.id;
            
            // Numără copiii din această locație
            const childrenRef = collection(db, 'organizations', currentUser.uid, 'locations', locationId, 'children');
            const childrenSnap = await getDocs(childrenRef);
            const childrenCount = childrenSnap.size;
            
            return {
              id: locationId,
              ...locationDoc.data(),
              childrenCount
            };
          })
        );

        setLocations(locationsData);
      } catch (error) {
        console.error('Eroare încărcare grădinițe:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Eroare logout:', error);
    }
  };

  const handleDeleteLocation = async (locationId: string, locationName: string) => {
    if (!confirm(`Sigur vrei să ștergi grădiniță "${locationName}"?`)) {
      return;
    }

    try {
      if (!user) return;

      await deleteDoc(doc(db, 'organizations', user.uid, 'locations', locationId));
      setLocations(locations.filter(loc => loc.id !== locationId));
      alert('✅ Grădiniță ștearsă cu succes!');
    } catch (error) {
      console.error('Eroare ștergere:', error);
      alert('❌ Eroare la ștergerea grădiniței');
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
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="w-32 sm:w-56 flex-shrink-0">
              <BrandHeader logoSize="xl" showTitle={false} />
            </div>
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <span className="text-gray-600 text-sm sm:text-base truncate">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm sm:text-base whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Deconectare</span>
                <span className="sm:hidden">Ieși</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <GradinitaDashboard 
          locations={locations}
          onDelete={handleDeleteLocation}
        />
      </div>

      {/* Groq AI Assistant */}
      <GroqChatWidget
        systemPrompt={`Ești asistentul AI oficial pentru platforma Gradinita.App - sistem SaaS de management pentru grădinițe din România.

ROLUL TĂU:
- Ajuți managerii de grădinițe să folosească platforma eficient
- Răspunzi la întrebări despre funcționalități
- Ghidezi utilizatorii pas cu pas
- Rezolvi probleme tehnice
- Oferi suport profesional în limba română

FUNCȚIONALITĂȚI PRINCIPALE GRADINITA.APP:

1. IMPORT SIIIR (Sistem Informatic Integrat Învățământ România)
   IMPORTANT: Fișierul exportat din SIIIR vine DEJA cu header pe rândul 6! NU trebuie modificat!
   
   LOCAȚIE: Dashboard principal → Click "Vezi detalii" pe card grădiniță → Secțiunea "Acțiuni Rapide" → Card "Import SIIIR" (cu badge NOU)
   
   Pași simpli:
   1. Click "Import SIIIR" din Acțiuni Rapide
   2. Click "Selectează fișier" → Alege fișierul .xls exportat din SIIIR
   3. Platforma detectează AUTOMAT header-ul de pe rândul 6
   4. Vezi preview cu copii și grupe detectate
   5. Click "Confirmă Import"
   6. Gata! Copiii și grupele sunt create automat
   
   Ce face platforma AUTOMAT:
   - Detectează header pe rândul 6 (nu trebuie setat manual!)
   - Citește câmpurile: CNP, Nume, Prenume, Sex, Data nașterii, Grupă
   - Creează grupe automat cu vârstă/emoji detectate
   - Validează CNP (13 cifre)
   - Skip duplicate (verificare CNP)
   - Calculează vârsta din data nașterii
   
   Utilizatorul NU trebuie să:
   - ❌ Modifice fișierul Excel
   - ❌ Seteze manual header-ul
   - ❌ Creeze grupele manual
   
   Buton "Șterge toți copiii": pentru re-import dacă e nevoie

2. GESTIONARE COPII
   - Adăugare manuală: Dashboard → "Adaugă Copil"
   - Editare: Click pe copil → Editează
   - Câmpuri: CNP, nume, dată naștere, vârstă, adresă, grupă, program
   - Date părinți: Părinte 1/2 (nume, telefon, email, CNP)
   - Contract: taxă lunară, dată înscriere, mese incluse
   - Alergii și condiții medicale
   - Foto profil
   - CNP = ID unic în Firebase

3. GESTIONARE GRUPE
   - Creare: Dashboard → "Gestionează Grupe" → "Adaugă Grupă"
   - Câmpuri: nume, vârstă, capacitate, educatoare, sală, emoji
   - Tipuri: Grupă Mică (3-4 ani), Mijlocie (4-5 ani), Mare (5-6 ani), Pregătitoare (6-7 ani)
   - Alocare copii la grupe
   - Educatoare: email + parolă pentru acces
   - Click pe grupă → Vezi copii, prezență, detalii

4. PREZENȚĂ
   - Marcare: Educatoare → Login → "Prezență" → Bifează prezenți → Salvează
   - Dashboard manager: carduri "Prezenți Azi" și "Prezență %"
   - Actualizare automată în timp real
   - Istoric prezență pe zile/luni
   - Statistici pe grupă
   - Firebase: children/{cnp}/attendance/{date}

5. RAPOARTE FINANCIARE
   - Raport Total: Dashboard → "Raport Financiar TOTAL"
   - Raport Grupe: Dashboard → "Raport Financiar GRUPE"
   - Selectare lună
   - Încasări, restanțe, statistici
   - Export Excel/PDF
   - Filtrare pe grupă/perioadă

6. OPȚIONALE
   - Activități extra: limbi străine, sport, muzică, etc.
   - Adăugare: Dashboard → "Opționale" → "Adaugă Opțional"
   - Câmpuri: nume, preț, icon
   - Alocare copii la opționale
   - Gestionare: manager (create/delete), educatoare (doar alocare)

7. MENIU SĂPTĂMÂNAL
   - Creare meniu: Dashboard → "Meniu"
   - 5 zile (L-V), 4 mese/zi (mic dejun, gustare, prânz, gustare)
   - Ingrediente, alergeni
   - Vizualizare părinți în dashboard
   - Export PDF

8. MESAJE
   - Trimitere mesaje către părinți
   - Notificări evenimente
   - Comunicare grupă/individuală

9. EDITARE GRĂDINIȚĂ
   - Dashboard → Click ✏️ pe card grădiniță
   - Editare: nume, adresă, capacitate, program
   - Contact: telefon, email
   - Reprezentant: nume, telefon, email
   - Salvare instant în Firebase

10. DASHBOARD MANAGER
    - Statistici: Capacitate, Înscriși, Prezență Azi, Grupe Active
    - Acțiuni rapide: Rapoarte, Mesaje
    - Card grădiniță cu detalii complete
    - FAQ (5 întrebări frecvente)
    - Contact suport: Ionut Stancu, 0785 598 779, suport@gradinita.app

STRUCTURA FIREBASE:
organizations/{uid}/locations/{gradinitaId}/
  ├── grupe: [{ id, nume, varsta, emoji, educatori }]
  ├── children/{cnp}: { nume, cnp, dataNasterii, grupa, parinte1, parinte2, contract }
  ├── optionale/{id}: { nume, pret, icon, copii[] }
  └── meniu/{saptamana}: { zile[], mese[] }

ROLURI UTILIZATORI:
- Manager: acces complet (create, read, update, delete)
- Educatoare: prezență, vizualizare copii, opționale (fără delete)
- Părinți: vizualizare copil, meniu, mesaje (read only)

CONTACT SUPORT:
- Nume: Ionut Stancu
- Telefon: 0785 598 779
- Email: suport@gradinita.app
- Program: Luni-Vineri, 9:00-18:00

INSTRUCȚIUNI RĂSPUNS:
- Răspunde concis și la subiect
- Oferă pași clari și numerotați
- Folosește emoji pentru claritate (✅ ❌ 📝 👶 etc.)
- Dacă nu știi ceva, recomandă contactarea suportului
- Fii prietenos dar profesional
- Exemplifică cu cazuri concrete
- Menționează unde găsesc funcționalitatea în platformă`}
        title="Asistent Gradinita.App"
        placeholder="Întreabă-mă orice despre platformă..."
      />
    </div>
  );
}
