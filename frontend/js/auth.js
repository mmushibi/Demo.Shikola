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
// Demo Authentication - No backend, always authenticated
window.ShikolaAuth = {
    // Demo user data
    demoUser: {
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@shikola.com',
        role: 'admin',
        avatar: 'fas fa-user-shield'
    },

    // Always return success
    async login(credentials) {
        this.setSession(this.demoUser, 'school-admin');
        return { success: true, user: this.demoUser };
    },

    // Logout just reloads the page
    async logout() {
        window.location.href = './index.html';
    },

    // Always authenticated in demo
    async isAuthenticated() {
        return true;
    },

    // Get demo user
    getCurrentUser() {
        return { user: this.demoUser };
    },

    // Always super admin in demo

    // Skip token validation
    async validateToken(token) {
        return true;
    },

    // Always allow access
    async protectRoute(requiredRole = 'admin') {
        return true;
    },

    // Set mock session
    setSession(user, portal) {
        const session = {
            user: user,
            portal: portal,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('shikola_admin_session', JSON.stringify(session));
    },

    // No-op init
    init() {
        this.setSession(this.demoUser, 'school-admin');
    }
};

// Initialize
window.ShikolaAuth.init();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ShikolaAuth;
}
