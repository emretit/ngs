import { showError, showWarning } from "./toastUtils";
import { logger } from "./logger";

export type ErrorContext = {
  operation: string;
  userId?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
};

export class AppError extends Error {
  public readonly context: ErrorContext;
  public readonly code?: string;
  public readonly statusCode?: number;

  constructor(
    message: string,
    context: ErrorContext,
    code?: string,
    statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
    this.context = context;
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const handleError = (
  error: unknown,
  context: ErrorContext,
  showToast = true
): void => {
  let errorMessage = 'Beklenmeyen bir hata oluştu';
  let errorCode = 'UNKNOWN_ERROR';
  
  if (error instanceof AppError) {
    errorMessage = error.message;
    errorCode = error.code || 'APP_ERROR';
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorCode = 'GENERAL_ERROR';
  }

  // Log the error
  logger.error(`[${context.operation}] ${errorMessage}`, error, {
    context,
    errorCode,
    timestamp: new Date().toISOString()
  });

  // Show user-friendly toast notification
  if (showToast) {
    if (errorCode === 'NETWORK_ERROR' || errorCode === 'CONNECTION_ERROR') {
      showWarning('Bağlantı sorunu yaşanıyor. Lütfen tekrar deneyin.');
    } else {
      showError(errorMessage);
    }
  }
};

export const handleSuccess = (
  message: string,
  operation: string,
  data?: any
): void => {
  logger.info(`[${operation}] ${message}`, data);
};

export const wrapAsync = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: Partial<ErrorContext>
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      const result = await fn(...args);
      return result;
    } catch (error) {
      handleError(error, {
        operation: context.operation || 'unknown',
        ...context
      });
      return null;
    }
  };
};