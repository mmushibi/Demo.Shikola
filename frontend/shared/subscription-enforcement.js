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
class SubscriptionEnforcement {
    constructor() {
        this.subscriptionData = null;
        this.enforcementEnabled = true;
        this.checkInterval = null;
        this.init();
    }

    init() {
        // Start enforcement when authenticated
        document.addEventListener('authStateChanged', (event) => {
            if (event.detail.isAuthenticated) {
                this.startEnforcement();
            } else {
                this.stopEnforcement();
            }
        });

        // Monitor page changes for dynamic content
        this.observePageChanges();

        // Initial load if already authenticated
        if (window.authManager?.isAuthenticated()) {
            this.startEnforcement();
        }
    }

    startEnforcement() {
        // Load subscription data
        this.loadSubscriptionData();
        
        // Start periodic checks
        this.checkInterval = setInterval(() => {
            this.enforceSubscriptionLimits();
        }, 30000); // Check every 30 seconds

        // Enforce immediately
        this.enforceSubscriptionLimits();

        console.log('Subscription enforcement started');
    }

    stopEnforcement() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.subscriptionData = null;
        console.log('Subscription enforcement stopped');
    }

    async loadSubscriptionData() {
        try {
            const schoolId = this.getSchoolId();
            if (!schoolId) return;

            // Load subscription features
            const featuresResponse = await fetch(`/api/subscription/features/${schoolId}`);
            if (featuresResponse.ok) {
                const features = await featuresResponse.json();
                this.subscriptionData = { features: new Set(features.map(f => f.toLowerCase())) };
            }

            // Load usage limits
            const limitsResponse = await fetch(`/api/subscription/limits/${schoolId}`);
            if (limitsResponse.ok) {
                const limits = await limitsResponse.json();
                this.subscriptionData = { ...this.subscriptionData, limits };
            }

            // Load current usage
            const usageResponse = await fetch(`/api/subscription/usage/${schoolId}`);
            if (usageResponse.ok) {
                const usage = await usageResponse.json();
                this.subscriptionData = { ...this.subscriptionData, usage };
            }

        } catch (error) {
            console.error('Error loading subscription data:', error);
        }
    }

    enforceSubscriptionLimits() {
        if (!this.enforcementEnabled || !this.subscriptionData) return;

        // Enforce feature access
        this.enforceFeatureAccess();

        // Enforce usage limits
        this.enforceUsageLimits();

        // Update UI indicators
        this.updateUsageIndicators();
    }

    enforceFeatureAccess() {
        // Handle elements with data-feature-require attribute
        const featureElements = document.querySelectorAll('[data-feature-require]');
        featureElements.forEach(element => {
            const requiredFeatures = this.parseFeatureAttribute(element.dataset.featureRequire);
            const hasPermission = requiredFeatures.every(feature => this.canAccessFeature(feature));
            
            this.setElementVisibility(element, hasPermission);
            
            // Add subscription upgrade prompt
            if (!hasPermission && element.dataset.upgradePrompt !== 'false') {
                this.addUpgradePrompt(element, requiredFeatures);
            }
        });

        // Handle navigation menu items
        this.enforceNavigationAccess();
    }

    enforceUsageLimits() {
        // Handle elements with data-limit-require attribute
        const limitElements = document.querySelectorAll('[data-limit-require]');
        limitElements.forEach(element => {
            const requiredLimit = element.dataset.limitRequire;
            const hasCapacity = this.checkLimitCapacity(requiredLimit);
            
            this.setElementVisibility(element, hasCapacity);
            
            // Disable interactive elements when limit reached
            if (!hasCapacity && (element.tagName === 'BUTTON' || element.tagName === 'A')) {
                element.disabled = true;
                element.classList.add('opacity-50', 'cursor-not-allowed');
                
                // Add limit warning
                this.addLimitWarning(element, requiredLimit);
            }
        });

        // Handle form submissions that might exceed limits
        this.enforceFormLimits();
    }

    enforceNavigationAccess() {
        const navItems = document.querySelectorAll('nav a, .navigation a');
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (!href) return;

            // Check if navigation requires specific features
            const featureRequired = item.dataset.featureRequire;
            if (featureRequired) {
                const hasAccess = this.canAccessFeature(featureRequired);
                if (!hasAccess) {
                    item.classList.add('opacity-50', 'cursor-not-allowed');
                    item.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.showUpgradeModal(featureRequired);
                    });
                }
            }
        });
    }

    enforceFormLimits() {
        const forms = document.querySelectorAll('form[data-limit-check]');
        forms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                const limitType = form.dataset.limitCheck;
                if (!this.checkLimitCapacity(limitType)) {
                    e.preventDefault();
                    this.showLimitExceededModal(limitType);
                    return false;
                }
            });
        });
    }

    canAccessFeature(featureName) {
        if (!this.subscriptionData?.features) return false;
        return this.subscriptionData.features.has(featureName.toLowerCase());
    }

    checkLimitCapacity(limitType) {
        if (!this.subscriptionData?.limits || !this.subscriptionData?.usage) return true;

        const limitKey = `${limitType}_limit`;
        const usageKey = `${limitType}_usage`;

        const limit = this.subscriptionData.limits[limitKey];
        const usage = this.subscriptionData.usage[usageKey];

        if (!limit) return true; // No limit defined
        if (!usage) return true; // No usage tracked

        return usage < limit;
    }

    getRemainingCapacity(limitType) {
        if (!this.subscriptionData?.limits || !this.subscriptionData?.usage) return Infinity;

        const limitKey = `${limitType}_limit`;
        const usageKey = `${limitType}_usage`;

        const limit = this.subscriptionData.limits[limitKey];
        const usage = this.subscriptionData.usage[usageKey];

        if (!limit) return Infinity;
        if (!usage) return limit;

        return limit - usage;
    }

    getUsagePercentage(limitType) {
        if (!this.subscriptionData?.limits || !this.subscriptionData?.usage) return 0;

        const limitKey = `${limitType}_limit`;
        const usageKey = `${limitType}_usage`;

        const limit = this.subscriptionData.limits[limitKey];
        const usage = this.subscriptionData.usage[usageKey];

        if (!limit) return 0;
        if (!usage) return 0;

        return (usage / limit) * 100;
    }

    updateUsageIndicators() {
        Object.keys(this.subscriptionData?.limits || {}).forEach(limitKey => {
            const featureName = limitKey.replace('_limit', '');
            const usageKey = `${featureName}_usage`;
            
            if (this.subscriptionData.usage[usageKey] !== undefined) {
                const limit = this.subscriptionData.limits[limitKey];
                const usage = this.subscriptionData.usage[usageKey];
                const percentage = (usage / limit) * 100;

                // Update progress bars
                const progressBar = document.querySelector(`[data-usage-bar="${featureName}"]`);
                if (progressBar) {
                    progressBar.style.width = `${Math.min(percentage, 100)}%`;
                    progressBar.setAttribute('aria-valuenow', usage);
                    progressBar.setAttribute('aria-valuemax', limit);
                    
                    // Update color based on percentage
                    progressBar.className = progressBar.className.replace(/bg-\w+-500/g, '');
                    if (percentage >= 95) {
                        progressBar.classList.add('bg-red-500');
                    } else if (percentage >= 80) {
                        progressBar.classList.add('bg-yellow-500');
                    } else {
                        progressBar.classList.add('bg-green-500');
                    }
                }

                // Update usage text
                const usageText = document.querySelector(`[data-usage-text="${featureName}"]`);
                if (usageText) {
                    usageText.textContent = `${usage} / ${limit}`;
                }

                // Update warning indicators
                const warningElement = document.querySelector(`[data-usage-warning="${featureName}"]`);
                if (warningElement) {
                    warningElement.classList.toggle('hidden', percentage < 80);
                    warningElement.textContent = `${percentage.toFixed(1)}% used`;
                }
            }
        });
    }

    addUpgradePrompt(element, requiredFeatures) {
        // Check if upgrade prompt already exists
        if (element.dataset.upgradeAdded === 'true') return;

        const prompt = document.createElement('div');
        prompt.className = 'text-xs text-orange-600 mt-1';
        prompt.innerHTML = `
            <button class="underline hover:no-underline" onclick="window.subscriptionEnforcement.showUpgradeModal('${requiredFeatures.join(',')}')">
                Upgrade to access this feature
            </button>
        `;

        element.parentNode.insertBefore(prompt, element.nextSibling);
        element.dataset.upgradeAdded = 'true';
    }

    addLimitWarning(element, limitType) {
        // Check if warning already exists
        if (element.dataset.limitWarningAdded === 'true') return;

        const remaining = this.getRemainingCapacity(limitType);
        const warning = document.createElement('div');
        warning.className = 'text-xs text-red-600 mt-1';
        warning.textContent = `Limit reached (${remaining} remaining)`;

        element.parentNode.insertBefore(warning, element.nextSibling);
        element.dataset.limitWarningAdded = 'true';
    }

    showUpgradeModal(featureNames) {
        const modal = document.createElement('div');
        modal.id = 'subscription-upgrade-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                <div class="flex items-center mb-4">
                    <svg class="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    <h3 class="text-lg font-semibold text-gray-900">Upgrade Required</h3>
                </div>
                <p class="text-gray-600 mb-6">
                    This feature requires a higher subscription plan. Upgrade your plan to unlock this and other premium features.
                </p>
                <div class="flex gap-3">
                    <button id="view-plans-btn" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        View Plans
                    </button>
                    <button id="close-upgrade-btn" class="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                        Close
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

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideUpgradeModal();
            }
        });
    }

    showLimitExceededModal(limitType) {
        const remaining = this.getRemainingCapacity(limitType);
        const modal = document.createElement('div');
        modal.id = 'limit-exceeded-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                <div class="flex items-center mb-4">
                    <svg class="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <h3 class="text-lg font-semibold text-gray-900">Limit Exceeded</h3>
                </div>
                <p class="text-gray-600 mb-6">
                    You have reached the limit for ${limitType}. You have ${remaining} remaining. Upgrade your plan to increase your limits.
                </p>
                <div class="flex gap-3">
                    <button id="upgrade-limit-btn" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Upgrade Plan
                    </button>
                    <button id="close-limit-btn" class="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('upgrade-limit-btn').addEventListener('click', () => {
            window.location.href = '/pricing';
        });

        document.getElementById('close-limit-btn').addEventListener('click', () => {
            this.hideLimitExceededModal();
        });
    }

    hideUpgradeModal() {
        const modal = document.getElementById('subscription-upgrade-modal');
        if (modal) {
            modal.remove();
        }
    }

    hideLimitExceededModal() {
        const modal = document.getElementById('limit-exceeded-modal');
        if (modal) {
            modal.remove();
        }
    }

    observePageChanges() {
        // Monitor for dynamic content changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if new elements need enforcement
                            this.enforceSubscriptionLimits();
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Helper methods
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

    // Public API
    enableEnforcement() {
        this.enforcementEnabled = true;
        this.enforceSubscriptionLimits();
    }

    disableEnforcement() {
        this.enforcementEnabled = false;
        // Show all elements
        document.querySelectorAll('.subscription-hidden').forEach(element => {
            element.style.display = '';
            element.removeAttribute('aria-hidden');
            element.classList.remove('subscription-hidden');
        });
    }

    refreshSubscriptionData() {
        this.loadSubscriptionData();
    }

    isFeatureAvailable(featureName) {
        return this.canAccessFeature(featureName);
    }

    getSubscriptionInfo() {
        return this.subscriptionData;
    }
}

// Initialize subscription enforcement
window.subscriptionEnforcement = new SubscriptionEnforcement();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubscriptionEnforcement;
}
