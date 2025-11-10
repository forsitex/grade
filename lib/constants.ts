import { Company } from '@/types/resident';

export const COMPANIES: Company[] = [
  {
    name: "EMPATHY SUPPORT SRL",
    cui: "50780956",
    representative: "Matei Octavian",
    position: "Administrator",
    address: "Str. Fortunei nr 4, Domnești, România, 077090",
    registrationNumber: "J20240356660008",
    euid: "ROONRC.J20240356660008",
    signatureUrl: "/signatures/semnatura-octavian.png"
  },
  {
    name: 'MOBIVIRO SRL',
    cui: '47149140',
    representative: 'Ceapa Maria Raluca',
    position: 'Administrator',
    address: 'Adresa MOBIVIRO', // TODO: Adaugă adresa corectă
    registrationNumber: 'J40/22366/2022',
    euid: 'ROONRC.J40/22366/2022',
    signatureUrl: '/signatures/semnatura-raluca.png'
  }
];

export interface Camin {
  id: string;
  name: string;
  companyId: string; // CUI-ul firmei care gestionează
}

export const CAMINE: Camin[] = [
  {
    id: "fortunei",
    name: "Cămin Fortunei",
    companyId: "50780956" // EMPATHY SUPPORT SRL
  },
  {
    id: "cetinei",
    name: "Cămin Cetinei",
    companyId: "47149140" // MOBIVIRO SRL
  },
  {
    id: "clinceni",
    name: "Cămin Clinceni",
    companyId: "47149140" // MOBIVIRO SRL
  },
  {
    id: "orhideelor",
    name: "Cămin Orhideelor",
    companyId: "47149140" // MOBIVIRO SRL
  }
];

export const CONTACT_PHONE = "0786300500";

export const LOGO_PATH = "/logo-empathy.png"; // Logo local în public/
export const LOGO_URL = "/logo-empathy.png"; // Alias pentru compatibilitate

export const RELATII_APARTINATOR = [
  "Fiu",
  "Fiică",
  "Soț",
  "Soție",
  "Frate",
  "Soră",
  "Nepot",
  "Nepoată",
  "Altul"
];

export const MOBILITATE_OPTIONS = [
  "Independent",
  "Scaun rulant",
  "Imobilizat la pat",
  "Necesită asistență"
];

export const PROVENIENTA_OPTIONS = [
  "De acasă",
  "Din spital",
  "Din alt centru",
  "Altă variantă"
];

// Helper function: Obține firma pentru un cămin
export function getCompanyForCamin(caminId: string): Company | undefined {
  const camin = CAMINE.find(c => c.id === caminId);
  if (!camin) return undefined;
  
  return COMPANIES.find(company => company.cui === camin.companyId);
}

// Helper function: Obține căminele pentru o firmă
export function getCamineForCompany(companyCui: string): Camin[] {
  return CAMINE.filter(camin => camin.companyId === companyCui);
}
