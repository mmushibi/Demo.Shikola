/*
Copyright (c) 2026 Sepio Corp. All Rights Reserved.

This software and its associated documentation files (the "Software") 
are the sole and exclusive property of Sepio Corp. Unauthorized copying, 
modification, distribution, or use of this Software is strictly prohibited.

Sepio Corp retains all intellectual property rights to this Software.
No license is granted to use, reproduce, or distribute this Software 
without the express written consent of Sepio Corp.

For inquiries regarding licensing, please contact:
Sepio Corp
Email: legal@sepiocorp.com
*/
/**
 * Structured Logging System for Shikola
 * Provides consistent logging with correlation IDs and structured output
 */

const winston = require('winston')
const crypto = require('crypto')

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
}

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
}

// Tell winston that you want to link the colors
winston.addColors(colors)

// Define which level to log based on environment
const getLevel = () => {
  const env = process.env.NODE_ENV || 'production'
  const isDevelopment = env === 'development'
  return isDevelopment ? 'debug' : 'warn'
}

// Define log formats
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Define transports
const createTransports = (service) => {
  const transports = [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]

  // Add file transports in production
  if (process.env.NODE_ENV === 'production') {
    // Create logs directory if it doesn't exist
    const fs = require('fs')
    const logsDir = 'logs'
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir)
    }

    transports.push(
      // File transport for errors
      new winston.transports.File({
        filename: `logs/${service}-error.log`,
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }),
      
      // File transport for all logs
      new winston.transports.File({
        filename: `logs/${service}-combined.log`,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      })
    )
  }

  return transports
}

class Logger {
  constructor(service = 'shikola-backend') {
    this.service = service
    this.logLevels = levels
    this.logLevel = getLevel()
    this.logger = winston.createLogger({
      level: getLevel(),
      levels,
      format,
      defaultMeta: { service },
      transports: createTransports(service),
      exitOnError: false
    })
  }

  /**
   * Create a structured log entry
   */
  createLogEntry(level, message, meta = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      ...meta
    }
  }

  /**
   * Generate a unique correlation ID for request tracking
   */
  generateCorrelationId() {
    return crypto.randomBytes(16).toString('hex')
  }

  /**
   * Log error with structured format
   */
  error(message, error = null, meta = {}) {
    const logData = {
      message,
      correlationId: meta.correlationId || 'none',
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: error.code
      } : null
    }
    this.logger.error(message, logData)
  }

  /**
   * Log warning with structured format
   */
  warn(message, meta = {}) {
    const logData = {
      message,
      correlationId: meta.correlationId || 'none',
      ...meta
    }
    this.logger.warn(message, logData)
  }

  /**
   * Log info with structured format
   */
  info(message, meta = {}) {
    const logData = {
      message,
      correlationId: meta.correlationId || 'none',
      ...meta
    }
    this.logger.info(message, logData)
  }

  /**
   * Log debug with structured format
   */
  debug(message, meta = {}) {
    const logData = {
      message,
      correlationId: meta.correlationId || 'none',
      ...meta
    }
    this.logger.debug(message, logData)
  }

  /**
   * Log HTTP requests
   */
  http(message, meta = {}) {
    const logData = {
      message,
      correlationId: meta.correlationId || 'none',
      ...meta
    }
    this.logger.http(message, logData)
  }

  /**
   * Log HTTP request/response
   */
  logRequest(req, res, responseTime) {
    const logEntry = this.createLogEntry('info', 'HTTP Request/Response', {
      correlationId: req.correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user ? req.user.id : null,
      userRole: req.user ? req.user.role : null
    });
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Log security events
   */
  logSecurity(event, details = {}) {
    const logEntry = this.createLogEntry('warn', `Security Event: ${event}`, {
      eventType: 'security',
      ...details
    });
    console.warn(JSON.stringify(logEntry));
  }

  /**
   * Log business events
   */
  logBusiness(event, details = {}) {
    const logEntry = this.createLogEntry('info', `Business Event: ${event}`, {
      eventType: 'business',
      ...details
    });
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Check if log level should be output
   */
  shouldLog(level) {
    return this.logLevels[level] <= this.logLevels[this.logLevel];
  }
}

// Create singleton instance
const logger = new Logger();

// Express middleware for request correlation IDs
const correlationMiddleware = (req, res, next) => {
  req.correlationId = logger.generateCorrelationId();
  res.setHeader('X-Correlation-ID', req.correlationId);
  
  const startTime = Date.now();
  
  // Override res.end to log response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);
    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = {
  logger,
  correlationMiddleware,
  Logger
};
