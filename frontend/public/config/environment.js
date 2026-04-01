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
// Shikola Environment Configuration
window.SHIKOLA_ENV = {
  environment: 'production',
  settings: {
    debug: false,
    apiBaseUrl: '/api',
    enableRealTimeSync: true,
    enableAnalytics: false,
    enableErrorReporting: false
  },
  api: {
    baseUrl: '/api',
    timeout: 30000,
    retries: 3
  },
  features: {
    demoMode: false,
    offlineMode: true,
    realTimeUpdates: true,
    advancedReporting: false,
    requireApiConnection: true,
    paymentGateway: false
  }
};

// Set global API base for backward compatibility
window.SHIKOLA_API_BASE = '/api';

console.log('[Shikola] Environment configuration loaded:', window.SHIKOLA_ENV.environment);
