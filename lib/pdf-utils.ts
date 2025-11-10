/**
 * PDF Utilities
 * 
 * Funcții helper pentru manipularea PDF-urilor:
 * - Conversie PDF → Base64
 * - Conversie PDF → Imagini
 * - Validare PDF
 */

/**
 * Convertește un fișier PDF în Base64 pentru a fi trimis către OpenAI
 */
export async function convertPdfToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const base64 = reader.result as string;
      // Elimină prefixul "data:application/pdf;base64,"
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    
    reader.onerror = () => {
      reject(new Error('Eroare la citirea fișierului PDF'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Convertește un Buffer PDF în Base64
 */
export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

/**
 * Validează că fișierul este un PDF valid
 */
export function validatePdfFile(file: File): { valid: boolean; error?: string } {
  // Verifică tipul MIME
  if (file.type !== 'application/pdf') {
    return {
      valid: false,
      error: 'Fișierul trebuie să fie de tip PDF'
    };
  }
  
  // Verifică dimensiunea (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Fișierul este prea mare. Dimensiunea maximă este 10MB'
    };
  }
  
  // Verifică că nu este gol
  if (file.size === 0) {
    return {
      valid: false,
      error: 'Fișierul este gol'
    };
  }
  
  return { valid: true };
}

/**
 * Extrage numele fișierului fără extensie
 */
export function getFileNameWithoutExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

/**
 * Generează un nume unic pentru fișier
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const nameWithoutExt = getFileNameWithoutExtension(originalName);
  return `${nameWithoutExt}-${timestamp}-${random}.pdf`;
}
