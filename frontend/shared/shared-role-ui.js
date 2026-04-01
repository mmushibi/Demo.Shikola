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
// Shared Role-based UI Visibility System for Shikola Portals
class ShikolaRoleUI {
    constructor() {
        this.currentRole = null;
        this.init();
    }

    init() {
        // Listen for user updates from auth system
        window.addEventListener('shikola:user-updated', (event) => {
            this.currentRole = event.detail?.user?.role || null;
            this.updateUIVisibility();
        });

        // Initial setup
        if (window.shikolaAuth && window.shikolaAuth.currentUser) {
            this.currentRole = window.shikolaAuth.currentUser.role;
            this.updateUIVisibility();
        }
    }

    // Role-based visibility helpers
    hasRole(role) {
        return this.currentRole === role;
    }

    hasAnyRole(roles) {
        if (!Array.isArray(roles)) return false;
        return roles.includes(this.currentRole);
    }

    hasAllRoles(roles) {
        if (!Array.isArray(roles)) return false;
        return roles.every(role => this.currentRole === role);
    }

    // Get subscription-based permissions
    getSubscriptionBasedPermissions() {
        const subscriptionFeatures = Array.from(window.subscriptionUI.availableFeatures);
        const role = this.currentRole;

        // Map subscription features to role-based permissions
        const rolePermissions = {};
        
        // Super admin gets all subscription features
        rolePermissions.superadmin = subscriptionFeatures;
        
        // Admin gets most features except system-level ones
        rolePermissions.admin = subscriptionFeatures.filter(feature => 
            !['system_health', 'subscription_management', 'platform_staff'].includes(feature)
        );
        
        // Teacher gets academic features
        rolePermissions.teacher = subscriptionFeatures.filter(feature => 
            ['class_management', 'attendance', 'exams', 'reports', 'student_grades', 'assignment_management'].includes(feature)
        );
        
        // Accountant gets financial features
        rolePermissions.accountant = subscriptionFeatures.filter(feature => 
            ['fee_management', 'payment_processing', 'financial_reports'].includes(feature)
        );

        return rolePermissions;
    }

    // Enhanced feature access check that considers both role and subscription
    canAccessFeature(feature) {
        // First check subscription-based access
        if (window.subscriptionUI && window.subscriptionUI.availableFeatures.size > 0) {
            return window.subscriptionUI.canAccessFeature(feature) && 
                   this.getSubscriptionBasedPermissions()[this.currentRole]?.includes(feature) || false;
        }

        // Fallback to role-based permissions
        const permissions = this.getRolePermissions();
        return permissions[this.currentRole]?.includes(feature) || false;
    }

    // Check if user can perform action based on usage limits
    canPerformAction(actionType) {
        if (window.subscriptionUI) {
            return window.subscriptionUI.checkLimitCapacity(actionType);
        }
        return true; // No limit checking if subscription UI not available
    }

    getRolePermissions() {
        // Check if subscription-based permissions are available
        if (window.subscriptionUI && window.subscriptionUI.availableFeatures.size > 0) {
            return this.getSubscriptionBasedPermissions();
        }

        // Fallback to hardcoded role permissions
        return {
            superadmin: [
                'system_health', 'user_management', 'school_provisioning', 
                'subscription_management', 'activity_logs', 'global_settings',
                'impersonation', 'analytics', 'platform_staff', 'coupons'
            ],
            admin: [
                'school_profile', 'student_management', 'teacher_management',
                'class_management', 'attendance', 'exams', 'reports',
                'fee_management', 'notifications', 'school_settings'
            ],
            teacher: [
                'class_management', 'attendance', 'exams', 'reports',
                'student_grades', 'assignment_management'
            ],
            accountant: [
                'fee_management', 'payment_processing', 'financial_reports',
                'invoice_management', 'budget_tracking'
            ],
            pupil: [
                'view_grades', 'view_attendance', 'view_timetable',
                'view_assignments', 'messages', 'profile_management'
            ]
        };
    }

    // Update UI element visibility based on current role
    updateUIVisibility() {
        if (!this.currentRole) return;

        // Handle elements with data-role-require attribute
        const roleElements = document.querySelectorAll('[data-role-require]');
        roleElements.forEach(element => {
            const requiredRoles = this.parseRoleAttribute(element.dataset.roleRequire);
            const hasPermission = this.hasAnyRole(requiredRoles);
            
            this.setElementVisibility(element, hasPermission);
        });

        // Handle elements with data-feature-require attribute
        const featureElements = document.querySelectorAll('[data-feature-require]');
        featureElements.forEach(element => {
            const requiredFeatures = this.parseFeatureAttribute(element.dataset.featureRequire);
            const hasPermission = requiredFeatures.every(feature => this.canAccessFeature(feature));
            
            this.setElementVisibility(element, hasPermission);
        });

        // Handle elements with data-role-hide attribute
        const hideElements = document.querySelectorAll('[data-role-hide]');
        hideElements.forEach(element => {
            const hiddenRoles = this.parseRoleAttribute(element.dataset.roleHide);
            const shouldHide = this.hasAnyRole(hiddenRoles);
            
            this.setElementVisibility(element, !shouldHide);
        });

        // Handle disabled state for buttons/inputs
        const disabledElements = document.querySelectorAll('[data-role-disable]');
        disabledElements.forEach(element => {
            const disabledRoles = this.parseRoleAttribute(element.dataset.roleDisable);
            const shouldDisable = this.hasAnyRole(disabledRoles);
            
            element.disabled = shouldDisable;
            if (shouldDisable) {
                element.setAttribute('aria-disabled', 'true');
            } else {
                element.removeAttribute('aria-disabled');
            }
        });
    }

    setElementVisibility(element, visible) {
        if (visible) {
            element.style.display = '';
            element.removeAttribute('aria-hidden');
            element.classList.remove('role-hidden');
        } else {
            element.style.display = 'none';
            element.setAttribute('aria-hidden', 'true');
            element.classList.add('role-hidden');
        }
    }

    parseRoleAttribute(attribute) {
        if (!attribute) return [];
        return attribute.split(',').map(role => role.trim().toLowerCase()).filter(Boolean);
    }

    parseFeatureAttribute(attribute) {
        if (!attribute) return [];
        return attribute.split(',').map(feature => feature.trim().toLowerCase()).filter(Boolean);
    }

    // Helper functions for common role checks
    isSuperAdmin() {
        return this.hasRole('superadmin');
    }

    isAdmin() {
        return this.hasRole('admin');
    }

    isTeacher() {
        return this.hasRole('teacher');
    }

    isManagement() {
        return this.hasRole('admin');
    }

    isStaff() {
        return this.hasAnyRole(['admin', 'teacher', 'accountant']);
    }

    isPlatformStaff() {
        return this.hasAnyRole(['sales', 'subscriptions', 'marketing']);
    }

    // Dynamic role checking for complex conditions
    canManageUsers() {
        return this.hasAnyRole(['superadmin', 'admin']);
    }

    canViewReports() {
        return this.hasAnyRole(['superadmin', 'admin', 'teacher', 'accountant']);
    }

    canManageFinances() {
        return this.hasAnyRole(['superadmin', 'admin', 'accountant']);
    }

    canAccessSystemSettings() {
        return this.hasAnyRole(['superadmin', 'admin']);
    }
}

// Initialize the role UI system
window.shikolaRoleUI = new ShikolaRoleUI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShikolaRoleUI;
}
