export interface Company {
  name: string;
  cui: string;
  registrationNumber: string;
  euid: string;
  address: string;
  representative: string;
  position: string;
  signatureUrl: string;
}

export interface Resident {
  id?: string;
  
  // Step 1: Firmă și Cămin
  companyCui: string;
  caminId: string;
  
  // Step 2: Date Beneficiar
  beneficiarNumeComplet: string;
  beneficiarCnp: string;
  beneficiarDataNasterii: string;
  beneficiarAdresa: string;
  beneficiarCodPostal?: string;
  beneficiarCiSerie: string;
  beneficiarCiNumar: string;
  beneficiarCiEliberatData: string;
  beneficiarCiEliberatDe: string;
  beneficiarCiValabilPana: string;
  
  // Step 3: Date Aparținător
  apartinatorNumeComplet: string;
  apartinatorCnp: string;
  apartinatorRelatie: string;
  apartinatorTelefon: string;
  apartinatorEmail: string;
  apartinatorAdresa: string;
  apartinatorCiSerie: string;
  apartinatorCiNumar: string;
  apartinatorCiEliberatData: string;
  apartinatorCiEliberatDe: string;
  apartinatorCiValabilPana: string;
  
  // Step 4: Date Contract
  costServiciu: number;
  contributieBeneficiar?: number;
  dataInceputContract: string;
  dataSfarsitContract?: string;
  durataNedeterminata: boolean;
  
  // Step 5: Date Medicale (opțional)
  provenienta?: string;
  provenientaDetalii?: string;
  diagnostic?: string;
  alergii?: string;
  alimentatie?: string;
  incontinenta?: string;
  mobilitate?: string;
  greutate?: number;
  comportament?: string;
  medicFamilieNume?: string;
  medicFamilieTelefon?: string;
  medicFamilieEmail?: string;
  tensiuneArteriala?: string;
  puls?: string;
  glicemie?: string;
  temperatura?: string;
  saturatieOxigen?: string;
  escare?: string;
  stareGenerala?: string;
  
  // Metadata
  dataInregistrare: number;
  contractGenerat: boolean;
  caleContractPdf?: string;
  numarDosar?: string;
  numarContract?: number;
}

// Constantele sunt acum în lib/constants.ts
