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
 * General Settings Manager - Real-time API Integration with Offline Support
 * Handles all general settings operations with automatic offline storage and sync
 */

class GeneralSettingsManager {
    constructor() {
        this.apiBaseUrl = window.API_CONFIG?.BASE_URL || '/api';
        this.isOnline = navigator.onLine;
        this.offlineStorage = new Map();
        this.syncQueue = [];
        this.lastSyncTime = localStorage.getItem('shikola_settings_last_sync') || null;
        
        // Settings categories
        this.categories = {
            profile: 'profile',
            branches: 'branches', 
            particulars: 'particulars',
            discounts: 'discounts',
            banks: 'banks',
            rules: 'rules',
            grading: 'grading',
            break_config: 'break_config'
        };

        this.init();
    }

    init() {
        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnlineStatusChange(true));
        window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
        
        // Start periodic sync when online
        if (this.isOnline) {
            this.startPeriodicSync();
        }
        
        // Load cached data
        this.loadCachedData();
        
        console.log('General Settings Manager initialized');
    }

    handleOnlineStatusChange(isOnline) {
        this.isOnline = isOnline;
        
        if (isOnline) {
            console.log('Connection restored - starting sync');
            this.processSyncQueue();
            this.startPeriodicSync();
        } else {
            console.log('Connection lost - enabling offline mode');
            this.stopPeriodicSync();
        }
        
        // Update UI indicators
        this.updateConnectionStatus(isOnline);
    }

    updateConnectionStatus(isOnline) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.className = isOnline ? 'status-online' : 'status-offline';
            statusElement.innerHTML = isOnline ? 
                '<i class="fas fa-wifi"></i> Online' : 
                '<i class="fas fa-wifi-slash"></i> Offline';
        }
    }

    async loadCachedData() {
        try {
            for (const [category, key] of Object.entries(this.categories)) {
                const cached = localStorage.getItem(`shikola_settings_${key}`);
                if (cached) {
                    this.offlineStorage.set(category, JSON.parse(cached));
                }
            }
        } catch (error) {
            console.error('Failed to load cached data:', error);
        }
    }

    async saveToCache(category, data) {
        try {
            localStorage.setItem(`shikola_settings_${this.categories[category]}`, JSON.stringify(data));
            this.offlineStorage.set(category, data);
        } catch (error) {
            console.error(`Failed to cache ${category} data:`, error);
        }
    }

    // API Request Wrapper with Offline Support
    async makeRequest(endpoint, options = {}) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        
        if (!this.isOnline) {
            return this.handleOfflineRequest(endpoint, options);
        }

        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Cache successful responses
            if (response.status < 300) {
                const category = this.getCategoryFromEndpoint(endpoint);
                await this.saveToCache(category, data.data || data);
            }

            return data;
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            
            // Fall back to cached data if available
            const category = this.getCategoryFromEndpoint(endpoint);
            const cachedData = this.offlineStorage.get(category);
            
            if (cachedData) {
                console.log(`Using cached data for ${category}`);
                return { success: true, data: cachedData, cached: true };
            }
            
            throw error;
        }
    }

    async handleOfflineRequest(endpoint, options) {
        const category = this.getCategoryFromEndpoint(endpoint);
        
        if (options.method && options.method !== 'GET') {
            // Queue non-GET requests for when we come back online
            this.syncQueue.push({
                endpoint,
                options,
                timestamp: Date.now(),
                category
            });
            
            return {
                success: true,
                message: 'Request queued for sync when online',
                queued: true
            };
        }
        
        // Return cached data for GET requests
        const cachedData = this.offlineStorage.get(category);
        if (cachedData) {
            return { success: true, data: cachedData, cached: true };
        }
        
        throw new Error('No cached data available offline');
    }

    getCategoryFromEndpoint(endpoint) {
        if (endpoint.includes('/profile')) return 'profile';
        if (endpoint.includes('/branches')) return 'branches';
        if (endpoint.includes('/particulars')) return 'particulars';
        if (endpoint.includes('/discounts')) return 'discounts';
        if (endpoint.includes('/banks')) return 'banks';
        if (endpoint.includes('/rules')) return 'rules';
        if (endpoint.includes('/grading')) return 'grading';
        if (endpoint.includes('/break-config')) return 'break_config';
        return 'unknown';
    }

    getAuthToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }

    // Profile Settings Methods
    async getProfileSettings() {
        try {
            const response = await this.makeRequest('/settings/profile');
            return response.data || response;
        } catch (error) {
            console.error('Failed to get profile settings:', error);
            throw error;
        }
    }

    async saveProfileSettings(data) {
        try {
            const response = await this.makeRequest('/settings/profile', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                await this.saveToCache('profile', data);
                this.showNotification('Profile settings saved successfully', 'success');
            }
            
            return response;
        } catch (error) {
            console.error('Failed to save profile settings:', error);
            this.showNotification('Failed to save profile settings', 'error');
            throw error;
        }
    }

    // Branch Management Methods
    async getBranches() {
        try {
            const response = await this.makeRequest('/settings/branches');
            return response.data || response;
        } catch (error) {
            console.error('Failed to get branches:', error);
            throw error;
        }
    }

    async saveBranches(data) {
        try {
            const response = await this.makeRequest('/settings/branches', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                await this.saveToCache('branches', response.data);
                this.showNotification('Branches saved successfully', 'success');
            }
            
            return response;
        } catch (error) {
            console.error('Failed to save branches:', error);
            this.showNotification('Failed to save branches', 'error');
            throw error;
        }
    }

    // Fee Particulars Methods
    async getParticulars() {
        try {
            const response = await this.makeRequest('/settings/particulars');
            return response.data || response;
        } catch (error) {
            console.error('Failed to get fee particulars:', error);
            throw error;
        }
    }

    async saveParticulars(data) {
        try {
            const response = await this.makeRequest('/settings/particulars', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                await this.saveToCache('particulars', response.data);
                this.showNotification('Fee particulars saved successfully', 'success');
            }
            
            return response;
        } catch (error) {
            console.error('Failed to save fee particulars:', error);
            this.showNotification('Failed to save fee particulars', 'error');
            throw error;
        }
    }

    // Fee Discounts Methods
    async getDiscounts() {
        try {
            const response = await this.makeRequest('/settings/discounts');
            return response.data || response;
        } catch (error) {
            console.error('Failed to get fee discounts:', error);
            throw error;
        }
    }

    async saveDiscounts(data) {
        try {
            const response = await this.makeRequest('/settings/discounts', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                await this.saveToCache('discounts', response.data);
                this.showNotification('Fee discounts saved successfully', 'success');
            }
            
            return response;
        } catch (error) {
            console.error('Failed to save fee discounts:', error);
            this.showNotification('Failed to save fee discounts', 'error');
            throw error;
        }
    }

    // Bank Accounts Methods
    async getBanks() {
        try {
            const response = await this.makeRequest('/settings/banks');
            return response.data || response;
        } catch (error) {
            console.error('Failed to get bank accounts:', error);
            throw error;
        }
    }

    async saveBanks(data) {
        try {
            const response = await this.makeRequest('/settings/banks', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                await this.saveToCache('banks', response.data);
                this.showNotification('Bank accounts saved successfully', 'success');
            }
            
            return response;
        } catch (error) {
            console.error('Failed to save bank accounts:', error);
            this.showNotification('Failed to save bank accounts', 'error');
            throw error;
        }
    }

    // School Rules Methods
    async getRules() {
        try {
            const response = await this.makeRequest('/settings/rules');
            return response.data || response;
        } catch (error) {
            console.error('Failed to get school rules:', error);
            throw error;
        }
    }

    async saveRules(data) {
        try {
            const response = await this.makeRequest('/settings/rules', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                await this.saveToCache('rules', data);
                this.showNotification('School rules saved successfully', 'success');
            }
            
            return response;
        } catch (error) {
            console.error('Failed to save school rules:', error);
            this.showNotification('Failed to save school rules', 'error');
            throw error;
        }
    }

    // Grading Settings Methods
    async getGradingSettings() {
        try {
            const response = await this.makeRequest('/settings/grading');
            return response.data || response;
        } catch (error) {
            console.error('Failed to get grading settings:', error);
            throw error;
        }
    }

    async saveGradingSettings(data) {
        try {
            const response = await this.makeRequest('/settings/grading', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                await this.saveToCache('grading', data);
                this.showNotification('Grading settings saved successfully', 'success');
            }
            
            return response;
        } catch (error) {
            console.error('Failed to save grading settings:', error);
            this.showNotification('Failed to save grading settings', 'error');
            throw error;
        }
    }

    async saveCustomScale(data) {
        try {
            const response = await this.makeRequest('/settings/grading/scales', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                // Refresh grading settings cache
                await this.getGradingSettings();
                this.showNotification('Custom grading scale created successfully', 'success');
            }
            
            return response;
        } catch (error) {
            console.error('Failed to save custom scale:', error);
            this.showNotification('Failed to save custom scale', 'error');
            throw error;
        }
    }

    // Break Configuration Methods
    async getBreakConfiguration() {
        try {
            const response = await this.makeRequest('/settings/break-config');
            return response.data || response;
        } catch (error) {
            console.error('Failed to get break configuration:', error);
            throw error;
        }
    }

    async saveBreakConfiguration(data) {
        try {
            const response = await this.makeRequest('/settings/break-config', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                await this.saveToCache('break_config', data);
                this.showNotification('Break configuration saved successfully', 'success');
            }
            
            return response;
        } catch (error) {
            console.error('Failed to save break configuration:', error);
            this.showNotification('Failed to save break configuration', 'error');
            throw error;
        }
    }

    // Sync Queue Management
    async processSyncQueue() {
        if (this.syncQueue.length === 0) return;
        
        console.log(`Processing ${this.syncQueue.length} queued sync operations`);
        
        const syncData = {
            ChangedCategories: [],
            ProfileData: null,
            BranchData: [],
            ParticularData: [],
            DiscountData: [],
            BankData: [],
            RulesData: null,
            GradingData: null,
            BreakConfigData: null
        };

        // Group queued requests by category
        this.syncQueue.forEach(item => {
            if (!syncData.ChangedCategories.includes(item.category)) {
                syncData.ChangedCategories.push(item.category);
            }
            
            // Extract data from queued requests
            if (item.options.body) {
                try {
                    const data = JSON.parse(item.options.body);
                    
                    switch (item.category) {
                        case 'profile':
                            syncData.ProfileData = data;
                            break;
                        case 'branches':
                            syncData.BranchData.push(...(Array.isArray(data) ? data : [data]));
                            break;
                        case 'particulars':
                            syncData.ParticularData.push(...(Array.isArray(data) ? data : [data]));
                            break;
                        case 'discounts':
                            syncData.DiscountData.push(...(Array.isArray(data) ? data : [data]));
                            break;
                        case 'banks':
                            syncData.BankData.push(...(Array.isArray(data) ? data : [data]));
                            break;
                        case 'rules':
                            syncData.RulesData = data;
                            break;
                        case 'grading':
                            syncData.GradingData = data;
                            break;
                        case 'break_config':
                            syncData.BreakConfigData = data;
                            break;
                    }
                } catch (parseError) {
                    console.error('Failed to parse queued request data:', parseError);
                }
            }
        });

        try {
            // Send batch sync request
            const response = await this.makeRequest('/settings/sync', {
                method: 'POST',
                body: JSON.stringify(syncData)
            });
            
            if (response.success) {
                // Clear processed queue items
                this.syncQueue = [];
                this.lastSyncTime = new Date().toISOString();
                localStorage.setItem('shikola_settings_last_sync', this.lastSyncTime);
                
                // Refresh all cached data
                await this.refreshAllData();
                
                this.showNotification('All changes synced successfully', 'success');
            } else {
                this.showNotification('Some changes failed to sync', 'error');
            }
            
        } catch (error) {
            console.error('Failed to process sync queue:', error);
            this.showNotification('Failed to sync changes', 'error');
        }
    }

    async refreshAllData() {
        try {
            await Promise.all([
                this.getProfileSettings(),
                this.getBranches(),
                this.getParticulars(),
                this.getDiscounts(),
                this.getBanks(),
                this.getRules(),
                this.getGradingSettings(),
                this.getBreakConfiguration()
            ]);
        } catch (error) {
            console.error('Failed to refresh all data:', error);
        }
    }

    // Periodic Sync
    startPeriodicSync() {
        if (this.syncInterval) return;
        
        this.syncInterval = setInterval(async () => {
            if (this.isOnline) {
                try {
                    await this.refreshAllData();
                    console.log('Periodic sync completed');
                } catch (error) {
                    console.error('Periodic sync failed:', error);
                }
            }
        }, 5 * 60 * 1000); // Sync every 5 minutes
    }

    stopPeriodicSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    // Notification System
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
                color: white;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 9999;
                font-size: 14px;
                max-width: 300px;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        }
    }

    // Utility Methods
    async validateData(data, rules) {
        const errors = [];
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];
            
            if (rule.required && (!value || value.toString().trim() === '')) {
                errors.push(`${field} is required`);
                continue;
            }
            
            if (rule.type && value && typeof value !== rule.type) {
                errors.push(`${field} must be of type ${rule.type}`);
                continue;
            }
            
            if (rule.min && value < rule.min) {
                errors.push(`${field} must be at least ${rule.min}`);
            }
            
            if (rule.max && value > rule.max) {
                errors.push(`${field} must be at most ${rule.max}`);
            }
            
            if (rule.pattern && value && !rule.pattern.test(value)) {
                errors.push(`${field} format is invalid`);
            }
        }
        
        return errors;
    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    getConnectionStatus() {
        return {
            isOnline: this.isOnline,
            queuedOperations: this.syncQueue.length,
            lastSync: this.lastSyncTime
        };
    }

    // Cleanup
    destroy() {
        this.stopPeriodicSync();
        window.removeEventListener('online', this.handleOnlineStatusChange);
        window.removeEventListener('offline', this.handleOnlineStatusChange);
    }
}

// Initialize the manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.generalSettingsManager = new GeneralSettingsManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeneralSettingsManager;
}
