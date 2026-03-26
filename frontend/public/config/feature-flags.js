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
// Shikola Feature Flags Configuration
window.SHIKOLA_FEATURE_FLAGS = {
  // Core Features
  authentication: true,
  userManagement: true,
  schoolManagement: true,
  academicManagement: true,
  financialManagement: true,
  
  // Portal Features
  superAdminPortal: true,
  schoolAdminPortal: true,
  teacherPortal: true,
  pupilPortal: true,
  accountantPortal: true,
  
  // Advanced Features
  realTimeSync: true,
  offlineMode: true,
  advancedReporting: true,
  analytics: true,
  notifications: true,
  
  // Features
  demoMode: false,
  debugMode: false,
  
  // API Configuration
  requireApiConnection: true,
  
  // Beta Features
  parentPortal: false,
  mobileApp: false,
  paymentGateway: false,
  predictiveAnalytics: false,
  
  // System Features
  caching: true,
  compression: true,
  securityHeaders: true,
  rateLimiting: true
};

console.log('[Shikola] Feature flags loaded:', Object.keys(window.SHIKOLA_FEATURE_FLAGS).length, 'features configured');
