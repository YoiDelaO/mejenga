import countriesData from '../../data/countriesData.json';

export interface Country { id: string; name: string; }
export interface Region { id: string; countryId: string; name: string; }
export interface Locality { id: string; regionId: string; name: string; }

// Generadores dinámicos deterministas para simular base de datos mundial
const generateRegionsForCountry = (countryId: string, countryName: string): Region[] => {
  const count = (countryId.charCodeAt(0) + (countryId.charCodeAt(1) || 0)) % 10 + 5; // 5 a 14 regiones
  return Array.from({ length: count }).map((_, i) => ({
    id: `${countryId}-r${i + 1}`,
    countryId,
    name: `Provincia/Estado ${i + 1} de ${countryName}`
  }));
};

const generateLocalitiesForRegion = (regionId: string, regionName: string): Locality[] => {
  const count = (regionId.charCodeAt(regionId.length - 1)) % 15 + 10; // 10 a 24 localidades
  return Array.from({ length: count }).map((_, i) => ({
    id: `${regionId}-l${i + 1}`,
    regionId,
    name: `Ciudad/Localidad ${i + 1} (${regionId})`
  }));
};

class LocationServiceAPI {
  // Simula latencia de red para demostrar carga dinámica
  private async delay(ms = 400) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getCountries(): Promise<Country[]> {
    await this.delay();
    return countriesData as Country[];
  }

  async getCountryById(id: string): Promise<Country | undefined> {
    const countries = countriesData as Country[];
    return countries.find(c => c.id === id);
  }

  async getRegions(countryId: string): Promise<Region[]> {
    await this.delay();
    const country = await this.getCountryById(countryId);
    if (!country) return [];
    // Aquí en el futuro se llamaría a GET /api/countries/:id/regions
    return generateRegionsForCountry(country.id, country.name);
  }

  async getRegionById(countryId: string, regionId: string): Promise<Region | undefined> {
    const regions = await this.getRegions(countryId);
    return regions.find(r => r.id === regionId);
  }

  async getLocalities(regionId: string): Promise<Locality[]> {
    await this.delay();
    // Aquí en el futuro se llamaría a GET /api/regions/:id/localities
    return generateLocalitiesForRegion(regionId, regionId);
  }

  async getLocalityById(regionId: string, localityId: string): Promise<Locality | undefined> {
    const localities = await this.getLocalities(regionId);
    return localities.find(l => l.id === localityId);
  }
}

export const LocationService = new LocationServiceAPI();
