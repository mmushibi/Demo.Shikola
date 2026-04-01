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
 * Shared Teacher API Client
 * Provides unified API access for all teacher portal pages
 * Integrates role-based access control and multiple subject teachers support
 */

(function() {
    'use strict';

    // API configuration
    const API_BASE = window.SHIKOLA_API_BASE || '/api';
    const API_VERSION = 'v1';
    
    // Authentication helpers
    function getAuthToken() {
        try {
            return localStorage.getItem('authToken') || 
                   localStorage.getItem('shikola_token') || 
                   sessionStorage.getItem('authToken') || null;
        } catch (e) {
            return null;
        }
    }

    function buildAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    // Generic API request handler
    async function apiRequest(endpoint, options = {}) {
        const url = `${API_BASE}/api${endpoint}`;
        const config = {
            headers: buildAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            // Authentication error handling
            if (response.status === 401) {
                console.warn('[Teacher API] Authentication expired, redirecting to login...');
                // Clear tokens and redirect to login
                if (window.authManager) {
                    window.authManager.clearAuth();
                }
                localStorage.removeItem('authToken');
                localStorage.removeItem('shikola_token');
                sessionStorage.removeItem('authToken');
                window.location.href = '../../public/signin.html';
                return null;
            }

            // Handle other HTTP errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Teacher API namespace
    window.ShikolaTeacherApi = {
        
        // Dashboard API
        async getDashboard() {
            return await apiRequest('/teacher/dashboard');
        },

        async getMyClasses() {
            return await apiRequest('/teacher/my-classes');
        },

        async getAttendance(params = {}) {
            const query = new URLSearchParams(params).toString();
            return await apiRequest(`/teacher/attendance?${query}`);
        },

        // Assignments API
        async getAssignments(params = {}) {
            const query = new URLSearchParams(params).toString();
            return await apiRequest(`/teacher/assignments?${query}`);
        },

        async createAssignment(assignmentData) {
            return await apiRequest('/teacher/assignments', {
                method: 'POST',
                body: JSON.stringify(assignmentData)
            });
        },

        async updateAssignment(id, assignmentData) {
            return await apiRequest(`/teacher/assignments/${id}`, {
                method: 'PUT',
                body: JSON.stringify(assignmentData)
            });
        },

        async deleteAssignment(id) {
            return await apiRequest(`/teacher/assignments/${id}`, {
                method: 'DELETE'
            });
        },

        async getAssignmentSubmissions(id) {
            return await apiRequest(`/teacher/assignments/${id}/submissions`);
        },

        async gradeSubmission(assignmentId, gradeData) {
            return await apiRequest(`/teacher/assignments/${assignmentId}/grade`, {
                method: 'POST',
                body: JSON.stringify(gradeData)
            });
        },

        // Subject Teacher Specific API
        async getMyPupils(params = {}) {
            const query = new URLSearchParams(params).toString();
            return await apiRequest(`/subject-teacher/my-pupils?${query}`);
        },

        async getMySubjects(params = {}) {
            const query = new URLSearchParams(params).toString();
            return await apiRequest(`/subject-teacher/my-subjects?${query}`);
        },

        async getClassSubjectTeachers(classId) {
            return await apiRequest(`/subject-teacher/class-subjects/${classId}`);
        },

        async getAttendanceSubset(params = {}) {
            const query = new URLSearchParams(params).toString();
            return await apiRequest(`/subject-teacher/attendance-subset?${query}`);
        },

        async checkPupilAccess(pupilId, accessType = 'view') {
            return await apiRequest(`/subject-teacher/pupil-access/${pupilId}?accessType=${accessType}`);
        },

        // Attendance API (Enhanced)
        async saveClassAttendance(className, date, students, options = {}) {
            return await apiRequest('/teacher/attendance/mark', {
                method: 'POST',
                body: JSON.stringify({
                    className,
                    date,
                    students,
                    ...options
                })
            });
        },

        async loadClassAttendance(className, date) {
            return await apiRequest(`/teacher/attendance/class?className=${encodeURIComponent(className)}&date=${date}`);
        },

        async saveAttendanceRemarks(className, date, remarks) {
            return await apiRequest('/teacher/attendance/remarks', {
                method: 'POST',
                body: JSON.stringify({
                    className,
                    date,
                    remarks
                })
            });
        },

        // Class Tests API
        async getClassTests(params = {}) {
            const query = new URLSearchParams(params).toString();
            return await apiRequest(`/teacher/class-tests?${query}`);
        },

        async createClassTest(testData) {
            return await apiRequest('/teacher/class-tests', {
                method: 'POST',
                body: JSON.stringify(testData)
            });
        },

        async saveClassTestMarks(testId, marks) {
            return await apiRequest('/teacher/class-tests/marks', {
                method: 'POST',
                body: JSON.stringify({
                    testId,
                    marks
                })
            });
        },

        async getClassTestResults(params = {}) {
            const query = new URLSearchParams(params).toString();
            return await apiRequest(`/teacher/class-tests/results?${query}`);
        },

        // Exams API
        async getMyExams(params = {}) {
            const query = new URLSearchParams(params).toString();
            return await apiRequest(`/teacher/exams/my-exams?${query}`);
        },

        async getExamSchedules(params = {}) {
            const query = new URLSearchParams(params).toString();
            return await apiRequest(`/teacher/exams/exam-schedules?${query}`);
        },

        async saveExamMarks(examData) {
            return await apiRequest('/teacher/exams/exam-marks', {
                method: 'POST',
                body: JSON.stringify(examData)
            });
        },

        async getMyClasses() {
            return await apiRequest('/teacher/my-classes');
        },

        async getMySubjects() {
            return await apiRequest('/teacher/my-subjects');
        },

        async getMySubjectsForClass(className) {
            return await apiRequest(`/teacher/my-subjects?className=${encodeURIComponent(className)}`);
        },

        async getMyClassesForSubject(subject) {
            return await apiRequest(`/teacher/my-classes?subject=${encodeURIComponent(subject)}`);
        },

        async getMyClassSubjectAssignments() {
            return await apiRequest('/teacher/class-subject-assignments');
        },

        // Profile API
        async getTeacherProfile() {
            return await apiRequest('/teacher/profile');
        },

        // Pupils API
        async getMyPupils(className) {
            const query = className ? `?className=${encodeURIComponent(className)}` : '';
            return await apiRequest(`/teacher/pupils${query}`);
        },

        // Timetable API
        async getTimetable(params = {}) {
            const query = new URLSearchParams(params).toString();
            return await apiRequest(`/teacher/timetable?${query}`);
        },

        // Reports API
        async getStudentReportData(params = {}) {
            const query = new URLSearchParams(params).toString();
            return await apiRequest(`/teacher/reports/student-data?${query}`);
        },

        async generateReportCard(params = {}) {
            const query = new URLSearchParams(params).toString();
            return await apiRequest(`/teacher/reports/generate-report-card?${query}`);
        },

        async saveReportCard(reportData) {
            return await apiRequest('/teacher/reports/save-report-card', {
                method: 'POST',
                body: JSON.stringify(reportData)
            });
        },

        // Live Classes API
        async getLiveClasses(params = {}) {
            const query = new URLSearchParams(params).toString();
            return await apiRequest(`/teacher/live-classes?${query}`);
        },

        async createLiveClass(classData) {
            return await apiRequest('/teacher/live-classes', {
                method: 'POST',
                body: JSON.stringify(classData)
            });
        },

        async updateLiveClass(id, classData) {
            return await apiRequest(`/teacher/live-classes/${id}`, {
                method: 'PUT',
                body: JSON.stringify(classData)
            });
        },

        async deleteLiveClass(id) {
            return await apiRequest(`/teacher/live-classes/${id}`, {
                method: 'DELETE'
            });
        },

        async startLiveClass(id) {
            return await apiRequest(`/teacher/live-classes/${id}/start`, {
                method: 'POST'
            });
        },

        async endLiveClass(id) {
            return await apiRequest(`/teacher/live-classes/${id}/end`, {
                method: 'POST'
            });
        },

        // Reports API
        async getClassReport(className, params = {}) {
            const query = new URLSearchParams(params).toString();
            return await apiRequest(`/teacher/reports/class/${encodeURIComponent(className)}?${query}`);
        },

        async getSubjectReport(subjectId, params = {}) {
            const query = new URLSearchParams(params).toString();
            return await apiRequest(`/teacher/reports/subject/${subjectId}?${query}`);
        },

        async getPupilReport(pupilId, params = {}) {
            const query = new URLSearchParams(params).toString();
            return await apiRequest(`/teacher/reports/pupil/${pupilId}?${query}`);
        },

        // ECZ Grading Integration
        async calculateECZGrade(score, gradeLevel = 'secondary') {
            return await apiRequest(`/ecz-grading/calculate?score=${score}&gradeLevel=${gradeLevel}`);
        },

        async getGradingScale(schoolId, gradeLevel = 'secondary') {
            return await apiRequest(`/ecz-grading/scale?schoolId=${schoolId}&gradeLevel=${gradeLevel}`);
        },

        async calculateDivision(grades) {
            return await apiRequest('/ecz-grading/division', {
                method: 'POST',
                body: JSON.stringify({ grades })
            });
        },

        // Utility methods
        async getCurrentUser() {
            try {
                const token = getAuthToken();
                if (!token) return null;

                const payload = JSON.parse(atob(token.split('.')[1]));
                return {
                    id: payload.id,
                    email: payload.email,
                    role: payload.role,
                    schoolId: payload.schoolId,
                    name: payload.name || payload.email
                };
            } catch (e) {
                console.error('Failed to parse user token:', e);
                return null;
            }
        },

        async checkPermissions(resource, action) {
            try {
                const user = await this.getCurrentUser();
                if (!user) return false;

                // For now, basic role-based check
                // This could be enhanced with server-side permission checking
                switch (user.role) {
                    case 'Admin':
                        return true;
                    case 'Teacher':
                        return ['view', 'edit'].includes(action);
                    case 'Pupil':
                        return action === 'view';
                    default:
                        return false;
                }
            } catch (e) {
                console.error('Permission check failed:', e);
                return false;
            }
        },

        // Error handling wrapper
        async withErrorHandling(apiCall, errorMessage = 'Operation failed') {
            try {
                return await apiCall();
            } catch (error) {
                console.error(errorMessage, error);
                
                // Dispatch error event for UI components to handle
                window.dispatchEvent(new CustomEvent('shikola:api-error', {
                    detail: {
                        message: errorMessage,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    }
                }));
                
                throw error;
            }
        },

        // Real-time events
        subscribeToRealTimeUpdates(callback) {
            // Set up Server-Sent Events or WebSocket connection
            // For now, use polling as fallback
            const eventSource = new EventSource(`${API_BASE}/api/teacher/events`);
            
            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    callback(data);
                } catch (e) {
                    console.error('Failed to parse real-time event:', e);
                }
            };

            eventSource.onerror = (error) => {
                console.error('Real-time connection error:', error);
                // Fallback to polling
                setInterval(() => {
                    callback({ type: 'poll', data: null });
                }, 30000);
            };

            return eventSource;
        },

        // Cache management
        clearCache() {
            // Clear any cached data
            if (window.caches) {
                window.caches.keys().then(names => {
                    names.forEach(name => {
                        if (name.includes('shikola-teacher-')) {
                            window.caches.delete(name);
                        }
                    });
                });
            }
        },

        // Health check
        async healthCheck() {
            try {
                const response = await apiRequest('/health');
                return response.status === 'ok';
            } catch (error) {
                console.error('Health check failed:', error);
                return false;
            }
        }
    };

    // Initialize API client
    console.log('Shikola Teacher API initialized');

    // Set up global error handler
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.message && event.reason.message.includes('API')) {
            console.error('Unhandled API promise rejection:', event.reason);
        }
    });

    // Set up authentication refresh
    setInterval(async () => {
        const user = await window.ShikolaTeacherApi.getCurrentUser();
        if (!user) {
            console.warn('User not authenticated, checking session...');
        }
    }, 60000); // Check every minute

})();
