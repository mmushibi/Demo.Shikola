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
 * Shikola Pupil Portal - Offline Manager
 * Provides intelligent offline functionality with real-time sync capabilities
 * Based on super-admin-offline-manager.js architecture
 */
(function() {
    'use strict';

    // Configuration
    const OFFLINE_CONFIG = {
        cachePrefix: 'shikola_pupil_',
        cacheExpiry: {
            dashboard: 5 * 60 * 1000,        // 5 minutes
            timetable: 30 * 60 * 1000,        // 30 minutes
            assignments: 15 * 60 * 1000,       // 15 minutes
            grades: 60 * 60 * 1000,           // 1 hour
            attendance: 10 * 60 * 1000,        // 10 minutes
            reportCard: 120 * 60 * 1000,       // 2 hours
            notifications: 5 * 60 * 1000,       // 5 minutes
            fees: 60 * 60 * 1000,             // 1 hour
            messages: 30 * 60 * 1000            // 30 minutes
        },
        maxStorageSize: 20 * 1024 * 1024, // 20MB
        syncRetryAttempts: 3,
        syncRetryDelay: 2000
    };

    // State management
    let isOnline = navigator.onLine;
    let syncInProgress = false;
    let lastSyncTimes = {};
    let pendingSyncActions = [];

    // Cache management
    class CacheManager {
        static set(key, data, expiryMs) {
            try {
                const item = {
                    data,
                    timestamp: Date.now(),
                    expiry: Date.now() + expiryMs
                };
                localStorage.setItem(OFFLINE_CONFIG.cachePrefix + key, JSON.stringify(item));
                this.cleanup();
            } catch (e) {
                console.warn('Cache set failed:', e);
                this.cleanup();
            }
        }

        static get(key) {
            try {
                const item = localStorage.getItem(OFFLINE_CONFIG.cachePrefix + key);
                if (!item) return null;
                
                const parsed = JSON.parse(item);
                if (Date.now() > parsed.expiry) {
                    this.remove(key);
                    return null;
                }
                
                return parsed.data;
            } catch (e) {
                console.warn('Cache get failed:', e);
                return null;
            }
        }

        static remove(key) {
            try {
                localStorage.removeItem(OFFLINE_CONFIG.cachePrefix + key);
            } catch (e) {
                console.warn('Cache remove failed:', e);
            }
        }

        static cleanup() {
            try {
                const keys = Object.keys(localStorage);
                const now = Date.now();
                let size = 0;

                keys.forEach(key => {
                    if (key.startsWith(OFFLINE_CONFIG.cachePrefix)) {
                        try {
                            const item = localStorage.getItem(key);
                            if (item) {
                                size += new Blob([item]).size;
                                const parsed = JSON.parse(item);
                                if (now > parsed.expiry) {
                                    localStorage.removeItem(key);
                                }
                            }
                        } catch (e) {
                            localStorage.removeItem(key);
                        }
                    }
                });

                // Remove oldest items if storage is full
                if (size > OFFLINE_CONFIG.maxStorageSize) {
                    const cacheKeys = keys
                        .filter(k => k.startsWith(OFFLINE_CONFIG.cachePrefix))
                        .map(k => ({
                            key: k,
                            item: JSON.parse(localStorage.getItem(k) || '{}')
                        }))
                        .sort((a, b) => a.item.timestamp - b.item.timestamp);

                    while (size > OFFLINE_CONFIG.maxStorageSize * 0.8 && cacheKeys.length) {
                        const oldest = cacheKeys.shift();
                        localStorage.removeItem(oldest.key);
                        size -= new Blob([JSON.stringify(oldest.item)]).size;
                    }
                }
            } catch (e) {
                console.warn('Cache cleanup failed:', e);
            }
        }

        static clear() {
            try {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith(OFFLINE_CONFIG.cachePrefix)) {
                        localStorage.removeItem(key);
                    }
                });
            } catch (e) {
                console.warn('Cache clear failed:', e);
            }
        }
    }

    // API wrapper with offline support
    class PupilAPI {
        static async request(endpoint, options = {}) {
            const cacheKey = endpoint.replace(/[^a-zA-Z0-9]/g, '_');
            const useCache = options.useCache !== false;
            const cacheExpiry = options.cacheExpiry || OFFLINE_CONFIG.cacheExpiry.dashboard;

            // Try cache first when offline or cache is preferred
            if (!isOnline || useCache) {
                const cached = CacheManager.get(cacheKey);
                if (cached) {
                    console.log(`Using cached data for ${endpoint}`);
                    return { success: true, data: cached, cached: true };
                }
            }

            // Only make network requests when online
            if (!isOnline) {
                throw new Error('Offline - no network access');
            }

            try {
                const response = await window.ShikolaAPI.request(endpoint, options);
                
                // Cache successful responses
                if (response.success && useCache) {
                    CacheManager.set(cacheKey, response.data, cacheExpiry);
                    lastSyncTimes[cacheKey] = Date.now();
                }

                return response;
            } catch (error) {
                console.warn(`API request failed for ${endpoint}:`, error);
                
                // Try fallback cache on network error
                const fallback = CacheManager.get(cacheKey);
                if (fallback) {
                    return { success: true, data: fallback, cached: true, fallback: true };
                }
                
                throw error;
            }
        }

        static async syncData(endpoint, options = {}) {
            if (syncInProgress || !isOnline) {
                return false;
            }

            syncInProgress = true;
            const cacheKey = endpoint.replace(/[^a-zA-Z0-9]/g, '_');

            try {
                await this.request(endpoint, { ...options, useCache: false });
                console.log(`Synced data for ${endpoint}`);
                return true;
            } catch (error) {
                console.warn(`Sync failed for ${endpoint}:`, error);
                return false;
            } finally {
                syncInProgress = false;
            }
        }
    }

    // Real-time sync integration
    class RealtimeManager {
        static init() {
            if (window.shikolaRealtimeSync) {
                // Subscribe to real-time updates
                window.shikolaRealtimeSync.subscribe('timetable', (data) => {
                    this.handleRealtimeUpdate('timetable', data);
                });
                
                window.shikolaRealtimeSync.subscribe('assignments', (data) => {
                    this.handleRealtimeUpdate('assignments', data);
                });
                
                window.shikolaRealtimeSync.subscribe('grades', (data) => {
                    this.handleRealtimeUpdate('grades', data);
                });
                
                window.shikolaRealtimeSync.subscribe('attendance', (data) => {
                    this.handleRealtimeUpdate('attendance', data);
                });
                
                window.shikolaRealtimeSync.subscribe('notifications', (data) => {
                    this.handleRealtimeUpdate('notifications', data);
                });

                console.log('Pupil real-time sync initialized');
            }
        }

        static handleRealtimeUpdate(type, data) {
            // Update cache with real-time data
            const cacheKey = `${type}_realtime`;
            CacheManager.set(cacheKey, data, OFFLINE_CONFIG.cacheExpiry[type] || OFFLINE_CONFIG.cacheExpiry.dashboard);
            
            // Trigger UI update if function exists
            if (window.pupilRealtimeUpdate) {
                window.pupilRealtimeUpdate(type, data);
            }
            
            console.log(`Real-time update received for ${type}:`, data);
        }
    }

    // Connection status monitoring
    function updateConnectionStatus() {
        const wasOnline = isOnline;
        isOnline = navigator.onLine;
        
        if (wasOnline !== isOnline) {
            console.log(`Connection status changed: ${isOnline ? 'online' : 'offline'}`);
            
            if (isOnline) {
                // Sync pending actions when coming back online
                syncPendingActions();
            }
            
            // Update UI if function exists
            if (window.pupilConnectionStatusChanged) {
                window.pupilConnectionStatusChanged(isOnline);
            }
        }
    }

    // Sync pending actions
    async function syncPendingActions() {
        if (pendingSyncActions.length === 0) return;
        
        console.log(`Syncing ${pendingSyncActions.length} pending actions`);
        
        for (const action of pendingSyncActions) {
            try {
                await PupilAPI.request(action.endpoint, action.options);
                console.log(`Synced pending action: ${action.endpoint}`);
            } catch (error) {
                console.warn(`Failed to sync pending action: ${action.endpoint}`, error);
            }
        }
        
        pendingSyncActions = [];
    }

    // Add pending action for when offline
    function addPendingAction(endpoint, options) {
        pendingSyncActions.push({
            endpoint,
            options,
            timestamp: Date.now()
        });
        
        // Limit pending actions
        if (pendingSyncActions.length > 20) {
            pendingSyncActions = pendingSyncActions.slice(-20);
        }
    }

    // Public API
    window.PupilOfflineManager = {
        // API methods
        request: PupilAPI.request.bind(PupilAPI),
        syncData: PupilAPI.syncData.bind(PupilAPI),
        
        // Cache methods
        getCache: CacheManager.get.bind(CacheManager),
        setCache: CacheManager.set.bind(CacheManager),
        removeCache: CacheManager.remove.bind(CacheManager),
        clearCache: CacheManager.clear.bind(CacheManager),
        
        // Status methods
        isOnline: () => isOnline,
        isSyncing: () => syncInProgress,
        getLastSync: (key) => lastSyncTimes[key],
        
        // Initialization
        init: function() {
            RealtimeManager.init();
            
            // Monitor connection status
            window.addEventListener('online', updateConnectionStatus);
            window.addEventListener('offline', updateConnectionStatus);
            
            // Clean up old cache on init
            CacheManager.cleanup();
            
            console.log('Pupil Offline Manager initialized');
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.PupilOfflineManager.init());
    } else {
        window.PupilOfflineManager.init();
    }

})();
