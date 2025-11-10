'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, collectionGroup } from 'firebase/firestore';
import { Image as ImageIcon, Loader2, Download, Calendar, Tag } from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface Photo {
  id: string;
  url: string;
  description: string;
  category: string;
  fileName: string;
  uploadedAt: any;
}

export default function FamilyGalleryPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [residentName, setResidentName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('toate');
  const [error, setError] = useState('');

  const categories = [
    { value: 'toate', label: '📸 Toate' },
    { value: 'evenimente', label: '🎉 Evenimente' },
    { value: 'mese', label: '🍽️ Mese' },
    { value: 'activitati', label: '🏃 Activități' },
    { value: 'creativitate', label: '🎨 Creativitate' },
    { value: 'social', label: '👥 Social' },
    { value: 'altele', label: '📸 Altele' },
  ];

  useEffect(() => {
    loadGallery();
  }, [token]);

  const loadGallery = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Căutare acces pentru token:', token);
      console.log('🔍 Token length:', token.length);
      
      // Căutăm în toate companiile după token
      const companiesRef = collection(db, 'companies');
      const companiesSnap = await getDocs(companiesRef);
      
      console.log('📊 Găsit', companiesSnap.docs.length, 'companii');
      
      let foundAccess = false;
      let foundPhotos: Photo[] = [];
      let foundResidentName = '';
      
      // Iterăm prin fiecare companie
      for (const companyDoc of companiesSnap.docs) {
        const companyId = companyDoc.id;
        
        // Iterăm prin căminele companiei
        const camineRef = collection(db, 'companies', companyId, 'camine');
        const camineSnap = await getDocs(camineRef);
        
        for (const caminDoc of camineSnap.docs) {
          const caminId = caminDoc.id;
          
          // Iterăm prin rezidenții căminului
          const residentsRef = collection(db, 'companies', companyId, 'camine', caminId, 'residents');
          const residentsSnap = await getDocs(residentsRef);
          
          for (const residentDoc of residentsSnap.docs) {
            const residentCnp = residentDoc.id;
            
            // Verificăm dacă există familyAccess cu token-ul nostru
            const accessRef = collection(db, 'companies', companyId, 'camine', caminId, 'residents', residentCnp, 'familyAccess');
            const accessSnap = await getDocs(accessRef);
            
            for (const accessDoc of accessSnap.docs) {
              const accessData = accessDoc.data();
              
              console.log('🔑 Verificare token:', {
                dbToken: accessData.accessToken,
                urlToken: token,
                match: accessData.accessToken === token
              });
              
              if (accessData.accessToken === token) {
                // GĂSIT! Încărcăm galeria
                foundAccess = true;
                foundResidentName = accessData.residentName || residentDoc.data().numeComplet || 'Rezident';
                
                console.log('✅ Acces găsit pentru:', foundResidentName);
                
                // Încărcăm pozele
                const galleryRef = collection(db, 'companies', companyId, 'camine', caminId, 'residents', residentCnp, 'gallery');
                const galleryQuery = query(galleryRef, orderBy('uploadedAt', 'desc'));
                const gallerySnap = await getDocs(galleryQuery);
                
                foundPhotos = gallerySnap.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                })) as Photo[];
                
                break;
              }
            }
            
            if (foundAccess) break;
          }
          
          if (foundAccess) break;
        }
        
        if (foundAccess) break;
      }
      
      if (!foundAccess) {
        setError('Token invalid sau expirat. Vă rugăm contactați administratorul.');
        setLoading(false);
        return;
      }
      
      setResidentName(foundResidentName);
      setPhotos(foundPhotos);
      setLoading(false);
      
      console.log('📸 Încărcat', foundPhotos.length, 'poze');
      
    } catch (error: any) {
      console.error('❌ Error loading gallery:', error);
      setError('Eroare la încărcare galerie: ' + error.message);
      setLoading(false);
    }
  };

  const filteredPhotos = selectedCategory === 'toate' 
    ? photos 
    : photos.filter(p => p.category === selectedCategory);

  const downloadPhoto = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Eroare la download!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Se încarcă galeria...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl">
          <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Acces Temporar Indisponibil</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Această funcționalitate necesită configurare suplimentară pe server (Cloud Functions).
            Vă rugăm contactați administratorul.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            👨‍👩‍👧 Portal Familie
          </h1>
          <p className="text-xl text-gray-600">Galerie Foto - {residentName || 'Rezident'}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedCategory === cat.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Photos Grid */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              📚 Galerie ({filteredPhotos.length} {filteredPhotos.length === 1 ? 'poză' : 'poze'})
            </h2>
          </div>

          {filteredPhotos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Nu există poze în această categorie.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative group cursor-pointer"
                  onClick={() => {
                    setCurrentIndex(index);
                    setLightboxOpen(true);
                  }}
                >
                  <img
                    src={photo.url}
                    alt={photo.description}
                    className="w-full h-48 object-cover rounded-lg shadow-lg hover:shadow-2xl transition"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition rounded-lg flex flex-col justify-end p-3">
                    <p className="text-white text-sm font-semibold mb-1">
                      {photo.description || 'Fără descriere'}
                    </p>
                    <div className="flex items-center gap-2 text-white text-xs">
                      <Tag className="w-3 h-3" />
                      <span>{photo.category}</span>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPhoto(photo.url, photo.fileName);
                    }}
                    className="absolute top-2 right-2 p-2 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-white"
                  >
                    <Download className="w-4 h-4 text-gray-700" />
                  </button>

                  {/* Date */}
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {photo.uploadedAt?.toDate?.()?.toLocaleDateString('ro-RO') || 'Data necunoscută'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox */}
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={filteredPhotos.map(p => ({ src: p.url }))}
          index={currentIndex}
        />
      </div>
    </div>
  );
}
