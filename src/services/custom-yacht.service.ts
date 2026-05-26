import dayjs from 'dayjs';

import { api } from '@/config/axios.config';
import { SortDirection } from '@/config/constants.config';
import { CustomYachtFormValues, UpdateCustomYachtRequest } from '@/config/forms/form-models.config';
import { CustomYachtModel, CustomYachtModelShortInfo } from '@/models/custom-yacht.model';
import { ErrorModel } from '@/models/error.model';
import { PaginatedResponse, PayloadResponse } from '@/types/response.type';
import DateTime from '@/utils/static/DateTime';
import { createQueryParamsWithPage } from '@/utils/static/queryParams';

export interface CustomYachtImageResponse {
  id: number;
}

export interface BrochureResult {
  success: boolean;
  url?: string;
  error?: string;
}

export default class CustomYachtService {
  public static async getCustomYachts(
    pageNumber?: number,
    name?: string,
    sortBy?: string,
    sortDirection?: SortDirection
  ): Promise<PaginatedResponse<CustomYachtModelShortInfo>> {
    try {
      const queryParams = createQueryParamsWithPage({
        pageNumber,
        name,
        sortBy,
        sortDirection,
      });
      const { data } = await api.get(`/admin/custom-yachts${queryParams}`);

      return data;
    } catch {
      return { content: [] };
    }
  }

  public static async getCustomYacht(id: number): Promise<CustomYachtModel | null> {
    try {
      const { data } = await api.get(`/admin/custom-yachts/${id}`);

      return data || null;
    } catch {
      return null;
    }
  }

  public static async getBrochure(slug: string): Promise<BrochureResult> {
    try {
      const url = `${import.meta.env.VITE_BOAT_API_URL}/public/yachts/${slug}/brochure`;
      const response = await fetch(url);

      if (!response.ok) {
        return { success: false, error: `HTTP error! status: ${response.status}` };
      }

      return { success: true, url: response.url };
    } catch {
      return { success: false, error: 'Unknown error' };
    }
  }

  public static async createCustomYacht(formValues: CustomYachtFormValues): Promise<PayloadResponse<null>> {
    try {
      const formData = new FormData();

      const customYachtRequest = {
        ...formValues.customYachtRequest,
        defaultCheckin: formValues.customYachtRequest.defaultCheckin
          ? DateTime.formatTime(dayjs(formValues.customYachtRequest.defaultCheckin))
          : '',
        defaultCheckout: formValues.customYachtRequest.defaultCheckout
          ? DateTime.formatTime(dayjs(formValues.customYachtRequest.defaultCheckout))
          : '',
      };

      const jsonBlob = new Blob([JSON.stringify(customYachtRequest)], {
        type: 'application/json',
      });

      formData.append('customYachtRequest', jsonBlob, 'custom_boat_request.json');

      if (formValues.mainImage instanceof File) {
        formData.append('mainImage', formValues.mainImage);
      }

      if (formValues.pdf instanceof File) {
        formData.append('pdf', formValues.pdf);
      }

      if (formValues.images && formValues.images.length > 0) {
        formValues.images.forEach((image, index) => {
          if (image instanceof File) {
            formData.append('images', image, `image_${index}.${image.name.split('.').pop()}`);
          }
        });
      }

      const { data } = await api.post('/admin/custom-yachts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return { payload: data };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: null, message };
    }
  }

  public static async updateCustomYacht(
    id: number,
    payload: UpdateCustomYachtRequest
  ): Promise<PayloadResponse<boolean>> {
    try {
      await api.put(`/admin/custom-yachts/${id}`, { id, ...payload });

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async deleteCustomYacht(id: number): Promise<PayloadResponse<boolean>> {
    try {
      await api.delete(`/admin/custom-yachts/${id}`);

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async uploadCustomYachtMainImage(
    id: number,
    mainImage: File
  ): Promise<PayloadResponse<number | boolean>> {
    try {
      const formData = new FormData();

      if (mainImage instanceof File) {
        formData.append('mainImage', mainImage);
      }

      const { data } = await api.post<CustomYachtImageResponse>(`/admin/custom-yachts/${id}/main-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return { payload: data.id };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async uploadCustomYachtPDFFile(id: number, pdfFile: File): Promise<PayloadResponse<boolean>> {
    try {
      const formData = new FormData();

      if (pdfFile instanceof File) {
        formData.append('pdfFile', pdfFile);
      }

      await api.post(`/admin/custom-yachts/${id}/pdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async uploadCustomYachtUploadImages(
    id: number,
    images: File[]
  ): Promise<PayloadResponse<number[] | boolean>> {
    try {
      const formData = new FormData();

      if (images && images.length > 0) {
        images.forEach((image, index) => {
          if (image instanceof File) {
            formData.append('images', image, `image_${index}.${image.name.split('.').pop()}`);
          }
        });
      }

      const { data } = await api.post<CustomYachtImageResponse[]>(`/admin/custom-yachts/${id}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return { payload: data.map(image => image.id) };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async deleteCustomYachtImage(id: number, imageId: string): Promise<PayloadResponse<boolean>> {
    try {
      await api.delete(`/admin/custom-yachts/${id}/images/${imageId}`);

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async deleteCustomPDF(id: number): Promise<PayloadResponse<boolean>> {
    try {
      await api.delete(`/admin/custom-yachts/${id}/pdf`);

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }
}
