import { CountryCountModel } from '@/models/locations.model';

// /public/marinas?countryCode=X returns the LocationViewDto shape — same
// fields the regions/countries endpoints already use. We reuse
// CountryCountModel since {id,name,countryCode} are the only fields the
// autocomplete renderer cares about.
export default class LocationsService {
  public static async getCountires(): Promise<CountryCountModel[]> {
    try {
      const url = `${import.meta.env.VITE_BOAT_API_URL}/public/countries`;
      const response = await fetch(url);

      return await response.json();
    } catch {
      return [];
    }
  }

  public static async getMarinasByCountry(countryCode: string): Promise<CountryCountModel[]> {
    try {
      const url = `${import.meta.env.VITE_BOAT_API_URL}/public/marinas?countryCode=${encodeURIComponent(countryCode)}`;
      const response = await fetch(url);

      return await response.json();
    } catch {
      return [];
    }
  }
}
