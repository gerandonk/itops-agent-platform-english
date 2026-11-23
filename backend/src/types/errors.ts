export enum ErrorCode {
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  BUSINESS_ERROR = 'BUSINESS_ERROR'
}

export interface AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: Record<string, unknown>;
  isOperational?: boolean;
}

export function createAppError(
  code: ErrorCode,
  message: string,
  statusCode = 500,
  details?: Record<string, unknown>
): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  error.isOperational = true;
  return error;
}

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.SERVER_ERROR]: 'Internal server error, please try again later',
  [ErrorCode.VALIDATION_ERROR]: 'Request parameter validation failed',
  [ErrorCode.AUTH_ERROR]: 'Authentication failed, please log in again',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Login expired, please log in again',
  [ErrorCode.AUTH_TOKEN_INVALID]: 'Invalid authentication token',
  [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions to perform this action',
  [ErrorCode.NOT_FOUND]: 'Requested resource not found',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Specified resource not found',
  [ErrorCode.DUPLICATE_RESOURCE]: 'Resource already exists, please do not create duplicate',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Request rate too high, please try again later',
  [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service call failed',
  [ErrorCode.TIMEOUT_ERROR]: 'Request timeout, please try again later',
  [ErrorCode.INVALID_REQUEST]: 'Invalid request format',
  [ErrorCode.BUSINESS_ERROR]: 'Business processing failed'
};

export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.SERVER_ERROR;
}
