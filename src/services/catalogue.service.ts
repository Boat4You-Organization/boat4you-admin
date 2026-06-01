import { api } from '@/config/axios.config';
import { SortDirection } from '@/config/constants.config';
import { ManufacturerModel } from '@/models/catalogue.model';
import { Equipment } from '@/models/equipment.model';
import { ExtrasModel } from '@/models/extras.model';
import { PaginatedResponse } from '@/types/response.type';
import { createQueryParamsWithPage } from '@/utils/static/queryParams';

export interface CalcExtraRow {
  name: string;
  key: string;
  priceEur: number | null;
  obligatory: boolean;
  unit: string | null;
}

export interface OfferPriceCalc {
  totalPriceEur: number;
  selectedExtrasInPrice: CalcExtraRow[];
  selectedExtrasAtBase: CalcExtraRow[];
}

export default class CatalogueService {
  // Re-quote a single offer against the partner with the broker's selected
  // extras (same public endpoint the customer boat page uses). NauSys recomputes
  // obligatory extras on the fly — e.g. a Damage Waiver becomes mandatory once a
  // Skipper is selected — so the Offers workspace can surface those in the client
  // offer exactly like the customer site does. Returns null on any failure so the
  // caller falls back to the statically-synced extras.
  public static async calculateOfferPrice(
    slug: string,
    offerId: number,
    selectedExtras: string[],
    currency?: string
  ): Promise<OfferPriceCalc | null> {
    try {
      const params = new URLSearchParams();

      selectedExtras.forEach(k => params.append('selectedExtras', k));

      if (currency) params.append('currency', currency);

      const url = `${import.meta.env.VITE_BOAT_API_URL}/public/yachts/${encodeURIComponent(
        slug
      )}/offer/${offerId}/calculate?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to calculate offer price: ${response.status}`);
      }

      return response.json();
    } catch {
      return null;
    }
  }

  public static async getManufacturers(name?: string): Promise<PaginatedResponse<ManufacturerModel>> {
    try {
      const queryParams = createQueryParamsWithPage({ name });
      const url = `${import.meta.env.VITE_BOAT_API_URL}/public/catalogue/manufacturers${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch manufacturers: ${response.status}`);
      }

      return response.json();
    } catch {
      return {
        content: [],
      };
    }
  }

  public static async getModels(manufacturerId: number, name?: string): Promise<PaginatedResponse<ManufacturerModel>> {
    try {
      const queryParams = createQueryParamsWithPage({ manufacturerId, name });
      const url = `${import.meta.env.VITE_BOAT_API_URL}/public/catalogue/models${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      return response.json();
    } catch {
      return {
        content: [],
      };
    }
  }

  public static async getAdminManufacturers(name?: string, id?: string): Promise<PaginatedResponse<ManufacturerModel>> {
    try {
      const queryParams = createQueryParamsWithPage({ name, id });
      const { data } = await api.get(`/admin/catalogue/manufacturers${queryParams}`);

      return data;
    } catch {
      return {
        content: [],
      };
    }
  }

  public static async getAdminModels(
    manufacturerId: number,
    name?: string,
    id?: string
  ): Promise<PaginatedResponse<ManufacturerModel>> {
    try {
      const queryParams = createQueryParamsWithPage({ manufacturerId, name, id });
      const { data } = await api.get(`/admin/catalogue/models${queryParams}`);

      return data;
    } catch {
      return {
        content: [],
      };
    }
  }

  public static async getEquipments(): Promise<PaginatedResponse<Equipment>> {
    try {
      const queryParams = createQueryParamsWithPage({ pageSize: 100 });
      const { data } = await api.get(`/admin/catalogue/amenities${queryParams}`);

      return data;
    } catch {
      return {
        content: [],
      };
    }
  }

  public static async getExtras(
    pageNumber?: number,
    name?: string,
    sortBy?: string,
    sortDirection?: SortDirection
  ): Promise<PaginatedResponse<ExtrasModel>> {
    try {
      const queryParams = createQueryParamsWithPage({ pageNumber, name, sortBy, sortDirection });
      const { data } = await api.get(`/admin/catalogue/extras${queryParams}`);

      return data;
    } catch {
      return {
        content: [],
      };
    }
  }
}
