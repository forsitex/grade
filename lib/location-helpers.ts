// Helper functions pentru gestionare dinamică locații bazat pe tipul de organizație

export type LocationType = 'camin' | 'gradinita' | 'spital' | 'hotel';

interface LocationConfig {
  singularName: string;
  pluralName: string;
  personSingular: string;
  personPlural: string;
  addPersonLabel: string;
  representantLabel: string;
  detailsPath: string;
  addPath: string;
  addPersonPath: string;
  icon: string;
}

const locationConfigs: Record<LocationType, LocationConfig> = {
  camin: {
    singularName: 'Cămin',
    pluralName: 'Cămine',
    personSingular: 'Rezident',
    personPlural: 'Rezidenți',
    addPersonLabel: 'Adaugă Rezident',
    representantLabel: 'Reprezentant Cămin',
    detailsPath: '/camine',
    addPath: '/camine/add',
    addPersonPath: '/residents/add',
    icon: '🏥'
  },
  gradinita: {
    singularName: 'Grădiniță',
    pluralName: 'Grădinițe',
    personSingular: 'Copil',
    personPlural: 'Copii',
    addPersonLabel: 'Adaugă Copil',
    representantLabel: 'Director/Manager Grădiniță',
    detailsPath: '/gradinite',
    addPath: '/gradinite/add',
    addPersonPath: '/children/add',
    icon: '🎨'
  },
  spital: {
    singularName: 'Clinică',
    pluralName: 'Clinici',
    personSingular: 'Pacient',
    personPlural: 'Pacienți',
    addPersonLabel: 'Adaugă Pacient',
    representantLabel: 'Manager Clinică',
    detailsPath: '/clinici',
    addPath: '/clinici/add',
    addPersonPath: '/patients/add',
    icon: '❤️'
  },
  hotel: {
    singularName: 'Hotel',
    pluralName: 'Hoteluri',
    personSingular: 'Rezervare',
    personPlural: 'Rezervări',
    addPersonLabel: 'Nouă Rezervare',
    representantLabel: 'Manager Hotel',
    detailsPath: '/hoteluri',
    addPath: '/hoteluri/add',
    addPersonPath: '/reservations/add',
    icon: '🏨'
  }
};

// Obține configurația pentru un tip de locație
export function getLocationConfig(type: LocationType): LocationConfig {
  return locationConfigs[type] || locationConfigs.camin;
}

// Obține URL-ul pentru detalii locație
export function getLocationDetailsUrl(type: LocationType, locationId: string): string {
  const config = getLocationConfig(type);
  return `${config.detailsPath}/${locationId}`;
}

// Obține URL-ul pentru adăugare locație
export function getAddLocationUrl(type: LocationType): string {
  const config = getLocationConfig(type);
  return config.addPath;
}

// Obține URL-ul pentru adăugare persoană (rezident/copil/pacient/rezervare)
export function getAddPersonUrl(type: LocationType, locationId: string): string {
  const config = getLocationConfig(type);
  return `${config.addPersonPath}?locationId=${locationId}`;
}

// Obține label-ul pentru butonul de adăugare persoană
export function getAddPersonLabel(type: LocationType): string {
  const config = getLocationConfig(type);
  return config.addPersonLabel;
}

// Obține numele singular al locației
export function getLocationSingularName(type: LocationType): string {
  const config = getLocationConfig(type);
  return config.singularName;
}

// Obține numele plural al locației
export function getLocationPluralName(type: LocationType): string {
  const config = getLocationConfig(type);
  return config.pluralName;
}

// Obține numele singular al persoanei (rezident/copil/pacient)
export function getPersonSingularName(type: LocationType): string {
  const config = getLocationConfig(type);
  return config.personSingular;
}

// Obține numele plural al persoanei (rezidenți/copii/pacienți)
export function getPersonPluralName(type: LocationType): string {
  const config = getLocationConfig(type);
  return config.personPlural;
}

// Obține label-ul pentru reprezentant
export function getRepresentantLabel(type: LocationType): string {
  const config = getLocationConfig(type);
  return config.representantLabel;
}

// Obține iconul pentru tipul de locație
export function getLocationIcon(type: LocationType): string {
  const config = getLocationConfig(type);
  return config.icon;
}
