/**
 * Mappings coordonate pentru PDF-uri standard
 * Fiecare tip de document are coordonatele sale fixe
 */

export interface FieldMapping {
  label: string;
  x: number;
  y: number;
  page: number;
}

export interface PdfTemplate {
  matches: string[]; // Fraze unice pentru detectare
  fields: FieldMapping[];
}

export const PDF_MAPPINGS: Record<string, PdfTemplate> = {
  'cerere_admitere': {
    matches: ['CERERE', 'ADMITERE', 'Subsemnata', 'domiciliat'],
    fields: [
      { label: 'Subsemnata/ul', x: 130, y: 690, page: 1 },
      { label: 'domiciliat/ă în', x: 130, y: 670, page: 1 },
      { label: 'CNP', x: 130, y: 650, page: 1 },
      { label: 'posesoare a C.I. seria', x: 130, y: 630, page: 1 },
      { label: 'nr.', x: 300, y: 630, page: 1 },
      { label: 'eliberat la data de', x: 130, y: 610, page: 1 },
      { label: 'de către', x: 300, y: 610, page: 1 },
      { label: 'denumit/ă și beneficiar/ă', x: 130, y: 590, page: 1 },
      { label: 'DI/Dna', x: 130, y: 570, page: 1 },
      { label: 'domiciliat/ă în', x: 300, y: 570, page: 1 },
      { label: 'posesoare a C.I. seria', x: 130, y: 550, page: 1 },
      { label: 'în calitate de aparținator', x: 130, y: 530, page: 1 },
    ]
  },
  'contract_servicii': {
    matches: ['CONTRACT DE ACORDARE SERVICII SOCIALE'],
    fields: []
  }
};

// Funcție pentru detectare tip PDF după conținut
export function detectPdfType(pdfText: string): string | null {
  const normalizedText = pdfText.toUpperCase();
  
  for (const [key, template] of Object.entries(PDF_MAPPINGS)) {
    const hasMatch = template.matches.some(phrase => 
      normalizedText.includes(phrase.toUpperCase())
    );
    
    if (hasMatch) {
      return key;
    }
  }
  
  return null;
}
