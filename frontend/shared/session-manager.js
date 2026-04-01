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
class SessionManager {
    constructor() {
        this.sessionTimeout = null;
        this.warningTimeout = null;
        this.warningShown = false;
        this.sessionCheckInterval = null;
        this.init();
    }

    init() {
        // Start session monitoring when authenticated
        document.addEventListener('authStateChanged', (event) => {
            if (event.detail.isAuthenticated) {
                this.startSessionMonitoring();
            } else {
                this.stopSessionMonitoring();
            }
        });

        // Monitor user activity
        this.setupActivityListeners();

        // Initial load if already authenticated
        if (window.authManager?.isAuthenticated()) {
            this.startSessionMonitoring();
        }
    }

    startSessionMonitoring() {
        const userRole = this.getUserRole();
        const timeoutMinutes = userRole === 'pupil' ? 7 * 24 * 60 : 30; // 7 days for pupils, 30 min for others
        const warningMinutes = 5; // Show warning 5 minutes before expiry

        // Clear existing timeouts
        this.clearTimeouts();

        // Set session timeout
        this.sessionTimeout = setTimeout(() => {
            this.handleSessionTimeout();
        }, timeoutMinutes * 60 * 1000);

        // Set warning timeout
        this.warningTimeout = setTimeout(() => {
            this.showSessionWarning();
        }, (timeoutMinutes - warningMinutes) * 60 * 1000);

        // Start periodic session validation
        this.sessionCheckInterval = setInterval(() => {
            this.validateSession();
        }, 60000); // Check every minute

        console.log(`Session monitoring started for role: ${userRole}, timeout: ${timeoutMinutes} minutes`);
    }

    stopSessionMonitoring() {
        this.clearTimeouts();
        console.log('Session monitoring stopped');
    }

    clearTimeouts() {
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
            this.sessionTimeout = null;
        }
        if (this.warningTimeout) {
            clearTimeout(this.warningTimeout);
            this.warningTimeout = null;
        }
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
            this.sessionCheckInterval = null;
        }
        this.warningShown = false;
    }

    setupActivityListeners() {
        const events = [
            'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
        ];

        events.forEach(event => {
            document.addEventListener(event, () => {
                this.resetSessionTimeout();
            }, { passive: true });
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.resetSessionTimeout();
            }
        });

        // Handle window focus/blur
        window.addEventListener('focus', () => {
            this.resetSessionTimeout();
        });
    }

    resetSessionTimeout() {
        if (!window.authManager?.isAuthenticated()) {
            return;
        }

        // Update session activity on server
        this.updateSessionActivity();

        // Reset local timeouts
        const userRole = this.getUserRole();
        const timeoutMinutes = userRole === 'pupil' ? 7 * 24 * 60 : 30;
        const warningMinutes = 5;

        this.clearTimeouts();

        this.sessionTimeout = setTimeout(() => {
            this.handleSessionTimeout();
        }, timeoutMinutes * 60 * 1000);

        this.warningTimeout = setTimeout(() => {
            this.showSessionWarning();
        }, (timeoutMinutes - warningMinutes) * 60 * 1000);
    }

    async updateSessionActivity() {
        try {
            const sessionId = this.getSessionId();
            if (!sessionId) return;

            const response = await fetch('/api/session/update-activity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ sessionId })
            });

            if (!response.ok) {
                console.warn('Failed to update session activity');
            }
        } catch (error) {
            console.error('Error updating session activity:', error);
        }
    }

    async validateSession() {
        try {
            const sessionId = this.getSessionId();
            if (!sessionId) return;

            const response = await fetch(`/api/session/validate/${sessionId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (!response.ok) {
                console.warn('Session validation failed, logging out');
                this.handleSessionTimeout();
            }
        } catch (error) {
            console.error('Error validating session:', error);
        }
    }

    showSessionWarning() {
        if (this.warningShown) return;
        this.warningShown = true;

        const userRole = this.getUserRole();
        const timeRemaining = userRole === 'pupil' ? '5 minutes' : '5 minutes';

        // Create warning modal
        const warningModal = document.createElement('div');
        warningModal.id = 'session-warning-modal';
        warningModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        warningModal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                <div class="flex items-center mb-4">
                    <svg class="w-6 h-6 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <h3 class="text-lg font-semibold text-gray-900">Session Expiring Soon</h3>
                </div>
                <p class="text-gray-600 mb-6">
                    Your session will expire in ${timeRemaining} due to inactivity. Would you like to extend your session?
                </p>
                <div class="flex gap-3">
                    <button id="extend-session-btn" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Extend Session
                    </button>
                    <button id="logout-now-btn" class="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                        Logout Now
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(warningModal);

        // Add event listeners
        document.getElementById('extend-session-btn').addEventListener('click', () => {
            this.extendSession();
            this.hideWarning();
        });

        document.getElementById('logout-now-btn').addEventListener('click', () => {
            this.logout();
        });

        // Auto-hide after 4.5 minutes and logout
        setTimeout(() => {
            if (document.getElementById('session-warning-modal')) {
                this.logout();
            }
        }, 4.5 * 60 * 1000);
    }

    hideWarning() {
        const warningModal = document.getElementById('session-warning-modal');
        if (warningModal) {
            warningModal.remove();
        }
        this.warningShown = false;
    }

    extendSession() {
        this.resetSessionTimeout();
        this.showNotification('Session extended', 'success');
    }

    handleSessionTimeout() {
        this.showNotification('Your session has expired. Please log in again.', 'warning');
        setTimeout(() => {
            this.logout();
        }, 3000);
    }

    async logout() {
        try {
            // Call logout API
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            // Clear local auth data
            if (window.authManager) {
                window.authManager.logout();
            } else {
                // Fallback logout
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.href = '/signin?reason=session_expired';
            }
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Helper methods
    getUserRole() {
        if (window.authManager) {
            return window.authManager.getUserRole();
        }
        
        // Fallback to localStorage
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                return user.role;
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        
        return 'unknown';
    }

    getSessionId() {
        return document.cookie.split(';')
            .find(cookie => cookie.trim().startsWith('sessionId='))
            ?.split('=')[1];
    }

    getAuthToken() {
        if (window.authManager) {
            return window.authManager.getToken();
        }
        
        // Fallback to localStorage
        return localStorage.getItem('authToken');
    }

    // Public API for external use
    isSessionActive() {
        return this.sessionTimeout !== null;
    }

    getRemainingTime() {
        if (!this.sessionTimeout) return 0;
        
        const now = Date.now();
        const timeoutTime = this.sessionTimeout.getStartTime?.() || (now + 30 * 60 * 1000);
        return Math.max(0, timeoutTime - now);
    }
}

// Initialize session manager
window.sessionManager = new SessionManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionManager;
}
