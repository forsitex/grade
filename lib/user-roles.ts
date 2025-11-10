import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Tipuri de roluri disponibile în sistem
 */
export type UserRole = 
  | 'admin'           // Owner firmă (cel care s-a înregistrat)
  | 'educatoare'      // Educatoare grădiniță
  | 'manager-camin'   // Manager cămin bătrâni
  | 'manager-clinica' // Manager clinică/spital
  | 'doctor'          // Doctor în clinică
  | 'asistent'        // Asistent medical
  | 'infirmiera'      // Infirmieră cămin
  | 'ingrijitor'      // Îngrijitor cămin
  | 'receptioner'     // Recepționer hotel
  | 'pacient'         // Pacient spital
  | 'familie';        // Membru familie (acces limitat)

/**
 * Date utilizator cu rol
 */
export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  organizationId: string;
  locationId?: string;      // ID-ul căminului/grădiniței/clinicii
  grupaId?: string;         // Pentru educatoare
  departmentId?: string;    // Pentru doctor/asistent
  permissions: string[];    // Lista de permisiuni
}

/**
 * Configurație dashboard per rol
 */
export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  'admin': '/dashboard',
  'educatoare': '/dashboard-educatoare',
  'manager-camin': '/dashboard-manager-camin',
  'manager-clinica': '/dashboard-manager-clinica',
  'doctor': '/dashboard-doctor',
  'asistent': '/dashboard-asistent',
  'infirmiera': '/dashboard-staff',
  'ingrijitor': '/dashboard-staff',
  'receptioner': '/dashboard-receptioner',
  'pacient': '/dashboard-pacient',
  'familie': '/dashboard-familie'
};

/**
 * Colecții Firebase per rol
 */
const ROLE_COLLECTIONS: Record<UserRole, string> = {
  'admin': 'organizations',      // Admin = organizationId = uid
  'educatoare': 'educatoare',
  'manager-camin': 'managers',
  'manager-clinica': 'managers',
  'doctor': 'doctors',
  'asistent': 'staff',
  'infirmiera': 'staff',
  'ingrijitor': 'staff',
  'receptioner': 'staff',
  'pacient': 'patients',
  'familie': 'family'
};

/**
 * Obține rolul și datele utilizatorului curent
 * 
 * @returns UserData sau null dacă nu e autentificat
 * 
 * @example
 * const userData = await getUserRole();
 * if (userData?.role === 'admin') {
 *   // logică admin
 * }
 */
export async function getUserRole(): Promise<UserData | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    // Verifică fiecare rol în ordine (de la cel mai specific la cel mai general)
    const rolesToCheck: UserRole[] = [
      'educatoare',
      'manager-camin',
      'manager-clinica',
      'doctor',
      'asistent',
      'infirmiera',
      'ingrijitor',
      'receptioner',
      'pacient',
      'familie'
    ];

    for (const role of rolesToCheck) {
      const collectionName = ROLE_COLLECTIONS[role];
      const userRef = doc(db, collectionName, user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          uid: user.uid,
          email: user.email || '',
          role: role,
          organizationId: data.organizationId || user.uid,
          locationId: data.locationId,
          grupaId: data.grupaId,
          departmentId: data.departmentId,
          permissions: data.permissions || []
        };
      }
    }

    // Dacă nu e găsit în nicio colecție, e admin (owner-ul firmei)
    return {
      uid: user.uid,
      email: user.email || '',
      role: 'admin',
      organizationId: user.uid,
      permissions: ['all'] // Admin are toate permisiunile
    };

  } catch (error) {
    console.error('❌ Eroare getUserRole:', error);
    return null;
  }
}

/**
 * Obține dashboard-ul corect pentru rolul utilizatorului
 * 
 * @returns URL dashboard sau null
 * 
 * @example
 * const dashboard = await getUserDashboard();
 * router.push(dashboard); // Redirect la dashboard-ul corect
 */
export async function getUserDashboard(): Promise<string | null> {
  const userData = await getUserRole();
  if (!userData) return null;

  return ROLE_DASHBOARDS[userData.role];
}

/**
 * Verifică dacă utilizatorul are un anumit rol
 * 
 * @param role - Rolul de verificat
 * @returns true dacă utilizatorul are rolul specificat
 * 
 * @example
 * if (await hasRole('admin')) {
 *   // Afișează opțiuni admin
 * }
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const userData = await getUserRole();
  return userData?.role === role;
}

/**
 * Verifică dacă utilizatorul are una din rolurile specificate
 * 
 * @param roles - Array de roluri
 * @returns true dacă utilizatorul are unul din roluri
 * 
 * @example
 * if (await hasAnyRole(['admin', 'manager-camin'])) {
 *   // Afișează opțiuni management
 * }
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const userData = await getUserRole();
  return userData ? roles.includes(userData.role) : false;
}

/**
 * Obține organizationId și locationId pentru utilizatorul curent
 * Funcționează pentru TOATE rolurile
 * 
 * @param locationIdFromUrl - ID-ul location-ului din URL (opțional)
 * @returns Datele organizației sau null
 * 
 * @example
 * const orgData = await getOrganizationData(gradinitaId);
 * // Pentru admin: organizationId = uid, locationId = gradinitaId
 * // Pentru educatoare: organizationId = owner uid, locationId = grădinița ei
 */
export async function getOrganizationData(locationIdFromUrl?: string): Promise<{
  organizationId: string;
  locationId: string;
  role: UserRole;
} | null> {
  const userData = await getUserRole();
  if (!userData) return null;

  return {
    organizationId: userData.organizationId,
    locationId: userData.locationId || locationIdFromUrl || '',
    role: userData.role
  };
}

/**
 * Verifică dacă utilizatorul are permisiune pentru o acțiune
 * 
 * @param permission - Permisiunea de verificat
 * @returns true dacă utilizatorul are permisiunea
 * 
 * @example
 * if (await hasPermission('delete_children')) {
 *   // Afișează buton ștergere
 * }
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const userData = await getUserRole();
  if (!userData) return false;

  // Admin are toate permisiunile
  if (userData.role === 'admin') return true;

  return userData.permissions.includes(permission);
}
