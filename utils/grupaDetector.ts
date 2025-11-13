interface Grupa {
  id: string;
  nume: string;
  varsta: string;
  capacitate: number;
  educatori: string[];
  sala?: string;
  emoji?: string;
  sursa?: string;
}

/**
 * Detectează vârsta din numele grupei
 * Ex: "Grupa mare A" → "5-6 ani"
 */
export function detectVarstaFromNume(numeGrupa: string): string {
  const nume = numeGrupa.toLowerCase();
  
  if (nume.includes('mare')) return '5-6 ani';
  if (nume.includes('mijlocie')) return '4-5 ani';
  if (nume.includes('mică') || nume.includes('mica')) return '3-4 ani';
  if (nume.includes('creșă') || nume.includes('cresa')) return '1-3 ani';
  
  return '3-6 ani'; // Default
}

/**
 * Detectează emoji potrivit din numele grupei
 * Ex: "Grupa mare A" → "🎓"
 */
export function detectEmojiFromNume(numeGrupa: string): string {
  const nume = numeGrupa.toLowerCase();
  
  if (nume.includes('mare')) return '🎓';
  if (nume.includes('mijlocie')) return '📚';
  if (nume.includes('mică') || nume.includes('mica')) return '🧸';
  if (nume.includes('creșă') || nume.includes('cresa')) return '👶';
  
  // Detectare după literă (A, B, C, D)
  if (nume.includes(' a')) return '🎨';
  if (nume.includes(' b')) return '🌟';
  if (nume.includes(' c')) return '🌈';
  if (nume.includes(' d')) return '🦋';
  
  return '🎨'; // Default
}

/**
 * Creează obiect Grupa din nume SIIIR
 */
export function createGrupaFromSIIIR(numeGrupa: string): Grupa {
  return {
    id: `grupa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    nume: numeGrupa.trim(),
    varsta: detectVarstaFromNume(numeGrupa),
    capacitate: 25,
    educatori: [],
    sala: '',
    emoji: detectEmojiFromNume(numeGrupa),
    sursa: 'SIIIR'
  };
}

/**
 * Extrage grupe unice din lista de copii SIIIR
 */
export function extractGrupeUnice(copii: any[]): string[] {
  const grupeSet = new Set<string>();
  
  copii.forEach(copil => {
    if (copil.grupa && copil.grupa.trim()) {
      grupeSet.add(copil.grupa.trim());
    }
  });
  
  return Array.from(grupeSet).sort();
}

/**
 * Verifică ce grupe trebuie create (nu există deja)
 */
export function getGrupeLipsa(
  grupeFromSIIIR: string[],
  grupeExistente: Grupa[]
): string[] {
  const numeGrupeExistente = grupeExistente.map(g => g.nume);
  return grupeFromSIIIR.filter(g => !numeGrupeExistente.includes(g));
}

/**
 * Creează array de grupe noi din nume SIIIR
 */
export function createGrupeFromSIIIR(numeGrupe: string[]): Grupa[] {
  return numeGrupe.map(nume => createGrupaFromSIIIR(nume));
}
