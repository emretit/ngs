import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isPurchaseRequest,
  isPurchaseRequestItem,
  isExpenseRequest,
  validatePurchaseRequestArray,
  validatePurchaseRequestItemArray,
  validateExpenseRequestArray,
  validateSupabaseArray,
  validateSupabaseSingle,
  safeCast,
} from './typeUtils';

/**
 * Unit Tests for Type Safety Utilities
 *
 * Tests runtime type validation functions
 *
 * @see Phase 1.2 of PAFTA Refactoring Plan
 */

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('typeUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isPurchaseRequest', () => {
    it('should validate a valid PurchaseRequest', () => {
      const validRequest = {
        id: 'req-123',
        request_number: 'PR-001',
        title: 'Test Request',
        requester_id: 'user-123',
        total_budget: 1000,
        status: 'draft',
        requested_date: '2024-01-01',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        description: null,
        department: null,
        preferred_supplier_id: null,
        notes: null,
        needed_by_date: null,
        approved_by: null,
        approved_at: null,
      };

      expect(isPurchaseRequest(validRequest)).toBe(true);
    });

    it('should reject object missing required fields', () => {
      const invalidRequest = {
        id: 'req-123',
        title: 'Test Request',
        // Missing other required fields
      };

      expect(isPurchaseRequest(invalidRequest)).toBe(false);
    });

    it('should reject object with wrong field types', () => {
      const invalidRequest = {
        id: 'req-123',
        request_number: 'PR-001',
        title: 'Test Request',
        requester_id: 'user-123',
        total_budget: '1000', // Should be number
        status: 'draft',
        requested_date: '2024-01-01',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      expect(isPurchaseRequest(invalidRequest)).toBe(false);
    });

    it('should reject non-object values', () => {
      expect(isPurchaseRequest(null)).toBe(false);
      expect(isPurchaseRequest(undefined)).toBe(false);
      expect(isPurchaseRequest('string')).toBe(false);
      expect(isPurchaseRequest(123)).toBe(false);
      expect(isPurchaseRequest([])).toBe(false);
    });
  });

  describe('isPurchaseRequestItem', () => {
    it('should validate a valid PurchaseRequestItem', () => {
      const validItem = {
        id: 'item-123',
        request_id: 'req-123',
        description: 'Test Item',
        quantity: 5,
        unit: 'pcs',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        product_id: null,
        estimated_unit_price: null,
        estimated_total: null,
        notes: null,
      };

      expect(isPurchaseRequestItem(validItem)).toBe(true);
    });

    it('should reject item missing required fields', () => {
      const invalidItem = {
        id: 'item-123',
        description: 'Test Item',
        // Missing other fields
      };

      expect(isPurchaseRequestItem(invalidItem)).toBe(false);
    });
  });

  describe('isExpenseRequest', () => {
    it('should validate a valid ExpenseRequest', () => {
      const validExpense = {
        id: 'exp-123',
        company_id: 'comp-123',
        request_number: 'EXP-001',
        requester_id: 'user-123',
        expense_date: '2024-01-01',
        category: 'travel',
        description: 'Business trip',
        amount: 500,
        currency: 'TRY',
        status: 'draft',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        employee_id: null,
        department_id: null,
        receipt_url: null,
        notes: null,
        approved_at: null,
        paid_at: null,
      };

      expect(isExpenseRequest(validExpense)).toBe(true);
    });

    it('should reject expense missing required fields', () => {
      const invalidExpense = {
        id: 'exp-123',
        amount: 500,
        // Missing other fields
      };

      expect(isExpenseRequest(invalidExpense)).toBe(false);
    });
  });

  describe('validatePurchaseRequestArray', () => {
    it('should validate array of valid PurchaseRequests', () => {
      const requests = [
        {
          id: 'req-1',
          request_number: 'PR-001',
          title: 'Request 1',
          requester_id: 'user-123',
          total_budget: 1000,
          status: 'draft',
          requested_date: '2024-01-01',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          description: null,
          department: null,
          preferred_supplier_id: null,
          notes: null,
          needed_by_date: null,
          approved_by: null,
          approved_at: null,
        },
        {
          id: 'req-2',
          request_number: 'PR-002',
          title: 'Request 2',
          requester_id: 'user-123',
          total_budget: 2000,
          status: 'pending',
          requested_date: '2024-01-01',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          description: null,
          department: null,
          preferred_supplier_id: null,
          notes: null,
          needed_by_date: null,
          approved_by: null,
          approved_at: null,
        },
      ];

      const result = validatePurchaseRequestArray(requests);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('req-1');
      expect(result[1].id).toBe('req-2');
    });

    it('should filter out invalid items and return valid ones', () => {
      const mixedArray = [
        {
          id: 'req-1',
          request_number: 'PR-001',
          title: 'Valid Request',
          requester_id: 'user-123',
          total_budget: 1000,
          status: 'draft',
          requested_date: '2024-01-01',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          description: null,
          department: null,
          preferred_supplier_id: null,
          notes: null,
          needed_by_date: null,
          approved_by: null,
          approved_at: null,
        },
        { id: 'invalid', title: 'Invalid' }, // Missing required fields
        null,
        undefined,
      ];

      const result = validatePurchaseRequestArray(mixedArray);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('req-1');
    });

    it('should return empty array for non-array input', () => {
      expect(validatePurchaseRequestArray(null)).toEqual([]);
      expect(validatePurchaseRequestArray({})).toEqual([]);
      expect(validatePurchaseRequestArray('string')).toEqual([]);
    });

    it('should return empty array for empty array', () => {
      expect(validatePurchaseRequestArray([])).toEqual([]);
    });
  });

  describe('validateSupabaseArray', () => {
    it('should validate array using custom validator', () => {
      const validator = (item: unknown): item is { id: string; name: string } => {
        return (
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          'name' in item &&
          typeof (item as any).id === 'string' &&
          typeof (item as any).name === 'string'
        );
      };

      const data = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3' }, // Invalid - missing name
      ];

      const result = validateSupabaseArray(data, validator, 'CustomType');
      expect(result).toHaveLength(2);
    });

    it('should return empty array for non-array input', () => {
      const validator = (item: unknown): item is any => true;
      expect(validateSupabaseArray(null, validator, 'Test')).toEqual([]);
    });
  });

  describe('validateSupabaseSingle', () => {
    it('should validate single object using custom validator', () => {
      const validator = (item: unknown): item is { id: string } => {
        return (
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          typeof (item as any).id === 'string'
        );
      };

      const validData = { id: '123' };
      const result = validateSupabaseSingle(validData, validator, 'CustomType');
      expect(result).toEqual(validData);
    });

    it('should return null for invalid data', () => {
      const validator = (item: unknown): item is { id: string } => false;
      const result = validateSupabaseSingle({ id: '123' }, validator, 'CustomType');
      expect(result).toBeNull();
    });

    it('should return null for null/undefined input', () => {
      const validator = (item: unknown): item is any => true;
      expect(validateSupabaseSingle(null, validator, 'Test')).toBeNull();
      expect(validateSupabaseSingle(undefined, validator, 'Test')).toBeNull();
    });
  });

  describe('safeCast', () => {
    it('should return data when validation passes', () => {
      const validator = (item: unknown): item is { id: string } => {
        return (
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          typeof (item as any).id === 'string'
        );
      };

      const data = { id: '123' };
      const result = safeCast(data, validator, 'CustomType', { id: 'fallback' });
      expect(result).toEqual(data);
    });

    it('should return fallback when validation fails', () => {
      const validator = (item: unknown): item is { id: string } => false;
      const fallback = { id: 'fallback' };
      const result = safeCast({ invalid: true }, validator, 'CustomType', fallback);
      expect(result).toEqual(fallback);
    });
  });

  describe('validatePurchaseRequestItemArray', () => {
    it('should validate array of valid PurchaseRequestItems', () => {
      const items = [
        {
          id: 'item-1',
          request_id: 'req-123',
          description: 'Item 1',
          quantity: 5,
          unit: 'pcs',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          product_id: null,
          estimated_unit_price: null,
          estimated_total: null,
          notes: null,
        },
      ];

      const result = validatePurchaseRequestItemArray(items);
      expect(result).toHaveLength(1);
    });
  });

  describe('validateExpenseRequestArray', () => {
    it('should validate array of valid ExpenseRequests', () => {
      const expenses = [
        {
          id: 'exp-1',
          company_id: 'comp-123',
          request_number: 'EXP-001',
          requester_id: 'user-123',
          expense_date: '2024-01-01',
          category: 'travel',
          description: 'Business trip',
          amount: 500,
          currency: 'TRY',
          status: 'draft',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          employee_id: null,
          department_id: null,
        },
      ];

      const result = validateExpenseRequestArray(expenses);
      expect(result).toHaveLength(1);
    });
  });
});
