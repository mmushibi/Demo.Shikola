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
// Path configuration for organized Shikola structure
window.SHIKOLA_PATHS = {
    // Base paths
    BASE: '/',
    ASSETS: '/frontend/assets/',
    SHARED: '/frontend/shared/',
    PORTALS: '/frontend/portals/',
    PUBLIC: '/frontend/frontend/public/',
    
    // Asset paths
    CSS: '/frontend/assets/css/',
    JS: '/frontend/assets/js/',
    IMAGES: '/frontend/assets/images/',
    
    // Shared resources
    SHARED_JS: '/frontend/shared/',
    SHARED_CSS: '/frontend/shared/css/',
    
    // Portal paths
    ACCOUNTANT: '/frontend/portals/frontend/portals/accountant-portal/',
    PUPIL: '/frontend/portals/frontend/portals/pupil-portal/',
    SCHOOL_ADMIN: '/frontend/portals/frontend/portals/school-admin/',
    SUPER_ADMIN: '/frontend/portals/frontend/portals/super-admin/',
    TEACHER: '/frontend/portals/frontend/portals/teacher-portal/'
};

// Helper function to get correct path
function getPath(type, resource) {
    const basePath = window.SHIKOLA_PATHS[type.toUpperCase()];
    if (!basePath) {
        console.warn(`Unknown path type: ${type}`);
        return resource;
    }
    return basePath + resource;
}

// Auto-load configuration
if (typeof window !== 'undefined') {
    window.getPath = getPath;
}
