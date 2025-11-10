'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  Loader2,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, getDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';

interface Photo {
  id: string;
  url: string;
  description: string;
  category: string;
  fileName: string;
  uploadedAt: any;
  children: string[]; // Array de CNP-uri
}

interface Child {
  id: string;
  nume: string;
  cnp: string;
}

export default function GrupaGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const gradinitaId = params.id as string;
  const grupaId = params.grupaId as string;

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [grupa, setGrupa] = useState<any>(null);
  const [filterChild, setFilterChild] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [actualLocationId, setActualLocationId] = useState<string>('');

  const categories = [
    { value: 'activitati_creative', label: '🎨 Activități Creative' },
    { value: 'activitati_fizice', label: '🏃 Activități Fizice' },
    { value: 'mese', label: '🍽️ Mese' },
    { value: 'somn', label: '😴 Somn/Odihnă' },
    { value: 'evenimente', label: '🎉 Evenimente' },
    { value: 'spectacole', label: '🎭 Spectacole' },
    { value: 'plimbari', label: '🌳 Plimbări/Exterior' },
    { value: 'educatie', label: '📚 Educație' },
    { value: 'altele', label: '📸 Altele' },
  ];

  useEffect(() => {
    // RESETEAZĂ state-ul
    setChildren([]);
    setPhotos([]);
    setGrupa(null);
    setLoading(true);
    
    // Încarcă datele
    loadData();
  }, [gradinitaId, grupaId]);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      let orgId = '';
      let locId = '';
      
      // Verifică dacă e educatoare (citește din Firestore)
      const educatoareRef = doc(db, 'educatoare', user.uid);
      const educatoareSnap = await getDoc(educatoareRef);
      
      if (educatoareSnap.exists()) {
        // E educatoare
        const educatoareData = educatoareSnap.data();
        orgId = educatoareData.organizationId;
        locId = educatoareData.locationId;
        console.log('📍 Educatoare - orgId:', orgId, 'locId:', locId);
      } else {
        // E admin
        orgId = user.uid;
        locId = gradinitaId;
      }

      // Salvează în state pentru alte funcții
      setOrganizationId(orgId);
      setActualLocationId(locId);

      // Încarcă date grădiniță și grupă - DIRECT din locația specifică
      const locationRef = doc(db, 'organizations', orgId, 'locations', locId);
      const locationSnap = await getDoc(locationRef);
      
      let foundGrupa = null;
      if (locationSnap.exists()) {
        const locationData = locationSnap.data();
        foundGrupa = locationData.grupe?.find((g: any) => g.id === grupaId);
        if (foundGrupa) {
          setGrupa(foundGrupa);
          console.log('✅ Grupa găsită:', foundGrupa.nume);
        } else {
          console.error('❌ Grupa nu există în această locație');
        }
      } else {
        console.error('❌ Locația nu există');
      }

      // Încarcă copii din grupă
      if (foundGrupa) {
        const childrenRef = collection(db, 'organizations', orgId, 'locations', locId, 'children');
        const childrenSnap = await getDocs(childrenRef);
        const childrenData = (childrenSnap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as any[])
          .filter((child: any) => child.grupa === foundGrupa.nume);
        
        setChildren(childrenData);
        console.log('✅ Copii încărcați:', childrenData.length, 'din grupa:', foundGrupa.nume);
      } else {
        console.error('❌ Grupa nu a fost găsită!');
        setChildren([]);
      }

      // Încarcă poze (de la nivel de LOCATION, nu grupă)
      const galleryRef = collection(
        db,
        'organizations',
        orgId,
        'locations',
        locId,
        'gallery'
      );

      const q = query(galleryRef, orderBy('uploadedAt', 'desc'));
      const snapshot = await getDocs(q);

      // Filtrează pozele pentru grupa curentă (opțional)
      const allPhotos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Photo[];

      // Afișează toate pozele (părinții vor vedea doar pozele cu copiii lor)
      setPhotos(allPhotos);
    } catch (error) {
      console.error('Eroare încărcare date:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleChildSelection = (cnp: string) => {
    setSelectedChildren(prev =>
      prev.includes(cnp)
        ? prev.filter(c => c !== cnp)
        : [...prev, cnp]
    );
  };

  const selectAllChildren = () => {
    setSelectedChildren(children.map(c => c.cnp));
  };

  const deselectAllChildren = () => {
    setSelectedChildren([]);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !organizationId) return;

    if (selectedChildren.length === 0) {
      alert('❌ Te rog selectează cel puțin un copil!');
      return;
    }

    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        console.log('📤 Compressing:', file.name);

        // Compresie imagine (max 2MB)
        const options = {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };

        const compressedFile = await imageCompression(file, options);
        console.log('✅ Compressed from', (file.size / 1024 / 1024).toFixed(2), 'MB to', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');

        // Upload
        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('gradinitaId', actualLocationId);
        formData.append('grupaId', grupaId);
        formData.append('description', description);
        formData.append('category', selectedCategory || 'altele');
        formData.append('userId', organizationId);
        formData.append('children', JSON.stringify(selectedChildren));

        const response = await fetch('/api/upload-group-photo', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error);
        }

        console.log('✅ Uploaded:', data.photoId);
      }

      // Reset form
      setDescription('');
      setSelectedCategory('');
      setSelectedChildren([]);

      // Refresh photos
      await loadData();

      alert(`✅ ${files.length} ${files.length === 1 ? 'poză uploadată' : 'poze uploadate'} cu succes!`);
    } catch (error: any) {
      console.error('Error uploading:', error);
      alert('❌ Eroare la upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Sigur vrei să ștergi această poză?')) return;
    if (!organizationId) return;

    try {
      const photoRef = doc(
        db,
        'organizations',
        organizationId,
        'locations',
        actualLocationId,
        'gallery',
        photoId
      );

      await deleteDoc(photoRef);

      // Refresh photos
      setPhotos(photos.filter(p => p.id !== photoId));

      console.log('✅ Deleted photo:', photoId);
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Eroare la ștergere!');
    }
  };

  const getChildName = (cnp: string) => {
    const child = children.find(c => c.cnp === cnp);
    return child?.nume || cnp;
  };

  const filteredPhotos = photos.filter(photo => {
    if (filterChild && !photo.children.includes(filterChild)) return false;
    if (filterCategory && photo.category !== filterCategory) return false;
    return true;
  });

  // Grupează pozele per zi
  const photosByDate = filteredPhotos.reduce((acc, photo) => {
    const date = photo.uploadedAt ? new Date(photo.uploadedAt.toDate ? photo.uploadedAt.toDate() : photo.uploadedAt) : new Date();
    const dateKey = date.toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(photo);
    return acc;
  }, {} as Record<string, Photo[]>);

  // Sortează zilele descrescător (cele mai recente primele)
  const sortedDates = Object.keys(photosByDate).sort((a, b) => {
    const dateA = photosByDate[a][0].uploadedAt?.toDate?.() || new Date(0);
    const dateB = photosByDate[b][0].uploadedAt?.toDate?.() || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  const openLightbox = (photo: Photo, index: number) => {
    setSelectedPhoto(photo);
    setSelectedPhotoIndex(index);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  const goToPrevious = () => {
    if (selectedPhotoIndex > 0) {
      const newIndex = selectedPhotoIndex - 1;
      setSelectedPhotoIndex(newIndex);
      setSelectedPhoto(filteredPhotos[newIndex]);
    }
  };

  const goToNext = () => {
    if (selectedPhotoIndex < filteredPhotos.length - 1) {
      const newIndex = selectedPhotoIndex + 1;
      setSelectedPhotoIndex(newIndex);
      setSelectedPhoto(filteredPhotos[newIndex]);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={async () => {
              const user = auth.currentUser;
              if (user) {
                const educatoareRef = doc(db, 'educatoare', user.uid);
                const educatoareSnap = await getDoc(educatoareRef);
                if (educatoareSnap.exists()) {
                  router.push('/dashboard-educatoare');
                } else {
                  router.push(`/gradinite/${gradinitaId}/grupe/${grupaId}`);
                }
              } else {
                router.push(`/gradinite/${gradinitaId}/grupe/${grupaId}`);
              }
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Galerie */}
          <div className="bg-gradient-to-r from-blue-500 to-pink-500 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="flex items-center gap-4">
              <span className="text-6xl">{grupa?.emoji || '📸'}</span>
              <div>
                <h1 className="text-4xl font-bold mb-2">Galerie Foto</h1>
                <p className="text-white/90">{grupa?.nume}</p>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📤 Upload Poze Noi</h2>

            {/* Selectare Copii */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Selectează Copiii din Poză *
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllChildren}
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Selectează Toți
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={deselectAllChildren}
                    className="text-sm text-gray-600 hover:text-gray-700 font-semibold"
                  >
                    Deselectează Toți
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {children.map((child) => (
                  <button
                    key={child.cnp}
                    onClick={() => toggleChildSelection(child.cnp)}
                    className={`p-3 rounded-lg border-2 transition ${
                      selectedChildren.includes(child.cnp)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedChildren.includes(child.cnp)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedChildren.includes(child.cnp) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium">{child.nume}</span>
                    </div>
                  </button>
                ))}
              </div>
              {selectedChildren.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  ✅ {selectedChildren.length} {selectedChildren.length === 1 ? 'copil selectat' : 'copii selectați'}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Categorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selectează categorie</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descriere (opțional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Activitate desen, Plimbare în parc..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <label className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-pink-600 text-white font-bold rounded-lg cursor-pointer hover:from-blue-700 hover:to-pink-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Se încarcă...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Selectează Poze
                </>
              )}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>

            <p className="text-sm text-gray-500 mt-4 text-center">
              Poți selecta multiple poze. Vor fi comprimate automat la max 2MB.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">Filtre</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filtrează per Copil
                </label>
                <select
                  value={filterChild}
                  onChange={(e) => setFilterChild(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Toți copiii</option>
                  {children.map(child => (
                    <option key={child.cnp} value={child.cnp}>{child.nume}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filtrează per Categorie
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Toate categoriile</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {(filterChild || filterCategory) && (
              <button
                onClick={() => {
                  setFilterChild('');
                  setFilterCategory('');
                }}
                className="mt-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <X className="w-4 h-4" />
                Resetează Filtre
              </button>
            )}
          </div>

          {/* Photos Grid */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📚 Galerie ({filteredPhotos.length} {filteredPhotos.length === 1 ? 'poză' : 'poze'})
            </h2>

            {filteredPhotos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>
                  {photos.length === 0
                    ? 'Nu există poze încă. Uploadează prima poză!'
                    : 'Nu există poze cu filtrele selectate.'}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {sortedDates.map((dateKey) => {
                  const dayPhotos = photosByDate[dateKey];
                  return (
                    <div key={dateKey}>
                      {/* Header Zi */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg">
                          <Calendar className="w-5 h-5" />
                          <span className="font-bold">{dateKey}</span>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                        <span className="text-sm text-gray-500 font-semibold">
                          {dayPhotos.length} {dayPhotos.length === 1 ? 'poză' : 'poze'}
                        </span>
                      </div>

                      {/* Grid Poze */}
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {dayPhotos.map((photo) => {
                          const photoIndex = filteredPhotos.findIndex(p => p.id === photo.id);
                          return (
                            <div 
                              key={photo.id} 
                              className="cursor-pointer"
                              onClick={() => openLightbox(photo, photoIndex)}
                            >
                              <div className="relative group">
                                {/* Thumbnail */}
                                <img
                                  src={photo.url}
                                  alt={photo.description}
                                  className="w-full h-32 object-cover rounded-lg shadow-md hover:shadow-xl transition"
                                />
                                {/* Overlay hover */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                                  <ImageIcon className="w-8 h-8 text-white" />
                                </div>
                              </div>
                              {/* Info sub thumbnail */}
                              <div className="mt-2 px-1">
                                <p className="text-xs font-semibold text-gray-900 truncate">
                                  {photo.description || categories.find(c => c.value === photo.category)?.label || 'Fără titlu'}
                                </p>
                                {/* Copii în poză - preview */}
                                {photo.children && photo.children.length > 0 && (
                                  <p className="text-xs text-purple-600 mt-1 truncate">
                                    👥 {photo.children.length} {photo.children.length === 1 ? 'copil' : 'copii'}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Previous Button */}
          {selectedPhotoIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition z-10"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
          )}

          {/* Next Button */}
          {selectedPhotoIndex < filteredPhotos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition z-10"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          )}

          {/* Content */}
          <div 
            className="max-w-6xl w-full flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.description}
              className="max-h-[70vh] w-auto rounded-lg shadow-2xl"
            />

            {/* Info Card */}
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {/* Title/Description */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedPhoto.description || categories.find(c => c.value === selectedPhoto.category)?.label || 'Fără titlu'}
                  </h3>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {formatDate(selectedPhoto.uploadedAt)}
                    </span>
                  </div>

                  {/* Category & Children */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {categories.find(c => c.value === selectedPhoto.category)?.label || selectedPhoto.category}
                    </span>
                  </div>

                  {/* Children in photo */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Copii în poză:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPhoto.children.map(cnp => (
                        <span key={cnp} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {getChildName(cnp)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeLightbox();
                    handleDelete(selectedPhoto.id);
                  }}
                  className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Counter */}
              <div className="text-center text-gray-500 text-sm">
                Poză {selectedPhotoIndex + 1} din {filteredPhotos.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
