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
        systemPrompt="Ești un asistent AI pentru managerii de grădinițe. Ajuți cu: gestionarea locațiilor, organizarea grupelor, rapoarte, statistici, și orice întrebări despre administrarea grădinițelor. Răspunde în limba română, profesional și util."
        title="Asistent Manager"
        placeholder="Întreabă-mă orice despre gestionarea grădiniței..."
      />
    </div>
  );
}
