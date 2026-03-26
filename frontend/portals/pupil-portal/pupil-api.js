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
 * Shikola Pupil Portal API Integration
 * Provides unified API access for all pupil portal functionality
 */
(function () {
    'use strict';

    function getAuthToken() {
        try {
            return localStorage.getItem('authToken') || localStorage.getItem('shikola_token') || null;
        } catch (e) {
            return null;
        }
    }

    function buildAuthHeaders() {
        var headers = { 'Content-Type': 'application/json' };
        var token = getAuthToken();
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        return headers;
    }

    function canUseApi() {
        var base = window.SHIKOLA_API_BASE;
        var token = getAuthToken();
        // Always try to use real API when backend is available
        return !!(base && token);
    }

    async function apiRequest(endpoint, options) {
        var base = window.SHIKOLA_API_BASE;
        if (!base) return { success: false, error: 'API not configured' };
        
        try {
            var response = await fetch(base + endpoint, Object.assign({
                headers: buildAuthHeaders()
            }, options || {}));
            
            var data = await response.json().catch(function () { return null; });
            
            if (!response.ok) {
                return { success: false, error: data?.error || 'Request failed', status: response.status };
            }
            
            return { success: true, data: data, status: response.status };
        } catch (e) {
            return { success: false, error: 'Network error: ' + e.message };
        }
    }

    // Pupil Profile
    async function getProfile() {
        if (!canUseApi()) {
            var profile = window.ShikolaPupilPortal ? window.ShikolaPupilPortal.getActivePupilProfile() : null;
            return { success: true, data: profile };
        }

        return await apiRequest('/api/pupil/profile');
    }

    async function updateProfile(data) {
        if (!canUseApi()) {
            return { success: true, data: data };
        }

        return await apiRequest('/api/pupil/profile', {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    // Timetable
    async function getTimetable(params) {
        var queryString = '';
        if (params && typeof params === 'object') {
            var parts = [];
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key) && params[key] != null) {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                }
            }
            if (parts.length) {
                queryString = '?' + parts.join('&');
            }
        }

        if (!canUseApi()) {
            var timetableData = getTimetableFromLocalStorage();
            return { success: true, data: timetableData, source: 'localStorage' };
        }

        try {
            var result = await apiRequest('/api/pupil/timetable' + queryString);
            if (result.success && result.data) {
                // Cache successful response in localStorage
                saveTimetableToLocalStorage(result.data);
                return { success: true, data: result.data, source: 'api' };
            }
            // API returned success but no data, fallback to localStorage
            var cachedData = getTimetableFromLocalStorage();
            return { success: true, data: cachedData, source: 'localStorage' };
        } catch (error) {
            // API failed - requires backend connection
            console.error('API failed for timetable:', error);
            return { success: false, error: 'Backend connection required for timetable data', source: 'error' };
        }
    }

    function getTimetableFromLocalStorage() {
        try {
            var cached = localStorage.getItem('shikola_pupil_timetable_v1');
            if (cached) {
                var data = JSON.parse(cached);
                // Check if cache is still valid (24 hours)
                if (data.timestamp && (Date.now() - data.timestamp) < 24 * 60 * 60 * 1000) {
                    return data.timetable;
                }
            }
        } catch (e) {
            console.warn('Failed to read timetable from localStorage:', e);
        }
        // No fallback - API required for production
        return [];
    }

    function saveTimetableToLocalStorage(timetable) {
        try {
            var cacheData = {
                timetable: timetable,
                timestamp: Date.now()
            };
            localStorage.setItem('shikola_pupil_timetable_v1', JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Failed to save timetable to localStorage:', e);
        }
    }


    // Assignments
    async function getAssignments(params) {
        var queryString = '';
        if (params && typeof params === 'object') {
            var parts = [];
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key) && params[key] != null) {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                }
            }
            if (parts.length) {
                queryString = '?' + parts.join('&');
            }
        }

        if (!canUseApi()) {
            var assignments = getAssignmentsFromLocalStorage();
            return { success: true, data: assignments, source: 'localStorage' };
        }

        try {
            var result = await apiRequest('/api/pupil/assignments' + queryString);
            if (result.success && result.data) {
                // Cache successful response in localStorage
                saveAssignmentsToLocalStorage(result.data);
                return { success: true, data: result.data, source: 'api' };
            }
            // API returned success but no data, fallback to localStorage
            var cachedData = getAssignmentsFromLocalStorage();
            return { success: true, data: cachedData, source: 'localStorage' };
        } catch (error) {
            // API failed - requires backend connection
            console.error('API failed for assignments:', error);
            return { success: false, error: 'Backend connection required for assignments data', source: 'error' };
        }
    }

    function getAssignmentsFromLocalStorage() {
        try {
            var cached = localStorage.getItem('shikola_pupil_assignments_v1');
            if (cached) {
                var data = JSON.parse(cached);
                // Check if cache is still valid (1 hour for assignments)
                if (data.timestamp && (Date.now() - data.timestamp) < 60 * 60 * 1000) {
                    return data.assignments;
                }
            }
        } catch (e) {
            console.warn('Failed to read assignments from localStorage:', e);
        }
        // No fallback - API required for production
        return [];
    }

    function saveAssignmentsToLocalStorage(assignments) {
        try {
            var cacheData = {
                assignments: assignments,
                timestamp: Date.now()
            };
            localStorage.setItem('shikola_pupil_assignments_v1', JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Failed to save assignments to localStorage:', e);
        }
    }


    async function submitAssignment(assignmentId, formData) {
        if (!canUseApi()) {
            return { success: true, data: { id: assignmentId, status: 'Submitted' } };
        }

        return await apiRequest('/api/pupil/assignments/' + assignmentId + '/submit', {
            method: 'POST',
            body: formData
        });
    }

    // Grades and Results
    async function getGrades(params) {
        var queryString = '';
        if (params && typeof params === 'object') {
            var parts = [];
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key) && params[key] != null) {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                }
            }
            if (parts.length) {
                queryString = '?' + parts.join('&');
            }
        }

        if (!canUseApi()) {
            var grades = getGradesFromLocalStorage();
            return { success: true, data: grades, source: 'localStorage' };
        }

        try {
            var result = await apiRequest('/api/pupil/grades' + queryString);
            if (result.success && result.data) {
                // Cache successful response in localStorage
                saveGradesToLocalStorage(result.data);
                return { success: true, data: result.data, source: 'api' };
            }
            // API returned success but no data, fallback to localStorage
            var cachedData = getGradesFromLocalStorage();
            return { success: true, data: cachedData, source: 'localStorage' };
        } catch (error) {
            // API failed - requires backend connection
            console.error('API failed for grades:', error);
            return { success: false, error: 'Backend connection required for grades data', source: 'error' };
        }
    }

    function getGradesFromLocalStorage() {
        try {
            var cached = localStorage.getItem('shikola_pupil_grades_v1');
            if (cached) {
                var data = JSON.parse(cached);
                // Check if cache is still valid (6 hours for grades)
                if (data.timestamp && (Date.now() - data.timestamp) < 6 * 60 * 60 * 1000) {
                    return data.grades;
                }
            }
        } catch (e) {
            console.warn('Failed to read grades from localStorage:', e);
        }
        // No fallback - API required for production
        return [];
    }

    function saveGradesToLocalStorage(grades) {
        try {
            var cacheData = {
                grades: grades,
                timestamp: Date.now()
            };
            localStorage.setItem('shikola_pupil_grades_v1', JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Failed to save grades to localStorage:', e);
        }
    }


    async function getReportCard(params) {
        var queryString = '';
        if (params && typeof params === 'object') {
            var parts = [];
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key) && params[key] != null) {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                }
            }
            if (parts.length) {
                queryString = '?' + parts.join('&');
            }
        }

        if (!canUseApi()) {
            var reportCard = getReportCardFromLocalStorage();
            return { success: true, data: reportCard, source: 'localStorage' };
        }

        try {
            var result = await apiRequest('/api/pupil/report-card' + queryString);
            if (result.success && result.data) {
                // Cache successful response in localStorage
                saveReportCardToLocalStorage(result.data);
                return { success: true, data: result.data, source: 'api' };
            }
            // API returned success but no data, fallback to localStorage
            var cachedData = getReportCardFromLocalStorage();
            return { success: true, data: cachedData, source: 'localStorage' };
        } catch (error) {
            // API failed - requires backend connection
            console.error('API failed for report card:', error);
            return { success: false, error: 'Backend connection required for report card data', source: 'error' };
        }
    }

    function getReportCardFromLocalStorage() {
        try {
            var cached = localStorage.getItem('shikola_pupil_report_card_v1');
            if (cached) {
                var data = JSON.parse(cached);
                // Check if cache is still valid (24 hours for report cards)
                if (data.timestamp && (Date.now() - data.timestamp) < 24 * 60 * 60 * 1000) {
                    return data.reportCard;
                }
            }
        } catch (e) {
            console.warn('Failed to read report card from localStorage:', e);
        }
        // No fallback - API required for production
        return null;
    }

    function saveReportCardToLocalStorage(reportCard) {
        try {
            var cacheData = {
                reportCard: reportCard,
                timestamp: Date.now()
            };
            localStorage.setItem('shikola_pupil_report_card_v1', JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Failed to save report card to localStorage:', e);
        }
    }


    // Fees and Payments
    async function getFeesSummary() {
        if (!canUseApi()) {
            return { success: false, error: 'API not available - fees summary requires backend connection' };
        }

        return await apiRequest('/api/pupil/fees/summary');
    }

    async function getInvoices(params) {
        var queryString = '';
        if (params && typeof params === 'object') {
            var parts = [];
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key) && params[key] != null) {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                }
            }
            if (parts.length) {
                queryString = '?' + parts.join('&');
            }
        }

        if (!canUseApi()) {
            var invoices = getInvoicesFromLocalStorage();
            return { success: true, data: invoices, source: 'localStorage' };
        }

        try {
            var result = await apiRequest('/api/pupil/fees/invoices' + queryString);
            if (result.success && result.data) {
                // Cache successful response in localStorage
                saveInvoicesToLocalStorage(result.data);
                return { success: true, data: result.data, source: 'api' };
            }
            // API returned success but no data, fallback to localStorage
            var cachedData = getInvoicesFromLocalStorage();
            return { success: true, data: cachedData, source: 'localStorage' };
        } catch (error) {
            // API failed - requires backend connection
            console.error('API failed for invoices:', error);
            return { success: false, error: 'Backend connection required for invoices data', source: 'error' };
        }
    }

    function getInvoicesFromLocalStorage() {
        try {
            var cached = localStorage.getItem('shikola_pupil_invoices_v1');
            if (cached) {
                var data = JSON.parse(cached);
                // Check if cache is still valid (2 hours for invoices)
                if (data.timestamp && (Date.now() - data.timestamp) < 2 * 60 * 60 * 1000) {
                    return data.invoices;
                }
            }
        } catch (e) {
            console.warn('Failed to read invoices from localStorage:', e);
        }
        // No fallback - API required for production
        return [];
    }

    function saveInvoicesToLocalStorage(invoices) {
        try {
            var cacheData = {
                invoices: invoices,
                timestamp: Date.now()
            };
            localStorage.setItem('shikola_pupil_invoices_v1', JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Failed to save invoices to localStorage:', e);
        }
    }


    async function getPayments(params) {
        var queryString = '';
        if (params && typeof params === 'object') {
            var parts = [];
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key) && params[key] != null) {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                }
            }
            if (parts.length) {
                queryString = '?' + parts.join('&');
            }
        }

        if (!canUseApi()) {
            var payments = getPaymentsFromLocalStorage();
            return { success: true, data: payments, source: 'localStorage' };
        }

        try {
            var result = await apiRequest('/api/pupil/fees/payments' + queryString);
            if (result.success && result.data) {
                // Cache successful response in localStorage
                savePaymentsToLocalStorage(result.data);
                return { success: true, data: result.data, source: 'api' };
            }
            // API returned success but no data, fallback to localStorage
            var cachedData = getPaymentsFromLocalStorage();
            return { success: true, data: cachedData, source: 'localStorage' };
        } catch (error) {
            // API failed - requires backend connection
            console.error('API failed for payments:', error);
            return { success: false, error: 'Backend connection required for payments data', source: 'error' };
        }
    }

    function getPaymentsFromLocalStorage() {
        try {
            var cached = localStorage.getItem('shikola_pupil_payments_v1');
            if (cached) {
                var data = JSON.parse(cached);
                // Check if cache is still valid (2 hours for payments)
                if (data.timestamp && (Date.now() - data.timestamp) < 2 * 60 * 60 * 1000) {
                    return data.payments;
                }
            }
        } catch (e) {
            console.warn('Failed to read payments from localStorage:', e);
        }
        // No fallback - API required for production
        return [];
    }

    function savePaymentsToLocalStorage(payments) {
        try {
            var cacheData = {
                payments: payments,
                timestamp: Date.now()
            };
            localStorage.setItem('shikola_pupil_payments_v1', JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Failed to save payments to localStorage:', e);
        }
    }


    // Attendance
    async function getAttendance(params) {
        var queryString = '';
        if (params && typeof params === 'object') {
            var parts = [];
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key) && params[key] != null) {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                }
            }
            if (parts.length) {
                queryString = '?' + parts.join('&');
            }
        }

        if (!canUseApi()) {
            var attendance = getAttendanceFromLocalStorage();
            return { success: true, data: attendance, source: 'localStorage' };
        }

        try {
            var result = await apiRequest('/api/pupil/attendance' + queryString);
            if (result.success && result.data) {
                // Cache successful response in localStorage
                saveAttendanceToLocalStorage(result.data);
                return { success: true, data: result.data, source: 'api' };
            }
            // API returned success but no data, fallback to localStorage
            var cachedData = getAttendanceFromLocalStorage();
            return { success: true, data: cachedData, source: 'localStorage' };
        } catch (error) {
            // API failed - requires backend connection
            console.error('API failed for attendance:', error);
            return { success: false, error: 'Backend connection required for attendance data', source: 'error' };
        }
    }

    function getAttendanceFromLocalStorage() {
        try {
            var cached = localStorage.getItem('shikola_pupil_attendance_v1');
            if (cached) {
                var data = JSON.parse(cached);
                // Check if cache is still valid (30 minutes for attendance)
                if (data.timestamp && (Date.now() - data.timestamp) < 30 * 60 * 1000) {
                    return data.attendance;
                }
            }
        } catch (e) {
            console.warn('Failed to read attendance from localStorage:', e);
        }
        // No fallback - API required for production
        return [];
    }

    function saveAttendanceToLocalStorage(attendance) {
        try {
            var cacheData = {
                attendance: attendance,
                timestamp: Date.now()
            };
            localStorage.setItem('shikola_pupil_attendance_v1', JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Failed to save attendance to localStorage:', e);
        }
    }


    // Notifications
    async function getNotifications() {
        if (!canUseApi()) {
            var notifications = getNotificationsFromLocalStorage();
            return { success: true, data: notifications, source: 'localStorage' };
        }

        try {
            var result = await apiRequest('/api/pupil/notifications');
            if (result.success && result.data) {
                // Cache successful response in localStorage
                saveNotificationsToLocalStorage(result.data);
                return { success: true, data: result.data, source: 'api' };
            }
            // API returned success but no data, fallback to localStorage
            var cachedData = getNotificationsFromLocalStorage();
            return { success: true, data: cachedData, source: 'localStorage' };
        } catch (error) {
            // API failed - requires backend connection
            console.error('API failed for notifications:', error);
            return { success: false, error: 'Backend connection required for notifications data', source: 'error' };
        }
    }

    function getNotificationsFromLocalStorage() {
        try {
            var cached = localStorage.getItem('shikola_pupil_notifications_v1');
            if (cached) {
                var data = JSON.parse(cached);
                // Check if cache is still valid (15 minutes for notifications)
                if (data.timestamp && (Date.now() - data.timestamp) < 15 * 60 * 1000) {
                    return data.notifications;
                }
            }
        } catch (e) {
            console.warn('Failed to read notifications from localStorage:', e);
        }
        // No fallback - API required for production
        return [];
    }

    function saveNotificationsToLocalStorage(notifications) {
        try {
            var cacheData = {
                notifications: notifications,
                timestamp: Date.now()
            };
            localStorage.setItem('shikola_pupil_notifications_v1', JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Failed to save notifications to localStorage:', e);
        }
    }


    async function markNotificationRead(id) {
        if (!canUseApi()) {
            return { success: true };
        }

        return await apiRequest('/api/pupil/notifications/' + id + '/read', {
            method: 'PATCH'
        });
    }

    // Dashboard
    async function getDashboard() {
        if (!canUseApi()) {
            var dashboard = getDashboardFromLocalStorage();
            return { success: true, data: dashboard, source: 'localStorage' };
        }

        try {
            var result = await apiRequest('/api/pupil/dashboard');
            if (result.success && result.data) {
                // Cache successful response in localStorage
                saveDashboardToLocalStorage(result.data);
                return { success: true, data: result.data, source: 'api' };
            }
            // API returned success but no data, fallback to localStorage
            var cachedData = getDashboardFromLocalStorage();
            return { success: true, data: cachedData, source: 'localStorage' };
        } catch (error) {
            // API failed - requires backend connection
            console.error('API failed for dashboard:', error);
            return { success: false, error: 'Backend connection required for dashboard data', source: 'error' };
        }
    }

    function getDashboardFromLocalStorage() {
        try {
            var cached = localStorage.getItem('shikola_pupil_dashboard_v1');
            if (cached) {
                var data = JSON.parse(cached);
                // Check if cache is still valid (5 minutes for dashboard)
                if (data.timestamp && (Date.now() - data.timestamp) < 5 * 60 * 1000) {
                    return data.dashboard;
                }
            }
        } catch (e) {
            console.warn('Failed to read dashboard from localStorage:', e);
        }
        // No fallback - API required for production
        return null;
    }

    function saveDashboardToLocalStorage(dashboard) {
        try {
            var cacheData = {
                dashboard: dashboard,
                timestamp: Date.now()
            };
            localStorage.setItem('shikola_pupil_dashboard_v1', JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Failed to save dashboard to localStorage:', e);
        }
    }


    // Export API
    window.ShikolaPupilApi = {
        // Profile
        getProfile: getProfile,
        updateProfile: updateProfile,

        // Timetable
        getTimetable: getTimetable,

        // Assignments
        getAssignments: getAssignments,
        submitAssignment: submitAssignment,

        // Grades
        getGrades: getGrades,
        getReportCard: getReportCard,

        // Fees
        getFeesSummary: getFeesSummary,
        getInvoices: getInvoices,
        getPayments: getPayments,

        // Attendance
        getAttendance: getAttendance,

        // Notifications
        getNotifications: getNotifications,
        markNotificationRead: markNotificationRead,

        // Dashboard
        getDashboard: getDashboard,

        // Utility
        canUseApi: canUseApi,
        apiRequest: apiRequest
    };

})();
