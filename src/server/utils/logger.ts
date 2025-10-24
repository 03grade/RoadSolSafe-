// Enhanced logger with more detailed logging capabilities
import { createLogger, format, transports } from 'winston';
import { config } from '../config/index.js';
import { logger } from './logger.js';

// Create a Winston logger with enhanced formatting
const logFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

const winstonLogger = createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'driver-trip-reward-backend' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// For production, also log to file
if (config.nodeEnv === 'production') {
  winstonLogger.add(new transports.File({ filename: 'error.log', level: 'error' }));
  winstonLogger.add(new transports.File({ filename: 'combined.log' }));
}

// Enhanced logger with custom methods
export const enhancedLogger = {
  ...winstonLogger,
  // Add custom methods for convenience
  debug: (message: string, meta?: any) => {
    winstonLogger.debug(message, meta);
  },
  info: (message: string, meta?: any) => {
    winstonLogger.info(message, meta);
  },
  warn: (message: string, meta?: any) => {
    winstonLogger.warn(message, meta);
  },
  error: (message: string, meta?: any) => {
    winstonLogger.error(message, meta);
  },
  // Enhanced logging methods
  apiCall: (method: string, endpoint: string, duration: number, status: number) => {
    winstonLogger.info('API Call', {
      method,
      endpoint,
      duration,
      status,
      timestamp: new Date().toISOString()
    });
  },
  databaseOperation: (operation: string, table: string, duration: number, rowsAffected: number) => {
    winstonLogger.info('Database Operation', {
      operation,
      table,
      duration,
      rowsAffected,
      timestamp: new Date().toISOString()
    });
  },
  sessionEvent: (event: string, sessionId: string, driverId: string) => {
    winstonLogger.info('Session Event', {
      event,
      sessionId,
      driverId,
      timestamp: new Date().toISOString()
    });
  },
  securityEvent: (event: string, details: any) => {
    winstonLogger.warn('Security Event', {
      event,
      details,
      timestamp: new Date().toISOString()
    });
  }
};

export { enhancedLogger as logger };