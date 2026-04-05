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
// Exam Results API Integration
class ExamResultsAPI {
    constructor() {
        this.baseURL = window.SHIKOLA_API_BASE || '/api';
        this.token = null;
        this.init();
    }

    init() {
        this.token = localStorage.getItem('shikola_token') || localStorage.getItem('authToken');
        if (!this.token) {
            console.warn('No authentication token found for exam results');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api/examresults${endpoint}`;
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
            console.error('Exam results API error:', error);
            throw error;
        }
    }

    redirectToLogin() {
        window.location.href = '/index.html';
    }

    // Get pupil's exams
    async getMyExams(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.year) params.append('year', filters.year);
        if (filters.term) params.append('term', filters.term);
        if (filters.subject) params.append('subject', filters.subject);
        
        const queryString = params.toString();
        return await this.request(`/my-exams${queryString ? '?' + queryString : ''}`);
    }

    // Get exam results for a specific exam
    async getExamResults(examId) {
        return await this.request(`/exams/${examId}/results`);
    }

    // Get detailed exam result
    async getExamResultDetail(resultId) {
        return await this.request(`/results/${resultId}`);
    }

    // Get exam performance summary
    async getExamPerformanceSummary(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.year) params.append('year', filters.year);
        if (filters.term) params.append('term', filters.term);
        if (filters.includeComparisons) params.append('includeComparisons', filters.includeComparisons);
        
        const queryString = params.toString();
        return await this.request(`/performance-summary${queryString ? '?' + queryString : ''}`);
    }

    // Get subject-wise performance
    async getSubjectPerformance(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.year) params.append('year', filters.year);
        if (filters.term) params.append('term', filters.term);
        
        const queryString = params.toString();
        return await this.request(`/subject-performance${queryString ? '?' + queryString : ''}`);
    }

    // Get exam statistics
    async getExamStatistics(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.examId) params.append('examId', filters.examId);
        if (filters.classId) params.append('classId', filters.classId);
        
        const queryString = params.toString();
        return await this.request(`/statistics${queryString ? '?' + queryString : ''}`);
    }

    // Download exam result certificate
    async downloadResultCertificate(resultId) {
        const response = await this.request(`/results/${resultId}/certificate`);
        if (response && response.success) {
            // Create download link
            const link = document.createElement('a');
            link.href = response.data.downloadUrl;
            link.download = response.data.fileName;
            link.click();
        }
        return response;
    }
}

// Initialize the API
window.examResultsAPI = new ExamResultsAPI();

// Alpine.js component for exam results
function examResults() {
    return {
        myExams: [],
        examResults: [],
        performanceSummary: null,
        subjectPerformance: [],
        examStatistics: null,
        selectedExam: null,
        selectedResult: null,
        loading: false,
        error: null,
        showDetails: false,
        filters: {
            year: new Date().getFullYear().toString(),
            term: '1',
            subject: '',
            includeComparisons: true
        },

        async init() {
            await this.loadMyExams();
            await this.loadPerformanceSummary();
            await this.loadSubjectPerformance();
        },

        async loadMyExams() {
            this.loading = true;
            this.error = null;
            
            try {
                const response = await window.examResultsAPI.getMyExams(this.filters);
                if (response && response.success) {
                    this.myExams = response.data || [];
                } else {
                    this.error = response?.error || 'Failed to load exams';
                }
            } catch (error) {
                console.error('Error loading exams:', error);
                this.error = 'Failed to load exams';
            } finally {
                this.loading = false;
            }
        },

        async loadExamResults(examId) {
            this.loading = true;
            
            try {
                const response = await window.examResultsAPI.getExamResults(examId);
                if (response && response.success) {
                    this.examResults = response.data || [];
                } else {
                    this.error = response?.error || 'Failed to load exam results';
                }
            } catch (error) {
                console.error('Error loading exam results:', error);
                this.error = 'Failed to load exam results';
            } finally {
                this.loading = false;
            }
        },

        async loadPerformanceSummary() {
            try {
                const response = await window.examResultsAPI.getExamPerformanceSummary(this.filters);
                if (response && response.success) {
                    this.performanceSummary = response.data;
                }
            } catch (error) {
                console.error('Error loading performance summary:', error);
            }
        },

        async loadSubjectPerformance() {
            try {
                const response = await window.examResultsAPI.getSubjectPerformance(this.filters);
                if (response && response.success) {
                    this.subjectPerformance = response.data || [];
                }
            } catch (error) {
                console.error('Error loading subject performance:', error);
            }
        },

        async loadExamStatistics(examId) {
            try {
                const response = await window.examResultsAPI.getExamStatistics({
                    examId: examId,
                    ...this.filters
                });
                if (response && response.success) {
                    this.examStatistics = response.data;
                }
            } catch (error) {
                console.error('Error loading exam statistics:', error);
            }
        },

        viewExamDetails(exam) {
            this.selectedExam = exam;
            this.loadExamResults(exam.id);
            this.loadExamStatistics(exam.id);
            this.showDetails = true;
        },

        viewResultDetails(result) {
            this.selectedResult = result;
            // Load detailed result if needed
        },

        async downloadCertificate(result) {
            try {
                await window.examResultsAPI.downloadResultCertificate(result.id);
                this.showNotification('Certificate downloaded successfully', 'success');
            } catch (error) {
                console.error('Error downloading certificate:', error);
                this.showNotification('Failed to download certificate', 'error');
            }
        },

        getGradeColor(grade) {
            // ECZ grading colors
            if (grade >= 1 && grade <= 2) return 'text-green-600 bg-green-100';
            if (grade >= 3 && grade <= 4) return 'text-blue-600 bg-blue-100';
            if (grade >= 5 && grade <= 6) return 'text-yellow-600 bg-yellow-100';
            if (grade >= 7 && grade <= 8) return 'text-orange-600 bg-orange-100';
            return 'text-red-600 bg-red-100';
        },

        getGradeLabel(grade) {
            // ECZ grade labels
            switch (grade) {
                case 1: return 'Excellent';
                case 2: return 'Very Good';
                case 3: return 'Good';
                case 4: return 'Good';
                case 5: return 'Credit';
                case 6: return 'Credit';
                case 7: return 'Pass';
                case 8: return 'Pass';
                case 9: return 'Fail';
                default: return 'N/A';
            }
        },

        getPerformanceColor(percentage) {
            if (percentage >= 80) return 'text-green-600';
            if (percentage >= 70) return 'text-blue-600';
            if (percentage >= 60) return 'text-yellow-600';
            if (percentage >= 50) return 'text-orange-600';
            return 'text-red-600';
        },

        formatPercentage(value) {
            return `${Math.round(value)}%`;
        },

        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },

        calculateAverage(results) {
            if (!results || results.length === 0) return 0;
            const total = results.reduce((sum, result) => sum + (result.score || 0), 0);
            return Math.round(total / results.length);
        },

        getDivision(averageGrade) {
            // ECZ division calculation
            if (averageGrade <= 3) return '1';
            if (averageGrade <= 5) return '2';
            if (averageGrade <= 7) return '3';
            if (averageGrade <= 8) return '4';
            return '5';
        },

        getDivisionColor(division) {
            switch (division) {
                case '1': return 'text-green-600 bg-green-100';
                case '2': return 'text-blue-600 bg-blue-100';
                case '3': return 'text-yellow-600 bg-yellow-100';
                case '4': return 'text-orange-600 bg-orange-100';
                case '5': return 'text-red-600 bg-red-100';
                default: return 'text-gray-600 bg-gray-100';
            }
        },

        showNotification(message, type = 'info') {
            // Show notification using existing notification system
            if (window.showNotification) {
                window.showNotification(message, type);
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        },

        applyFilters() {
            this.loadMyExams();
            this.loadPerformanceSummary();
            this.loadSubjectPerformance();
        },

        clearFilters() {
            this.filters = {
                year: new Date().getFullYear().toString(),
                term: '1',
                subject: '',
                includeComparisons: true
            };
            this.loadMyExams();
            this.loadPerformanceSummary();
            this.loadSubjectPerformance();
        },

        closeDetails() {
            this.showDetails = false;
            this.selectedExam = null;
            this.examResults = [];
            this.examStatistics = null;
        }
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ExamResultsAPI, examResults };
}
