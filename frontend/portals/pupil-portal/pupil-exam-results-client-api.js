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
 * Pupil Exam Results API (Client-side)
 * Provides API integration for pupil exam results functionality
 */
(function() {
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

    async function apiRequest(endpoint, options) {
        var base = window.SHIKOLA_API_BASE || '/api';
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

    // Fallback data when API is unavailable
    function getFallbackExamResults() {
        return {
            pupilName: 'Yohano Mushibi',
            admissionNumber: '2026-001',
            className: 'Grade 7A',
            subjects: [
                { subject: 'Mathematics', marks: 85, maxMarks: 100, percentage: 85, grade: '2', remarks: 'Very Good' },
                { subject: 'English', marks: 78, maxMarks: 100, percentage: 78, grade: '3', remarks: 'Good' },
                { subject: 'Science', marks: 92, maxMarks: 100, percentage: 92, grade: '1', remarks: 'Excellent' },
                { subject: 'Social Studies', marks: 74, maxMarks: 100, percentage: 74, grade: '3', remarks: 'Good' },
                { subject: 'Creative Arts', marks: 88, maxMarks: 100, percentage: 88, grade: '2', remarks: 'Very Good' }
            ],
            totalSubjects: 5,
            totalMarks: 417,
            totalMaxMarks: 500,
            overallPercentage: 83.4
        };
    }

    function getFallbackExamsList() {
        return [
            {
                id: '1',
                title: 'Midterm Examination',
                examType: 'midterm',
                status: 'published',
                canViewResults: true,
                resultPublishDate: '2024-03-15',
                className: 'Grade 7A'
            },
            {
                id: '2',
                title: 'Final Examination',
                examType: 'final',
                status: 'published',
                canViewResults: true,
                resultPublishDate: '2024-06-20',
                className: 'Grade 7A'
            }
        ];
    }

    // Export API object
    window.PupilExamResultsAPI = {
        // Get pupil information
        getPupilInfo: async function() {
            try {
                var result = await apiRequest('/pupil/profile');
                if (result.success && result.data) {
                    return result.data;
                }
                // Fallback data
                return {
                    id: '1',
                    name: 'Yohano Mushibi',
                    class: 'Grade 7A',
                    admissionNumber: '2026-001'
                };
            } catch (error) {
                return {
                    id: '1',
                    name: 'Yohano Mushibi',
                    class: 'Grade 7A',
                    admissionNumber: '2026-001'
                };
            }
        },

        // Get school profile
        getSchoolProfile: async function() {
            try {
                var result = await apiRequest('/school/profile');
                if (result.success && result.data) {
                    return result.data;
                }
                // Fallback data
                return {
                    name: 'Shikola Academy',
                    address: '123 Education Street, Lusaka, Zambia',
                    phone: '+260 123 456 789',
                    email: 'info@shikola.edu.zm',
                    logo: '/frontend/assets/images/logo.png',
                    motto: 'Excellence in Education',
                    established: '2010',
                    headteacher: 'Mrs. Sarah Mulenga'
                };
            } catch (error) {
                return {
                    name: 'Shikola Academy',
                    address: '123 Education Street, Lusaka, Zambia',
                    phone: '+260 123 456 789',
                    email: 'info@shikola.edu.zm',
                    logo: '/frontend/assets/images/logo.png',
                    motto: 'Excellence in Education',
                    established: '2010',
                    headteacher: 'Mrs. Sarah Mulenga'
                };
            }
        },

        // Get available exams for pupil
        getMyExams: async function() {
            try {
                var result = await apiRequest('/pupil/exams');
                if (result.success && result.data) {
                    return result.data;
                }
                return getFallbackExamsList();
            } catch (error) {
                return getFallbackExamsList();
            }
        },

        // Get exam results for specific exam
        getExamResults: async function(examId) {
            try {
                var result = await apiRequest('/pupil/exams/' + examId + '/results');
                if (result.success && result.data) {
                    return result.data;
                }
                return getFallbackExamResults();
            } catch (error) {
                return getFallbackExamResults();
            }
        },

        // Calculate grade based on percentage
        calculateGrade: async function(percentage, gradeLevel) {
            // ECZ Grading System for Zambia
            if (percentage >= 85) return { grade: '1', label: 'Excellent', points: 1, isEczCompliant: true };
            if (percentage >= 75) return { grade: '2', label: 'Very Good', points: 2, isEczCompliant: true };
            if (percentage >= 65) return { grade: '3', label: 'Good', points: 3, isEczCompliant: true };
            if (percentage >= 55) return { grade: '4', label: 'Satisfactory', points: 4, isEczCompliant: true };
            if (percentage >= 50) return { grade: '5', label: 'Pass', points: 5, isEczCompliant: true };
            if (percentage >= 40) return { grade: '6', label: 'Credit', points: 6, isEczCompliant: false };
            if (percentage >= 35) return { grade: '7', label: 'Marginal Pass', points: 7, isEczCompliant: false };
            return { grade: '8', label: 'Fail', points: 8, isEczCompliant: false };
        },

        // Perform real-time sync
        performRealtimeSync: async function() {
            try {
                var result = await apiRequest('/pupil/sync/exam-results');
                if (result.success) {
                    // Dispatch sync event
                    document.dispatchEvent(new CustomEvent('sync-completed', {
                        detail: {
                            status: 'success',
                            timestamp: new Date(),
                            data: result.data
                        }
                    }));
                    return true;
                }
                return false;
            } catch (error) {
                // Dispatch sync error event
                document.dispatchEvent(new CustomEvent('sync-completed', {
                    detail: {
                        status: 'error',
                        timestamp: new Date(),
                        error: error.message
                    }
                }));
                return false;
            }
        }
    };

})();
