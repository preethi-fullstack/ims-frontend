import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}
0
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevel: LogLevel = environment.production ? LogLevel.WARN : LogLevel.DEBUG;
  private appName = 'IMS-App';
  
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
  
  getLogLevel(): LogLevel {
    return this.logLevel;
  }
  
  debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.debug(`[${this.appName}] DEBUG: ${message}`, ...args);
    }
  }
  
  info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.info(`[${this.appName}] INFO: ${message}`, ...args);
    }
  }
  
  warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(`[${this.appName}] WARN: ${message}`, ...args);
    }
  }
  
  error(message: string, error?: any, ...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`[${this.appName}] ERROR: ${message}`, error, ...args);
      
      // Log to server in production
      if (environment.production) {
        this.logToServer('ERROR', message, error);
      }
    }
  }
  
  log(level: LogLevel, message: string, ...args: any[]): void {
    switch (level) {
      case LogLevel.DEBUG:
        this.debug(message, ...args);
        break;
      case LogLevel.INFO:
        this.info(message, ...args);
        break;
      case LogLevel.WARN:
        this.warn(message, ...args);
        break;
      case LogLevel.ERROR:
        this.error(message, ...args);
        break;
    }
  }
  
  private logToServer(level: string, message: string, error?: any): void {
    // In a real application, you would send this to your logging service
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    // Example: Send to logging endpoint
    // this.http.post('/api/logs', logEntry).subscribe();
    
    // For now, just store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(logEntry);
      if (logs.length > 1000) {
        logs.shift(); // Keep only last 1000 logs
      }
      localStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save log:', e);
    }
  }
  
  getLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch {
      return [];
    }
  }
  
  clearLogs(): void {
    localStorage.removeItem('app_logs');
  }
  
  // Performance logging
  startTimer(label: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.debug(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    };
  }
}