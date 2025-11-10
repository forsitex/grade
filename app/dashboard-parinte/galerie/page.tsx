'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ArrowLeft, Image as ImageIcon, Download, X, Loader2, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Photo {
  id: string;
  url: string;
  children: string[];
  category?: string;
  description?: string;
  uploadedAt: any;
  uploadedBy?: string;
}

export default function GalerieParintePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [copilNume, setCopilNume] = useState('');
  const [copilCnp, setCopilCnp] = useState('');
  const [activeCategory, setActiveCategory] = useState('toate');

  useEffect(() => {
    loadGalerie();
  }, []);

  useEffect(() => {
    filterPhotos();
  }, [photos, activeCategory]);

  const loadGalerie = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      // Citește datele părintelui
      const parinteRef = doc(db, 'parinti', user.uid);
      const parinteSnap = await getDoc(parinteRef);

      if (!parinteSnap.exists()) {
        router.push('/login');
        return;
      }

      const parinteData = parinteSnap.data();
      setCopilCnp(parinteData.copilCnp);
      setCopilNume(parinteData.copilNume);

      // Citește toate pozele din galeria locației
      const galleryRef = collection(
        db,
        'organizations',
        parinteData.organizationId,
        'locations',
        parinteData.locationId,
        'gallery'
      );

      const gallerySnap = await getDocs(galleryRef);
      const allPhotos = gallerySnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Photo[];

      // Filtrează doar pozele cu copilul
      const copilPhotos = allPhotos.filter(photo => 
        photo.children && photo.children.includes(parinteData.copilCnp)
      );

      // Sortează după dată (cele mai noi primele)
      copilPhotos.sort((a, b) => {
        const dateA = a.uploadedAt?.seconds || 0;
        const dateB = b.uploadedAt?.seconds || 0;
        return dateB - dateA;
      });

      setPhotos(copilPhotos);
    } catch (error) {
      console.error('Eroare încărcare galerie:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPhotos = () => {
    if (activeCategory === 'toate') {
      setFilteredPhotos(photos);
    } else {
      setFilteredPhotos(photos.filter(p => p.category === activeCategory));
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('ro-RO', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const categories = [
    { id: 'toate', label: 'Toate', icon: '📸' },
    { id: 'activitati', label: 'Activități', icon: '🎨' },
    { id: 'mese', label: 'Mese', icon: '🍽️' },
    { id: 'joaca', label: 'Joacă', icon: '🎮' },
    { id: 'evenimente', label: 'Evenimente', icon: '🎉' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Se încarcă galeria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
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
              <h1 className="text-2xl font-bold text-gray-900">📸 Galerie Foto</h1>
              <p className="text-sm text-gray-600">{copilNume}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Categorii */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeCategory === cat.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Statistici */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 mb-1">Total poze cu {copilNume}</p>
                <p className="text-4xl font-bold">{photos.length}</p>
              </div>
              <ImageIcon className="w-16 h-16 text-white/30" />
            </div>
          </div>

          {/* Grid Poze */}
          {filteredPhotos.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {activeCategory === 'toate' ? 'Nu există poze încă' : 'Nu există poze în această categorie'}
              </h3>
              <p className="text-gray-600">
                Educatoarea va uploada poze în curând
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map(photo => (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="relative aspect-square bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer group hover:shadow-2xl transition"
                >
                  <img
                    src={photo.url}
                    alt={photo.description || 'Poză'}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-sm font-medium truncate">
                        {photo.description || 'Fără descriere'}
                      </p>
                      <p className="text-white/80 text-xs flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(photo.uploadedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="max-w-4xl w-full">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.description || 'Poză'}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">
                    {selectedPhoto.description || 'Fără descriere'}
                  </p>
                  <p className="text-white/70 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedPhoto.uploadedAt)}
                  </p>
                  {selectedPhoto.uploadedBy && (
                    <p className="text-white/70 text-sm mt-1">
                      Uploadat de: {selectedPhoto.uploadedBy}
                    </p>
                  )}
                </div>
                <a
                  href={selectedPhoto.url}
                  download
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                  Descarcă
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
