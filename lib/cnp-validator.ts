/**
 * Validare CNP românesc și extragere dată naștere
 */

export function validateCNP(cnp: string): boolean {
  if (!cnp || cnp.length !== 13) return false;
  
  const cnpArray = cnp.split('').map(Number);
  const controlKey = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += cnpArray[i] * controlKey[i];
  }
  
  const controlDigit = sum % 11 === 10 ? 1 : sum % 11;
  
  return controlDigit === cnpArray[12];
}

export function extractBirthDateFromCNP(cnp: string): string | null {
  if (!validateCNP(cnp)) return null;
  
  const sex = parseInt(cnp[0]);
  let year = parseInt(cnp.substring(1, 3));
  const month = cnp.substring(3, 5);
  const day = cnp.substring(5, 7);
  
  // Determinare secol
  if (sex === 1 || sex === 2) {
    year += 1900;
  } else if (sex === 3 || sex === 4) {
    year += 1800;
  } else if (sex === 5 || sex === 6) {
    year += 2000;
  } else if (sex === 7 || sex === 8) {
    year += 1900; // Rezidenți străini
  } else {
    return null;
  }
  
  return `${day}.${month}.${year}`;
}

export function getSexFromCNP(cnp: string): 'M' | 'F' | null {
  if (!validateCNP(cnp)) return null;
  
  const sex = parseInt(cnp[0]);
  
  if ([1, 3, 5, 7].includes(sex)) return 'M';
  if ([2, 4, 6, 8].includes(sex)) return 'F';
  
  return null;
}

export function getAgeFromCNP(cnp: string): number | null {
  const birthDate = extractBirthDateFromCNP(cnp);
  if (!birthDate) return null;
  
  const [day, month, year] = birthDate.split('.').map(Number);
  const birth = new Date(year, month - 1, day);
  const today = new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}
