'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Plus,
  Calendar,
  Users,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { getOrgAndLocation } from '@/lib/firebase-helpers';

export default function ActivitiesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [grupe, setGrupe] = useState<any[]>([]);
  const [selectedGrupa, setSelectedGrupa] = useState('toate');
  const [selectedStatus, setSelectedStatus] = useState('toate');

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

      // Obține organizationId (funcționează pentru admin și educatoare)
      const orgData = await getOrgAndLocation();
      if (!orgData) {
        router.push('/login');
        return;
      }

      // Încarcă grupe
      const locationsRef = collection(db, 'organizations', orgData.organizationId, 'locations');
      const locationsSnap = await getDocs(locationsRef);
      let locationsData = locationsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Dacă e educatoare, filtrează doar locația ei
      if (orgData.locationId) {
        locationsData = locationsData.filter(loc => loc.id === orgData.locationId);
      }

      let allGrupe: any[] = [];
      locationsData.forEach((location: any) => {
        if (location.grupe) {
          allGrupe = [...allGrupe, ...location.grupe.map((g: any) => ({
            ...g,
            locationId: location.id
          }))];
        }
      });
      setGrupe(allGrupe);

      // Încarcă activități
      let allActivities: any[] = [];
      for (const location of locationsData) {
        const activitiesRef = collection(db, 'organizations', orgData.organizationId, 'locations', location.id, 'activities');
        const activitiesQuery = query(activitiesRef, orderBy('data', 'desc'));
        const activitiesSnap = await getDocs(activitiesQuery);
        
        const locationActivities = activitiesSnap.docs.map(doc => ({
          id: doc.id,
          locationId: location.id,
          ...doc.data()
        }));
        allActivities = [...allActivities, ...locationActivities];
      }

      // Sortează după dată
      allActivities.sort((a, b) => {
        const dateA = new Date(a.data);
        const dateB = new Date(b.data);
        return dateB.getTime() - dateA.getTime();
      });

      setActivities(allActivities);
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (activityId: string, locationId: string, titlu: string) => {
    if (!confirm(`Sigur vrei să ștergi activitatea "${titlu}"?`)) {
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const orgData = await getOrgAndLocation(locationId);
      if (!orgData) return;

      await deleteDoc(doc(db, 'organizations', orgData.organizationId, 'locations', locationId, 'activities', activityId));
      alert('✅ Activitate ștearsă cu succes!');
      loadData();
    } catch (error) {
      console.error('Eroare ștergere:', error);
      alert('❌ Eroare la ștergerea activității');
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (selectedGrupa !== 'toate' && activity.grupa !== selectedGrupa) return false;
    if (selectedStatus !== 'toate' && activity.status !== selectedStatus) return false;
    return true;
  });

  const viitoare = filteredActivities.filter(a => {
    const activityDate = new Date(a.data);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return activityDate.getTime() >= today.getTime() && a.status !== 'completat';
  });

  const completate = filteredActivities.filter(a => a.status === 'completat');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completat':
        return <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">✅ Completat</span>;
      case 'anulat':
        return <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">❌ Anulat</span>;
      default:
        return null; // Nu mai afișăm "Planificat"
    }
  };

  const getTipIcon = (tip: string) => {
    const icons: any = {
      'Artă': '🎨',
      'Sport': '⚽',
      'Muzică': '🎵',
      'Dans': '💃',
      'Educație': '📚',
      'Excursie': '🚌',
      'Altele': '🎯'
    };
    return icons[tip] || '🎯';
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
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi la Dashboard
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">🎨 Activități</h1>
                <p className="text-white/90">Gestionare activități pentru toate grupele</p>
              </div>
              <Link
                href="/activities/add"
                className="px-6 py-3 bg-white text-pink-600 rounded-lg font-bold hover:bg-pink-50 transition shadow-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Adaugă Activitate
              </Link>
            </div>
          </div>

          {/* Filtre */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">Filtre</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grupă
                </label>
                <select
                  value={selectedGrupa}
                  onChange={(e) => setSelectedGrupa(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                >
                  <option value="toate">Toate Grupele</option>
                  {grupe.map(grupa => (
                    <option key={grupa.id} value={grupa.nume}>
                      {grupa.nume}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                >
                  <option value="toate">Toate</option>
                  <option value="planificat">Planificat</option>
                  <option value="completat">Completat</option>
                  <option value="anulat">Anulat</option>
                </select>
              </div>
            </div>
          </div>

          {/* Activități Viitoare */}
          {viitoare.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📅 Activități Viitoare ({viitoare.length})
              </h2>
              <div className="space-y-4">
                {viitoare.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-gradient-to-r from-blue-50 to-pink-50 border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{getTipIcon(activity.tip)}</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{activity.titlu}</h3>
                          <p className="text-sm text-gray-600">{activity.grupa}</p>
                        </div>
                      </div>
                      {getStatusBadge(activity.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{new Date(activity.data).toLocaleDateString('ro-RO')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{activity.participanti?.length || 0} copii</span>
                      </div>
                      {activity.poze && activity.poze.length > 0 && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-sm">{activity.poze.length} poze</span>
                        </div>
                      )}
                    </div>

                    {activity.descriere && (
                      <p className="text-gray-700 text-sm mb-4">{activity.descriere}</p>
                    )}

                    <div className="flex gap-2">
                      <Link
                        href={`/activities/${activity.id}?locationId=${activity.locationId}`}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                      >
                        <Edit className="w-4 h-4" />
                        Vezi Detalii
                      </Link>
                      <button
                        onClick={() => handleDelete(activity.id, activity.locationId, activity.titlu)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        Șterge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activități Completate */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ✅ Activități Completate ({completate.length})
            </h2>
            {completate.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                Nu există activități completate încă
              </p>
            ) : (
              <div className="space-y-4">
                {completate.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{getTipIcon(activity.tip)}</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{activity.titlu}</h3>
                          <p className="text-sm text-gray-600">{activity.grupa}</p>
                        </div>
                      </div>
                      {getStatusBadge(activity.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{new Date(activity.data).toLocaleDateString('ro-RO')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-bold text-green-600">
                          {activity.participanti?.length || 0} participanți
                        </span>
                      </div>
                      {activity.poze && activity.poze.length > 0 && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-sm font-bold text-purple-600">
                            {activity.poze.length} poze
                          </span>
                        </div>
                      )}
                    </div>

                    {activity.noteEducatoare && (
                      <div className="bg-white/50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700">
                          <span className="font-bold">Note:</span> {activity.noteEducatoare}
                        </p>
                      </div>
                    )}

                    <Link
                      href={`/activities/${activity.id}?locationId=${activity.locationId}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Vezi Detalii
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
