/**
 * Type Definitions pentru Template-uri Custom
 */

/**
 * Tipul de organizație
 */
export type OrganizationType = 'camin' | 'gradinita' | 'spital' | 'hotel';

/**
 * Câmp detectat în contract
 */
export interface ContractField {
  /** Identificator unic (ex: "nume_beneficiar") */
  name: string;
  
  /** Label-ul din contract (ex: "Nume beneficiar:") */
  label: string;
  
  /** Numărul paginii (1-indexed) */
  page: number;
  
  /** Poziție aproximativă în pagină */
  approximatePosition?: string;
  
  /** Coordonate exacte (dacă sunt disponibile) */
  coordinates?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  
  /** Tipul de date așteptat */
  dataType?: 'text' | 'number' | 'date' | 'phone' | 'email' | 'cnp';
  
  /** Dacă câmpul este obligatoriu */
  required?: boolean;
}

/**
 * Răspunsul de la OpenAI pentru analiză contract
 */
export interface ContractAnalysisResponse {
  /** Lista câmpurilor detectate */
  fields: ContractField[];
  
  /** Numărul total de pagini */
  totalPages?: number;
  
  /** Încrederea în detecție (0-1) */
  confidence?: number;
  
  /** Observații sau avertismente */
  notes?: string[];
}

/**
 * Template salvat în Firebase
 */
export interface ContractTemplate {
  /** ID-ul template-ului */
  id: string;
  
  /** Numele template-ului */
  name: string;
  
  /** Tipul de organizație */
  type: OrganizationType;
  
  /** URL-ul PDF-ului template în Firebase Storage */
  pdfUrl: string;
  
  /** Mapping-ul câmpurilor */
  fieldMapping: ContractField[];
  
  /** Dacă template-ul este activ */
  isActive: boolean;
  
  /** Data creării */
  createdAt: number;
  
  /** Data ultimei modificări */
  updatedAt?: number;
  
  /** ID-ul utilizatorului care a creat template-ul */
  userId: string;
  
  /** Metadata adițională */
  metadata?: {
    /** Număr de documente generate cu acest template */
    documentsGenerated?: number;
    
    /** Ultima dată când a fost folosit */
    lastUsed?: number;
    
    /** Versiunea template-ului */
    version?: number;
  };
}

/**
 * Request pentru analiză contract
 */
export interface AnalyzeContractRequest {
  /** PDF-ul în format Base64 */
  pdfBase64: string;
  
  /** Tipul de organizație */
  organizationType: OrganizationType;
  
  /** Numele template-ului (opțional) */
  templateName?: string;
}

/**
 * Request pentru generare contract completat
 */
export interface GenerateContractRequest {
  /** ID-ul template-ului */
  templateId: string;
  
  /** Datele entității (rezident/copil/pacient/rezervare) */
  entityData: Record<string, any>;
  
  /** ID-ul utilizatorului */
  userId: string;
  
  /** ID-ul locației (opțional) */
  locationId?: string;
}

/**
 * Răspuns pentru generare contract
 */
export interface GenerateContractResponse {
  /** URL-ul PDF-ului generat */
  pdfUrl: string;
  
  /** Numele fișierului */
  fileName: string;
  
  /** Dimensiunea fișierului în bytes */
  fileSize: number;
  
  /** Numărul de câmpuri completate */
  fieldsCompleted: number;
  
  /** Câmpuri care nu au putut fi completate */
  missingFields?: string[];
}

/**
 * Prompt-uri predefinite per tip de organizație
 */
export const ANALYSIS_PROMPTS: Record<OrganizationType, string> = {
  camin: `Analizează acest contract de internare în cămin pentru bătrâni și identifică următoarele câmpuri:
- Nume complet beneficiar/rezident
- CNP beneficiar
- Data nașterii
- Adresa completă
- Telefon beneficiar
- Nume aparținător/reprezentant legal
- Telefon aparținător
- Email aparținător (dacă există)
- Data semnării contractului
- Număr contract (dacă există)

Pentru fiecare câmp, returnează:
- name: identificator unic (ex: "nume_beneficiar")
- label: textul exact din contract (ex: "Nume beneficiar:")
- page: numărul paginii (1-indexed)
- approximatePosition: descriere poziție (ex: "top-left", "center", "bottom-right")
- dataType: tipul de date (text/number/date/phone/email/cnp)`,

  gradinita: `Analizează acest contract de înscriere în grădiniță și identifică următoarele câmpuri:
- Nume complet copil
- CNP copil
- Data nașterii
- Grupa
- Nume părinte 1 (mamă/tată)
- Telefon părinte 1
- Email părinte 1
- Nume părinte 2 (mamă/tată)
- Telefon părinte 2
- Email părinte 2
- Alergii/Restricții alimentare (dacă există)
- Observații medicale (dacă există)
- Data semnării contractului

Pentru fiecare câmp, returnează:
- name: identificator unic (ex: "nume_copil")
- label: textul exact din contract
- page: numărul paginii
- approximatePosition: descriere poziție
- dataType: tipul de date`,

  spital: `Analizează această fișă pacient/contract spital și identifică următoarele câmpuri:
- Nume complet pacient
- CNP pacient
- Data nașterii
- Adresa
- Telefon pacient
- Diagnostic principal
- Medic curant
- Secție/Salon
- Data internării
- Contact urgență (nume)
- Telefon contact urgență
- Asigurare medicală (dacă există)

Pentru fiecare câmp, returnează:
- name: identificator unic (ex: "nume_pacient")
- label: textul exact din document
- page: numărul paginii
- approximatePosition: descriere poziție
- dataType: tipul de date`,

  hotel: `Analizează această confirmare de rezervare hotel și identifică următoarele câmpuri:
- Nume client
- Telefon client
- Email client
- Data check-in
- Data check-out
- Număr cameră
- Tip cameră (single/double/suite/etc)
- Număr persoane
- Preț total
- Servicii adiționale (dacă există)
- Număr rezervare/confirmare

Pentru fiecare câmp, returnează:
- name: identificator unic (ex: "nume_client")
- label: textul exact din document
- page: numărul paginii
- approximatePosition: descriere poziție
- dataType: tipul de date`,
};
