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
class TrialManager {
    constructor() {
        this.trialData = null;
        this.countdownInterval = null;
        this.init();
    }

    init() {
        // Start trial monitoring when authenticated
        document.addEventListener('authStateChanged', (event) => {
            if (event.detail.isAuthenticated) {
                this.loadTrialStatus();
            } else {
                this.stopTrialMonitoring();
            }
        });

        // Initial load if already authenticated
        if (window.authManager?.isAuthenticated()) {
            this.loadTrialStatus();
        }
    }

    async loadTrialStatus() {
        try {
            const schoolId = this.getSchoolId();
            if (!schoolId) return;

            const response = await fetch(`/api/trial/status/${schoolId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (response.ok) {
                this.trialData = await response.json();
                this.updateTrialUI();
                this.startCountdown();
            }
        } catch (error) {
            console.error('Error loading trial status:', error);
        }
    }

    updateTrialUI() {
        if (!this.trialData) return;

        // Update trial banner
        this.updateTrialBanner();

        // Update trial indicators
        this.updateTrialIndicators();

        // Show/hide trial-specific features
        this.updateTrialFeatures();

        // Handle trial expiry
        if (this.trialData.isTrial && !this.trialData.isActive) {
            this.handleTrialExpired();
        }
    }

    updateTrialBanner() {
        const banner = document.getElementById('trial-banner');
        if (!banner) return;

        if (this.trialData.isTrial && this.trialData.isActive) {
            banner.classList.remove('hidden');
            const daysRemaining = this.trialData.daysRemainingInTrial || 0;
            
            banner.innerHTML = `
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3">
                    <div class="container mx-auto flex items-center justify-between">
                        <div class="flex items-center">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span class="font-medium">
                                ${daysRemaining > 0 ? `${daysRemaining} days left in your trial` : 'Trial expires today!'}
                            </span>
                        </div>
                        <div class="flex items-center gap-3">
                            <button onclick="window.trialManager.showUpgradeModal()" class="bg-white text-blue-600 px-4 py-1 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
                                Upgrade Now
                            </button>
                            <button onclick="window.trialManager.hideBanner()" class="text-white hover:text-gray-200">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            banner.classList.add('hidden');
        }
    }

    updateTrialIndicators() {
        // Update trial status badges
        const badges = document.querySelectorAll('[data-trial-status]');
        badges.forEach(badge => {
            if (this.trialData.isTrial) {
                badge.textContent = 'Trial';
                badge.className = badge.className.replace(/bg-\w+-100/g, 'bg-yellow-100');
                badge.className = badge.className.replace(/text-\w+-800/g, 'text-yellow-800');
            } else {
                badge.textContent = 'Active';
                badge.className = badge.className.replace(/bg-yellow-100/g, 'bg-green-100');
                badge.className = badge.className.replace(/text-yellow-800/g, 'text-green-800');
            }
        });

        // Update countdown displays
        const countdowns = document.querySelectorAll('[data-trial-countdown]');
        countdowns.forEach(countdown => {
            if (this.trialData.isTrial && this.trialData.daysRemainingInTrial > 0) {
                countdown.textContent = `${this.trialData.daysRemainingInTrial} days`;
            } else {
                countdown.textContent = 'Expired';
            }
        });
    }

    updateTrialFeatures() {
        // Show/hide trial-specific features
        const trialFeatures = document.querySelectorAll('[data-trial-feature]');
        trialFeatures.forEach(feature => {
            const featureName = feature.dataset.trialFeature;
            const isAvailable = this.isTrialFeatureAvailable(featureName);
            
            feature.style.display = isAvailable ? '' : 'none';
            
            if (!isAvailable) {
                // Add upgrade prompt
                this.addTrialUpgradePrompt(feature, featureName);
            }
        });

        // Handle trial limitations
        const trialLimits = document.querySelectorAll('[data-trial-limit]');
        trialLimits.forEach(limit => {
            const limitType = limit.dataset.trialLimit;
            const isLimited = this.isTrialLimited(limitType);
            
            if (isLimited) {
                limit.classList.add('opacity-75');
                limit.setAttribute('title', 'Limited during trial period');
            }
        });
    }

    isTrialFeatureAvailable(featureName) {
        // Check if feature is available during trial
        const trialFeatures = [
            'dashboard', 'user_management', 'class_management', 
            'attendance', 'basic_reports', 'pupil_management'
        ];
        
        return this.trialData.isTrial && trialFeatures.includes(featureName);
    }

    isTrialLimited(limitType) {
        // Check if feature is limited during trial
        const limitedFeatures = [
            'advanced_reports', 'api_access', 'bulk_operations',
            'advanced_analytics', 'custom_integrations'
        ];
        
        return this.trialData.isTrial && limitedFeatures.includes(limitType);
    }

    addTrialUpgradePrompt(element, featureName) {
        if (element.dataset.trialPromptAdded === 'true') return;

        const prompt = document.createElement('div');
        prompt.className = 'text-xs text-orange-600 mt-1';
        prompt.innerHTML = `
            <button class="underline hover:no-underline" onclick="window.trialManager.showUpgradeModal('${featureName}')">
                Upgrade to unlock ${featureName}
            </button>
        `;

        element.parentNode.insertBefore(prompt, element.nextSibling);
        element.dataset.trialPromptAdded = 'true';
    }

    startCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        if (!this.trialData?.isTrial || !this.trialData.trialEndDate) return;

        this.countdownInterval = setInterval(() => {
            this.updateCountdown();
        }, 60000); // Update every minute
    }

    stopTrialMonitoring() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        this.trialData = null;
    }

    updateCountdown() {
        if (!this.trialData?.trialEndDate) return;

        const now = new Date();
        const trialEnd = new Date(this.trialData.trialEndDate);
        const diffTime = trialEnd - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        this.trialData.daysRemainingInTrial = Math.max(0, diffDays);
        this.updateTrialUI();

        if (diffDays <= 0) {
            this.handleTrialExpired();
        }
    }

    handleTrialExpired() {
        // Show expired modal
        this.showTrialExpiredModal();

        // Update UI to reflect expired status
        this.trialData.isActive = false;
        this.updateTrialUI();

        // Stop countdown
        this.stopTrialMonitoring();
    }

    showTrialExpiredModal() {
        const modal = document.createElement('div');
        modal.id = 'trial-expired-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                <div class="flex items-center mb-4">
                    <svg class="w-6 h-6 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="text-lg font-semibold text-gray-900">Trial Expired</h3>
                </div>
                <p class="text-gray-600 mb-6">
                    Your trial period has ended. Upgrade to a paid plan to continue using all features without interruption.
                </p>
                <div class="space-y-3">
                    <button id="upgrade-trial-btn" class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Choose a Plan
                    </button>
                    <button id="close-expired-btn" class="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                        Continue with Limited Features
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('upgrade-trial-btn').addEventListener('click', () => {
            window.location.href = '/pricing';
        });

        document.getElementById('close-expired-btn').addEventListener('click', () => {
            this.hideTrialExpiredModal();
        });
    }

    showUpgradeModal(featureName = null) {
        const modal = document.createElement('div');
        modal.id = 'trial-upgrade-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                <div class="flex items-center mb-4">
                    <svg class="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    <h3 class="text-lg font-semibold text-gray-900">Upgrade Your Plan</h3>
                </div>
                <p class="text-gray-600 mb-6">
                    ${featureName ? `Unlock ${featureName} and all premium features by upgrading to a paid plan.` : 'Get unlimited access to all features by upgrading to a paid plan.'}
                </p>
                <div class="space-y-3">
                    <button id="view-plans-btn" class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        View Plans & Pricing
                    </button>
                    <button id="close-upgrade-btn" class="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                        Maybe Later
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('view-plans-btn').addEventListener('click', () => {
            window.location.href = '/pricing';
        });

        document.getElementById('close-upgrade-btn').addEventListener('click', () => {
            this.hideUpgradeModal();
        });
    }

    hideBanner() {
        const banner = document.getElementById('trial-banner');
        if (banner) {
            banner.classList.add('hidden');
        }
    }

    hideTrialExpiredModal() {
        const modal = document.getElementById('trial-expired-modal');
        if (modal) {
            modal.remove();
        }
    }

    hideUpgradeModal() {
        const modal = document.getElementById('trial-upgrade-modal');
        if (modal) {
            modal.remove();
        }
    }

    // Promo code handling
    async applyPromoCode(code) {
        try {
            const response = await fetch('/api/promo/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ code: code })
            });

            const result = await response.json();
            
            if (result.isValid) {
                // Reload trial status to reflect promo code changes
                await this.loadTrialStatus();
                this.showNotification('Promo code applied successfully!', 'success');
            } else {
                this.showNotification(result.message || 'Invalid promo code', 'error');
            }
            
            return result;
        } catch (error) {
            console.error('Error applying promo code:', error);
            this.showNotification('Error applying promo code', 'error');
            return { isValid: false, message: 'Service unavailable' };
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
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
    getSchoolId() {
        if (window.authManager) {
            return window.authManager.getSchoolId();
        }
        
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

    getAuthToken() {
        if (window.authManager) {
            return window.authManager.getToken();
        }
        return localStorage.getItem('authToken');
    }

    // Public API
    getTrialStatus() {
        return this.trialData;
    }

    isTrialActive() {
        return this.trialData?.isTrial && this.trialData?.isActive;
    }

    getDaysRemaining() {
        return this.trialData?.daysRemainingInTrial || 0;
    }

    refreshTrialStatus() {
        this.loadTrialStatus();
    }
}

// Initialize trial manager
window.trialManager = new TrialManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrialManager;
}
