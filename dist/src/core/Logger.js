"use strict";
/**
 * Logger Service
 *
 * Provides colored, namespaced logging for the application and plugins.
 * Uses chalk for terminal colors.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const chalk_1 = __importDefault(require("chalk"));
/**
 * Simple logger with namespace support and colored output
 */
class Logger {
    constructor(namespace = 'core', level = 'info') {
        this.namespace = namespace;
        this.level = level;
    }
    /**
     * Create a child logger with a different namespace
     * Useful for plugins to get their own namespaced logger
     */
    child(namespace) {
        return new Logger(namespace, this.level);
    }
    /**
     * Set the minimum log level
     */
    setLevel(level) {
        this.level = level;
    }
    /**
     * Get the current log level
     */
    getLevel() {
        return this.level;
    }
    /**
     * Debug-level logging (gray)
     */
    debug(message, ...args) {
        if (this.shouldLog('debug')) {
            console.log(chalk_1.default.gray(`[${this.namespace}] DEBUG: ${message}`), ...args);
        }
    }
    /**
     * Info-level logging (blue)
     */
    info(message, ...args) {
        if (this.shouldLog('info')) {
            console.log(chalk_1.default.blue(`[${this.namespace}] INFO: ${message}`), ...args);
        }
    }
    /**
     * Warning-level logging (yellow)
     */
    warn(message, ...args) {
        if (this.shouldLog('warn')) {
            console.warn(chalk_1.default.yellow(`[${this.namespace}] WARN: ${message}`), ...args);
        }
    }
    /**
     * Error-level logging (red)
     */
    error(message, error, ...args) {
        if (this.shouldLog('error')) {
            console.error(chalk_1.default.red(`[${this.namespace}] ERROR: ${message}`), ...args);
            if (error instanceof Error) {
                console.error(chalk_1.default.red(error.stack || error.message));
            }
            else if (error) {
                console.error(chalk_1.default.red(String(error)));
            }
        }
    }
    /**
     * Success message (green) - always shown regardless of log level
     */
    success(message, ...args) {
        console.log(chalk_1.default.green(`[${this.namespace}] ✓ ${message}`), ...args);
    }
    /**
     * Check if a message at the given level should be logged
     */
    shouldLog(messageLevel) {
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.level);
        const messageLevelIndex = levels.indexOf(messageLevel);
        return messageLevelIndex >= currentLevelIndex;
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map