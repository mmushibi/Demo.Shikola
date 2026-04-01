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
 * Unified Shikola API Client
 * Replaces localStorage usage with real backend calls
 * Supports real-time synchronization and proper RBAC
 */
(function(window) {
    'use strict';

    class UnifiedShikolaAPI {
        constructor() {
            this.baseURL = window.SHIKOLA_API_BASE || '/api';
            this.token = null;
            this.refreshToken = null;
            this.user = null;
            this.realtimeConnected = false;
            this.hubConnection = null;
            this.requestCache = new Map();
            this.pendingRequests = new Map();
            
            this.initializeAuth();
            this.setupRealtimeConnection();
        }

        // Authentication Management
        initializeAuth() {
            this.token = localStorage.getItem('shikola_token') || sessionStorage.getItem('shikola_token');
            this.refreshToken = localStorage.getItem('shikola_refresh_token') || sessionStorage.getItem('shikola_refresh_token');
            
            const userData = localStorage.getItem('shikola_user') || sessionStorage.getItem('shikola_user');
            if (userData) {
                try {
                    this.user = JSON.parse(userData);
                } catch (e) {
                    console.error('Failed to parse user data:', e);
                }
            }
        }

        async login(credentials) {
            try {
                const response = await this.request('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify(credentials)
                });

                if (response.success) {
                    this.token = response.data.token;
                    this.refreshToken = response.data.refreshToken;
                    this.user = response.data.user;

                    // Store tokens securely
                    if (credentials.rememberMe) {
                        localStorage.setItem('shikola_token', this.token);
                        localStorage.setItem('shikola_refresh_token', this.refreshToken);
                        localStorage.setItem('shikola_user', JSON.stringify(this.user));
                    } else {
                        sessionStorage.setItem('shikola_token', this.token);
                        sessionStorage.setItem('shikola_refresh_token', this.refreshToken);
                        sessionStorage.setItem('shikola_user', JSON.stringify(this.user));
                    }

                    // Initialize real-time connection
                    this.setupRealtimeConnection();

                    return response;
                }
                throw new Error(response.error || 'Login failed');
            } catch (error) {
                console.error('Login error:', error);
                throw error;
            }
        }

        async logout() {
            try {
                if (this.token) {
                    await this.request('/auth/logout', { method: 'POST' });
                }
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                this.clearAuth();
            }
        }

        clearAuth() {
            this.token = null;
            this.refreshToken = null;
            this.user = null;

            // Clear all storage
            localStorage.removeItem('shikola_token');
            localStorage.removeItem('shikola_refresh_token');
            localStorage.removeItem('shikola_user');
            sessionStorage.removeItem('shikola_token');
            sessionStorage.removeItem('shikola_refresh_token');
            sessionStorage.removeItem('shikola_user');

            // Disconnect real-time connection
            if (this.hubConnection) {
                this.hubConnection.stop();
                this.realtimeConnected = false;
            }
        }

        // Real-time Connection
        setupRealtimeConnection() {
            if (!this.token || this.realtimeConnected) return;

            try {
                // Create SignalR connection
                this.hubConnection = new signalR.HubConnectionBuilder()
                    .withUrl(`${this.baseURL}/shikola-hub`, {
                        accessTokenFactory: () => this.token
                    })
                    .withAutomaticReconnect()
                    .build();

                // Set up event handlers
                this.hubConnection.on('EntityChanged', (data) => {
                    this.handleRealtimeEvent('entity_changed', data);
                });

                this.hubConnection.on('AttendanceUpdated', (data) => {
                    this.handleRealtimeEvent('attendance_updated', data);
                });

                this.hubConnection.on('ExamPublished', (data) => {
                    this.handleRealtimeEvent('exam_published', data);
                });

                this.hubConnection.on('GradeUpdated', (data) => {
                    this.handleRealtimeEvent('grade_updated', data);
                });

                this.hubConnection.on('FeePaymentReceived', (data) => {
                    this.handleRealtimeEvent('fee_payment_received', data);
                });

                this.hubConnection.on('MessageReceived', (data) => {
                    this.handleRealtimeEvent('message_received', data);
                });

                this.hubConnection.on('TimetableUpdated', (data) => {
                    this.handleRealtimeEvent('timetable_updated', data);
                });

                this.hubConnection.on('SystemAnnouncement', (data) => {
                    this.handleRealtimeEvent('system_announcement', data);
                });

                // Start connection
                this.hubConnection.start()
                    .then(() => {
                        this.realtimeConnected = true;
                        console.log('Real-time connection established');
                    })
                    .catch(err => {
                        console.error('Failed to establish real-time connection:', err);
                        this.realtimeConnected = false;
                    });

            } catch (error) {
                console.error('Error setting up real-time connection:', error);
            }
        }

        handleRealtimeEvent(eventType, data) {
            // Dispatch custom event for frontend components to listen to
            const event = new CustomEvent('shikola:realtime', {
                detail: {
                    type: eventType,
                    data: data,
                    timestamp: new Date()
                }
            });
            window.dispatchEvent(event);

            // Update cache if needed
            this.updateCacheOnRealtimeEvent(eventType, data);
        }

        updateCacheOnRealtimeEvent(eventType, data) {
            switch (eventType) {
                case 'entity_changed':
                    const cacheKey = `${data.entityType}_${data.entity?.id || data.entityId}`;
                    if (data.action === 'deleted') {
                        this.requestCache.delete(cacheKey);
                    } else {
                        this.requestCache.set(cacheKey, data.entity);
                    }
                    break;
                // Add more cases as needed
            }
        }

        // HTTP Request Method
        async request(endpoint, options = {}) {
            const url = `${this.baseURL}${endpoint}`;
            const cacheKey = `${endpoint}_${JSON.stringify(options)}`;

            // Check cache for GET requests
            if (options.method === 'GET' || !options.method) {
                if (this.requestCache.has(cacheKey)) {
                    return Promise.resolve(this.requestCache.get(cacheKey));
                }
            }

            // Prevent duplicate requests
            if (this.pendingRequests.has(cacheKey)) {
                return this.pendingRequests.get(cacheKey);
            }

            const requestPromise = this.makeRequest(url, options);
            this.pendingRequests.set(cacheKey, requestPromise);

            try {
                const response = await requestPromise;
                
                // Cache successful GET requests
                if ((options.method === 'GET' || !options.method) && response.success) {
                    this.requestCache.set(cacheKey, response);
                    // Set cache expiry
                    setTimeout(() => {
                        this.requestCache.delete(cacheKey);
                    }, 5 * 60 * 1000); // 5 minutes
                }

                return response;
            } finally {
                this.pendingRequests.delete(cacheKey);
            }
        }

        async makeRequest(url, options = {}) {
            const config = {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };

            if (this.token) {
                config.headers['Authorization'] = `Bearer ${this.token}`;
            }

            if (options.body) {
                config.body = options.body;
            }

            try {
                const response = await fetch(url, config);
                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        // Token expired, try to refresh
                        const refreshSuccess = await this.refreshAccessToken();
                        if (refreshSuccess) {
                            // Retry original request
                            config.headers['Authorization'] = `Bearer ${this.token}`;
                            const retryResponse = await fetch(url, config);
                            return await retryResponse.json();
                        } else {
                            this.clearAuth();
                            window.location.href = '/login';
                        }
                    }
                    throw new Error(data.error || `HTTP ${response.status}`);
                }

                return data;
            } catch (error) {
                console.error('API request error:', error);
                throw error;
            }
        }

        async refreshAccessToken() {
            if (!this.refreshToken) return false;

            try {
                const response = await fetch(`${this.baseURL}/auth/refresh`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ refreshToken: this.refreshToken })
                });

                if (response.ok) {
                    const data = await response.json();
                    this.token = data.token;
                    
                    // Update stored token
                    if (localStorage.getItem('shikola_token')) {
                        localStorage.setItem('shikola_token', this.token);
                    } else {
                        sessionStorage.setItem('shikola_token', this.token);
                    }
                    
                    return true;
                }
            } catch (error) {
                console.error('Token refresh failed:', error);
            }

            return false;
        }

        // Portal-specific API methods
        // Accountant Portal
        accountant = {
            getChartOfAccounts: () => this.request('/accountant-portal/chart-of-accounts'),
            createChartOfAccount: (data) => this.request('/accountant-portal/chart-of-accounts', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            getIncomes: (startDate, endDate) => {
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                return this.request(`/accountant-portal/incomes?${params}`);
            },
            createIncome: (data) => this.request('/accountant-portal/incomes', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            getExpenses: (startDate, endDate) => {
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                return this.request(`/accountant-portal/expenses?${params}`);
            },
            createExpense: (data) => this.request('/accountant-portal/expenses', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            getBudgets: () => this.request('/accountant-portal/budgets'),
            createBudget: (data) => this.request('/accountant-portal/budgets', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            getFinancialReports: (reportType, startDate, endDate) => {
                const params = new URLSearchParams();
                params.append('reportType', reportType);
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                return this.request(`/accountant-portal/financial-reports?${params}`);
            },
            getAuditTrail: (startDate, endDate, entityType) => {
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                if (entityType) params.append('entityType', entityType);
                return this.request(`/accountant-portal/audit-trail?${params}`);
            }
        };

        // Pupil Portal
        pupil = {
            getProfile: () => this.request('/pupil-portal/profile'),
            updateProfile: (data) => this.request('/pupil-portal/profile', {
                method: 'PUT',
                body: JSON.stringify(data)
            }),
            uploadPhoto: (file) => {
                const formData = new FormData();
                formData.append('photo', file);
                return this.request('/pupil-portal/profile/photo', {
                    method: 'POST',
                    body: formData,
                    headers: {} // Let browser set Content-Type for FormData
                });
            },
            getExamResults: (examId, term) => {
                const params = new URLSearchParams();
                if (examId) params.append('examId', examId);
                if (term) params.append('term', term);
                return this.request(`/pupil-portal/exam-results?${params}`);
            },
            getExamResultsSummary: (term) => {
                const params = new URLSearchParams();
                if (term) params.append('term', term);
                return this.request(`/pupil-portal/exam-results/summary?${params}`);
            },
            getAssignments: (status) => {
                const params = new URLSearchParams();
                if (status) params.append('status', status);
                return this.request(`/pupil-portal/assignments?${params}`);
            },
            submitAssignment: (assignmentId, data) => {
                const formData = new FormData();
                formData.append('content', data.content);
                if (data.file) formData.append('file', data.file);
                return this.request(`/pupil-portal/assignments/${assignmentId}/submit`, {
                    method: 'POST',
                    body: formData,
                    headers: {} // Let browser set Content-Type for FormData
                });
            },
            getTimetable: () => this.request('/pupil-portal/timetable'),
            getAttendance: (startDate, endDate) => {
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                return this.request(`/pupil-portal/attendance?${params}`);
            },
            getFees: () => this.request('/pupil-portal/fees'),
            getMessages: (type) => {
                const params = new URLSearchParams();
                if (type) params.append('type', type);
                return this.request(`/pupil-portal/messages?${params}`);
            },
            markMessageAsRead: (messageId) => this.request(`/pupil-portal/messages/${messageId}/read`, {
                method: 'POST'
            })
        };

        // Teacher Portal
        teacher = {
            getDashboard: () => this.request('/teacher/dashboard'),
            getClasses: () => this.request('/teacher/classes'),
            getAssignments: (classId) => {
                const params = classId ? `?classId=${classId}` : '';
                return this.request(`/teacher/assignments${params}`);
            },
            createAssignment: (data) => this.request('/teacher/assignments', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            getAttendance: (classId, date) => {
                const params = new URLSearchParams();
                if (classId) params.append('classId', classId);
                if (date) params.append('date', date);
                return this.request(`/teacher/attendance?${params}`);
            },
            markAttendance: (data) => this.request('/teacher/attendance', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            getExams: (classId) => {
                const params = classId ? `?classId=${classId}` : '';
                return this.request(`/teacher/exams${params}`);
            },
            createExam: (data) => this.request('/teacher/exams', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            getTimetable: () => this.request('/teacher/timetable'),
            getReports: (type, filters) => {
                const params = new URLSearchParams();
                params.append('type', type);
                Object.keys(filters || {}).forEach(key => {
                    if (filters[key]) params.append(key, filters[key]);
                });
                return this.request(`/teacher/reports?${params}`);
            }
        };

        // School Admin Portal
        schoolAdmin = {
            getDashboard: () => this.request('/school-admin/dashboard'),
            getPupils: (filters) => {
                const params = new URLSearchParams();
                Object.keys(filters || {}).forEach(key => {
                    if (filters[key]) params.append(key, filters[key]);
                });
                return this.request(`/school-admin/pupils?${params}`);
            },
            createPupil: (data) => this.request('/school-admin/pupils', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            getClasses: () => this.request('/school-admin/classes'),
            createClass: (data) => this.request('/school-admin/classes', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            getTeachers: () => this.request('/school-admin/teachers'),
            createTeacher: (data) => this.request('/school-admin/teachers', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            getExams: () => this.request('/school-admin/exams'),
            createExam: (data) => this.request('/school-admin/exams', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            getTimetables: () => this.request('/school-admin/timetables'),
            createTimetable: (data) => this.request('/school-admin/timetables', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            getReports: (type, filters) => {
                const params = new URLSearchParams();
                params.append('type', type);
                Object.keys(filters || {}).forEach(key => {
                    if (filters[key]) params.append(key, filters[key]);
                });
                return this.request(`/school-admin/reports?${params}`);
            }
        };

        // Operations Portal
        operations = {
            getDashboard: () => this.request('/operations/dashboard'),
            getSchools: (filters) => {
                const params = new URLSearchParams();
                Object.keys(filters || {}).forEach(key => {
                    if (filters[key]) params.append(key, filters[key]);
                });
                return this.request(`/operations/schools?${params}`);
            },
            createSchool: (data) => this.request('/operations/schools', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            updateSchool: (schoolId, data) => this.request(`/operations/schools/${schoolId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            }),
            deleteSchool: (schoolId) => this.request(`/operations/schools/${schoolId}`, {
                method: 'DELETE'
            }),
            getUsers: (filters) => {
                const params = new URLSearchParams();
                Object.keys(filters || {}).forEach(key => {
                    if (filters[key]) params.append(key, filters[key]);
                });
                return this.request(`/operations/users?${params}`);
            },
            createUser: (data) => this.request('/operations/users', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            updateUser: (userId, data) => this.request(`/operations/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            }),
            deleteUser: (userId) => this.request(`/operations/users/${userId}`, {
                method: 'DELETE'
            }),
            getSystemMetrics: () => this.request('/operations/system-metrics'),
            getDatabaseStats: () => this.request('/operations/database-stats'),
            getErrorLogs: (filters) => {
                const params = new URLSearchParams();
                Object.keys(filters || {}).forEach(key => {
                    if (filters[key]) params.append(key, filters[key]);
                });
                return this.request(`/operations/error-logs?${params}`);
            },
            getAccessLogs: (filters) => {
                const params = new URLSearchParams();
                Object.keys(filters || {}).forEach(key => {
                    if (filters[key]) params.append(key, filters[key]);
                });
                return this.request(`/operations/access-logs?${params}`);
            },
            getFinancialOverview: (filters) => {
                const params = new URLSearchParams();
                Object.keys(filters || {}).forEach(key => {
                    if (filters[key]) params.append(key, filters[key]);
                });
                return this.request(`/operations/financial-overview?${params}`);
            }
        };

        // Super Admin Portal
        superAdmin = {
            getDashboard: () => this.request('/super-admin/dashboard'),
            getSchools: () => this.request('/super-admin/schools'),
            createSchool: (data) => this.request('/super-admin/schools', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            getUsers: (role, schoolId) => {
                const params = new URLSearchParams();
                if (role) params.append('role', role);
                if (schoolId) params.append('schoolId', schoolId);
                return this.request(`/super-admin/users?${params}`);
            },
            createUser: (data) => this.request('/super-admin/users', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            getAnalytics: (type, filters) => {
                const params = new URLSearchParams();
                params.append('type', type);
                Object.keys(filters || {}).forEach(key => {
                    if (filters[key]) params.append(key, filters[key]);
                });
                return this.request(`/super-admin/analytics?${params}`);
            }
        };

        // Utility Methods
        getCurrentUser() {
            return this.user;
        }

        isAuthenticated() {
            return !!this.token && !!this.user;
        }

        hasRole(role) {
            return this.user && this.user.role === role;
        }

        hasPermission(permission) {
            return this.user && this.user.permissions && this.user.permissions.includes(permission);
        }

        clearCache() {
            this.requestCache.clear();
        }
    }

    // Create global instance
    window.ShikolaAPI = new UnifiedShikolaAPI();

    // Backward compatibility
    window.SHIKOLA_API_BASE = window.SHIKOLA_API_BASE || '/api';

})(window);
