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
 * Universal Shikola API Client
 * Provides database integration with localStorage fallback for all portals
 */
(function() {
    'use strict';

    // Portal-specific configurations
    const PORTAL_CONFIGS = {
        pupil: {
            cachePrefix: 'shikola_pupil',
            endpoints: {
                dashboard: '/api/pupil/dashboard',
                timetable: '/api/pupil/timetable',
                assignments: '/api/pupil/assignments',
                grades: '/api/pupil/grades',
                reportCard: '/api/pupil/report-card',
                attendance: '/api/pupil/attendance',
                invoices: '/api/pupil/fees/invoices',
                payments: '/api/pupil/fees/payments',
                notifications: '/api/pupil/notifications'
            },
            cacheTimes: {
                dashboard: 5 * 60 * 1000,        // 5 minutes
                timetable: 24 * 60 * 60 * 1000,  // 24 hours
                assignments: 60 * 60 * 1000,     // 1 hour
                grades: 6 * 60 * 60 * 1000,      // 6 hours
                reportCard: 24 * 60 * 60 * 1000, // 24 hours
                attendance: 30 * 60 * 1000,      // 30 minutes
                invoices: 2 * 60 * 60 * 1000,    // 2 hours
                payments: 2 * 60 * 60 * 1000,    // 2 hours
                notifications: 15 * 60 * 1000    // 15 minutes
            }
        },
        teacher: {
            cachePrefix: 'shikola_teacher',
            endpoints: {
                dashboard: '/api/teacher/dashboard',
                classes: '/api/teacher/classes',
                assignments: '/api/teacher/assignments',
                attendance: '/api/teacher/attendance',
                grades: '/api/teacher/grades',
                pupils: '/api/teacher/pupils',
                timetable: '/api/teacher/timetable'
            },
            cacheTimes: {
                dashboard: 5 * 60 * 1000,
                classes: 30 * 60 * 1000,
                assignments: 45 * 60 * 1000,
                attendance: 15 * 60 * 1000,
                grades: 2 * 60 * 60 * 1000,
                pupils: 10 * 60 * 1000,
                timetable: 2 * 60 * 60 * 1000
            }
        },
        school_admin: {
            cachePrefix: 'shikola_school_admin',
            endpoints: {
                dashboard: '/api/frontend/portals/school-admin/dashboard',
                pupils: '/api/frontend/portals/school-admin/pupils',
                employees: '/api/frontend/portals/school-admin/employees',
                classes: '/api/frontend/portals/school-admin/classes',
                fees: '/api/frontend/portals/school-admin/fees',
                attendance: '/api/frontend/portals/school-admin/attendance',
                reports: '/api/frontend/portals/school-admin/reports',
                timetable: '/api/frontend/portals/school-admin/timetable'
            },
            cacheTimes: {
                dashboard: 2 * 60 * 1000,
                pupils: 5 * 60 * 1000,
                employees: 10 * 60 * 1000,
                classes: 15 * 60 * 1000,
                fees: 5 * 60 * 1000,
                attendance: 10 * 60 * 1000,
                reports: 30 * 60 * 1000,
                timetable: 2 * 60 * 60 * 1000
            }
        },
        operations: {
            cachePrefix: 'shikola_operations',
            endpoints: {
                dashboard: '/api/operations/dashboard',
                schools: '/api/operations/schools',
                users: '/api/operations/users',
                systemHealth: '/api/operations/system-health',
                systemMetrics: '/api/operations/system-metrics',
                databaseStats: '/api/operations/database-stats',
                errorLogs: '/api/operations/error-logs',
                accessLogs: '/api/operations/access-logs',
                financialOverview: '/api/operations/financial-overview',
                complianceReports: '/api/operations/compliance-reports',
                backups: '/api/operations/backups',
                settings: '/api/operations/settings'
            },
            cacheTimes: {
                dashboard: 30 * 1000,
                schools: 5 * 60 * 1000,
                users: 5 * 60 * 1000,
                systemHealth: 30 * 1000,
                systemMetrics: 30 * 1000,
                databaseStats: 60 * 1000,
                errorLogs: 2 * 60 * 1000,
                accessLogs: 2 * 60 * 1000,
                financialOverview: 10 * 60 * 1000,
                complianceReports: 30 * 60 * 1000,
                backups: 15 * 60 * 1000,
                settings: 30 * 60 * 1000
            }
        },
        super_admin: {
            cachePrefix: 'shikola_super_admin',
            endpoints: {
                dashboard: '/api/frontend/portals/super-admin/dashboard',
                systemMetrics: '/api/frontend/portals/super-admin/system-metrics',
                users: '/api/frontend/portals/super-admin/users',
                auditLogs: '/api/frontend/portals/super-admin/audit-logs',
                schools: '/api/frontend/portals/super-admin/schools'
            },
            cacheTimes: {
                dashboard: 10 * 60 * 1000,
                systemMetrics: 10 * 60 * 1000,
                users: 5 * 60 * 1000,
                auditLogs: 15 * 60 * 1000,
                schools: 30 * 60 * 1000
            }
        },
       accountant: {
            cachePrefix: 'shikola_accountant',
            endpoints: {
                dashboard: '/api/accountant/dashboard',
                invoices: '/api/accountant/invoices',
                payments: '/api/accountant/payments',
                bankReconciliation: '/api/accountant/bank-reconciliation',
                reports: '/api/accountant/reports',
                auditTrail: '/api/accountant/audit-trail'
            },
            cacheTimes: {
                dashboard: 5 * 60 * 1000,
                invoices: 2 * 60 * 1000,
                payments: 2 * 60 * 1000,
                bankReconciliation: 10 * 60 * 1000,
                reports: 30 * 60 * 1000,
                auditTrail: 15 * 60 * 1000
            }
        },
      
    };

    // Get current portal
    function getCurrentPortal() {
        const path = window.location.pathname;
        if (path.includes('pupil-portal')) return 'pupil';
        if (path.includes('teacher-portal')) return 'teacher';
        if (path.includes('school-admin')) return 'school_admin';
        if (path.includes('super-admin')) return 'super_admin';
        if (path.includes('accountant-portal')) return 'accountant';
        return 'unknown';
    }

    // Get auth token
    function getAuthToken() {
        try {
            return localStorage.getItem('authToken') || localStorage.getItem('shikola_token') || null;
        } catch (e) {
            return null;
        }
    }

    // Check if API is available
    function canUseApi() {
        return !!(window.SHIKOLA_API_BASE && getAuthToken());
    }

    // Generic API request
    async function apiRequest(endpoint, options = {}) {
        const url = window.SHIKOLA_API_BASE + endpoint;
        const token = getAuthToken();
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method: 'GET',
            ...options,
            headers
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    // Get data from localStorage
    function getFromLocalStorage(dataType, portal) {
        try {
            const config = PORTAL_CONFIGS[portal];
            if (!config) return null;

            const cacheKey = `${config.cachePrefix}_${dataType}_v1`;
            const cached = localStorage.getItem(cacheKey);
            
            if (cached) {
                const data = JSON.parse(cached);
                const cacheTime = config.cacheTimes[dataType] || 5 * 60 * 1000;
                
                if (data.timestamp && (Date.now() - data.timestamp) < cacheTime) {
                    return data.data;
                }
            }
        } catch (e) {
            console.warn(`Failed to read ${dataType} from localStorage:`, e);
        }
        return null;
    }

    // Save data to localStorage
    function saveToLocalStorage(dataType, data, portal) {
        try {
            const config = PORTAL_CONFIGS[portal];
            if (!config) return;

            const cacheKey = `${config.cachePrefix}_${dataType}_v1`;
            const cacheData = {
                data: data,
                timestamp: Date.now(),
                source: 'api'
            };
            
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (e) {
            console.warn(`Failed to save ${dataType} to localStorage:`, e);
        }
    }

    // Generate production-ready fallback data
    function generateFallbackData(dataType, portal) {
        const fallbackData = {
            dashboard: null,
            classes: [],
            pupils: [],
            employees: [],
            assignments: [],
            grades: [],
            attendance: [],
            notifications: [],
            invoices: [],
            payments: [],
            reports: null,
            timetable: []
        };

        const result = fallbackData[dataType] || null;
        console.warn(`Using fallback data for ${dataType} in portal ${portal}`);
        return result;
    }

    // Universal data fetcher with fallback
    async function fetchData(dataType, params = {}, portal = null) {
        const currentPortal = portal || getCurrentPortal();
        const config = PORTAL_CONFIGS[currentPortal];
        
        if (!config) {
            console.error(`Unknown portal: ${currentPortal}`);
            return { success: false, error: 'Unknown portal' };
        }

        const endpoint = config.endpoints[dataType];
        if (!endpoint) {
            console.error(`Unknown data type: ${dataType} for portal: ${currentPortal}`);
            return { success: false, error: 'Unknown data type' };
        }

        // Check if we can use API
        if (!canUseApi()) {
            const cachedData = getFromLocalStorage(dataType, currentPortal);
            if (cachedData) {
                return { success: true, data: cachedData, source: 'localStorage' };
            }
            return generateFallbackData(dataType, currentPortal);
        }

        try {
            // Build query string
            const queryString = Object.keys(params).length > 0 
                ? '?' + new URLSearchParams(params).toString() 
                : '';

            // Make API request
            const result = await apiRequest(endpoint + queryString);
            
            if (result.success && result.data) {
                // Cache successful response
                saveToLocalStorage(dataType, result.data, currentPortal);
                return { success: true, data: result.data, source: 'api' };
            }
            
            // API returned success but no data, fallback to cache
            const cachedData = getFromLocalStorage(dataType, currentPortal);
            if (cachedData) {
                return { success: true, data: cachedData, source: 'localStorage' };
            }
            
            return generateFallbackData(dataType, currentPortal);
            
        } catch (error) {
            console.warn(`API failed for ${dataType}, using fallback:`, error);
            
            // API failed, fallback to localStorage
            const cachedData = getFromLocalStorage(dataType, currentPortal);
            if (cachedData) {
                return { success: true, data: cachedData, source: 'localStorage' };
            }
            
            return generateFallbackData(dataType, currentPortal);
        }
    }

    // Universal data writer
    async function writeData(dataType, data, method = 'POST', portal = null) {
        const currentPortal = portal || getCurrentPortal();
        const config = PORTAL_CONFIGS[currentPortal];
        
        if (!config) {
            console.error(`Unknown portal: ${currentPortal}`);
            return { success: false, error: 'Unknown portal' };
        }

        const endpoint = config.endpoints[dataType];
        if (!endpoint) {
            console.error(`Unknown data type: ${dataType} for portal: ${currentPortal}`);
            return { success: false, error: 'Unknown data type' };
        }

        if (!canUseApi()) {
            return { success: false, error: 'API not available' };
        }

        try {
            const result = await apiRequest(endpoint, {
                method: method,
                body: data
            });
            
            // Clear relevant cache after write
            clearCache(dataType, currentPortal);
            
            // Notify real-time sync
            if (window.ShikolaRealtimeSync) {
                window.ShikolaRealtimeSync.sendEvent(dataType, method.toLowerCase(), data);
            }
            
            return result;
            
        } catch (error) {
            console.error(`Failed to write ${dataType}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Clear cache
    function clearCache(dataType, portal) {
        try {
            const config = PORTAL_CONFIGS[portal];
            if (!config) return;

            const cacheKey = `${config.cachePrefix}_${dataType}_v1`;
            localStorage.removeItem(cacheKey);
        } catch (e) {
            console.warn(`Failed to clear cache for ${dataType}:`, e);
        }
    }

    // Clear all cache for portal
    function clearAllCache(portal = null) {
        const currentPortal = portal || getCurrentPortal();
        const config = PORTAL_CONFIGS[currentPortal];
        
        if (!config) return;

        Object.keys(config.endpoints).forEach(dataType => {
            clearCache(dataType, currentPortal);
        });
    }

    // Get cache status
    function getCacheStatus(portal = null) {
        const currentPortal = portal || getCurrentPortal();
        const config = PORTAL_CONFIGS[currentPortal];
        
        if (!config) return {};

        const status = {};
        Object.keys(config.endpoints).forEach(dataType => {
            try {
                const cacheKey = `${config.cachePrefix}_${dataType}_v1`;
                const cached = localStorage.getItem(cacheKey);
                
                if (cached) {
                    const data = JSON.parse(cached);
                    const cacheTime = config.cacheTimes[dataType] || 5 * 60 * 1000;
                    const age = Date.now() - data.timestamp;
                    const expired = age > cacheTime;
                    
                    status[dataType] = {
                        cached: true,
                        timestamp: data.timestamp,
                        age: age,
                        expired: expired,
                        size: new Blob([cached]).size
                    };
                } else {
                    status[dataType] = {
                        cached: false,
                        timestamp: null,
                        age: null,
                        expired: true,
                        size: 0
                    };
                }
            } catch (e) {
                status[dataType] = {
                    cached: false,
                    error: e.message
                };
            }
        });

        return status;
    }

    // Public API
    window.ShikolaUniversalAPI = {
        // Data operations
        get: fetchData,
        post: (dataType, data, portal) => writeData(dataType, data, 'POST', portal),
        put: (dataType, data, portal) => writeData(dataType, data, 'PUT', portal),
        delete: (dataType, id, portal) => writeData(dataType, { id }, 'DELETE', portal),
        
        // Cache operations
        clearCache: clearCache,
        clearAllCache: clearAllCache,
        getCacheStatus: getCacheStatus,
        
        // Utilities
        getCurrentPortal: getCurrentPortal,
        canUseApi: canUseApi,
        
        // Direct API access
        apiRequest: apiRequest
    };

})();
