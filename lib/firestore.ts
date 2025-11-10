import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Resident } from '@/types/resident';

// ============================================
// COMPANY FUNCTIONS
// ============================================

export async function createCompany(userId: string, companyName: string, email: string) {
  try {
    const companyRef = doc(db, 'companies', userId);
    
    await setDoc(companyRef, {
      name: companyName,
      email: email,
      createdAt: serverTimestamp(),
      ownerId: userId,
      camine: [],
      representatives: []
    });
    
    console.log('✅ Companie creată:', companyName);
    return userId;
  } catch (error) {
    console.error('❌ Error creating company:', error);
    throw error;
  }
}

// ============================================
// RESIDENT FUNCTIONS
// ============================================

// Salvare rezident în Firestore
export async function saveResident(resident: Resident): Promise<string> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('💾 SALVARE REZIDENT - START');
    console.log('👤 User ID:', user.uid);
    console.log('🏠 Cămin ID:', resident.caminId);
    console.log('📋 CNP:', resident.beneficiarCnp);

    // Încearcă să salveze în structura nouă (organizations/locations/residents)
    let savedSuccessfully = false;
    
    try {
      const path = `organizations/${user.uid}/locations/${resident.caminId}/residents/${resident.beneficiarCnp}`;
      console.log('📍 Încercare salvare în structura nouă:', path);
      const residentRef = doc(db, 'organizations', user.uid, 'locations', resident.caminId, 'residents', resident.beneficiarCnp);
      
      await setDoc(residentRef, {
        ...resident,
        dataInregistrare: Date.now()
      });
      
      console.log('✅ Salvare reușită în structura nouă!');
      savedSuccessfully = true;
    } catch (orgError) {
      console.log('⚠️ Salvare în structura nouă eșuată:', orgError);
      console.log('🔄 Încerc structura veche...');
    }

    // Dacă nu reușește, încearcă structura veche (companies/camine/residents)
    if (!savedSuccessfully) {
      const path = `companies/${user.uid}/camine/${resident.caminId}/residents/${resident.beneficiarCnp}`;
      console.log('📍 Încercare salvare în structura veche:', path);
      const residentRef = doc(db, 'companies', user.uid, 'camine', resident.caminId, 'residents', resident.beneficiarCnp);
      
      await setDoc(residentRef, {
        ...resident,
        dataInregistrare: Date.now()
      });
      
      console.log('✅ Salvare reușită în structura veche!');
      console.log('📍 PATH FINAL:', path);
    }
    
    return resident.beneficiarCnp;
  } catch (error) {
    console.error('❌ Error saving resident:', error);
    throw error;
  }
}

// Actualizare rezident
export async function updateResident(cnp: string, caminId: string, data: Partial<Resident>): Promise<void> {
  try {
    const residentRef = doc(db, 'iEmpathy', caminId, 'residents', cnp);
    await updateDoc(residentRef, data);
  } catch (error) {
    console.error('Error updating resident:', error);
    throw error;
  }
}

// Obținere rezident după CNP
export async function getResidentByCnp(cnp: string, caminId: string): Promise<Resident | null> {
  try {
    const residentRef = doc(db, 'iEmpathy', caminId, 'residents', cnp);
    const residentSnap = await getDoc(residentRef);
    
    if (residentSnap.exists()) {
      return residentSnap.data() as Resident;
    }
    return null;
  } catch (error) {
    console.error('Error getting resident:', error);
    throw error;
  }
}

// Obținere toți rezidenții dintr-un cămin
export async function getResidentsByCamin(caminId: string): Promise<Resident[]> {
  try {
    const residentsRef = collection(db, 'iEmpathy', caminId, 'residents');
    const residentsSnap = await getDocs(residentsRef);
    
    return residentsSnap.docs.map(doc => doc.data() as Resident);
  } catch (error) {
    console.error('Error getting residents:', error);
    throw error;
  }
}

// Ștergere rezident
export async function deleteResident(cnp: string, caminId: string): Promise<void> {
  try {
    const residentRef = doc(db, 'iEmpathy', caminId, 'residents', cnp);
    await deleteDoc(residentRef);
  } catch (error) {
    console.error('Error deleting resident:', error);
    throw error;
  }
}

// Generare număr dosar unic
export function generateNumarDosar(): string {
  const prefix = 'EM';
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}${timestamp}`;
}

// Generare număr contract
export async function generateNumarContract(caminId: string): Promise<number> {
  try {
    const residentsRef = collection(db, 'iEmpathy', caminId, 'residents');
    const residentsSnap = await getDocs(residentsRef);
    
    return residentsSnap.size + 1;
  } catch (error) {
    console.error('Error generating contract number:', error);
    return 1;
  }
}
