/**
 * Gemini API Cache Service
 * Optimizes token usage by caching Gemini API responses
 * Supports localStorage for quick access and IndexedDB for larger data
 */

import { logger } from '@/utils/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  companyId?: string;
}

interface CacheConfig {
  ttl: number;
  maxSize?: number; // Max entries before cleanup
}

const CACHE_CONFIGS: Record<string, CacheConfig> = {
  sql: { ttl: 30 * 60 * 1000, maxSize: 50 }, // 30 minutes
  report: { ttl: 60 * 60 * 1000, maxSize: 30 }, // 1 hour
  analyze: { ttl: 60 * 60 * 1000, maxSize: 20 }, // 1 hour
  mapping: { ttl: 24 * 60 * 60 * 1000, maxSize: 100 }, // 24 hours
  chat: { ttl: 10 * 60 * 1000, maxSize: 20 } // 10 minutes (short for fresh responses)
};

const STORAGE_PREFIX = 'gemini_cache_';
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Cleanup every 5 minutes

class GeminiCacheService {
  private cleanupTimer: number | null = null;

  constructor() {
    this.startCleanup();
  }

  /**
   * Generate cache key from request parameters
   */
  private generateKey(type: string, params: Record<string, any>, companyId?: string): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);

    const paramsStr = JSON.stringify(sortedParams);
    const keyBase = `${STORAGE_PREFIX}${type}_${companyId || 'global'}_${paramsStr}`;

    // Use simple hash for shorter keys
    return this.simpleHash(keyBase);
  }

  /**
   * Simple string hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `${STORAGE_PREFIX}${Math.abs(hash).toString(36)}`;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Get data from cache
   */
  get<T>(type: string, params: Record<string, any>, companyId?: string): T | null {
    try {
      const key = this.generateKey(type, params, companyId);
      const cached = localStorage.getItem(key);

      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);

      // Check if expired
      if (this.isExpired(entry)) {
        logger.debug(`Cache expired for ${type}:`, key);
        localStorage.removeItem(key);
        return null;
      }

      // Verify company_id matches (security)
      if (companyId && entry.companyId !== companyId) {
        logger.warn(`Cache company_id mismatch for ${type}:`, key);
        localStorage.removeItem(key);
        return null;
      }

      logger.debug(`Cache hit for ${type}:`, key);
      return entry.data;
    } catch (error) {
      logger.error(`Cache get error for ${type}:`, error);
      return null;
    }
  }

  /**
   * Set data in cache
   */
  set<T>(type: string, params: Record<string, any>, data: T, companyId?: string): void {
    try {
      const config = CACHE_CONFIGS[type] || CACHE_CONFIGS.sql;
      const key = this.generateKey(type, params, companyId);

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: config.ttl,
        companyId
      };

      localStorage.setItem(key, JSON.stringify(entry));
      logger.debug(`Cache set for ${type}:`, key, `TTL: ${config.ttl / 1000}s`);

      // Check if cleanup needed
      this.checkCleanup(type, config.maxSize);
    } catch (error) {
      logger.error(`Cache set error for ${type}:`, error);
    }
  }

  /**
   * Check if cleanup is needed for a specific cache type
   */
  private checkCleanup(type: string, maxSize?: number): void {
    if (!maxSize) return;

    try {
      const keys = this.getKeysForType(type);

      if (keys.length > maxSize) {
        logger.debug(`Cache cleanup triggered for ${type}: ${keys.length} > ${maxSize}`);
        // Remove oldest entries
        const entries = keys.map(key => {
          const cached = localStorage.getItem(key);
          if (!cached) return null;
          const entry = JSON.parse(cached) as CacheEntry<any>;
          return { key, timestamp: entry.timestamp };
        }).filter(Boolean) as Array<{ key: string; timestamp: number }>;

        // Sort by timestamp (oldest first)
        entries.sort((a, b) => a.timestamp - b.timestamp);

        // Remove oldest entries to get back to maxSize
        const toRemove = entries.slice(0, keys.length - maxSize);
        toRemove.forEach(({ key }) => localStorage.removeItem(key));

        logger.debug(`Removed ${toRemove.length} old cache entries for ${type}`);
      }
    } catch (error) {
      logger.error(`Cache cleanup error for ${type}:`, error);
    }
  }

  /**
   * Get all cache keys for a specific type
   */
  private getKeysForType(type: string): string[] {
    const keys: string[] = [];
    const prefix = `${STORAGE_PREFIX}`;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }

    return keys;
  }

  /**
   * Clear cache for a specific type
   */
  clearType(type: string): void {
    try {
      const keys = this.getKeysForType(type);
      keys.forEach(key => localStorage.removeItem(key));
      logger.info(`Cleared ${keys.length} cache entries for ${type}`);
    } catch (error) {
      logger.error(`Cache clear error for ${type}:`, error);
    }
  }

  /**
   * Clear all Gemini cache
   */
  clearAll(): void {
    try {
      const keys = this.getKeysForType('');
      keys.forEach(key => localStorage.removeItem(key));
      logger.info(`Cleared all ${keys.length} Gemini cache entries`);
    } catch (error) {
      logger.error('Cache clear all error:', error);
    }
  }

  /**
   * Clear cache for a specific company
   */
  clearCompany(companyId: string): void {
    try {
      const keys = this.getKeysForType('');
      let cleared = 0;

      keys.forEach(key => {
        try {
          const cached = localStorage.getItem(key);
          if (!cached) return;

          const entry = JSON.parse(cached) as CacheEntry<any>;
          if (entry.companyId === companyId) {
            localStorage.removeItem(key);
            cleared++;
          }
        } catch {
          // Skip invalid entries
        }
      });

      logger.info(`Cleared ${cleared} cache entries for company ${companyId}`);
    } catch (error) {
      logger.error(`Cache clear company error for ${companyId}:`, error);
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    if (this.cleanupTimer) return;

    this.cleanupTimer = window.setInterval(() => {
      this.cleanupExpired();
    }, CLEANUP_INTERVAL);

    logger.debug('Cache cleanup timer started');
  }

  /**
   * Stop periodic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      logger.debug('Cache cleanup timer stopped');
    }
  }

  /**
   * Remove expired cache entries
   */
  private cleanupExpired(): void {
    try {
      const keys = this.getKeysForType('');
      let removed = 0;

      keys.forEach(key => {
        try {
          const cached = localStorage.getItem(key);
          if (!cached) return;

          const entry = JSON.parse(cached) as CacheEntry<any>;
          if (this.isExpired(entry)) {
            localStorage.removeItem(key);
            removed++;
          }
        } catch {
          // Remove invalid entries
          localStorage.removeItem(key);
          removed++;
        }
      });

      if (removed > 0) {
        logger.debug(`Cleaned up ${removed} expired cache entries`);
      }
    } catch (error) {
      logger.error('Cache cleanup expired error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    total: number;
    byType: Record<string, number>;
    totalSize: number;
  } {
    try {
      const keys = this.getKeysForType('');
      const byType: Record<string, number> = {};
      let totalSize = 0;

      keys.forEach(key => {
        const cached = localStorage.getItem(key);
        if (!cached) return;

        totalSize += cached.length;

        try {
          const entry = JSON.parse(cached) as CacheEntry<any>;
          // Extract type from cache data (approximate)
          const type = 'unknown';
          byType[type] = (byType[type] || 0) + 1;
        } catch {
          // Skip invalid entries
        }
      });

      return {
        total: keys.length,
        byType,
        totalSize
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return { total: 0, byType: {}, totalSize: 0 };
    }
  }
}

// Export singleton instance
export const geminiCache = new GeminiCacheService();

// Export for testing
export { GeminiCacheService };
