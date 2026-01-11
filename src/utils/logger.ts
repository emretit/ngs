/**
 * Enhanced Logger Utility
 *
 * Structured logging with context tracking and performance timing
 *
 * @see Phase 3.1 of PAFTA Refactoring Plan
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  companyId?: string;
  module?: string;
  action?: string;
  [key: string]: any;
}

interface Logger {
  debug: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, error?: any, data?: any) => void;
  setContext: (context: Partial<LogContext>) => void;
  clearContext: () => void;
  startTimer: (label: string) => void;
  endTimer: (label: string) => void;
}

class AppLogger implements Logger {
  private isDevelopment = import.meta.env.DEV;
  private context: LogContext = {};
  private timers: Map<string, number> = new Map();
  private minLogLevel: LogLevel = this.isDevelopment ? 'debug' : 'info';

  /**
   * Sets global context for all subsequent logs
   * Useful for tracking user, company, module across multiple log calls
   */
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clears the global context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Starts a performance timer
   */
  startTimer(label: string): void {
    this.timers.set(label, performance.now());
  }

  /**
   * Ends a performance timer and logs the duration
   */
  endTimer(label: string): void {
    const startTime = this.timers.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.info(`Timer: ${label}`, { duration: `${duration.toFixed(2)}ms` });
      this.timers.delete(label);
    } else {
      this.warn(`Timer "${label}" was not started`);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.minLogLevel);
    return currentLevelIndex >= minLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(this.context).length > 0
      ? ` [${Object.entries(this.context).map(([k, v]) => `${k}:${v}`).join(', ')}]`
      : '';
    return `[${timestamp}] [${level.toUpperCase()}]${contextStr} ${message}`;
  }

  private log(level: LogLevel, message: string, data?: any, error?: any) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message);
    const logData = data || error;

    // In production, you might want to send errors to a logging service
    if (!this.isDevelopment && level === 'error') {
      // TODO: Send to error tracking service (e.g., Sentry)
      // This is where you'd integrate with services like Sentry, LogRocket, etc.
    }

    if (level === 'error') {
      console.error(formattedMessage, logData);
      if (error instanceof Error) {
        console.error('Stack trace:', error.stack);
      }
    } else if (level === 'warn') {
      console.warn(formattedMessage, logData);
    } else if (level === 'info') {
      console.info(formattedMessage, logData);
    } else {
      console.debug(formattedMessage, logData);
    }
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: any, data?: any): void {
    this.log('error', message, data, error);
  }
}

export const logger = new AppLogger();