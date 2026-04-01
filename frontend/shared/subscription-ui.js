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
class SubscriptionUIManager {
    constructor() {
        this.subscriptionData = null;
        this.availableFeatures = new Set();
        this.usageLimits = {};
        this.currentUsage = {};
        this.init();
    }

    async init() {
        // Load subscription data when authentication state changes
        document.addEventListener('authStateChanged', (event) => {
            if (event.detail.isAuthenticated) {
                this.loadSubscriptionData();
            } else {
                this.clearSubscriptionData();
            }
        });

        // Initial load if already authenticated
        if (window.authManager?.isAuthenticated()) {
            this.loadSubscriptionData();
        }
    }

    async loadSubscriptionData() {
        try {
            const schoolId = this.getSchoolId();
            if (!schoolId) return;

            // Load subscription features
            const featuresResponse = await fetch(`/api/subscription/features/${schoolId}`);
            if (featuresResponse.ok) {
                const features = await featuresResponse.json();
                this.availableFeatures = new Set(features.map(f => f.toLowerCase()));
            }

            // Load usage limits
            const limitsResponse = await fetch(`/api/subscription/limits/${schoolId}`);
            if (limitsResponse.ok) {
                this.usageLimits = await limitsResponse.json();
            }

            // Load current usage
            const usageResponse = await fetch(`/api/subscription/usage/${schoolId}`);
            if (usageResponse.ok) {
                this.currentUsage = await usageResponse.json();
            }

            // Update UI
            this.updateUIVisibility();
            this.updateUsageIndicators();

        } catch (error) {
            console.error('Error loading subscription data:', error);
        }
    }

    clearSubscriptionData() {
        this.subscriptionData = null;
        this.availableFeatures.clear();
        this.usageLimits = {};
        this.currentUsage = {};
        this.updateUIVisibility();
    }

    updateUIVisibility() {
        // Handle elements with data-feature-require attribute
        const featureElements = document.querySelectorAll('[data-feature-require]');
        featureElements.forEach(element => {
            const requiredFeatures = this.parseFeatureAttribute(element.dataset.featureRequire);
            const hasPermission = requiredFeatures.every(feature => this.canAccessFeature(feature));
            
            this.setElementVisibility(element, hasPermission);
        });

        // Handle elements with data-limit-require attribute
        const limitElements = document.querySelectorAll('[data-limit-require]');
        limitElements.forEach(element => {
            const requiredLimit = element.dataset.limitRequire;
            const hasCapacity = this.checkLimitCapacity(requiredLimit);
            
            this.setElementVisibility(element, hasCapacity);
        });

        // Handle disabled state for buttons/inputs based on limits
        const disabledElements = document.querySelectorAll('[data-limit-disable]');
        disabledElements.forEach(element => {
            const limitType = element.dataset.limitDisable;
            const shouldDisable = !this.checkLimitCapacity(limitType);
            
            element.disabled = shouldDisable;
            if (shouldDisable) {
                element.setAttribute('aria-disabled', 'true');
                element.title = `Limit reached for ${limitType}`;
            } else {
                element.removeAttribute('aria-disabled');
                element.removeAttribute('title');
            }
        });
    }

    updateUsageIndicators() {
        // Update usage progress bars and indicators
        Object.keys(this.usageLimits).forEach(limitKey => {
            const featureName = limitKey.replace('_limit', '');
            const usageKey = `${featureName}_usage`;
            
            if (this.currentUsage[usageKey] !== undefined) {
                const limit = this.usageLimits[limitKey];
                const usage = this.currentUsage[usageKey];
                const percentage = (usage / limit) * 100;

                // Update progress bars
                const progressBar = document.querySelector(`[data-usage-bar="${featureName}"]`);
                if (progressBar) {
                    progressBar.style.width = `${Math.min(percentage, 100)}%`;
                    progressBar.setAttribute('aria-valuenow', usage);
                    progressBar.setAttribute('aria-valuemin', 0);
                    progressBar.setAttribute('aria-valuemax', limit);
                }

                // Update usage text
                const usageText = document.querySelector(`[data-usage-text="${featureName}"]`);
                if (usageText) {
                    usageText.textContent = `${usage} / ${limit}`;
                }

                // Update warning classes
                const warningElement = document.querySelector(`[data-usage-warning="${featureName}"]`);
                if (warningElement) {
                    warningElement.classList.toggle('text-yellow-600', percentage >= 80);
                    warningElement.classList.toggle('text-red-600', percentage >= 95);
                }
            }
        });
    }

    canAccessFeature(featureName) {
        return this.availableFeatures.has(featureName.toLowerCase());
    }

    checkLimitCapacity(limitType) {
        const limitKey = `${limitType}_limit`;
        const usageKey = `${limitType}_usage`;

        if (!this.usageLimits[limitKey]) return true; // No limit defined
        if (!this.currentUsage[usageKey]) return true; // No usage tracked

        const limit = this.usageLimits[limitKey];
        const usage = this.currentUsage[usageKey];

        return usage < limit;
    }

    getRemainingCapacity(limitType) {
        const limitKey = `${limitType}_limit`;
        const usageKey = `${limitType}_usage`;

        if (!this.usageLimits[limitKey]) return Infinity;
        if (!this.currentUsage[usageKey]) return this.usageLimits[limitKey];

        return this.usageLimits[limitKey] - this.currentUsage[usageKey];
    }

    getUsagePercentage(limitType) {
        const limitKey = `${limitType}_limit`;
        const usageKey = `${limitType}_usage`;

        if (!this.usageLimits[limitKey]) return 0;
        if (!this.currentUsage[usageKey]) return 0;

        return (this.currentUsage[usageKey] / this.usageLimits[limitKey]) * 100;
    }

    parseFeatureAttribute(attribute) {
        if (!attribute) return [];
        return attribute.split(',').map(feature => feature.trim().toLowerCase()).filter(Boolean);
    }

    setElementVisibility(element, visible) {
        if (visible) {
            element.style.display = '';
            element.removeAttribute('aria-hidden');
            element.classList.remove('subscription-hidden');
        } else {
            element.style.display = 'none';
            element.setAttribute('aria-hidden', 'true');
            element.classList.add('subscription-hidden');
        }
    }

    getSchoolId() {
        // Get school ID from auth manager or localStorage
        if (window.authManager) {
            return window.authManager.getSchoolId();
        }
        
        // Fallback to localStorage
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

    // Helper functions for common subscription checks
    hasFeature(featureName) {
        return this.canAccessFeature(featureName);
    }

    canAddMoreUsers() {
        return this.checkLimitCapacity('users');
    }

    canUploadMoreFiles() {
        return this.checkLimitCapacity('storage');
    }

    canMakeMoreApiCalls() {
        return this.checkLimitCapacity('api_calls');
    }

    // Show subscription upgrade modal
    showUpgradeModal(featureName = null) {
        const modal = document.getElementById('subscription-upgrade-modal');
        if (modal) {
            if (featureName) {
                const featureText = modal.querySelector('[data-feature-name]');
                if (featureText) {
                    featureText.textContent = featureName;
                }
            }
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    // Hide subscription upgrade modal
    hideUpgradeModal() {
        const modal = document.getElementById('subscription-upgrade-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    // Show usage warning
    showUsageWarning(limitType, currentUsage, limit) {
        const warningElement = document.getElementById(`usage-warning-${limitType}`);
        if (warningElement) {
            const percentage = (currentUsage / limit) * 100;
            warningElement.textContent = `Warning: ${currentUsage} of ${limit} ${limitType} used (${percentage.toFixed(1)}%)`;
            warningElement.classList.remove('hidden');
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                warningElement.classList.add('hidden');
            }, 10000);
        }
    }
}

// Initialize subscription UI manager
window.subscriptionUI = new SubscriptionUIManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubscriptionUIManager;
}
