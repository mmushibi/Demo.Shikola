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
// Operations Portal API Integration - Refined Architecture
class OperationsAPI {
    constructor() {
        this.baseURL = window.SHIKOLA_API_BASE || 'http://localhost:3000';
        this.token = null;
        this.init();
    }

    init() {
        this.token = localStorage.getItem('shikola_token') || localStorage.getItem('authToken');
        if (!this.token) {
            console.warn('No authentication token found');
            this.redirectToLogin();
        }
    }

    redirectToLogin() {
        window.location.href = '../../public/index.html';
    }

    isOperationsPortal() {
        try {
            return String(window.location.pathname || '').toLowerCase().includes('operations-portal');
        } catch (_e) {
            return false;
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                this.redirectToLogin();
                return null;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // REFINED OPERATIONS ENDPOINTS

    // Authentication
    async login(credentials) {
        const result = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (result && result.success && result.data.token) {
            this.setToken(result.data.token);
        }
        
        return result;
    }

    async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async forgotPassword(email) {
        return await this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    async changePassword(passwordData) {
        return await this.request('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify(passwordData)
        });
    }

    async getCurrentUser() {
        return await this.request('/auth/me', {
            method: 'GET'
        });
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('shikola_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('shikola_token');
        localStorage.removeItem('authToken');
    }

    isAuthenticated() {
        return !!this.token;
    }

    logout() {
        this.clearToken();
        this.redirectToLogin();
    }

    // 1. Dashboard - Bird's Eye View
    async getDashboardMetrics() {
        return await this.request('/api/operations/dashboard');
    }

    async getPlatformAlerts() {
        return await this.request('/api/operations/alerts');
    }

    // 2. Schools (Tenant Management)
    async getSchools(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/api/operations/schools?${params}`);
    }

    async getSchoolDetails(schoolId) {
        return await this.request(`/api/operations/schools/${schoolId}`);
    }

    async updateSchoolStatus(schoolId, status, reason) {
        return await this.request(`/api/operations/schools/${schoolId}/status`, {
            method: 'POST',
            body: JSON.stringify({ status, reason })
        });
    }

    async updateSchoolSubscription(schoolId, planId, expiryDate) {
        return await this.request(`/api/operations/schools/${schoolId}/subscription`, {
            method: 'POST',
            body: JSON.stringify({ planId, expiryDate })
        });
    }

    async toggleSchoolFeatures(schoolId, features) {
        return await this.request(`/api/operations/schools/${schoolId}/features`, {
            method: 'POST',
            body: JSON.stringify({ features })
        });
    }

    async updateSchoolStorage(schoolId, storageQuota) {
        return await this.request(`/api/operations/schools/${schoolId}/storage`, {
            method: 'POST',
            body: JSON.stringify({ storageQuota })
        });
    }

    async bulkSchoolOnboarding(schoolsData) {
        return await this.request('/api/operations/bulk-school-onboarding', {
            method: 'POST',
            body: JSON.stringify({ schools: schoolsData })
        });
    }

    async createSchool(schoolData) {
        return await this.request('/api/operations/schools', {
            method: 'POST',
            body: JSON.stringify(schoolData)
        });
    }

    async updateSchool(schoolId, schoolData) {
        return await this.request(`/api/operations/schools/${schoolId}`, {
            method: 'PUT',
            body: JSON.stringify(schoolData)
        });
    }

    async deleteSchool(schoolId) {
        return await this.request(`/api/operations/schools/${schoolId}`, {
            method: 'DELETE'
        });
    }

    async toggleSchoolStatus(schoolId, status) {
        return await this.request(`/api/operations/schools/${schoolId}/toggle-status`, {
            method: 'POST',
            body: JSON.stringify({ status })
        });
    }

    // 3. Billing & Subscriptions (Revenue Operations)
    async getBillingOverview() {
        return await this.request('/api/operations/billing/overview');
    }

    async getInvoices(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/api/operations/billing/invoices?${params}`);
    }

    async generateInvoice(schoolId, billingPeriod, amount) {
        return await this.request('/api/operations/billing/invoices', {
            method: 'POST',
            body: JSON.stringify({ schoolId, billingPeriod, amount })
        });
    }

    async extendPaymentGracePeriod(schoolId, days, reason) {
        return await this.request('/api/operations/billing/grace-period', {
            method: 'POST',
            body: JSON.stringify({ schoolId, days, reason })
        });
    }

    async manageDiscountCodes() {
        return await this.request('/api/operations/billing/discount-codes');
    }

    async getRevenueTrends(period = 'monthly') {
        return await this.request(`/api/operations/billing/revenue-trends?period=${period}`);
    }

    // Support & Helpdesk
    async getSupportTickets(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/api/operations/support/tickets?${params}`);
    }

    async getTicketDetails(ticketId) {
        return await this.request(`/api/operations/support/tickets/${ticketId}`);
    }

    async assignTicket(ticketId, assigneeId) {
        return await this.request(`/api/operations/support/tickets/${ticketId}/assign`, {
            method: 'POST',
            body: JSON.stringify({ assigneeId })
        });
    }

    async resolveTicket(ticketId, resolution, satisfactionScore = 5) {
        return await this.request(`/api/operations/support/tickets/${ticketId}/resolve`, {
            method: 'POST',
            body: JSON.stringify({ resolution, satisfactionScore })
        });
    }

    async escalateTicket(ticketId, escalationLevel, reason) {
        return await this.request(`/api/operations/support/tickets/${ticketId}/escalate`, {
            method: 'POST',
            body: JSON.stringify({ escalationLevel, reason })
        });
    }

    async getAvailableStaff() {
        return await this.request('/api/operations/support/staff');
    }

    // 5. Users (Admin/Staff Management Only) - Enhanced with real backend
    async getUsers(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/api/operations/users?${params}`);
    }

    async createUser(userData) {
        return await this.request('/api/operations/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async updateUser(userId, userData) {
        return await this.request(`/api/operations/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    // Profile Management
    async getUserDetails(userId) {
        if (userId === 'me') {
            return await this.request('/api/profile/me');
        }
        return await this.request(`/api/profile/${userId}`);
    }

    async updateUser(userId, userData) {
        if (userId === 'me') {
            return await this.request('/api/profile/me', {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        }
        return await this.request(`/api/profile/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async resetUserPassword(userId, passwordData) {
        if (userId === 'me') {
            return await this.request('/api/profile/change-password', {
                method: 'POST',
                body: JSON.stringify(passwordData)
            });
        }
        return await this.request(`/api/operations/users/${userId}/reset-password`, {
            method: 'POST'
        });
    }

    async deleteUser(userId) {
        return await this.request(`/api/operations/users/${userId}`, {
            method: 'DELETE'
        });
    }

    async changePassword(passwordData) {
        return await this.request('/api/profile/change-password', {
            method: 'POST',
            body: JSON.stringify(passwordData)
        });
    }

    async getCurrentUser() {
        return await this.request('/auth/me', {
            method: 'GET'
        });
    }

    async updateCurrentUser(userData) {
        return await this.request('/api/profile/me', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async createInvoice(invoiceData) {
        return await this.request('/api/operations/billing/invoices', {
            method: 'POST',
            body: JSON.stringify(invoiceData)
        });
    }

    async updateSubscriptionStatus(schoolId, statusData) {
        return await this.request(`/api/operations/schools/${schoolId}/subscription`, {
            method: 'POST',
            body: JSON.stringify(statusData)
        });
    }

    async getAdminUsers(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/api/operations/users/admins?${params}`);
    }

    async getOperationsStaff() {
        return await this.request('/api/operations/users/staff');
    }

    async getAvailableStaff() {
        return await this.request('/api/operations/support/staff');
    }

    async createAdminUser(userData) {
        return await this.request('/api/operations/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async updateAdminUser(userId, userData) {
        return await this.request(`/api/operations/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deactivateAdminUser(userId, reason) {
        return await this.request(`/api/operations/users/${userId}`, {
            method: 'DELETE',
            body: JSON.stringify({ reason })
        });
    }

    async generateCustomReport(config) {
        return await this.request('/api/operations/reports/custom', {
            method: 'POST',
            body: JSON.stringify(config)
        });
    }

    // 6. Reports (Cross-School Data) - Enhanced with real backend
    async getCrossSchoolReports(reportType, filters = {}) {
        const params = new URLSearchParams({ reportType, ...filters });
        return await this.request(`/api/operations/reports/cross-school?${params}`);
    }

    async getComplianceReports(complianceType, dateRange) {
        const params = new URLSearchParams({ complianceType, ...dateRange });
        return await this.request(`/api/operations/reports/compliance?${params}`);
    }

    async exportReport(reportId, format = 'pdf') {
        return await this.request(`/api/operations/reports/${reportId}/export?format=${format}`);
    }

    // New report endpoints with real backend integration
    async getSubscriptionReports(reportType, dateRange) {
        const params = new URLSearchParams({ reportType, dateRange });
        return await this.request(`/api/operations/reports/subscription?${params}`);
    }

    async getUserReports(reportType, dateRange) {
        const params = new URLSearchParams({ reportType, dateRange });
        return await this.request(`/api/operations/reports/users?${params}`);
    }

    async getTicketReports(reportType, dateRange) {
        const params = new URLSearchParams({ reportType, dateRange });
        return await this.request(`/api/operations/reports/tickets?${params}`);
    }

    async getSchoolReports(reportType, dateRange) {
        const params = new URLSearchParams({ reportType, dateRange });
        return await this.request(`/api/operations/reports/schools?${params}`);
    }

    async getAuditReports(auditType, dateRange) {
        const params = new URLSearchParams({ auditType, dateRange });
        return await this.request(`/api/operations/reports/audit?${params}`);
    }

    // 7. Service Health (Not System Monitoring)
    async getServiceHealth() {
        return await this.request('/api/operations/service-health');
    }

    async getServiceIntegrations() {
        return await this.request('/api/operations/service-health/integrations');
    }

    async restartService(serviceId) {
        return await this.request(`/api/operations/service-health/${serviceId}/restart`, {
            method: 'POST'
        });
    }

    async toggleMaintenanceMode(enabled, reason) {
        return await this.request('/api/operations/maintenance-mode', {
            method: 'POST',
            body: JSON.stringify({ enabled, reason })
        });
    }

    // 8. Communications (Mass Notifications)
    async sendSystemAnnouncement(announcement) {
        return await this.request('/api/operations/communications/announcement', {
            method: 'POST',
            body: JSON.stringify(announcement)
        });
    }

    async getAnnouncementHistory() {
        return await this.request('/api/operations/communications/announcements');
    }

    async scheduleAnnouncement(announcement, scheduledTime) {
        return await this.request('/api/operations/communications/schedule', {
            method: 'POST',
            body: JSON.stringify({ announcement, scheduledTime })
        });
    }

    async getCommunicationStats() {
        return await this.request('/api/operations/communications/stats');
    }

    // 9. Audit Logs (Accountability)
    async getAuditLogs(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/api/operations/audit-logs?${params}`);
    }

    async getAuditLogDetails(logId) {
        return await this.request(`/api/operations/audit-logs/${logId}`);
    }

    async exportAuditLogs(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/api/operations/audit-logs/export?${params}`);
    }

    // 10. Global Configuration (Non-technical)
    async getGlobalSettings() {
        return await this.request('/api/operations/global-settings');
    }

    async updateGlobalSetting(settingKey, value) {
        return await this.request('/api/operations/global-settings', {
            method: 'POST',
            body: JSON.stringify({ key: settingKey, value })
        });
    }

    async getFeatureFlags() {
        return await this.request('/api/operations/feature-flags');
    }

    async toggleFeatureFlag(flagKey, enabled) {
        return await this.request('/api/operations/feature-flags', {
            method: 'POST',
            body: JSON.stringify({ key: flagKey, enabled })
        });
    }

    // 11. Specialized Operations Actions
    async impersonateSchoolAdmin(schoolId) {
        return await this.request('/api/operations/impersonate', {
            method: 'POST',
            body: JSON.stringify({ schoolId, targetRole: 'school_admin' })
        });
    }

    async endImpersonation() {
        return await this.request('/api/operations/impersonation/end', {
            method: 'POST'
        });
    }

    async getImpersonationHistory() {
        return await this.request('/api/operations/impersonation/history');
    }

    // LEGACY ENDPOINTS (for backward compatibility)
    async getSystemMetrics() {
        return await this.request('/api/operations/system-metrics');
    }

    async getDatabaseStats() {
        return await this.request('/api/operations/database-stats');
    }

    async getErrorLogs() {
        return await this.request('/api/operations/error-logs');
    }

    async getAccessLogs() {
        return await this.request('/api/operations/access-logs');
    }

    async getPerformanceMetrics() {
        return await this.request('/api/operations/performance-metrics');
    }

    async getFinancialOverview() {
        return await this.request('/api/operations/financial-overview');
    }
}

// Initialize the API
window.operationsAPI = new OperationsAPI();
window.OperationsAPI = window.operationsAPI; // Backward compatibility
