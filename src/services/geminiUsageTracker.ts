/**
 * Gemini Usage Tracker
 * 
 * Note: Google Gemini API has different rate limits than Groq
 * Free tier: 15 RPM (requests per minute), 1 million tokens per minute
 */

export interface UsageStats {
  daily: {
    used: number;
    limit: number;
    remaining: number;
    resetTime: string;
  };
  monthly: {
    used: number;
    estimated: number;
  };
  rateLimit: {
    perMinute: number;
    current: number;
  };
}

// Local storage keys for tracking
const STORAGE_KEYS = {
  dailyCount: 'gemini_daily_requests',
  lastReset: 'gemini_last_reset',
  requestLog: 'gemini_request_log'
};

// Gemini Free Tier Limits (more generous than Groq)
const LIMITS = {
  dailyRequests: 1500, // Generous daily limit
  monthlyRequests: 45000, // 1500 * 30
  ratePerMinute: 15 // 15 RPM for free tier
};

export class GeminiUsageTracker {
  private static instance: GeminiUsageTracker;

  static getInstance(): GeminiUsageTracker {
    if (!this.instance) {
      this.instance = new GeminiUsageTracker();
    }
    return this.instance;
  }

  // Get current usage stats
  getUsageStats(): UsageStats {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem(STORAGE_KEYS.lastReset);
    const dailyCount = this.getDailyCount();
    const requestLog = this.getRequestLog();

    // Reset daily count if new day
    if (lastReset !== today) {
      this.resetDailyCount();
    }

    // Calculate rate limit usage (last minute)
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = requestLog.filter(timestamp => timestamp > oneMinuteAgo);

    // Calculate monthly estimate
    const dayOfMonth = new Date().getDate();
    const monthlyEstimate = Math.round((dailyCount / dayOfMonth) * 30);

    return {
      daily: {
        used: dailyCount,
        limit: LIMITS.dailyRequests,
        remaining: Math.max(0, LIMITS.dailyRequests - dailyCount),
        resetTime: this.getNextResetTime()
      },
      monthly: {
        used: dayOfMonth * dailyCount, // Rough estimate
        estimated: monthlyEstimate
      },
      rateLimit: {
        perMinute: LIMITS.ratePerMinute,
        current: recentRequests.length
      }
    };
  }

  // Track a new request
  trackRequest(): void {
    // Update daily count
    const dailyCount = this.getDailyCount() + 1;
    localStorage.setItem(STORAGE_KEYS.dailyCount, dailyCount.toString());

    // Update request log for rate limiting
    const requestLog = this.getRequestLog();
    requestLog.push(Date.now());

    // Keep only last 100 requests to avoid storage bloat
    const recentLog = requestLog.slice(-100);
    localStorage.setItem(STORAGE_KEYS.requestLog, JSON.stringify(recentLog));

    // Update last reset date
    localStorage.setItem(STORAGE_KEYS.lastReset, new Date().toDateString());
  }

  // Check if we can make a request (rate limiting)
  canMakeRequest(): { allowed: boolean; reason?: string } {
    const stats = this.getUsageStats();

    // Check daily limit
    if (stats.daily.remaining <= 0) {
      return {
        allowed: false,
        reason: `Günlük limit aşıldı. ${stats.daily.resetTime} sıfırlanacak.`
      };
    }

    // Check rate limit
    if (stats.rateLimit.current >= stats.rateLimit.perMinute) {
      return {
        allowed: false,
        reason: 'Dakika başına istek limiti aşıldı. Lütfen 1 dakika bekleyin.'
      };
    }

    return { allowed: true };
  }

  // Get usage percentage for UI
  getUsagePercentages() {
    const stats = this.getUsageStats();

    return {
      daily: Math.round((stats.daily.used / stats.daily.limit) * 100),
      rateLimit: Math.round((stats.rateLimit.current / stats.rateLimit.perMinute) * 100),
      monthly: Math.round((stats.monthly.estimated / LIMITS.monthlyRequests) * 100)
    };
  }

  // Private helper methods
  private getDailyCount(): number {
    const count = localStorage.getItem(STORAGE_KEYS.dailyCount);
    return count ? parseInt(count, 10) : 0;
  }

  private getRequestLog(): number[] {
    const log = localStorage.getItem(STORAGE_KEYS.requestLog);
    return log ? JSON.parse(log) : [];
  }

  private resetDailyCount(): void {
    localStorage.setItem(STORAGE_KEYS.dailyCount, '0');
    localStorage.setItem(STORAGE_KEYS.lastReset, new Date().toDateString());
  }

  private getNextResetTime(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return tomorrow.toLocaleString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  }

  // Export usage data for analysis
  exportUsageData() {
    const stats = this.getUsageStats();
    const data = {
      timestamp: new Date().toISOString(),
      stats,
      percentages: this.getUsagePercentages(),
      requestLog: this.getRequestLog()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-usage-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Backward compatibility
export const GroqUsageTracker = GeminiUsageTracker;
