import { supabase } from '@/integrations/supabase/client';

/**
 * Query filter options
 */
export interface QueryFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'ilike' | 'in' | 'is';
  value: any;
}

/**
 * Query options for building Supabase queries
 */
export interface QueryOptions {
  select?: string;
  filters?: QueryFilter[];
  orderBy?: {
    column: string;
    ascending?: boolean;
    nullsFirst?: boolean;
  };
  limit?: number;
  range?: {
    from: number;
    to: number;
  };
  count?: 'exact' | 'planned' | 'estimated';
}

/**
 * Build a base query with company_id filter
 * 
 * @param table - Table name
 * @param companyId - Company ID to filter by (required for security)
 * @param options - Query options
 * @returns PostgrestFilterBuilder instance
 * 
 * @example
 * ```typescript
 * const query = buildCompanyQuery('proposals', companyId, {
 *   select: '*, customer:customer_id (*)',
 *   filters: [
 *     { field: 'status', operator: 'eq', value: 'active' }
 *   ],
 *   orderBy: { column: 'created_at', ascending: false }
 * });
 * ```
 */
export function buildCompanyQuery<T = any>(
  table: string,
  companyId: string | null | undefined,
  options: QueryOptions = {}
) {
  if (!companyId) {
    throw new Error(`Company ID is required for querying ${table}`);
  }

  let query = supabase
    .from(table)
    .select(options.select || '*', options.count ? { count: options.count } : undefined);

  // Always add company_id filter first for security
  query = query.eq('company_id', companyId);

  // Apply filters
  if (options.filters) {
    options.filters.forEach(filter => {
      switch (filter.operator) {
        case 'eq':
          query = query.eq(filter.field, filter.value);
          break;
        case 'neq':
          query = query.neq(filter.field, filter.value);
          break;
        case 'gt':
          query = query.gt(filter.field, filter.value);
          break;
        case 'gte':
          query = query.gte(filter.field, filter.value);
          break;
        case 'lt':
          query = query.lt(filter.field, filter.value);
          break;
        case 'lte':
          query = query.lte(filter.field, filter.value);
          break;
        case 'ilike':
          query = query.ilike(filter.field, `%${filter.value}%`);
          break;
        case 'in':
          query = query.in(filter.field, filter.value);
          break;
        case 'is':
          query = query.is(filter.field, filter.value);
          break;
      }
    });
  }

  // Apply ordering
  if (options.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? true,
      nullsFirst: options.orderBy.nullsFirst ?? false,
    });
  }

  // Apply range (pagination)
  if (options.range) {
    query = query.range(options.range.from, options.range.to);
  } else if (options.limit) {
    query = query.limit(options.limit);
  }

  return query;
}

/**
 * Build a query with OR conditions
 * 
 * @param table - Table name
 * @param companyId - Company ID to filter by
 * @param orConditions - OR conditions string (e.g., "field1.ilike.%value%,field2.eq.value")
 * @param options - Additional query options
 * @returns PostgrestFilterBuilder instance
 */
export function buildCompanyQueryWithOr<T = any>(
  table: string,
  companyId: string | null | undefined,
  orConditions: string,
  options: QueryOptions = {}
) {
  if (!companyId) {
    throw new Error(`Company ID is required for querying ${table}`);
  }

  let query = supabase
    .from(table)
    .select(options.select || '*', options.count ? { count: options.count } : undefined);

  // Always add company_id filter first
  query = query.eq('company_id', companyId);

  // Apply OR conditions only if provided
  if (orConditions && orConditions.trim()) {
    query = query.or(orConditions);
  }

  // Apply additional filters
  if (options.filters) {
    options.filters.forEach(filter => {
      switch (filter.operator) {
        case 'eq':
          query = query.eq(filter.field, filter.value);
          break;
        case 'neq':
          query = query.neq(filter.field, filter.value);
          break;
        case 'gt':
          query = query.gt(filter.field, filter.value);
          break;
        case 'gte':
          query = query.gte(filter.field, filter.value);
          break;
        case 'lt':
          query = query.lt(filter.field, filter.value);
          break;
        case 'lte':
          query = query.lte(filter.field, filter.value);
          break;
        case 'ilike':
          query = query.ilike(filter.field, `%${filter.value}%`);
          break;
        case 'in':
          query = query.in(filter.field, filter.value);
          break;
        case 'is':
          query = query.is(filter.field, filter.value);
          break;
      }
    });
  }

  // Apply ordering
  if (options.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? true,
      nullsFirst: options.orderBy.nullsFirst ?? false,
    });
  }

  // Apply range (pagination)
  if (options.range) {
    query = query.range(options.range.from, options.range.to);
  } else if (options.limit) {
    query = query.limit(options.limit);
  }

  return query;
}

/**
 * Execute a company-scoped query
 * 
 * @param table - Table name
 * @param companyId - Company ID
 * @param options - Query options
 * @returns Promise with data and error
 */
export async function executeCompanyQuery<T = any>(
  table: string,
  companyId: string | null | undefined,
  options: QueryOptions = {}
): Promise<{ data: T[] | null; error: any; count?: number | null }> {
  try {
    const query = buildCompanyQuery<T>(table, companyId, options);
    const result = await query;
    return {
      data: result.data,
      error: result.error,
      count: result.count ?? null,
    };
  } catch (error) {
    return {
      data: null,
      error,
      count: null,
    };
  }
}

/**
 * Get a single record by ID with company_id check
 * 
 * @param table - Table name
 * @param id - Record ID
 * @param companyId - Company ID
 * @param select - Select fields
 * @returns Promise with data and error
 */
export async function getCompanyRecordById<T = any>(
  table: string,
  id: string,
  companyId: string | null | undefined,
  select: string = '*'
): Promise<{ data: T | null; error: any }> {
  if (!companyId) {
    return {
      data: null,
      error: new Error(`Company ID is required for querying ${table}`),
    };
  }

  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq('id', id)
    .eq('company_id', companyId)
    .maybeSingle();

  return { data, error };
}

