'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Calendar, Users, MapPin, Image as ImageIcon, Edit, Trash2 } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { getOrgAndLocation } from '@/lib/firebase-helpers';
import Link from 'next/link';

export default function ActivityDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const activityId = params.id as string;
  const locationId = searchParams.get('locationId');

  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<any>(null);

  useEffect(() => {
    loadActivity();
  }, [activityId]);

  const loadActivity = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      if (!locationId) {
        alert('Eroare: ID locație lipsește');
        router.back();
        return;
      }

      const orgData = await getOrgAndLocation(locationId);
      if (!orgData) {
        router.push('/login');
        return;
      }

      const activityRef = doc(
        db,
        'organizations',
        orgData.organizationId,
        'locations',
        locationId,
        'activities',
        activityId
      );
      const activitySnap = await getDoc(activityRef);

      if (activitySnap.exists()) {
        setActivity({ id: activitySnap.id, ...activitySnap.data() });
      } else {
        alert('Activitatea nu a fost găsită');
        router.back();
      }
    } catch (error) {
      console.error('Eroare încărcare activitate:', error);
      alert('Eroare la încărcarea activității');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Sigur vrei să ștergi activitatea "${activity.titlu}"?`)) {
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user || !locationId) return;

      const orgData = await getOrgAndLocation(locationId);
      if (!orgData) return;

      await deleteDoc(
        doc(
          db,
          'organizations',
          orgData.organizationId,
          'locations',
          locationId,
          'activities',
          activityId
        )
      );

      alert('✅ Activitate ștearsă cu succes!');
      router.push('/activities');
    } catch (error) {
      console.error('Eroare ștergere:', error);
      alert('❌ Eroare la ștergerea activității');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă activitatea...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
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
          {/* Header Card */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">{activity.titlu}</h1>
                <p className="text-white/90 text-xl">{activity.grupa}</p>
              </div>
              {activity.emoji && (
                <div className="text-6xl">{activity.emoji}</div>
              )}
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Detalii Activitate</h2>

            <div className="space-y-6">
              {/* Data */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(activity.data).toLocaleDateString('ro-RO', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Grupa */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Grupă</p>
                  <p className="text-lg font-semibold text-gray-900">{activity.grupa}</p>
                </div>
              </div>

              {/* Locație */}
              {activity.locatie && (
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Locație</p>
                    <p className="text-lg font-semibold text-gray-900">{activity.locatie}</p>
                  </div>
                </div>
              )}

              {/* Descriere */}
              {activity.descriere && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Descriere</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{activity.descriere}</p>
                </div>
              )}

              {/* Imagini */}
              {activity.imagini && activity.imagini.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-4">
                    <ImageIcon className="w-5 h-5 text-gray-600" />
                    <p className="text-sm text-gray-500">Imagini ({activity.imagini.length})</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {activity.imagini.map((url: string, index: number) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden shadow-md">
                        <img
                          src={url}
                          alt={`Activitate ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Link
              href={`/activities/${activityId}/edit?locationId=${locationId}`}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              <Edit className="w-5 h-5" />
              Editează
            </Link>
            <button
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
            >
              <Trash2 className="w-5 h-5" />
              Șterge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
