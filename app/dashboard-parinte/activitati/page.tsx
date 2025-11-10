'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { ArrowLeft, Activity, Loader2, Calendar, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

interface ActivityRecord {
  id: string;
  nume: string;
  descriere: string;
  data: any;
  grupaId: string;
  copiiParticipanti?: string[];
  poze?: string[];
  educatoare?: string;
}

export default function ActivitatiParintePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [copilNume, setCopilNume] = useState('');
  const [copilCnp, setCopilCnp] = useState('');

  useEffect(() => {
    loadActivitati();
  }, []);

  const loadActivitati = async () => {
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
      setCopilCnp(parinteData.copilCnp);

      // Citește activitățile
      const activitiesRef = collection(
        db,
        'organizations',
        parinteData.organizationId,
        'locations',
        parinteData.locationId,
        'activities'
      );

      const activitiesQuery = query(activitiesRef, orderBy('data', 'desc'));
      const activitiesSnap = await getDocs(activitiesQuery);

      const allActivities = activitiesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityRecord[];

      // Filtrează activitățile grupei copilului
      const grupaActivities = allActivities.filter(
        act => act.grupaId === parinteData.grupaId
      );

      setActivities(grupaActivities);
    } catch (error) {
      console.error('Eroare încărcare activități:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasParticipated = (activity: ActivityRecord) => {
    return activity.copiiParticipanti && activity.copiiParticipanti.includes(copilCnp);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Se încarcă activitățile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
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
              <h1 className="text-2xl font-bold text-gray-900">🎨 Activități</h1>
              <p className="text-sm text-gray-600">{copilNume}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Statistici */}
          <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl shadow-xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 mb-1">Total activități</p>
                <p className="text-4xl font-bold">{activities.length}</p>
              </div>
              <Activity className="w-16 h-16 text-white/30" />
            </div>
          </div>

          {/* Listă Activități */}
          {activities.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Nu există activități încă
              </h3>
              <p className="text-gray-600">
                Activitățile vor apărea aici când educatoarea le va adăuga
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map(activity => (
                <div key={activity.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{activity.nume}</h3>
                          {hasParticipated(activity) && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              ✓ Participat
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{activity.descriere}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(activity.data)}
                          </span>
                          {activity.educatoare && (
                            <span>👩‍🏫 {activity.educatoare}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Poze */}
                    {activity.poze && activity.poze.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <ImageIcon className="w-4 h-4 text-gray-600" />
                          <p className="text-sm font-medium text-gray-700">
                            {activity.poze.length} {activity.poze.length === 1 ? 'poză' : 'poze'}
                          </p>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {activity.poze.slice(0, 4).map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Activitate ${index + 1}`}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
