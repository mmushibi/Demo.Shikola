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
 * Shikola Super Admin Offline Storage Manager
 * Provides offline fallback with local storage caching for super admin portal
 */

(function(window) {
    'use strict';

    // Prevent double initialization
    if (window.ShikolaOfflineManager) return;

    // Storage keys
    const STORAGE_KEYS = {
        DASHBOARD: 'shikola_super_admin_dashboard',
        SCHOOLS: 'shikola_super_admin_schools',
        ACTIVITY_LOG: 'shikola_super_admin_activity_log',
        ANALYTICS: 'shikola_super_admin_analytics',
        SUBSCRIPTIONS: 'shikola_super_admin_subscriptions',
        USER_CACHE: 'shikola_super_admin_user_cache',
        GLOBAL_USER_SEARCH: 'shikola_super_admin_global_user_search',
        SCHOOLS_STATS: 'shikola_super_admin_schools_stats',
        SCHOOLS_SUGGESTIONS: 'shikola_super_admin_schools_suggestions',
        SCHOOL_USERS: 'shikola_super_admin_school_users',
        SCHOOL_DETAILS: 'shikola_super_admin_school_details',
        SYSTEM_HEALTH: 'shikola_super_admin_system_health',
        SETTINGS: 'shikola_super_admin_settings',
        LAST_SYNC: 'shikola_super_admin_last_sync',
        OFFLINE_MODE: 'shikola_super_admin_offline_mode'
    };

    // Cache expiry times (in milliseconds)
    const CACHE_EXPIRY = {
        DASHBOARD: 5 * 60 * 1000,        // 5 minutes
        SCHOOLS: 10 * 60 * 1000,        // 10 minutes
        ACTIVITY_LOG: 2 * 60 * 1000,    // 2 minutes
        ANALYTICS: 30 * 60 * 1000,      // 30 minutes
        SUBSCRIPTIONS: 15 * 60 * 1000,  // 15 minutes
        USER_CACHE: 60 * 60 * 1000      // 1 hour
    };

    // Helper functions
    function isOnline() {
        return navigator.onLine && window.ShikolaAPI;
    }

    function getCurrentTimestamp() {
        return new Date().getTime();
    }

    function isCacheValid(timestamp, cacheType) {
        const expiry = CACHE_EXPIRY[cacheType] || CACHE_EXPIRY.DASHBOARD;
        return (getCurrentTimestamp() - timestamp) < expiry;
    }

    function safeStorageGet(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.warn(`Failed to get from localStorage: ${key}`, e);
            return null;
        }
    }

    function safeStorageSet(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify({
                data: data,
                timestamp: getCurrentTimestamp()
            }));
            return true;
        } catch (e) {
            console.warn(`Failed to set localStorage: ${key}`, e);
            // Try to clear some old data if storage is full
            if (e.name === 'QuotaExceededError') {
                clearOldCache();
                try {
                    localStorage.setItem(key, JSON.stringify({
                        data: data,
                        timestamp: getCurrentTimestamp()
                    }));
                    return true;
                } catch (e2) {
                    console.error('Still cannot store data after clearing cache');
                }
            }
            return false;
        }
    }

    function clearOldCache() {
        const keys = Object.values(STORAGE_KEYS);
        keys.forEach(key => {
            try {
                const item = localStorage.getItem(key);
                if (item) {
                    const parsed = JSON.parse(item);
                    const age = getCurrentTimestamp() - parsed.timestamp;
                    // Remove items older than 24 hours
                    if (age > 24 * 60 * 60 * 1000) {
                        localStorage.removeItem(key);
                    }
                }
            } catch (e) {
                localStorage.removeItem(key);
            }
        });
    }

    // Main offline manager
    window.ShikolaOfflineManager = {
        isOnline: isOnline,
        
        // Cache management
        getCache: function(key, cacheType) {
            const cached = safeStorageGet(key);
            if (cached && isCacheValid(cached.timestamp, cacheType)) {
                return cached.data;
            }
            return null;
        },

        setCache: function(key, data, cacheType) {
            return safeStorageSet(key, data);
        },

        clearCache: function(key) {
            if (key) {
                localStorage.removeItem(key);
            } else {
                // Clear all super admin cache
                const keys = Object.values(STORAGE_KEYS);
                keys.forEach(k => localStorage.removeItem(k));
            }
        },

        // API wrapper with offline fallback
        async apiCallWithFallback(endpoint, params, cacheKey, cacheType, fallbackData) {
            // Try live API first if online
            if (isOnline()) {
                try {
                    const result = await window.ShikolaAPI.get(endpoint, params);
                    if (result.success) {
                        // Cache the successful response
                        this.setCache(cacheKey, result.data, cacheType);
                        this.setCache(STORAGE_KEYS.LAST_SYNC, getCurrentTimestamp(), 'DASHBOARD');
                        this.setCache(STORAGE_KEYS.OFFLINE_MODE, false, 'DASHBOARD');
                        return result;
                    }
                } catch (error) {
                    console.warn(`API call failed for ${endpoint}, falling back to cache:`, error);
                }
            }

            // Fallback to cache
            const cachedData = this.getCache(cacheKey, cacheType);
            if (cachedData) {
                console.log(`Using cached data for ${endpoint}`);
                this.setCache(STORAGE_KEYS.OFFLINE_MODE, true, 'DASHBOARD');
                return {
                    success: true,
                    data: cachedData,
                    offline: true,
                    cached: true
                };
            }

            // Final fallback to provided data or empty structure
            console.warn(`No cache available for ${endpoint}, using fallback data`);
            this.setCache(STORAGE_KEYS.OFFLINE_MODE, true, 'DASHBOARD');
            return {
                success: true,
                data: fallbackData || {},
                offline: true,
                fallback: true
            };
        },

        // Dashboard specific methods
        async getDashboard() {
            if (isOnline()) {
                try {
                    const result = await window.ShikolaAPI.get('/api/frontend/portals/super-admin/dashboard', {});
                    if (result.success) {
                        this.setCache(STORAGE_KEYS.DASHBOARD, result.data, 'DASHBOARD');
                        this.setCache(STORAGE_KEYS.LAST_SYNC, getCurrentTimestamp(), 'DASHBOARD');
                        this.setCache(STORAGE_KEYS.OFFLINE_MODE, false, 'DASHBOARD');
                        return result;
                    } else {
                        throw new Error(result.error || 'Failed to load dashboard data');
                    }
                } catch (error) {
                    console.error(`API call failed for dashboard:`, error);
                    throw error;
                }
            } else {
                throw new Error('No internet connection');
            }
        },

        async getSchools(params) {
            if (isOnline()) {
                try {
                    const result = await window.ShikolaAPI.get('/api/frontend/portals/super-admin/schools', params);
                    if (result.success) {
                        this.setCache(STORAGE_KEYS.SCHOOLS, result.data, 'SCHOOLS');
                        return result;
                    } else {
                        throw new Error(result.error || 'Failed to load schools data');
                    }
                } catch (error) {
                    console.error(`API call failed for schools:`, error);
                    throw error;
                }
            } else {
                throw new Error('No internet connection');
            }
        },

        async getActivityLog(params) {
            if (isOnline()) {
                try {
                    const result = await window.ShikolaAPI.get('/api/frontend/portals/super-admin/activity-log', params);
                    if (result.success) {
                        this.setCache(STORAGE_KEYS.ACTIVITY_LOG, result.data, 'ACTIVITY_LOG');
                        return result;
                    } else {
                        throw new Error(result.error || 'Failed to load activity log');
                    }
                } catch (error) {
                    console.error(`API call failed for activity log:`, error);
                    throw error;
                }
            } else {
                throw new Error('No internet connection');
            }
        },

        async getAnalytics(params) {
            if (isOnline()) {
                try {
                    const result = await window.ShikolaAPI.get('/api/frontend/portals/super-admin/analytics', params);
                    if (result.success) {
                        this.setCache(STORAGE_KEYS.ANALYTICS, result.data, 'ANALYTICS');
                        return result;
                    } else {
                        throw new Error(result.error || 'Failed to load analytics');
                    }
                } catch (error) {
                    console.error(`API call failed for analytics:`, error);
                    throw error;
                }
            } else {
                throw new Error('No internet connection');
            }
        },

        async getSubscriptions(params) {
            if (isOnline()) {
                try {
                    const result = await window.ShikolaAPI.get('/api/frontend/portals/super-admin/subscriptions', params);
                    if (result.success) {
                        this.setCache(STORAGE_KEYS.SUBSCRIPTIONS, result.data, 'SUBSCRIPTIONS');
                        return result;
                    } else {
                        throw new Error(result.error || 'Failed to load subscriptions');
                    }
                } catch (error) {
                    console.error(`API call failed for subscriptions:`, error);
                    throw error;
                }
            } else {
                throw new Error('No internet connection');
            }
        },

        // Status methods
        isOfflineMode: function() {
            const cached = safeStorageGet(STORAGE_KEYS.OFFLINE_MODE);
            return cached ? cached.data : false;
        },

        getLastSyncTime: function() {
            const cached = safeStorageGet(STORAGE_KEYS.LAST_SYNC);
            return cached ? new Date(cached.data) : null;
        },

        // Sync status for UI
        getSyncStatus: function() {
            if (this.isOnline()) {
                if (this.isOfflineMode()) {
                    return {
                        status: 'recovering',
                        message: 'Connection restored, syncing data...',
                        icon: 'fas fa-sync fa-spin'
                    };
                }
                return {
                    status: 'online',
                    message: 'Real-time data',
                    icon: 'fas fa-circle text-emerald-500'
                };
            } else {
                return {
                    status: 'offline',
                    message: 'Offline mode - using cached data',
                    icon: 'fas fa-wifi-slash text-slate-400'
                };
            }
        },

        // New endpoint methods for missing API integrations
        async getGlobalUserSearch(params) {
            return this.apiCallWithFallback(
                '/api/frontend/portals/super-admin/global-user-search',
                params,
                STORAGE_KEYS.GLOBAL_USER_SEARCH,
                'USER_CACHE',
                { data: [], pagination: { total: 0, limit: 50, offset: 0 } }
            );
        },

        async getSchoolsStats() {
            return this.apiCallWithFallback(
                '/api/frontend/portals/super-admin/schools/stats',
                {},
                STORAGE_KEYS.SCHOOLS_STATS,
                'SCHOOLS',
                {
                    total: 0,
                    active: 0,
                    trial: 0,
                    deactivated: 0,
                    trials_expiring_soon: 0
                }
            );
        },

        async getSchoolsSuggestions(params) {
            return this.apiCallWithFallback(
                '/api/frontend/portals/super-admin/schools/suggestions',
                params,
                STORAGE_KEYS.SCHOOLS_SUGGESTIONS,
                'SCHOOLS',
                { data: { data: [] } }
            );
        },

        async getSchoolUsers(schoolId, params) {
            return this.apiCallWithFallback(
                `/api/frontend/portals/super-admin/schools/${schoolId}/users`,
                params,
                `${STORAGE_KEYS.SCHOOL_USERS}_${schoolId}`,
                'USER_CACHE',
                { data: [] }
            );
        },

        async getSchoolDetails(schoolId) {
            return this.apiCallWithFallback(
                `/api/frontend/portals/super-admin/schools/${schoolId}`,
                {},
                `${STORAGE_KEYS.SCHOOL_DETAILS}_${schoolId}`,
                'SCHOOLS',
                null
            );
        },

        async getSystemHealth() {
            return this.apiCallWithFallback(
                '/api/frontend/portals/super-admin/system-health',
                {},
                STORAGE_KEYS.SYSTEM_HEALTH,
                'DASHBOARD',
                {
                    database: 'unknown',
                    redis: 'not_configured',
                    storage: 'unknown',
                    memory: { rss: 0, heapUsed: 0, heapTotal: 0 },
                    uptime: 0
                }
            );
        },

        async getSettings() {
            return this.apiCallWithFallback(
                '/api/frontend/portals/super-admin/settings',
                {},
                STORAGE_KEYS.SETTINGS,
                'ANALYTICS',
                {
                    general: {},
                    security: {},
                    system: {},
                    notifications: {},
                    advanced: {}
                }
            );
        },

        async saveSettings(settingsData) {
            if (isOnline()) {
                try {
                    const response = await window.ShikolaAPI.post('/api/frontend/portals/super-admin/settings', settingsData);
                    if (response.success) {
                        // Update cache with new settings
                        this.setCache(STORAGE_KEYS.SETTINGS, settingsData, 'ANALYTICS');
                        return response;
                    }
                } catch (error) {
                    console.warn('Failed to save settings, caching locally:', error);
                    // Cache settings locally to sync later
                    this.setCache(STORAGE_KEYS.SETTINGS, settingsData, 'ANALYTICS');
                    return {
                        success: true,
                        message: 'Settings saved locally (will sync when online)',
                        offline: true
                    };
                }
            }
            // Offline mode - cache locally
            this.setCache(STORAGE_KEYS.SETTINGS, settingsData, 'ANALYTICS');
            return {
                success: true,
                message: 'Settings saved locally (will sync when online)',
                offline: true
            };
        },

        // Initialize offline event listeners
        init: function() {
            const self = this;

            // Listen for online/offline events
            window.addEventListener('online', function() {
                console.log('Connection restored');
                self.setCache(STORAGE_KEYS.OFFLINE_MODE, false, 'DASHBOARD');
            });

            window.addEventListener('offline', function() {
                console.log('Connection lost, entering offline mode');
                self.setCache(STORAGE_KEYS.OFFLINE_MODE, true, 'DASHBOARD');
            });

            // Periodic cache cleanup
            setInterval(clearOldCache, 60 * 60 * 1000); // Every hour

            console.log('Super Admin Offline Manager initialized');
        }
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.ShikolaOfflineManager.init();
        });
    } else {
        window.ShikolaOfflineManager.init();
    }

})(window);
