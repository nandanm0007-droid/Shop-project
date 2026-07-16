export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function successResponse<T>(
  data: T,
  message?: string,
  meta?: ApiResponse['meta']
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    meta,
  };
}

export function errorResponse(
  message: string,
  code: string = 'ERROR',
  details?: unknown,
  statusCode: number = 500
): ApiResponse<null> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): ApiResponse<T[]> {
  return successResponse(data, undefined, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}