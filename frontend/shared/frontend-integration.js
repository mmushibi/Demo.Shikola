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
// Frontend Integration Script
// This script integrates all the frontend management systems

class FrontendIntegration {
    constructor() {
        this.systems = {};
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeSystems();
            });
        } else {
            this.initializeSystems();
        }
    }

    initializeSystems() {
        // Initialize all management systems
        this.initializeAuthManager();
        this.initializeSessionManager();
        this.initializeSubscriptionManager();
        this.initializeTrialManager();
        this.initializeValidationHelper();
        this.initializeRoleUI();
        this.setupSystemCommunication();
        
        console.log('Frontend integration initialized');
    }

    initializeAuthManager() {
        // Check if authManager exists, if not create a basic one
        if (!window.authManager) {
            window.authManager = new BasicAuthManager();
        }
        
        this.systems.auth = window.authManager;
    }

    initializeSessionManager() {
        if (window.sessionManager) {
            this.systems.session = window.sessionManager;
        }
    }

    initializeSubscriptionManager() {
        if (window.subscriptionUI) {
            this.systems.subscription = window.subscriptionUI;
        }
        
        if (window.subscriptionEnforcement) {
            this.systems.enforcement = window.subscriptionEnforcement;
        }
    }

    initializeTrialManager() {
        if (window.trialManager) {
            this.systems.trial = window.trialManager;
        }
    }

    initializeValidationHelper() {
        if (window.validationHelper) {
            this.systems.validation = window.validationHelper;
        }
    }

    initializeRoleUI() {
        if (window.roleUI) {
            this.systems.roleUI = window.roleUI;
        }
    }

    setupSystemCommunication() {
        // Set up communication between systems
        this.setupAuthEvents();
        this.setupSessionEvents();
        this.setupSubscriptionEvents();
        this.setupTrialEvents();
        this.setupValidationEvents();
    }

    setupAuthEvents() {
        // Listen for auth state changes
        document.addEventListener('authStateChanged', (event) => {
            const { isAuthenticated, user, schoolId } = event.detail;
            
            if (isAuthenticated) {
                // User logged in - initialize all systems
                this.onUserLogin(user, schoolId);
            } else {
                // User logged out - clean up all systems
                this.onUserLogout();
            }
        });
    }

    setupSessionEvents() {
        // Listen for session timeout
        if (this.systems.session) {
            // Override session timeout handler to show proper messaging
            const originalHandleTimeout = this.systems.session.handleSessionTimeout;
            this.systems.session.handleSessionTimeout = () => {
                this.showSessionTimeoutModal();
                originalHandleTimeout.call(this.systems.session);
            };
        }
    }

    setupSubscriptionEvents() {
        // Listen for subscription changes
        if (this.systems.subscription) {
            // When subscription data changes, update other systems
            const originalLoadData = this.systems.subscription.loadSubscriptionData;
            this.systems.subscription.loadSubscriptionData = async () => {
                await originalLoadData.call(this.systems.subscription);
                this.onSubscriptionDataChanged();
            };
        }
    }

    setupTrialEvents() {
        // Listen for trial events
        if (this.systems.trial) {
            // When trial expires, show upgrade prompt
            const originalHandleExpired = this.systems.trial.handleTrialExpired;
            this.systems.trial.handleTrialExpired = () => {
                this.onTrialExpired();
                originalHandleExpired.call(this.systems.trial);
            };
        }
    }

    setupValidationEvents() {
        // Set up validation for forms with special requirements
        this.setupSchoolCreationValidation();
        this.setupUserCreationValidation();
        this.setupPromoCodeValidation();
    }

    setupSchoolCreationValidation() {
        const schoolForms = document.querySelectorAll('form[data-school-creation]');
        schoolForms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const schoolData = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phoneNumber: formData.get('phoneNumber'),
                    schoolCode: formData.get('schoolCode'),
                    address: formData.get('address')
                };

                // Validate with backend
                const validation = await this.systems.validation.validateSchoolCreation(schoolData);
                
                if (validation.isValid) {
                    // Proceed with submission
                    form.submit();
                } else {
                    // Show errors
                    this.showValidationErrors(form, validation.errors);
                }
            });
        });
    }

    setupUserCreationValidation() {
        const userForms = document.querySelectorAll('form[data-user-creation]');
        userForms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const userData = {
                    email: formData.get('email'),
                    phoneNumber: formData.get('phoneNumber'),
                    schoolId: formData.get('schoolId'),
                    role: formData.get('role')
                };

                // Validate with backend
                const validation = await this.systems.validation.validateUserCreation(userData);
                
                if (validation.isValid) {
                    // Proceed with submission
                    form.submit();
                } else {
                    // Show errors
                    this.showValidationErrors(form, validation.errors);
                }
            });
        });
    }

    setupPromoCodeValidation() {
        const promoInputs = document.querySelectorAll('input[data-promo-code]');
        promoInputs.forEach(input => {
            input.addEventListener('blur', async () => {
                const code = input.value.trim();
                if (!code) return;

                const validation = await this.systems.validation.validatePromoCode(code);
                
                if (validation.isValid) {
                    this.showPromoSuccess(input, validation);
                } else {
                    this.showPromoError(input, validation.message);
                }
            });
        });
    }

    // Event handlers
    onUserLogin(user, schoolId) {
        console.log('User logged in:', user);
        
        // Initialize all systems that require authentication
        if (this.systems.session) {
            this.systems.session.startSessionMonitoring();
        }
        
        if (this.systems.subscription) {
            this.systems.subscription.loadSubscriptionData();
        }
        
        if (this.systems.enforcement) {
            this.systems.enforcement.startEnforcement();
        }
        
        if (this.systems.trial) {
            this.systems.trial.loadTrialStatus();
        }
        
        if (this.systems.roleUI) {
            this.systems.roleUI.updateUIVisibility();
        }
        
        // Show welcome message if needed
        this.showWelcomeMessage(user);
    }

    onUserLogout() {
        console.log('User logged out');
        
        // Clean up all systems
        if (this.systems.session) {
            this.systems.session.stopSessionMonitoring();
        }
        
        if (this.systems.enforcement) {
            this.systems.enforcement.stopEnforcement();
        }
        
        if (this.systems.trial) {
            this.systems.trial.stopTrialMonitoring();
        }
        
        // Clear any modals or notifications
        this.clearAllModals();
    }

    onSubscriptionDataChanged() {
        // Update role UI when subscription data changes
        if (this.systems.roleUI) {
            this.systems.roleUI.updateUIVisibility();
        }
        
        // Update trial manager if subscription changed
        if (this.systems.trial) {
            this.systems.trial.refreshTrialStatus();
        }
    }

    onTrialExpired() {
        // Show trial expired notification
        this.showTrialExpiredNotification();
        
        // Update subscription enforcement to reflect trial expiry
        if (this.systems.enforcement) {
            this.systems.enforcement.refreshSubscriptionData();
        }
    }

    // UI helpers
    showSessionTimeoutModal() {
        const modal = document.createElement('div');
        modal.id = 'session-timeout-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                <div class="flex items-center mb-4">
                    <svg class="w-6 h-6 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <h3 class="text-lg font-semibold text-gray-900">Session Expired</h3>
                </div>
                <p class="text-gray-600 mb-6">
                    Your session has expired due to inactivity. Please log in again to continue.
                </p>
                <button onclick="window.location.href='/signin'" class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Log In Again
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showTrialExpiredNotification() {
        if (this.systems.trial) {
            this.systems.trial.showNotification('Your trial has expired. Upgrade to continue using all features.', 'warning');
        }
    }

    showWelcomeMessage(user) {
        // Only show welcome message for new users or first login of the day
        const lastLogin = localStorage.getItem('lastLoginDate');
        const today = new Date().toDateString();
        
        if (lastLogin !== today) {
            const welcomeModal = document.createElement('div');
            welcomeModal.id = 'welcome-modal';
            welcomeModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            welcomeModal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                    <div class="flex items-center mb-4">
                        <svg class="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <h3 class="text-lg font-semibold text-gray-900">Welcome Back!</h3>
                    </div>
                    <p class="text-gray-600 mb-6">
                        Welcome back, ${user.name || user.email}! Your session is active and all systems are ready.
                    </p>
                    <button onclick="this.parentElement.parentElement.remove()" class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Get Started
                    </button>
                </div>
            `;

            document.body.appendChild(welcomeModal);
            localStorage.setItem('lastLoginDate', today);
        }
    }

    showValidationErrors(form, errors) {
        // Clear existing errors
        this.systems.validation.clearFormErrors(form);
        
        // Show new errors
        this.systems.validation.showErrors(form, errors.reduce((acc, error) => {
            acc[error.field || 'general'] = error.message;
            return acc;
        }, {}));
    }

    showPromoSuccess(input, validation) {
        input.classList.add('border-green-500');
        input.classList.remove('border-red-500');
        
        const successMsg = document.createElement('div');
        successMsg.className = 'text-green-600 text-sm mt-1';
        successMsg.textContent = validation.message || 'Promo code valid!';
        
        input.parentNode.insertBefore(successMsg, input.nextSibling);
        
        // Remove after 5 seconds
        setTimeout(() => {
            successMsg.remove();
        }, 5000);
    }

    showPromoError(input, message) {
        input.classList.add('border-red-500');
        input.classList.remove('border-green-500');
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'text-red-600 text-sm mt-1';
        errorMsg.textContent = message;
        
        input.parentNode.insertBefore(errorMsg, input.nextSibling);
    }

    clearAllModals() {
        const modals = document.querySelectorAll('[id$="-modal"]');
        modals.forEach(modal => modal.remove());
    }

    // Public API
    getSystem(name) {
        return this.systems[name];
    }

    isReady() {
        return Object.keys(this.systems).length > 0;
    }

    refreshAll() {
        // Refresh all systems
        if (this.systems.subscription) {
            this.systems.subscription.loadSubscriptionData();
        }
        
        if (this.systems.trial) {
            this.systems.trial.refreshTrialStatus();
        }
        
        if (this.systems.enforcement) {
            this.systems.enforcement.refreshSubscriptionData();
        }
    }
}

// Basic Auth Manager fallback
class BasicAuthManager {
    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    }
    
    getToken() {
        return localStorage.getItem('authToken');
    }
    
    getUserRole() {
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
    
    getSchoolId() {
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                return user.schoolId;
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        return null;
    }
    
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/signin';
    }
}

// Initialize frontend integration
window.frontendIntegration = new FrontendIntegration();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrontendIntegration;
}
