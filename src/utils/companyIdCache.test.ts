import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchCompanyId, clearCompanyIdCache, getCachedCompanyId } from './companyIdCache';
import { supabase } from '@/integrations/supabase/client';

/**
 * Unit Tests for Company ID Cache Utility
 *
 * Tests the consolidated fetchCompanyId implementation
 *
 * @see Phase 1.1 of PAFTA Refactoring Plan
 */

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
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

describe('companyIdCache', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCompanyIdCache();
    vi.clearAllMocks();
  });

  describe('fetchCompanyId', () => {
    it('should fetch and cache company ID successfully', async () => {
      // Mock successful user fetch
      const mockUser = { id: 'user-123' };
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock successful profile fetch
      const mockProfile = { company_id: 'company-456' };
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValue(mockFrom);

      const companyId = await fetchCompanyId();

      expect(companyId).toBe('company-456');
      expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should return cached company ID on second call', async () => {
      // Setup mocks
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { company_id: 'company-456' },
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValue(mockFrom);

      // First call - should hit database
      const companyId1 = await fetchCompanyId();

      // Second call - should use cache
      const companyId2 = await fetchCompanyId();

      expect(companyId1).toBe('company-456');
      expect(companyId2).toBe('company-456');
      // Should only call database once
      expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent requests with promise caching', async () => {
      // Setup mocks
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { company_id: 'company-456' },
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValue(mockFrom);

      // Make concurrent requests
      const [companyId1, companyId2, companyId3] = await Promise.all([
        fetchCompanyId(),
        fetchCompanyId(),
        fetchCompanyId(),
      ]);

      expect(companyId1).toBe('company-456');
      expect(companyId2).toBe('company-456');
      expect(companyId3).toBe('company-456');
      // Should only call database once despite concurrent requests
      expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
    });

    it('should throw error when user is not found', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(fetchCompanyId()).rejects.toThrow('Kullanıcı bulunamadı');
    });

    it('should throw error when user fetch fails', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      });

      await expect(fetchCompanyId()).rejects.toThrow('Kullanıcı bilgisi alınamadı');
    });

    it('should throw error when profile has no company_id', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { company_id: null },
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValue(mockFrom);

      await expect(fetchCompanyId()).rejects.toThrow('Şirket bilgisi bulunamadı');
    });

    it('should throw error when profile fetch fails', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };
      (supabase.from as any).mockReturnValue(mockFrom);

      await expect(fetchCompanyId()).rejects.toThrow('Profil bilgisi alınamadı');
    });

    it('should clear promise cache on error to allow retry', async () => {
      // First call - fails
      (supabase.auth.getUser as any).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Auth error' },
      });

      await expect(fetchCompanyId()).rejects.toThrow();

      // Second call - succeeds
      (supabase.auth.getUser as any).mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { company_id: 'company-456' },
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValue(mockFrom);

      const companyId = await fetchCompanyId();
      expect(companyId).toBe('company-456');
    });
  });

  describe('clearCompanyIdCache', () => {
    it('should clear the cache', async () => {
      // Setup and cache a company ID
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { company_id: 'company-456' },
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValue(mockFrom);

      await fetchCompanyId();
      expect(getCachedCompanyId()).toBe('company-456');

      // Clear cache
      clearCompanyIdCache();
      expect(getCachedCompanyId()).toBeNull();

      // Next call should hit database again
      await fetchCompanyId();
      expect(supabase.auth.getUser).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCachedCompanyId', () => {
    it('should return null when cache is empty', () => {
      expect(getCachedCompanyId()).toBeNull();
    });

    it('should return cached company ID', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { company_id: 'company-456' },
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValue(mockFrom);

      await fetchCompanyId();
      expect(getCachedCompanyId()).toBe('company-456');
    });
  });
});
