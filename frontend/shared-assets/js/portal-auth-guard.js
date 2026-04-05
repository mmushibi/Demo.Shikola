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

// Portal Authentication Guard
(function() {
    'use strict';

    // Portal authentication guard class
    class PortalAuthGuard {
        constructor() {
            this.isAuthenticated = false;
            this.currentUser = null;
            this.requiredRole = null;
            this.portalType = null;
            this.init();
        }

        init() {
            // Wait for auth system to be available
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    // Wait a bit more for auth system to initialize
                    setTimeout(() => this.checkAuthentication(), 100);
                });
            } else {
                // Wait a bit for auth system to initialize
                setTimeout(() => this.checkAuthentication(), 100);
            }
        }

        checkAuthentication() {
            // Get current portal type from URL
            this.portalType = this.getPortalType();
            
            // Check if user is authenticated
            if (window.shikolaAuth && window.shikolaAuth.isAuthenticated()) {
                this.isAuthenticated = true;
                this.currentUser = window.shikolaAuth.getCurrentUser();
                this.validatePortalAccess();
            } else {
                // Retry authentication check after a delay
                setTimeout(() => {
                    if (window.shikolaAuth && window.shikolaAuth.isAuthenticated()) {
                        this.isAuthenticated = true;
                        this.currentUser = window.shikolaAuth.getCurrentUser();
                        this.validatePortalAccess();
                    } else {
                        this.redirectToSignIn();
                    }
                }, 500);
            }
        }

        getPortalType() {
            const path = window.location.pathname.toLowerCase();
            
            if (path.includes('super-admin')) return 'super-admin';
            if (path.includes('school-admin')) return 'school-admin';
            if (path.includes('teacher-portal')) return 'teacher-portal';
            if (path.includes('pupil-portal')) return 'pupil-portal';
            if (path.includes('accountant-portal')) return 'accountant-portal';
            
            return 'unknown';
        }

        validatePortalAccess() {
            if (!this.currentUser) {
                this.redirectToSignIn();
                return;
            }

            // Check role-based access
            const hasAccess = this.checkRoleAccess();
            
            if (!hasAccess) {
                this.handleUnauthorizedAccess();
            } else {
                this.setupAuthMonitoring();
            }
        }

        checkRoleAccess() {
            const userRole = this.currentUser.role;
            
            // Demo mode: allow all access
            if (window.SHIKOLA_CONFIG && window.SHIKOLA_CONFIG.DEMO_MODE) {
                return true;
            }

            switch (this.portalType) {
                case 'super-admin':
                    return userRole === 'superadmin' || userRole === 'super-admin';
                case 'school-admin':
                    return userRole === 'admin' || userRole === 'school-admin' || userRole === 'superadmin' || userRole === 'super-admin';
                case 'teacher-portal':
                    return userRole === 'teacher' || userRole === 'admin' || userRole === 'school-admin' || userRole === 'superadmin' || userRole === 'super-admin';
                case 'pupil-portal':
                    return userRole === 'pupil' || userRole === 'student' || userRole === 'teacher' || userRole === 'admin' || userRole === 'school-admin' || userRole === 'superadmin' || userRole === 'super-admin';
                case 'accountant-portal':
                    return userRole === 'accountant' || userRole === 'admin' || userRole === 'school-admin' || userRole === 'superadmin' || userRole === 'super-admin';
                default:
                    return false;
            }
        }

        handleUnauthorizedAccess() {
            // Show unauthorized message
            this.showUnauthorizedMessage();
            
            // Redirect after delay
            setTimeout(() => {
                this.redirectToSignIn();
            }, 3000);
        }

        showUnauthorizedMessage() {
            const message = document.createElement('div');
            message.className = 'fixed inset-0 bg-red-50 flex items-center justify-center z-50';
            message.innerHTML = `
                <div class="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4">
                    <div class="text-center">
                        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <i class="fas fa-exclamation-triangle text-red-600"></i>
                        </div>
                        <h2 class="text-lg font-medium text-gray-900 mb-2">Access Denied</h2>
                        <p class="text-sm text-gray-600 mb-4">
                            You don't have permission to access this portal. You will be redirected to the sign-in page.
                        </p>
                        <div class="text-xs text-gray-500">
                            Portal: ${this.portalType}<br>
                            Required role: ${this.getRequiredRole()}
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(message);
        }

        getRequiredRole() {
            switch (this.portalType) {
                case 'super-admin': return 'Super Admin';
                case 'school-admin': return 'School Admin';
                case 'teacher-portal': return 'Teacher';
                case 'pupil-portal': return 'Student/Pupil';
                case 'accountant-portal': return 'Accountant';
                default: return 'Unknown';
            }
        }

        redirectToSignIn() {
            // Clear any existing auth data
            if (window.shikolaAuth && window.shikolaAuth.clearSession) {
                window.shikolaAuth.clearSession();
            }
            
            // Redirect to sign-in page
            window.location.href = '/index.html';
        }

        setupAuthMonitoring() {
            // Monitor authentication state changes
            if (window.shikolaAuth) {
                // Check authentication every 30 seconds
                setInterval(() => {
                    if (!window.shikolaAuth.isAuthenticated()) {
                        this.redirectToSignIn();
                    }
                }, 30000);

                // Listen for storage events (for multi-tab logout)
                window.addEventListener('storage', (e) => {
                    if (e.key === 'shikola_logout' || e.key === 'authToken' && !e.newValue) {
                        this.redirectToSignIn();
                    }
                });
            }
        }
    }

    // Initialize the auth guard
    window.portalAuthGuard = new PortalAuthGuard();

    // Export for global access
    window.PortalAuthGuard = PortalAuthGuard;

})();
