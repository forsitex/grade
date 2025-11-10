/**
 * @deprecated Folosește funcțiile din /lib/user-roles.ts în loc
 * 
 * Acest fișier este păstrat pentru backward compatibility.
 * Noile implementări ar trebui să folosească:
 * - getUserRole() - obține rolul și datele utilizatorului
 * - getOrganizationData() - obține organizationId și locationId
 * - hasRole() - verifică un rol specific
 * - hasAnyRole() - verifică multiple roluri
 */

import { getOrganizationData, hasRole } from './user-roles';

/**
 * @deprecated Folosește getOrganizationData() din user-roles.ts
 */
export async function getUserOrganizationData(gradinitaIdFromUrl?: string): Promise<{
  organizationId: string;
  locationId: string;
  isEducatoare: boolean;
} | null> {
  const data = await getOrganizationData(gradinitaIdFromUrl);
  if (!data) return null;

  return {
    organizationId: data.organizationId,
    locationId: data.locationId,
    isEducatoare: data.role === 'educatoare'
  };
}

/**
 * @deprecated Folosește hasRole('educatoare') din user-roles.ts
 */
export async function isEducatoare(): Promise<boolean> {
  return await hasRole('educatoare');
}
