/**
 * Logger Service
 *
 * Provides colored, namespaced logging for the application and plugins.
 * Uses chalk for terminal colors.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
/**
 * Simple logger with namespace support and colored output
 */
export declare class Logger {
    private namespace;
    private level;
    constructor(namespace?: string, level?: LogLevel);
    /**
     * Create a child logger with a different namespace
     * Useful for plugins to get their own namespaced logger
     */
    child(namespace: string): Logger;
    /**
     * Set the minimum log level
     */
    setLevel(level: LogLevel): void;
    /**
     * Get the current log level
     */
    getLevel(): LogLevel;
    /**
     * Debug-level logging (gray)
     */
    debug(message: string, ...args: unknown[]): void;
    /**
     * Info-level logging (blue)
     */
    info(message: string, ...args: unknown[]): void;
    /**
     * Warning-level logging (yellow)
     */
    warn(message: string, ...args: unknown[]): void;
    /**
     * Error-level logging (red)
     */
    error(message: string, error?: Error | unknown, ...args: unknown[]): void;
    /**
     * Success message (green) - always shown regardless of log level
     */
    success(message: string, ...args: unknown[]): void;
    /**
     * Check if a message at the given level should be logged
     */
    private shouldLog;
}
//# sourceMappingURL=Logger.d.ts.map