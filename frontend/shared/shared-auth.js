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
// Demo Shared Authentication System - No backend, always authenticated
class ShikolaAuth {
    constructor() {
        this.currentUser = null;
        this.currentPortal = null;
        this.demoUser = {
            id: 'demo-user',
            name: 'Demo User',
            email: 'demo@shikola.com',
            role: 'superadmin',
            avatar: 'fas fa-user-cog'
        };
        this.init();
    }

    static getInstance() {
        if (!window.shikolaAuth) {
            window.shikolaAuth = new ShikolaAuth();
        }
        return window.shikolaAuth;
    }

    isAuthenticated() {
        return true;
    }

    hasRole(role) {
        return true;
    }

    isSuperAdmin() {
        return true;
    }

    requireAuth() {
        return true;
    }

    requireSuperAdminAuth() {
        return true;
    }

    resolveAvatarForRole(role) {
        const r = String(role || '').toLowerCase();
        return r === 'admin' ? 'fas fa-user-shield'
            : r === 'teacher' ? 'fas fa-chalkboard-teacher'
            : r === 'pupil' ? 'fas fa-user-graduate'
            : r === 'accountant' ? 'fas fa-user-tie'
            : 'fas fa-user';
    }

    getAuthToken() {
        return 'demo-token';
    }

    isSuperAdminConsole() {
        return String(window.location.pathname || '').toLowerCase().includes('super-admin');
    }

    init() {
        this.currentUser = this.demoUser;
    }

    getSession() {
        return { user: this.demoUser, portal: this.currentPortal };
    }

    setSession(user, portal) {
        this.currentUser = user || this.demoUser;
        this.currentPortal = portal;
    }

    generateSessionId() {
        return 'demo-sess-' + Date.now();
    }

    clearSession() {
        this.currentUser = null;
        this.currentPortal = null;
    }

    async clearClientData() {
        this.clearSession();
    }

    updateLastActivity() {}
    startActivityTracking() {}
    stopActivityTracking() {}
    startSessionValidation() {}
    stopSessionValidation() {}
    setupActivityListeners() {}
    removeActivityListeners() {}

    async validateSession() {
        return true;
    }

    async forceLogout(message) {
        window.location.href = '../frontend/public/index.html';
    }

    async login(credentials, portal) {
        this.setSession(this.demoUser, portal || 'super-admin');
        return { success: true, user: this.demoUser };
    }

    async logout() {
        window.location.href = '../frontend/public/index.html';
    }

    redirectToSignIn() {
        window.location.href = '../frontend/public/index.html';
    }

    switchPortal(targetPortal) {
        this.currentPortal = targetPortal;
        window.location.href = `../${targetPortal}/dashboard.html`;
        return true;
    }

    getAvailablePortals() {
        return [
            { id: 'super-admin', name: 'Super Admin', icon: 'fas fa-user-cog', url: '../frontend/portals/super-admin/dashboard.html' },
            { id: 'school-admin', name: 'School Admin', icon: 'fas fa-user-shield', url: '../frontend/portals/school-admin/dashboard.html' },
            { id: 'teacher-portal', name: 'Teacher Portal', icon: 'fas fa-chalkboard-teacher', url: '../frontend/portals/teacher-portal/dashboard.html' },
            { id: 'pupil-portal', name: 'Pupil Portal', icon: 'fas fa-user-graduate', url: '../frontend/portals/pupil-portal/dashboard.html' },
            { id: 'accountant-portal', name: 'Accountant Portal', icon: 'fas fa-user-tie', url: '../frontend/portals/accountant-portal/dashboard.html' }
        ];
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentPortal() {
        return this.currentPortal;
    }

    renderImpersonationBanner() {}

    refreshPersistedProfile() {
        return Promise.resolve();
    }
}

// Global auth instance
window.shikolaAuth = new ShikolaAuth();

// Alpine.js integration
function authData() {
    return {
        auth: window.shikolaAuth,
        user: window.shikolaAuth.getCurrentUser(),
        availablePortals: window.shikolaAuth.getAvailablePortals(),
        portalSwitcherOpen: false,
        profileMenuOpen: false,

        init() {
            this.user = this.auth.getCurrentUser();
            this.availablePortals = this.auth.getAvailablePortals();
        },

        switchPortal(portalId) {
            this.auth.switchPortal(portalId);
            this.portalSwitcherOpen = false;
        },

        logout() {
            this.auth.logout();
        },

        getPortalIcon(portal) {
            return portal.icon;
        },

        getInitials(name) {
            if (!name) return 'D';
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
    };
}

// No portal gating in demo - all pages are accessible
