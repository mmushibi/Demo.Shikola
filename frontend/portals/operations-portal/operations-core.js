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
/**
 * Operations Portal - Refined Architecture Implementation
 * Based on the Operations Officer (OO) role specifications
 */

// Global configuration for Operations Officer permissions
const OPERATIONS_CONFIG = {
    role: 'operations',
    permissions: {
        // Tenant Management Permissions
        schools: {
            view: ['basic_info', 'status', 'subscription', 'feature_flags', 'domain', 'storage_usage', 'activity_stats'],
            edit: ['contact_info', 'status_toggle', 'subscription_plan', 'feature_enable_disable', 'domain_setup', 'storage_quota'],
            restricted: ['internal_data', 'student_records', 'financial_details', 'permanent_delete']
        },
        
        // User Management (Admin/Staff only)
        users: {
            view: ['admin_users', 'operations_staff', 'user_activity'],
            edit: ['admin_accounts', 'operations_accounts', 'role_assignments'],
            restricted: ['student_accounts', 'teacher_accounts', 'parent_accounts']
        },
        
        // Billing & Subscriptions
        billing: {
            view: ['subscription_plans', 'payment_status', 'invoice_history', 'revenue_trends'],
            edit: ['invoice_generation', 'payment_extensions', 'discount_codes', 'plan_upgrades'],
            restricted: ['refund_processing', 'payment_gateway_config']
        },
        
        // Support & Helpdesk
        support: {
            view: ['all_tickets', 'ticket_history', 'escalation_queue'],
            edit: ['ticket_assignment', 'ticket_resolution', 'customer_communications'],
            restricted: ['system_bug_reports', 'security_incidents']
        },
        
        // Reports & Analytics
        reports: {
            view: ['cross_tenant_metrics', 'compliance_reports', 'performance_analytics'],
            edit: ['report_scheduling', 'custom_report_generation'],
            restricted: ['raw_database_exports', 'sensitive_data_reports']
        },
        
        // Service Health
        health: {
            view: ['service_status', 'integration_health', 'performance_metrics'],
            edit: ['service_restart', 'maintenance_mode_toggle'],
            restricted: ['server_controls', 'database_operations']
        },
        
        // Global Configuration
        config: {
            view: ['platform_settings', 'feature_toggles', 'maintenance_status'],
            edit: ['global_settings', 'feature_flags', 'maintenance_mode'],
            restricted: ['api_keys', 'database_strings', 'security_configs']
        }
    },
    
    // Safeguard rules
    safeguards: {
        soft_delete_only: true,
        audit_all_actions: true,
        impersonation_logging: true,
        bulk_operations_approval: false
    }
};

// Permission checking utility
class OperationsPermissions {
    static hasPermission(category, action, item) {
        const userRole = getCurrentUserRole();
        if (userRole !== 'operations') return false;
        
        const config = OPERATIONS_CONFIG.permissions[category];
        if (!config) return false;
        
        // Check if item is in allowed list
        const allowedItems = config[action] || [];
        const restrictedItems = config.restricted || [];
        
        return allowedItems.includes(item) && !restrictedItems.includes(item);
    }
    
    static canView(category, item) {
        return this.hasPermission(category, 'view', item);
    }
    
    static canEdit(category, item) {
        return this.hasPermission(category, 'edit', item);
    }
    
    static isRestricted(category, item) {
        const config = OPERATIONS_CONFIG.permissions[category];
        return config?.restricted?.includes(item) || false;
    }
}

// Audit logging for Operations actions
class OperationsAuditLogger {
    static async logAction(action, details) {
        const auditEntry = {
            userId: getCurrentUserId(),
            role: 'operations',
            action: action,
            entity: details.entity,
            entityId: details.entityId,
            oldValues: details.oldValues,
            newValues: details.newValues,
            ipAddress: await getClientIP(),
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            category: details.category || 'general'
        };
        
        // Send to backend for persistent storage
        try {
            await fetch('/api/operations/audit-log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify(auditEntry)
            });
        } catch (error) {
            console.error('Failed to log audit entry:', error);
        }
        
        // Also store locally for immediate reference
        this.storeLocalAudit(auditEntry);
    }
    
    static storeLocalAudit(entry) {
        const auditLog = JSON.parse(localStorage.getItem('operations_audit_log') || '[]');
        auditLog.unshift(entry);
        
        // Keep only last 1000 entries locally
        if (auditLog.length > 1000) {
            auditLog.splice(1000);
        }
        
        localStorage.setItem('operations_audit_log', JSON.stringify(auditLog));
    }
    
    static getLocalAudit(filter = {}) {
        let auditLog = JSON.parse(localStorage.getItem('operations_audit_log') || '[]');
        
        if (filter.category) {
            auditLog = auditLog.filter(entry => entry.category === filter.category);
        }
        
        if (filter.dateFrom) {
            auditLog = auditLog.filter(entry => new Date(entry.timestamp) >= new Date(filter.dateFrom));
        }
        
        if (filter.dateTo) {
            auditLog = auditLog.filter(entry => new Date(entry.timestamp) <= new Date(filter.dateTo));
        }
        
        return auditLog;
    }
}

// Impersonation functionality with strict logging
class OperationsImpersonation {
    static async impersonateSchoolAdmin(schoolId, schoolName) {
        // Check permission
        if (!OperationsPermissions.canEdit('schools', 'impersonation')) {
            throw new Error('Insufficient permissions for impersonation');
        }
        
        // Log before impersonation
        await OperationsAuditLogger.logAction('impersonation_start', {
            entity: 'school',
            entityId: schoolId,
            category: 'security',
            details: `Impersonating ${schoolName} (ID: ${schoolId})`
        });
        
        try {
            // Request impersonation token from backend
            const response = await fetch('/api/operations/impersonate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({ schoolId, targetRole: 'school_admin' })
            });
            
            if (!response.ok) {
                throw new Error('Impersonation request failed');
            }
            
            const data = await response.json();
            
            // Store impersonation state
            const impersonationState = {
                originalToken: getAuthToken(),
                impersonationToken: data.token,
                schoolId: schoolId,
                schoolName: schoolName,
                startTime: new Date().toISOString()
            };
            
            localStorage.setItem('operations_impersonation', JSON.stringify(impersonationState));
            
            // Redirect to school admin portal
            window.open(`/school-admin/?impersonation=true`, '_blank');
            
        } catch (error) {
            await OperationsAuditLogger.logAction('impersonation_failed', {
                entity: 'school',
                entityId: schoolId,
                category: 'security',
                details: `Failed to impersonate ${schoolName}: ${error.message}`
            });
            throw error;
        }
    }
    
    static async endImpersonation() {
        const impersonationState = JSON.parse(localStorage.getItem('operations_impersonation') || '{}');
        
        if (impersonationState.originalToken) {
            await OperationsAuditLogger.logAction('impersonation_end', {
                entity: 'school',
                entityId: impersonationState.schoolId,
                category: 'security',
                details: `Ended impersonation of ${impersonationState.schoolName}`
            });
            
            // Restore original token
            localStorage.setItem('authToken', impersonationState.originalToken);
            localStorage.removeItem('operations_impersonation');
            
            // Close impersonated window and return to operations
            window.close();
        }
    }
    
    static isImpersonating() {
        return !!localStorage.getItem('operations_impersonation');
    }
    
    static getImpersonationState() {
        return JSON.parse(localStorage.getItem('operations_impersonation') || '{}');
    }
}

// Bulk operations with safeguards
class OperationsBulkOperations {
    static async bulkSchoolOnboarding(schoolsData) {
        // Validate data first
        const validationResult = await this.validateBulkSchoolData(schoolsData);
        if (!validationResult.valid) {
            throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
        }
        
        // Log bulk operation
        await OperationsAuditLogger.logAction('bulk_onboarding_start', {
            entity: 'schools',
            category: 'tenant_management',
            details: `Starting bulk onboarding of ${schoolsData.length} schools`
        });
        
        try {
            const response = await fetch('/api/operations/bulk-school-onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({ schools: schoolsData })
            });
            
            const result = await response.json();
            
            await OperationsAuditLogger.logAction('bulk_onboarding_complete', {
                entity: 'schools',
                category: 'tenant_management',
                details: `Bulk onboarding completed: ${result.successful} successful, ${result.failed} failed`
            });
            
            return result;
            
        } catch (error) {
            await OperationsAuditLogger.logAction('bulk_onboarding_failed', {
                entity: 'schools',
                category: 'tenant_management',
                details: `Bulk onboarding failed: ${error.message}`
            });
            throw error;
        }
    }
    
    static async validateBulkSchoolData(schoolsData) {
        // Implement validation logic
        const errors = [];
        
        for (const school of schoolsData) {
            if (!school.name || school.name.trim() === '') {
                errors.push('School name is required');
            }
            
            if (!school.email || !isValidEmail(school.email)) {
                errors.push(`Invalid email for ${school.name}`);
            }
            
            if (!school.subscription_plan) {
                errors.push(`Subscription plan required for ${school.name}`);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// Service health monitoring
class OperationsServiceHealth {
    static async getServiceHealth() {
        try {
            const response = await fetch('/api/operations/service-health', {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });
            
            const services = await response.json();
            
            // Categorize services
            return {
                critical: services.filter(s => s.category === 'critical'),
                integrations: services.filter(s => s.category === 'integration'),
                infrastructure: services.filter(s => s.category === 'infrastructure'),
                overall: this.calculateOverallHealth(services)
            };
            
        } catch (error) {
            console.error('Failed to fetch service health:', error);
            return { error: 'Unable to fetch service health data' };
        }
    }
    
    static calculateOverallHealth(services) {
        const totalServices = services.length;
        const healthyServices = services.filter(s => s.status === 'healthy').length;
        const percentage = totalServices > 0 ? (healthyServices / totalServices) * 100 : 0;
        
        if (percentage >= 95) return 'excellent';
        if (percentage >= 85) return 'good';
        if (percentage >= 70) return 'fair';
        return 'poor';
    }
    
    static async toggleMaintenanceMode(enabled, reason) {
        if (!OperationsPermissions.canEdit('config', 'maintenance_mode')) {
            throw new Error('Insufficient permissions to toggle maintenance mode');
        }
        
        await OperationsAuditLogger.logAction('maintenance_mode_toggle', {
            entity: 'platform',
            category: 'configuration',
            details: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}: ${reason}`
        });
        
        const response = await fetch('/api/operations/maintenance-mode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ enabled, reason })
        });
        
        return await response.json();
    }
}

// Communication hub for system-wide announcements
class OperationsCommunications {
    static async sendSystemAnnouncement(announcement) {
        if (!OperationsPermissions.canEdit('communications', 'system_announcements')) {
            throw new Error('Insufficient permissions to send system announcements');
        }
        
        await OperationsAuditLogger.logAction('announcement_sent', {
            entity: 'announcement',
            category: 'communications',
            details: `System announcement: ${announcement.title}`
        });
        
        const response = await fetch('/api/operations/system-announcement', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(announcement)
        });
        
        return await response.json();
    }
    
    static async getAnnouncementHistory() {
        const response = await fetch('/api/operations/announcements', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        return await response.json();
    }
}

// Utility functions
function getCurrentUserRole() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    } catch (error) {
        return null;
    }
}

function getCurrentUserId() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.nameid || payload.sub;
    } catch (error) {
        return null;
    }
}

function getAuthToken() {
    return localStorage.getItem('authToken') || localStorage.getItem('shikola_token');
}

async function getClientIP() {
    try {
        const response = await fetch('/api/operations/client-ip', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        const data = await response.json();
        return data.ip || 'unknown';
    } catch (error) {
        console.warn('Unable to fetch client IP:', error);
        return 'unknown';
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Export operations utilities
window.OperationsConfig = OPERATIONS_CONFIG;
window.OperationsPermissions = OperationsPermissions;
window.OperationsAuditLogger = OperationsAuditLogger;
window.OperationsImpersonation = OperationsImpersonation;
window.OperationsBulkOperations = OperationsBulkOperations;
window.OperationsServiceHealth = OperationsServiceHealth;
window.OperationsCommunications = OperationsCommunications;
