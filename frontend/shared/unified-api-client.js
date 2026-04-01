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
 * Shikola Unified API Client
 * Provides centralized API access with RBAC, row-level security, and real-time sync
 */
(function (window) {
    'use strict';

    // Configuration
    const CONFIG = {
        API_BASE: window.SHIKOLA_API_BASE || '/api',
        WS_BASE: window.SHIKOLA_WS_BASE || '/ws',
        CACHE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
    };

    // Cache and state management
    const cache = new Map();
    const wsConnections = new Map();
    const subscribers = new Map();
    let authToken = null;
    let currentUser = null;
    let reconnectAttempts = 0;

    /**
     * Authentication and User Management
     */
    class AuthManager {
        static getToken() {
            if (!authToken) {
                try {
                    authToken = localStorage.getItem('authToken') || 
                               localStorage.getItem('shikola_token') || null;
                } catch (e) {
                    console.warn('Failed to get auth token:', e);
                }
            }
            return authToken;
        }

        static setToken(token) {
            authToken = token;
            try {
                localStorage.setItem('authToken', token);
            } catch (e) {
                console.warn('Failed to store auth token:', e);
            }
        }

        static async getCurrentUser() {
            if (currentUser) return currentUser;
            
            try {
                const response = await apiRequest('/api/auth/me', {
                    method: 'GET',
                    cache: false
                });
                
                if (response.success) {
                    currentUser = response.data;
                    return currentUser;
                }
            } catch (e) {
                console.warn('Failed to get current user:', e);
            }
            
            return null;
        }

        static hasRole(requiredRole) {
            if (!currentUser) return false;
            const userRole = currentUser.role || currentUser.roleName;
            return userRole === requiredRole;
        }

        static hasPermission(permission) {
            if (!currentUser) return false;
            const permissions = currentUser.permissions || [];
            return permissions.includes(permission);
        }

        static canAccessResource(resource, action) {
            if (!currentUser) return false;
            
            // Check role-based access
            const roleHierarchy = {
                'Super Admin': 10,
                'Operations': 9,
                'School Admin': 8,
                'Head Teacher': 7,
                'Deputy Head': 6,
                'Teacher': 5,
                'Accountant': 4,
                'Parent': 3,
                'Pupil': 2
            };
            
            const userLevel = roleHierarchy[currentUser.role] || 0;
            
            // Resource-based access control
            const resourcePermissions = {
                'exams': ['Super Admin', 'School Admin', 'Teacher'],
                'pupils': ['Super Admin', 'School Admin', 'Teacher', 'Parent'],
                'attendance': ['Super Admin', 'School Admin', 'Teacher'],
                'fees': ['Super Admin', 'School Admin', 'Accountant', 'Parent'],
                'reports': ['Super Admin', 'School Admin', 'Teacher', 'Accountant'],
                'timetables': ['Super Admin', 'School Admin', 'Teacher', 'Pupil'],
                'messaging': ['Super Admin', 'School Admin', 'Teacher', 'Parent', 'Pupil']
            };
            
            const allowedRoles = resourcePermissions[resource] || [];
            return allowedRoles.includes(currentUser.role);
        }
    }

    /**
     * WebSocket Manager for Real-time Sync
     */
    class WebSocketManager {
        static connect(channel) {
            if (wsConnections.has(channel)) {
                return wsConnections.get(channel);
            }

            const token = AuthManager.getToken();
            if (!token) {
                console.warn('No auth token available for WebSocket connection');
                return null;
            }

            const ws = new WebSocket(`${CONFIG.WS_BASE}/${channel}?token=${token}`);
            
            ws.onopen = () => {
                console.log(`WebSocket connected to channel: ${channel}`);
                reconnectAttempts = 0;
                
                // Subscribe to relevant data based on user role
                this.subscribeToRelevantData(ws, channel);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleRealtimeUpdate(channel, data);
                } catch (e) {
                    console.error('Failed to parse WebSocket message:', e);
                }
            };

            ws.onclose = () => {
                console.log(`WebSocket disconnected from channel: ${channel}`);
                wsConnections.delete(channel);
                
                // Attempt reconnection
                if (reconnectAttempts < CONFIG.RETRY_ATTEMPTS) {
                    setTimeout(() => {
                        reconnectAttempts++;
                        this.connect(channel);
                    }, CONFIG.RETRY_DELAY * Math.pow(2, reconnectAttempts));
                }
            };

            ws.onerror = (error) => {
                console.error(`WebSocket error on channel ${channel}:`, error);
            };

            wsConnections.set(channel, ws);
            return ws;
        }

        static subscribeToRelevantData(ws, channel) {
            const user = AuthManager.getCurrentUser();
            if (!user) return;

            const subscriptions = {
                'school-admin': ['pupils', 'classes', 'exams', 'attendance', 'fees'],
                'teacher': ['classes', 'attendance', 'exams', 'assignments'],
                'pupil': ['assignments', 'exams', 'timetables'],
                'parent': ['pupils', 'fees', 'attendance', 'exams'],
                'accountant': ['fees', 'payments', 'expenses'],
                'super-admin': ['*']
            };

            const userSubscriptions = subscriptions[user.role] || [];
            
            userSubscriptions.forEach(sub => {
                ws.send(JSON.stringify({
                    action: 'subscribe',
                    channel: sub,
                    userId: user.id,
                    schoolId: user.schoolId
                }));
            });
        }

        static handleRealtimeUpdate(channel, data) {
            // Invalidate relevant cache
            const cacheKey = this.generateCacheKey(data.type, data.params);
            cache.delete(cacheKey);

            // Notify subscribers
            const channelSubscribers = subscribers.get(channel) || [];
            channelSubscribers.forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error('Error in realtime callback:', e);
                }
            });

            // Dispatch global event
            window.dispatchEvent(new CustomEvent('shikola:realtime-update', {
                detail: { channel, data }
            }));
        }

        static subscribe(channel, callback) {
            if (!subscribers.has(channel)) {
                subscribers.set(channel, []);
            }
            subscribers.get(channel).push(callback);
        }

        static unsubscribe(channel, callback) {
            const channelSubscribers = subscribers.get(channel);
            if (channelSubscribers) {
                const index = channelSubscribers.indexOf(callback);
                if (index > -1) {
                    channelSubscribers.splice(index, 1);
                }
            }
        }

        static generateCacheKey(type, params) {
            return `${type}:${JSON.stringify(params || {})}`;
        }
    }

    /**
     * Main API Request Function
     */
    async function apiRequest(endpoint, options = {}) {
        const {
            method = 'GET',
            body = null,
            params = null,
            cache = true,
            timeout = 30000,
            retries = CONFIG.RETRY_ATTEMPTS
        } = options;

        // Check authentication
        const token = AuthManager.getToken();
        if (!token && endpoint !== '/api/auth/login') {
            throw new Error('Authentication required');
        }

        // Generate cache key for GET requests
        let cacheKey = null;
        if (method === 'GET' && cache) {
            cacheKey = WebSocketManager.generateCacheKey(endpoint, params);
            const cached = cache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < CONFIG.CACHE_TIMEOUT) {
                return cached.data;
            }
        }

        // Build URL
        let url = CONFIG.API_BASE + endpoint;
        if (params) {
            const searchParams = new URLSearchParams(params);
            url += '?' + searchParams.toString();
        }

        // Build request
        const request = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(timeout)
        };

        if (token) {
            request.headers['Authorization'] = 'Bearer ' + token;
        }

        if (body && method !== 'GET') {
            request.body = JSON.stringify(body);
        }

        // Add row-level security headers
        const user = await AuthManager.getCurrentUser();
        if (user) {
            request.headers['X-User-Role'] = user.role;
            request.headers['X-User-School'] = user.schoolId;
            request.headers['X-User-ID'] = user.id;
        }

        // Make request with retries
        let lastError;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, request);
                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    // Handle authentication errors
                    if (response.status === 401) {
                        AuthManager.setToken(null);
                        currentUser = null;
                        window.dispatchEvent(new CustomEvent('shikola:auth-required'));
                        throw new Error('Authentication required');
                    }

                    // Handle authorization errors
                    if (response.status === 403) {
                        throw new Error('Access denied: insufficient permissions');
                    }

                    throw new Error(data?.error || `HTTP ${response.status}`);
                }

                const result = {
                    success: true,
                    data: data,
                    status: response.status,
                    cached: false
                };

                // Cache successful GET requests
                if (method === 'GET' && cache && cacheKey) {
                    cache.set(cacheKey, {
                        data: result,
                        timestamp: Date.now()
                    });
                }

                return result;

            } catch (error) {
                lastError = error;
                
                if (attempt < retries) {
                    await new Promise(resolve => 
                        setTimeout(resolve, CONFIG.RETRY_DELAY * Math.pow(2, attempt))
                    );
                }
            }
        }

        throw lastError;
    }

    /**
     * Resource-specific API methods
     */
    const API = {
        // Authentication
        auth: {
            login: (credentials) => apiRequest('/api/auth/login', {
                method: 'POST',
                body: credentials,
                cache: false
            }),
            logout: () => apiRequest('/api/auth/logout', {
                method: 'POST',
                cache: false
            }),
            me: () => apiRequest('/api/auth/me', { cache: false })
        },

        // Pupils
        pupils: {
            list: (params) => apiRequest('/api/pupils', { params }),
            get: (id) => apiRequest(`/api/pupils/${id}`),
            create: (data) => apiRequest('/api/pupils', {
                method: 'POST',
                body: data
            }),
            update: (id, data) => apiRequest(`/api/pupils/${id}`, {
                method: 'PUT',
                body: data
            }),
            delete: (id) => apiRequest(`/api/pupils/${id}`, {
                method: 'DELETE'
            })
        },

        // Classes
        classes: {
            list: (params) => apiRequest('/api/classes', { params }),
            get: (id) => apiRequest(`/api/classes/${id}`),
            create: (data) => apiRequest('/api/classes', {
                method: 'POST',
                body: data
            }),
            update: (id, data) => apiRequest(`/api/classes/${id}`, {
                method: 'PUT',
                body: data
            }),
            delete: (id) => apiRequest(`/api/classes/${id}`, {
                method: 'DELETE'
            })
        },

        // Exams
        exams: {
            list: (params) => apiRequest('/api/exams', { params }),
            get: (id) => apiRequest(`/api/exams/${id}`),
            create: (data) => apiRequest('/api/exams', {
                method: 'POST',
                body: data
            }),
            update: (id, data) => apiRequest(`/api/exams/${id}`, {
                method: 'PUT',
                body: data
            }),
            delete: (id) => apiRequest(`/api/exams/${id}`, {
                method: 'DELETE'
            }),
            subjects: () => apiRequest('/api/exams/subjects'),
            chapters: (params) => apiRequest('/api/exams/chapters', { params }),
            questions: (params) => apiRequest('/api/exams/questions', { params }),
            results: (params) => apiRequest('/api/exams/results', { params })
        },

        // Attendance
        attendance: {
            list: (params) => apiRequest('/api/attendance', { params }),
            mark: (data) => apiRequest('/api/attendance/mark', {
                method: 'POST',
                body: data
            }),
            report: (params) => apiRequest('/api/attendance/report', { params })
        },

        // Fees
        fees: {
            list: (params) => apiRequest('/api/fees', { params }),
            create: (data) => apiRequest('/api/fees', {
                method: 'POST',
                body: data
            }),
            payment: (data) => apiRequest('/api/fees/payment', {
                method: 'POST',
                body: data
            }),
            report: (params) => apiRequest('/api/fees/report', { params })
        },

        // Reports
        reports: {
            generate: (type, params) => apiRequest(`/api/reports/${type}`, { params }),
            list: () => apiRequest('/api/reports')
        },

        // Timetables
        timetables: {
            list: (params) => apiRequest('/api/timetables', { params }),
            get: (id) => apiRequest(`/api/timetables/${id}`),
            create: (data) => apiRequest('/api/timetables', {
                method: 'POST',
                body: data
            })
        },

        // Messaging
        messaging: {
            list: (params) => apiRequest('/api/messaging', { params }),
            send: (data) => apiRequest('/api/messaging/send', {
                method: 'POST',
                body: data
            })
        }
    };

    /**
     * Initialize the unified API client
     */
    function initialize() {
        // Get current user on initialization
        AuthManager.getCurrentUser().then(user => {
            if (user) {
                // Connect to relevant WebSocket channels
                const channels = ['general', user.role.toLowerCase()];
                channels.forEach(channel => {
                    WebSocketManager.connect(channel);
                });
            }
        });

        // Expose global API
        window.ShikolaAPI = {
            ...API,
            auth: AuthManager,
            ws: WebSocketManager,
            request: apiRequest,
            cache: {
                clear: () => cache.clear(),
                delete: (key) => cache.delete(key),
                get: (key) => cache.get(key)
            }
        };

        console.log('Shikola Unified API Client initialized');
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})(window);
