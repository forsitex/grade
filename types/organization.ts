/**
 * Type Definitions pentru Organizații
 */

export type OrganizationType = 'camin' | 'gradinita' | 'spital' | 'hotel';

export interface Organization {
  /** ID-ul organizației (Firebase UID) */
  id?: string;
  
  /** Nume firmă */
  name: string;
  
  /** Email firmă */
  email: string;
  
  /** CUI (Cod Unic de Înregistrare) */
  cui: string;
  
  /** Număr Registru Comerț (ex: J40/22366/2022) */
  nrRegistruComert: string;
  
  /** Adresa sediului firmei */
  adresaSediu: string;
  
  /** Telefon firmă */
  telefonFirma: string;
  
  /** Tipul de organizație */
  type: OrganizationType;
  
  /** Data creării */
  createdAt: any; // Timestamp
  
  /** Setări organizație */
  settings: {
    aiEnabled: boolean;
    subscription: 'standard' | 'premium' | 'gold';
    features: string[];
  };
  
  /** Data ultimei modificări */
  updatedAt?: any; // Timestamp
}

export interface Location {
  /** ID-ul locației */
  id?: string;
  
  /** Nume locație (cămin/grădiniță/spital/hotel) */
  name: string;
  
  /** Adresă locație */
  address: string;
  
  /** Telefon locație */
  phone: string;
  
  /** Email locație */
  email: string;
  
  /** Capacitate (număr persoane/copii/paturi/camere) */
  capacity: number;
  
  /** Reprezentant locație */
  reprezentant?: {
    name: string;
    phone: string;
    email: string;
  };
  
  /** Data creării */
  createdAt: any; // Timestamp
  
  /** Grupe (doar pentru grădinițe) */
  grupe?: Array<{
    id: string;
    nume: string;
    varsta: string;
    capacitate: number;
    educatori: string[];
    sala: string;
    emoji: string;
  }>;
}
