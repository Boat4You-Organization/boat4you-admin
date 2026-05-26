// export interface ApiResponse<T = null> {
//   errors: Record<string, string[]>;
//   message: string;
//   payload: T;
//   status: number;
// }

export type PaginatedResponse<T> = {
  content: T[];
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
};

export type PaginatedEntitiesResponse<T> = {
  entities: T[];
  totalCount: number;
  pagination?: {
    pageNumber: number;
    pageSize: number;
  };
};

// export type PaginatedApiResponse<T> = ApiResponse<PaginatedResponse<T>>;

export type PayloadResponse<T> = {
  payload: T;
  message?: string;
};

export type LoginResponse = {
  token: string;
  refreshToken: string;
  userId: number;
};
