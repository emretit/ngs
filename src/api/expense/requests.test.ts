import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchExpenseRequests,
  fetchExpenseRequestById,
  createExpenseRequest,
  submitExpenseRequest,
  updateExpenseRequest,
  deleteExpenseRequest,
} from './requests';
import { supabase } from '@/integrations/supabase/client';
import type { ExpenseRequest } from '@/types/expense';

/**
 * Unit Tests for Expense API
 *
 * Tests the expense API layer functions
 *
 * @see Phase 2.3 of PAFTA Refactoring Plan
 */

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('Expense API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchExpenseRequests', () => {
    it('should fetch expense requests successfully', async () => {
      const mockData: ExpenseRequest[] = [
        {
          id: 'exp-1',
          company_id: 'comp-123',
          request_number: 'EXP-001',
          requester_id: 'user-123',
          employee_id: null,
          department_id: null,
          expense_date: '2024-01-01',
          category: 'travel',
          description: 'Business trip',
          amount: 500,
          currency: 'TRY',
          status: 'draft',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockChain);

      const result = await fetchExpenseRequests('comp-123');

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('expense_requests');
      expect(mockChain.eq).toHaveBeenCalledWith('company_id', 'comp-123');
    });

    it('should throw error when fetch fails', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      (supabase.from as any).mockReturnValue(mockChain);

      await expect(fetchExpenseRequests('comp-123')).rejects.toThrow();
    });
  });

  describe('fetchExpenseRequestById', () => {
    it('should fetch single expense request successfully', async () => {
      const mockData: ExpenseRequest = {
        id: 'exp-1',
        company_id: 'comp-123',
        request_number: 'EXP-001',
        requester_id: 'user-123',
        employee_id: null,
        department_id: null,
        expense_date: '2024-01-01',
        category: 'travel',
        description: 'Business trip',
        amount: 500,
        currency: 'TRY',
        status: 'draft',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockChain);

      const result = await fetchExpenseRequestById('exp-1');

      expect(result).toEqual(mockData);
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'exp-1');
    });

    it('should throw error when expense not found', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      (supabase.from as any).mockReturnValue(mockChain);

      await expect(fetchExpenseRequestById('exp-999')).rejects.toThrow();
    });
  });

  describe('createExpenseRequest', () => {
    it('should create expense request successfully', async () => {
      const mockExpense: Partial<ExpenseRequest> = {
        requester_id: 'user-123',
        expense_date: '2024-01-01',
        category: 'travel',
        description: 'Business trip',
        amount: 500,
        currency: 'TRY',
      };

      const mockData: ExpenseRequest = {
        id: 'exp-new',
        company_id: 'comp-123',
        request_number: 'EXP-002',
        requester_id: 'user-123',
        employee_id: null,
        department_id: null,
        expense_date: '2024-01-01',
        category: 'travel',
        description: 'Business trip',
        amount: 500,
        currency: 'TRY',
        status: 'draft',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockChain);

      const result = await createExpenseRequest(mockExpense, 'comp-123');

      expect(result).toEqual(mockData);
      expect(mockChain.insert).toHaveBeenCalledWith({
        ...mockExpense,
        company_id: 'comp-123',
      });
    });

    it('should throw error when creation fails', async () => {
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      };

      (supabase.from as any).mockReturnValue(mockChain);

      await expect(
        createExpenseRequest({}, 'comp-123')
      ).rejects.toThrow();
    });
  });

  describe('submitExpenseRequest', () => {
    it('should submit expense request successfully', async () => {
      const mockData: ExpenseRequest = {
        id: 'exp-1',
        company_id: 'comp-123',
        request_number: 'EXP-001',
        requester_id: 'user-123',
        employee_id: null,
        department_id: null,
        expense_date: '2024-01-01',
        category: 'travel',
        description: 'Business trip',
        amount: 500,
        currency: 'TRY',
        status: 'submitted',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockChain);

      const result = await submitExpenseRequest('exp-1');

      expect(result).toEqual(mockData);
      expect(mockChain.update).toHaveBeenCalledWith({ status: 'submitted' });
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'exp-1');
    });
  });

  describe('updateExpenseRequest', () => {
    it('should update expense request successfully', async () => {
      const updates = {
        description: 'Updated description',
        amount: 600,
      };

      const mockData: ExpenseRequest = {
        id: 'exp-1',
        company_id: 'comp-123',
        request_number: 'EXP-001',
        requester_id: 'user-123',
        employee_id: null,
        department_id: null,
        expense_date: '2024-01-01',
        category: 'travel',
        description: 'Updated description',
        amount: 600,
        currency: 'TRY',
        status: 'draft',
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockChain);

      const result = await updateExpenseRequest('exp-1', updates);

      expect(result).toEqual(mockData);
      expect(mockChain.update).toHaveBeenCalledWith(updates);
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'exp-1');
    });
  });

  describe('deleteExpenseRequest', () => {
    it('should delete expense request successfully', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockChain);

      await deleteExpenseRequest('exp-1');

      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'exp-1');
    });

    it('should throw error when deletion fails', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Delete failed' },
        }),
      };

      (supabase.from as any).mockReturnValue(mockChain);

      await expect(deleteExpenseRequest('exp-1')).rejects.toThrow();
    });
  });
});
