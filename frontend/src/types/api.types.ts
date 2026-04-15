export interface ApiMeta {
  timestamp: string;
  requestId: string;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data: T;
  error: ApiError | null;
  meta: ApiMeta;
}

export interface PaginationMeta extends ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  error: ApiError | null;
  meta: PaginationMeta;
}

export interface KitListParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  level?: string;
  sort?: 'newest' | 'oldest' | 'title';
}
