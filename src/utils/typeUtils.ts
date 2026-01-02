import { logger } from "@/utils/logger";
import type { PurchaseRequest, PurchaseRequestItem } from "@/types/purchase";
import type { ExpenseRequest } from "@/types/expense";

/**
 * Type Safety Utilities
 *
 * Provides runtime type validation to replace unsafe `as any` and `as unknown as` casts.
 * All validators perform runtime checks and log warnings when data doesn't match expected types.
 *
 * @see Phase 1.2 of PAFTA Refactoring Plan
 */

/**
 * Type guard helper: checks if value is an object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard helper: checks if value is a non-empty string
 */
function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard helper: checks if value is a number
 */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard helper: checks if value is a valid array
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type guard: validates if data is a PurchaseRequest
 */
export function isPurchaseRequest(data: unknown): data is PurchaseRequest {
  if (!isObject(data)) return false;

  const required = [
    'id',
    'request_number',
    'title',
    'requester_id',
    'total_budget',
    'status',
    'requested_date',
    'created_at',
    'updated_at'
  ];

  for (const field of required) {
    if (!(field in data)) {
      logger.warn(`Missing required field in PurchaseRequest: ${field}`, { data });
      return false;
    }
  }

  return (
    isString(data.id) &&
    isString(data.request_number) &&
    isString(data.title) &&
    isString(data.requester_id) &&
    isNumber(data.total_budget) &&
    isString(data.status)
  );
}

/**
 * Type guard: validates if data is a PurchaseRequestItem
 */
export function isPurchaseRequestItem(data: unknown): data is PurchaseRequestItem {
  if (!isObject(data)) return false;

  const required = [
    'id',
    'request_id',
    'description',
    'quantity',
    'unit',
    'created_at',
    'updated_at'
  ];

  for (const field of required) {
    if (!(field in data)) {
      logger.warn(`Missing required field in PurchaseRequestItem: ${field}`, { data });
      return false;
    }
  }

  return (
    isString(data.id) &&
    isString(data.request_id) &&
    isString(data.description) &&
    isNumber(data.quantity) &&
    isString(data.unit)
  );
}

/**
 * Type guard: validates if data is an ExpenseRequest
 */
export function isExpenseRequest(data: unknown): data is ExpenseRequest {
  if (!isObject(data)) return false;

  const required = [
    'id',
    'company_id',
    'request_number',
    'requester_id',
    'expense_date',
    'category',
    'description',
    'amount',
    'currency',
    'status',
    'created_at',
    'updated_at'
  ];

  for (const field of required) {
    if (!(field in data)) {
      logger.warn(`Missing required field in ExpenseRequest: ${field}`, { data });
      return false;
    }
  }

  return (
    isString(data.id) &&
    isString(data.company_id) &&
    isString(data.request_number) &&
    isString(data.requester_id) &&
    isNumber(data.amount) &&
    isString(data.status)
  );
}

/**
 * Validates an array of PurchaseRequests
 * Filters out invalid items and logs warnings
 *
 * @param data - Unknown data to validate
 * @returns Array of valid PurchaseRequest objects
 */
export function validatePurchaseRequestArray(data: unknown): PurchaseRequest[] {
  if (!isArray(data)) {
    logger.error("Expected array for PurchaseRequest validation", null, { receivedType: typeof data });
    return [];
  }

  const valid: PurchaseRequest[] = [];
  const invalid: unknown[] = [];

  for (const item of data) {
    if (isPurchaseRequest(item)) {
      valid.push(item);
    } else {
      invalid.push(item);
    }
  }

  if (invalid.length > 0) {
    logger.warn(`Filtered ${invalid.length} invalid PurchaseRequest items`, { invalidCount: invalid.length });
  }

  return valid;
}

/**
 * Validates an array of PurchaseRequestItems
 * Filters out invalid items and logs warnings
 *
 * @param data - Unknown data to validate
 * @returns Array of valid PurchaseRequestItem objects
 */
export function validatePurchaseRequestItemArray(data: unknown): PurchaseRequestItem[] {
  if (!isArray(data)) {
    logger.error("Expected array for PurchaseRequestItem validation", null, { receivedType: typeof data });
    return [];
  }

  const valid: PurchaseRequestItem[] = [];
  const invalid: unknown[] = [];

  for (const item of data) {
    if (isPurchaseRequestItem(item)) {
      valid.push(item);
    } else {
      invalid.push(item);
    }
  }

  if (invalid.length > 0) {
    logger.warn(`Filtered ${invalid.length} invalid PurchaseRequestItem items`, { invalidCount: invalid.length });
  }

  return valid;
}

/**
 * Validates an array of ExpenseRequests
 * Filters out invalid items and logs warnings
 *
 * @param data - Unknown data to validate
 * @returns Array of valid ExpenseRequest objects
 */
export function validateExpenseRequestArray(data: unknown): ExpenseRequest[] {
  if (!isArray(data)) {
    logger.error("Expected array for ExpenseRequest validation", null, { receivedType: typeof data });
    return [];
  }

  const valid: ExpenseRequest[] = [];
  const invalid: unknown[] = [];

  for (const item of data) {
    if (isExpenseRequest(item)) {
      valid.push(item);
    } else {
      invalid.push(item);
    }
  }

  if (invalid.length > 0) {
    logger.warn(`Filtered ${invalid.length} invalid ExpenseRequest items`, { invalidCount: invalid.length });
  }

  return valid;
}

/**
 * Generic Supabase response validator
 * Validates array responses from Supabase queries
 *
 * @param data - Raw Supabase response data
 * @param validator - Type guard function
 * @param typeName - Name of the type for logging
 * @returns Validated array of typed objects
 *
 * @example
 * const requests = validateSupabaseArray(data, isPurchaseRequest, 'PurchaseRequest');
 */
export function validateSupabaseArray<T>(
  data: unknown,
  validator: (item: unknown) => item is T,
  typeName: string
): T[] {
  if (!isArray(data)) {
    logger.error(`Expected array for ${typeName} validation`, null, { receivedType: typeof data });
    return [];
  }

  const valid: T[] = [];
  const invalid: unknown[] = [];

  for (const item of data) {
    if (validator(item)) {
      valid.push(item);
    } else {
      invalid.push(item);
    }
  }

  if (invalid.length > 0) {
    logger.warn(`Filtered ${invalid.length} invalid ${typeName} items`, {
      invalidCount: invalid.length,
      typeName
    });
  }

  return valid;
}

/**
 * Generic Supabase single record validator
 * Validates single object responses from Supabase queries
 *
 * @param data - Raw Supabase response data
 * @param validator - Type guard function
 * @param typeName - Name of the type for logging
 * @returns Validated typed object or null
 *
 * @example
 * const request = validateSupabaseSingle(data, isPurchaseRequest, 'PurchaseRequest');
 */
export function validateSupabaseSingle<T>(
  data: unknown,
  validator: (item: unknown) => item is T,
  typeName: string
): T | null {
  if (data === null || data === undefined) {
    return null;
  }

  if (validator(data)) {
    return data;
  }

  logger.error(`Invalid ${typeName} data received`, null, { data });
  return null;
}

/**
 * Safe type cast with runtime validation
 * Use this to replace `as unknown as T` with runtime checking
 *
 * @param data - Data to cast
 * @param validator - Type guard function
 * @param typeName - Name of the type for logging
 * @param fallback - Fallback value if validation fails
 * @returns Validated data or fallback
 *
 * @example
 * const request = safeCast(data, isPurchaseRequest, 'PurchaseRequest', null);
 */
export function safeCast<T>(
  data: unknown,
  validator: (item: unknown) => item is T,
  typeName: string,
  fallback: T
): T {
  if (validator(data)) {
    return data;
  }

  logger.error(`Failed to cast to ${typeName}, using fallback`, null, {
    data,
    fallback
  });
  return fallback;
}
