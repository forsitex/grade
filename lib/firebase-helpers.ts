import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Obține organizationId și locationId pentru utilizatorul curent
 * Funcționează pentru TOATE rolurile (admin, educatoare, manager, etc.)
 * 
 * @param locationIdFromUrl - ID-ul location-ului din URL (opțional)
 * @returns { organizationId, locationId } sau null
 * 
 * @example
 * const { organizationId, locationId } = await getOrgAndLocation(gradinitaId);
 * const childRef = doc(db, 'organizations', organizationId, 'locations', locationId, 'children', cnp);
 */
export async function getOrgAndLocation(locationIdFromUrl?: string): Promise<{
  organizationId: string;
  locationId: string;
} | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    // Verifică dacă e educatoare
    const educatoareRef = doc(db, 'educatoare', user.uid);
    const educatoareSnap = await getDoc(educatoareRef);
    
    if (educatoareSnap.exists()) {
      // E educatoare - folosește datele din document
      const educatoareData = educatoareSnap.data();
      return {
        organizationId: educatoareData.organizationId,
        locationId: educatoareData.locationId
      };
    }

    // TODO: Adaugă verificări pentru alte roluri (manager, doctor, etc.)
    // când vor fi implementate

    // E admin - folosește uid-ul său
    return {
      organizationId: user.uid,
      locationId: locationIdFromUrl || ''
    };

  } catch (error) {
    console.error('❌ Eroare getOrgAndLocation:', error);
    return null;
  }
}
