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

// Shikola Configuration
window.SHIKOLA_CONFIG = {
    // API Configuration
    API_BASE_URL: window.location.origin + '/api',
    WS_URL: window.location.origin.replace('http', 'ws') + '/ws',
    
    // Application Settings
    APP_NAME: 'Shikola School Management System',
    APP_VERSION: '1.0.0',
    
    // Demo Mode Settings
    DEMO_MODE: true,
    
    // Theme Settings
    DEFAULT_THEME: 'light',
    
    // Cache Settings
    CACHE_DURATION: 300000, // 5 minutes
    
    // Sync Settings
    SYNC_INTERVALS: {
        dashboard: 30000,
        notifications: 15000,
        attendance: 60000,
        grades: 120000,
        assignments: 45000,
        fees: 300000,
        messages: 20000
    }
};

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.SHIKOLA_CONFIG;
}
