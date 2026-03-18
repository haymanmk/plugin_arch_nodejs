/**
 * Logger Service
 * 
 * Provides colored, namespaced logging for the application and plugins.
 * Uses chalk for terminal colors.
 */

import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Simple logger with namespace support and colored output
 */
export class Logger {
  private namespace: string;
  private level: LogLevel;
  
  constructor(namespace: string = 'core', level: LogLevel = 'info') {
    this.namespace = namespace;
    this.level = level;
  }
  
  /**
   * Create a child logger with a different namespace
   * Useful for plugins to get their own namespaced logger
   */
  child(namespace: string): Logger {
    return new Logger(namespace, this.level);
  }
  
  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }
  
  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }
  
  /**
   * Debug-level logging (gray)
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(chalk.gray(`[${this.namespace}] DEBUG: ${message}`), ...args);
    }
  }
  
  /**
   * Info-level logging (blue)
   */
  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.log(chalk.blue(`[${this.namespace}] INFO: ${message}`), ...args);
    }
  }
  
  /**
   * Warning-level logging (yellow)
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(chalk.yellow(`[${this.namespace}] WARN: ${message}`), ...args);
    }
  }
  
  /**
   * Error-level logging (red)
   */
  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(chalk.red(`[${this.namespace}] ERROR: ${message}`), ...args);
      if (error instanceof Error) {
        console.error(chalk.red(error.stack || error.message));
      } else if (error) {
        console.error(chalk.red(String(error)));
      }
    }
  }
  
  /**
   * Success message (green) - always shown regardless of log level
   */
  success(message: string, ...args: unknown[]): void {
    console.log(chalk.green(`[${this.namespace}] ✓ ${message}`), ...args);
  }
  
  /**
   * Check if a message at the given level should be logged
   */
  private shouldLog(messageLevel: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(messageLevel);
    
    return messageLevelIndex >= currentLevelIndex;
  }
}
