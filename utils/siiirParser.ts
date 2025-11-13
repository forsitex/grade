import * as XLSX from 'xlsx';

interface CopilSIIIR {
  cnp: string;
  nume: string;
  prenume?: string;
  sex: string;
  dataNasterii: string;
  varsta: number;
  grupa: string;
  program: string;
  adresa: string;
  alergii: string;
  conditiiMedicale: string;
  fotoUrl: string;
  parinte1: {
    nume: string;
    cnp: string;
    relatie: string;
    telefon: string;
    email: string;
    adresa: string;
    ci: { serie: string; numar: string; };
  };
  contract: {
    dataInceput: string;
    durata: string;
    dataSfarsit: string;
    costLunar: number;
    tipAbonament: string;
    meseIncluse: boolean;
  };
  sursa: string;
  importedAt: Date;
  createdAt: number;
}

interface ParseResult {
  copii: CopilSIIIR[];
  grupeUnice: string[];
  errors: Array<{ row: number; message: string }>;
}

/**
 * Curăță și formatează nume (Title Case)
 */
function capitalizeWords(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convertește data din format SIIIR (DD.MM.YYYY) în ISO (YYYY-MM-DD)
 */
function convertDateToISO(dateStr: string): string {
  if (!dateStr || dateStr === 'N/A') return '';
  
  try {
    const [day, month, year] = dateStr.split('.');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch {
    return '';
  }
}

/**
 * Calculează vârsta din data nașterii
 */
function calculateAge(dataNasterii: string): number {
  if (!dataNasterii) return 0;
  
  try {
    const birthDate = new Date(dataNasterii);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch {
    return 0;
  }
}

/**
 * Validează CNP (13 cifre)
 */
function isValidCNP(cnp: string): boolean {
  if (!cnp) return false;
  const cnpStr = cnp.toString().trim();
  return cnpStr.length === 13 && /^\d+$/.test(cnpStr);
}

/**
 * Parse fișier Excel SIIIR
 * Header pe rândul 6 (index 5)
 */
export async function parseSIIIRExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Parse cu header pe rândul 6 (index 5)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: ''
        });
        
        // Rândul 6 (index 5) conține header-ele
        const headers = jsonData[5] as string[];
        const dataRows = jsonData.slice(6); // Date de la rândul 7
        
        const copii: CopilSIIIR[] = [];
        const errors: Array<{ row: number; message: string }> = [];
        const grupeSet = new Set<string>();
        
        dataRows.forEach((row: any, index) => {
          const rowIndex = index + 7; // Număr rând real în Excel
          
          // Skip rânduri goale
          if (!row || row.length === 0 || !row[2]) {
            return;
          }
          
          // Map coloane (bazat pe structura SIIIR)
          const cnp = row[2]?.toString().trim() || '';
          const nume = row[4]?.toString().trim() || '';
          const prenume = row[5]?.toString().trim() || '';
          const sex = row[7]?.toString().trim() || '';
          const dataNasterii = row[8]?.toString().trim() || '';
          const grupa = row[10]?.toString().trim() || '';
          
          // Validări
          if (!isValidCNP(cnp)) {
            errors.push({ 
              row: rowIndex, 
              message: `CNP invalid: ${cnp}` 
            });
            return;
          }
          
          if (!nume) {
            errors.push({ 
              row: rowIndex, 
              message: 'Nume lipsă' 
            });
            return;
          }
          
          if (!grupa) {
            errors.push({ 
              row: rowIndex, 
              message: 'Grupă lipsă' 
            });
            return;
          }
          
          // Adaugă copil valid cu structură COMPLETĂ
          const dataISO = convertDateToISO(dataNasterii);
          const numeComplet = `${capitalizeWords(nume)} ${capitalizeWords(prenume)}`.trim();
          
          copii.push({
            // Date de bază
            cnp,
            nume: numeComplet.toUpperCase(),
            prenume: capitalizeWords(prenume),
            sex: sex || 'Necunoscut',
            dataNasterii: dataISO,
            varsta: calculateAge(dataISO),
            grupa: grupa.trim(),
            
            // Date suplimentare (goale, se completează manual)
            program: 'full-time',
            adresa: '',
            alergii: '',
            conditiiMedicale: '',
            fotoUrl: '',
            
            // Părinte 1 (gol, se completează manual)
            parinte1: {
              nume: '',
              cnp: '',
              relatie: 'mama',
              telefon: '',
              email: '',
              adresa: '',
              ci: { serie: '', numar: '' }
            },
            
            // Contract (gol, se completează manual)
            contract: {
              dataInceput: new Date().toISOString().split('T')[0],
              durata: '12 luni',
              dataSfarsit: '',
              costLunar: 0,
              tipAbonament: 'lunar',
              meseIncluse: true
            },
            
            // Metadata
            sursa: 'SIIIR',
            importedAt: new Date(),
            createdAt: Date.now()
          });
          
          // Colectează grupe unice
          if (grupa) {
            grupeSet.add(grupa.trim());
          }
        });
        
        resolve({
          copii,
          grupeUnice: Array.from(grupeSet).sort(),
          errors
        });
        
      } catch (error: any) {
        reject(new Error(`Eroare parsare Excel: ${error?.message || 'Eroare necunoscută'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Eroare citire fișier'));
    };
    
    reader.readAsBinaryString(file);
  });
}
