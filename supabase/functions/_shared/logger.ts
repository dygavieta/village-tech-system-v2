/**
 * Logging Utility for Edge Functions
 *
 * Provides standardized logging using Deno console with structured formats.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private context: LogContext;

  constructor(defaultContext: LogContext = {}) {
    this.context = defaultContext;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const combinedContext = { ...this.context, ...context };
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...combinedContext,
    });
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error
      ? {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
          ...context,
        }
      : context;
    console.error(this.formatMessage('error', message, errorContext));
  }

  debug(message: string, context?: LogContext): void {
    console.debug(this.formatMessage('debug', message, context));
  }

  child(childContext: LogContext): Logger {
    return new Logger({ ...this.context, ...childContext });
  }
}

export function createLogger(context?: LogContext): Logger {
  return new Logger(context);
}

export default Logger;
