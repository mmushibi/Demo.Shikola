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
 * Monitoring and Alerting Configuration for Shikola
 * Provides hooks for APM, log aggregation, and alerting systems
 */

class MonitoringService {
  constructor() {
    this.enabled = process.env.MONITORING_ENABLED === 'true';
    this.apmService = process.env.APM_SERVICE || 'none';
    this.logAggregator = process.env.LOG_AGGREGATOR || 'none';
    this.alertWebhook = process.env.ALERT_WEBHOOK_URL;
    this.metrics = {
      requests: 0,
      errors: 0,
      activeUsers: 0,
      responseTime: []
    };
  }

  /**
   * Initialize monitoring service connections
   */
  async initialize() {
    if (!this.enabled) {
      console.log('Monitoring service disabled');
      return;
    }

    console.info('Initializing monitoring service', {
      apmService: this.apmService,
      logAggregator: this.logAggregator
    });

    // Initialize APM service
    switch (this.apmService) {
      case 'datadog':
        await this.initializeDatadog();
        break;
      case 'newrelic':
        await this.initializeNewRelic();
        break;
      case 'elastic-apm':
        await this.initializeElasticAPM();
        break;
      default:
        console.debug('No APM service configured');
    }

    // Initialize log aggregation
    switch (this.logAggregator) {
      case 'elasticsearch':
        await this.initializeElasticsearch();
        break;
      case 'splunk':
        await this.initializeSplunk();
        break;
      case 'fluentd':
        await this.initializeFluentd();
        break;
      default:
        console.debug('No log aggregator configured');
    }
  }

  /**
   * Record custom metrics
   */
  recordMetric(name, value, tags = {}) {
    if (!this.enabled) return;

    this.metrics[name] = value;
    
    console.debug('Metric recorded', {
      metricName: name,
      value,
      tags,
      correlationId: 'system'
    });

    // Send to APM service if configured
    this.sendMetricToAPM(name, value, tags);
  }

  /**
   * Track response time
   */
  trackResponseTime(duration) {
    this.metrics.responseTime.push(duration);
    
    // Keep only last 1000 response times
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
    }

    // Calculate average response time
    const avgResponseTime = this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length;
    
    this.recordMetric('avg_response_time', avgResponseTime);
    this.recordMetric('max_response_time', Math.max(...this.metrics.responseTime));
  }

  /**
   * Increment error count
   */
  incrementErrorCount(errorType = 'unknown') {
    this.metrics.errors++;
    this.recordMetric('error_count', this.metrics.errors, { errorType });
  }

  /**
   * Track active users
   */
  trackActiveUsers(count) {
    this.metrics.activeUsers = count;
    this.recordMetric('active_users', count);
  }

  /**
   * Send alert for critical events
   */
  async sendAlert(level, message, details = {}) {
    if (!this.enabled || !this.alertWebhook) return;

    const alert = {
      timestamp: new Date().toISOString(),
      level,
      service: 'shikola-backend',
      message,
      details,
      metrics: this.metrics
    };

    console.warn('Sending alert', { alert });

    try {
      const response = await fetch(this.alertWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });

      if (!response.ok) {
        console.error('Failed to send alert', null, { 
          status: response.status,
          alert 
        });
      }
    } catch (error) {
      console.error('Error sending alert', error, { alert });
    }
  }

  /**
   * Health check endpoint data
   */
  getHealthStatus() {
    const avgResponseTime = this.metrics.responseTime.length > 0 
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length 
      : 0;

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      metrics: {
        ...this.metrics,
        avg_response_time: avgResponseTime,
        memory_usage: process.memoryUsage(),
        cpu_usage: process.cpuUsage()
      },
      monitoring: {
        enabled: this.enabled,
        apm_service: this.apmService,
        log_aggregator: this.logAggregator
      }
    };
  }

  /**
   * Initialize Datadog APM
   */
  async initializeDatadog() {
    try {
      // In production, you would use actual Datadog library
      console.info('Datadog APM initialized');
    } catch (error) {
      console.error('Failed to initialize Datadog APM', error);
    }
  }

  /**
   * Initialize New Relic APM
   */
  async initializeNewRelic() {
    try {
      // In production, you would use actual New Relic library
      console.info('New Relic APM initialized');
    } catch (error) {
      console.error('Failed to initialize New Relic APM', error);
    }
  }

  /**
   * Initialize Elastic APM
   */
  async initializeElasticAPM() {
    try {
      // In production, you would use actual Elastic APM library
      console.info('Elastic APM initialized');
    } catch (error) {
      console.error('Failed to initialize Elastic APM', error);
    }
  }

  /**
   * Initialize Elasticsearch for log aggregation
   */
  async initializeElasticsearch() {
    try {
      // In production, you would configure Elasticsearch client
      console.info('Elasticsearch log aggregation initialized');
    } catch (error) {
      console.error('Failed to initialize Elasticsearch', error);
    }
  }

  /**
   * Initialize Splunk for log aggregation
   */
  async initializeSplunk() {
    try {
      // In production, you would configure Splunk client
      console.info('Splunk log aggregation initialized');
    } catch (error) {
      console.error('Failed to initialize Splunk', error);
    }
  }

  /**
   * Initialize Fluentd for log aggregation
   */
  async initializeFluentd() {
    try {
      // In production, you would configure Fluentd client
      console.info('Fluentd log aggregation initialized');
    } catch (error) {
      console.error('Failed to initialize Fluentd', error);
    }
  }

  /**
   * Send metrics to APM service
   */
  sendMetricToAPM(name, value, tags) {
    // In production, this would send to actual APM service
    console.debug('Sending metric to APM', { name, value, tags });
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

// Express middleware for monitoring
const monitoringMiddleware = (req, res, next) => {
  if (!monitoringService.enabled) return next();

  const startTime = Date.now();
  
  // Track request count
  monitoringService.recordMetric('request_count', ++monitoringService.metrics.requests);

  // Override res.end to track response time and errors
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    monitoringService.trackResponseTime(responseTime);

    // Track errors based on status codes
    if (res.statusCode >= 400) {
      monitoringService.incrementErrorCount(res.statusCode >= 500 ? 'server_error' : 'client_error');
      
      // Send alerts for critical errors
      if (res.statusCode >= 500) {
        monitoringService.sendAlert('critical', 'Server error occurred', {
          statusCode: res.statusCode,
          url: req.url,
          method: req.method,
          correlationId: req.correlationId
        });
      }
    }

    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = {
  monitoringService,
  monitoringMiddleware,
  MonitoringService
};
