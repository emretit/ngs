import { toast } from 'sonner';

// PostgrestError type definition
export interface PostgrestError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Supabase error handler utility
 * Provides consistent error handling across the application
 */

export interface SupabaseErrorContext {
  operation?: string;
  table?: string;
  showToast?: boolean;
  logError?: boolean;
}

/**
 * Checks if error is a foreign key constraint violation
 */
export const isForeignKeyError = (error: PostgrestError | Error): boolean => {
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = (error as PostgrestError).code;
  
  return (
    errorCode === '23503' ||
    errorMessage.includes('foreign key') ||
    errorMessage.includes('violates foreign key constraint') ||
    errorMessage.includes('still referenced')
  );
};

/**
 * Checks if error is a permission/RLS error
 */
export const isPermissionError = (error: PostgrestError | Error): boolean => {
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = (error as PostgrestError).code;
  
  return (
    errorCode === '42501' ||
    errorMessage.includes('permission denied') ||
    errorMessage.includes('row-level security') ||
    errorMessage.includes('new row violates row-level security')
  );
};

/**
 * Checks if error is a unique constraint violation
 */
export const isUniqueConstraintError = (error: PostgrestError | Error): boolean => {
  const errorCode = (error as PostgrestError).code;
  return errorCode === '23505';
};

/**
 * Checks if error is a not null constraint violation
 */
export const isNotNullError = (error: PostgrestError | Error): boolean => {
  const errorCode = (error as PostgrestError).code;
  return errorCode === '23502';
};

/**
 * Gets user-friendly error message
 */
export const getErrorMessage = (
  error: PostgrestError | Error,
  context?: SupabaseErrorContext
): string => {
  const operation = context?.operation || 'İşlem';
  const errorMessage = error.message || 'Bilinmeyen hata';
  
  if (isForeignKeyError(error)) {
    return `${operation} başarısız: Bu kayıt başka kayıtlarda kullanıldığı için silinemez veya değiştirilemez.`;
  }
  
  if (isPermissionError(error)) {
    return `${operation} başarısız: Bu işlem için yetkiniz bulunmamaktadır.`;
  }
  
  if (isUniqueConstraintError(error)) {
    return `${operation} başarısız: Bu kayıt zaten mevcut.`;
  }
  
  if (isNotNullError(error)) {
    return `${operation} başarısız: Gerekli alanlar eksik.`;
  }
  
  // Try to extract meaningful error from PostgrestError
  if ((error as PostgrestError).details) {
    return `${operation} başarısız: ${(error as PostgrestError).details}`;
  }
  
  if ((error as PostgrestError).hint) {
    return `${operation} başarısız: ${(error as PostgrestError).hint}`;
  }
  
  return `${operation} başarısız: ${errorMessage}`;
};

/**
 * Handles Supabase errors with consistent logging and user feedback
 */
export const handleSupabaseError = (
  error: PostgrestError | Error | null | undefined,
  context?: SupabaseErrorContext
): void => {
  if (!error) return;
  
  const shouldLog = context?.logError !== false;
  const shouldShowToast = context?.showToast !== false;
  
  // Log error
  if (shouldLog) {
    console.error(`[Supabase Error] ${context?.operation || 'Operation'} failed:`, {
      error,
      table: context?.table,
      code: (error as PostgrestError).code,
      message: error.message,
      details: (error as PostgrestError).details,
      hint: (error as PostgrestError).hint,
    });
  }
  
  // Show toast notification
  if (shouldShowToast) {
    const message = getErrorMessage(error, context);
    toast.error(message, {
      duration: 5000,
    });
  }
};

/**
 * Wraps a Supabase query with error handling
 */
export async function withErrorHandling<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  context?: SupabaseErrorContext
): Promise<T | null> {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      handleSupabaseError(error, context);
      return null;
    }
    
    return data;
  } catch (error) {
    handleSupabaseError(error as Error, context);
    return null;
  }
}







