type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, error?: any, data?: any) => void;
}

class AppLogger implements Logger {
  private isDevelopment = import.meta.env.DEV;

  private log(level: LogLevel, message: string, data?: any, error?: any) {
    if (!this.isDevelopment && level === 'debug') return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (level === 'error') {
      console.error(`${prefix} ${message}`, error || data);
    } else if (level === 'warn') {
      console.warn(`${prefix} ${message}`, data);
    } else if (level === 'info') {
      console.info(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`, data);
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: any, data?: any) {
    this.log('error', message, data, error);
  }
}

export const logger = new AppLogger();