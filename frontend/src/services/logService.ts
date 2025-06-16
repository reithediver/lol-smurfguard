/**
 * Frontend Logging Service
 * 
 * This service handles logging for the frontend application, including:
 * - Console logging with consistent formatting
 * - Remote logging to backend API
 * - Error reporting with context
 */

import { apiService } from './api';

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// Log entry structure
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  stack?: string;
}

class LogService {
  private enabled: boolean = true;
  private remoteLoggingEnabled: boolean = true;
  private buffer: LogEntry[] = [];
  private bufferSize: number = 10;
  private applicationName: string = 'smurfguard-frontend';
  private version: string = '2.0.0';
  
  constructor() {
    // Flush logs on page unload
    window.addEventListener('beforeunload', () => {
      this.flushLogs(true);
    });
    
    // Periodically flush logs
    setInterval(() => {
      this.flushLogs();
    }, 30000); // Every 30 seconds
    
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled error', {
        message: event.error?.message || event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
    
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }
  
  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }
  
  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }
  
  /**
   * Log an error message
   */
  error(message: string, context?: Record<string, any>): void {
    // Get stack trace
    const stack = new Error().stack || '';
    this.log(LogLevel.ERROR, message, context, stack);
    
    // Force flush logs for errors
    this.flushLogs();
  }
  
  /**
   * Log a message with the specified level
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>, stack?: string): void {
    if (!this.enabled) return;
    
    // Create log entry
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      stack
    };
    
    // Log to console
    this.logToConsole(entry);
    
    // Add to buffer for remote logging
    if (this.remoteLoggingEnabled) {
      this.buffer.push(entry);
      
      // Flush if buffer is full
      if (this.buffer.length >= this.bufferSize) {
        this.flushLogs();
      }
    }
  }
  
  /**
   * Log to console with formatting
   */
  private logToConsole(entry: LogEntry): void {
    const { level, message, context, stack } = entry;
    
    // Format and color based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`%c[DEBUG] ${message}`, 'color: #6c757d', context);
        break;
      case LogLevel.INFO:
        console.info(`%c[INFO] ${message}`, 'color: #0d6efd', context);
        break;
      case LogLevel.WARN:
        console.warn(`%c[WARN] ${message}`, 'color: #ffc107', context);
        break;
      case LogLevel.ERROR:
        console.error(`%c[ERROR] ${message}`, 'color: #dc3545', context);
        if (stack) console.error(stack);
        break;
    }
  }
  
  /**
   * Flush logs to remote server
   */
  async flushLogs(sync: boolean = false): Promise<void> {
    if (!this.remoteLoggingEnabled || this.buffer.length === 0) return;
    
    const logs = [...this.buffer];
    this.buffer = [];
    
    try {
      const payload = {
        logs,
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          application: this.applicationName,
          version: this.version,
          timestamp: new Date().toISOString()
        }
      };
      
      if (sync) {
        // Use synchronous request for beforeunload event
        navigator.sendBeacon(
          `${apiService.getBaseUrl()}/logs`,
          JSON.stringify(payload)
        );
      } else {
        // Use normal fetch for regular logging
        await fetch(`${apiService.getBaseUrl()}/logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }
    } catch (error) {
      // Fallback to console if remote logging fails
      console.error('Failed to send logs to server:', error);
    }
  }
  
  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Enable or disable remote logging
   */
  setRemoteLoggingEnabled(enabled: boolean): void {
    this.remoteLoggingEnabled = enabled;
  }
}

export const logService = new LogService();
export default logService; 