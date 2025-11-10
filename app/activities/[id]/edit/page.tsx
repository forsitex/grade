'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Upload, X, Loader2 } from 'lucide-react';
import { auth, db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getOrgAndLocation } from '@/lib/firebase-helpers';

export default function EditActivityPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const activityId = params.id as string;
  const locationId = searchParams.get('locationId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [grupe, setGrupe] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    titlu: '',
    descriere: '',
    data: '',
    grupa: '',
    locatie: '',
    emoji: '🎨'
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  const emojis = ['🎨', '📚', '🎭', '🎵', '⚽', '🎪', '🌳', '🔬', '🎬', '🍳'];

  useEffect(() => {
    loadData();
  }, [activityId]);

  const loadData = async () => {
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

      // Încarcă grupe
      const locationRef = doc(db, 'organizations', orgData.organizationId, 'locations', locationId);
      const locationSnap = await getDoc(locationRef);
      
      if (locationSnap.exists()) {
        const locationData = locationSnap.data();
        setGrupe(locationData.grupe || []);
      }

      // Încarcă activitatea
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
        const data = activitySnap.data();
        setFormData({
          titlu: data.titlu || '',
          descriere: data.descriere || '',
          data: data.data || '',
          grupa: data.grupa || '',
          locatie: data.locatie || '',
          emoji: data.emoji || '🎨'
        });
        setExistingImages(data.imagini || []);
      } else {
        alert('Activitatea nu a fost găsită');
        router.back();
      }
    } catch (error) {
      console.error('Eroare încărcare date:', error);
      alert('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setNewImages(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (orgId: string, locId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of newImages) {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `activities/${orgId}/${locId}/${activityId}/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      uploadedUrls.push(url);
    }

    return uploadedUrls;
  };

  const handleSave = async () => {
    if (!formData.titlu || !formData.data || !formData.grupa) {
      alert('Te rog completează toate câmpurile obligatorii (Titlu, Data, Grupa)');
      return;
    }

    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user || !locationId) return;

      const orgData = await getOrgAndLocation(locationId);
      if (!orgData) return;

      // Upload imagini noi
      let newImageUrls: string[] = [];
      if (newImages.length > 0) {
        setUploadingImages(true);
        newImageUrls = await uploadImages(orgData.organizationId, locationId);
        setUploadingImages(false);
      }

      // Combină imaginile existente cu cele noi
      const allImages = [...existingImages, ...newImageUrls];

      // Actualizează activitatea
      const activityRef = doc(
        db,
        'organizations',
        orgData.organizationId,
        'locations',
        locationId,
        'activities',
        activityId
      );

      await updateDoc(activityRef, {
        ...formData,
        imagini: allImages,
        updatedAt: new Date(),
        updatedBy: user.email
      });

      alert('✅ Activitate actualizată cu succes!');
      router.push(`/activities/${activityId}?locationId=${locationId}`);
    } catch (error) {
      console.error('Eroare salvare:', error);
      alert('❌ Eroare la salvarea activității. Te rog încearcă din nou.');
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Se încarcă activitatea...</p>
        </div>
      </div>
    );
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
        <div className="max-w-3xl mx-auto">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <h1 className="text-4xl font-bold mb-2">✏️ Editează Activitate</h1>
            <p className="text-white/90 text-xl">Modifică detaliile activității</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="space-y-6">
              {/* Titlu */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Titlu Activitate *
                </label>
                <input
                  type="text"
                  value={formData.titlu}
                  onChange={(e) => setFormData({ ...formData, titlu: e.target.value })}
                  placeholder="Ex: Pictură cu acuarele"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                  required
                />
              </div>

              {/* Data */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data *
                </label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                  required
                />
              </div>

              {/* Grupa */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Grupă *
                </label>
                <select
                  value={formData.grupa}
                  onChange={(e) => setFormData({ ...formData, grupa: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                  required
                >
                  <option value="">Selectează grupa</option>
                  {grupe.map((grupa) => (
                    <option key={grupa.id} value={grupa.nume}>
                      {grupa.emoji} {grupa.nume}
                    </option>
                  ))}
                </select>
              </div>

              {/* Emoji */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Emoji
                </label>
                <div className="flex gap-2 flex-wrap">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, emoji })}
                      className={`text-3xl p-3 rounded-lg transition ${
                        formData.emoji === emoji
                          ? 'bg-purple-100 ring-2 ring-purple-500'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Locație */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Locație (opțional)
                </label>
                <input
                  type="text"
                  value={formData.locatie}
                  onChange={(e) => setFormData({ ...formData, locatie: e.target.value })}
                  placeholder="Ex: Sala de activități"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                />
              </div>

              {/* Descriere */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descriere (opțional)
                </label>
                <textarea
                  value={formData.descriere}
                  onChange={(e) => setFormData({ ...formData, descriere: e.target.value })}
                  placeholder="Descrie activitatea..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                />
              </div>

              {/* Imagini Existente */}
              {existingImages.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Imagini Existente
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {existingImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Imagine ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Imagini Noi */}
              {newImagePreviews.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Imagini Noi
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {newImagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Imagini */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adaugă Imagini Noi
                </label>
                <label className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition">
                  <Upload className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-600">Selectează imagini</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Anulează
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploadingImages}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving || uploadingImages ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {uploadingImages ? 'Se încarcă imaginile...' : 'Se salvează...'}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvează
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
