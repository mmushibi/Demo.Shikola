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
// Teacher Reports API Integration
class TeacherReportsAPI {
    constructor() {
        this.baseURL = window.SHIKOLA_API_BASE || '/api';
        this.token = null;
        this.init();
    }

    init() {
        this.token = localStorage.getItem('shikola_token') || localStorage.getItem('authToken');
        if (!this.token) {
            console.warn('No authentication token found for reports');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api/teacherreports${endpoint}`;
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
            console.error('Teacher reports API error:', error);
            throw error;
        }
    }

    redirectToLogin() {
        window.location.href = '../../public/index.html';
    }

    // Get student data for reports
    async getStudentData(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.year) params.append('year', filters.year);
        if (filters.term) params.append('term', filters.term);
        if (filters.className) params.append('className', filters.className);
        
        const queryString = params.toString();
        return await this.request(`/student-data${queryString ? '?' + queryString : ''}`);
    }

    // Get result cards
    async getResultCards(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.year) params.append('year', filters.year);
        if (filters.term) params.append('term', filters.term);
        if (filters.className) params.append('className', filters.className);
        
        const queryString = params.toString();
        return await this.request(`/result-cards${queryString ? '?' + queryString : ''}`);
    }

    // Get attendance summary
    async getAttendanceSummary(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.year) params.append('year', filters.year);
        if (filters.className) params.append('className', filters.filter);
        if (filters.month) params.append('month', filters.month);
        
        const queryString = params.toString();
        return await this.request(`/attendance-summary${queryString ? '?' + queryString : ''}`);
    }

    // Save comments
    async saveComments(commentData) {
        return await this.request('/save-comments', {
            method: 'POST',
            body: JSON.stringify(commentData)
        });
    }

    // Generate class performance report
    async generateClassPerformanceReport(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.classId) params.append('classId', filters.classId);
        if (filters.term) params.append('term', filters.term);
        if (filters.year) params.append('year', filters.year);
        if (filters.subjectId) params.append('subjectId', filters.subjectId);
        
        const queryString = params.toString();
        return await this.request(`/class-performance${queryString ? '?' + queryString : ''}`);
    }

    // Generate individual student report
    async generateStudentReport(studentId, filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.term) params.append('term', filters.term);
        if (filters.year) params.append('year', filters.year);
        if (filters.includeAttendance) params.append('includeAttendance', filters.includeAttendance);
        if (filters.includeBehavior) params.append('includeBehavior', filters.includeBehavior);
        
        const queryString = params.toString();
        return await this.request(`/student-report/${studentId}${queryString ? '?' + queryString : ''}`);
    }

    // Get subject performance analytics
    async getSubjectPerformanceAnalytics(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.subjectId) params.append('subjectId', filters.subjectId);
        if (filters.classId) params.append('classId', filters.classId);
        if (filters.term) params.append('term', filters.term);
        if (filters.year) params.append('year', filters.year);
        
        const queryString = params.toString();
        return await this.request(`/subject-analytics${queryString ? '?' + queryString : ''}`);
    }

    // Export report
    async exportReport(reportType, filters = {}) {
        const params = new URLSearchParams();
        
        Object.keys(filters).forEach(key => {
            if (filters[key]) params.append(key, filters[key]);
        });
        
        const queryString = params.toString();
        return await this.request(`/export/${reportType}${queryString ? '?' + queryString : ''}`);
    }
}

// Initialize the API
window.teacherReportsAPI = new TeacherReportsAPI();

// Alpine.js component for teacher reports
function teacherReports() {
    return {
        reportType: 'student-data',
        studentData: [],
        resultCards: [],
        attendanceSummary: null,
        classPerformance: null,
        subjectAnalytics: null,
        selectedStudent: null,
        selectedClass: null,
        selectedSubject: null,
        loading: false,
        error: null,
        showPreview: false,
        previewData: null,
        filters: {
            year: new Date().getFullYear().toString(),
            term: '1',
            className: '',
            subjectId: '',
            month: new Date().getMonth() + 1,
            includeAttendance: true,
            includeBehavior: true
        },
        comments: {},
        availableYears: [],
        availableTerms: ['1', '2', '3'],
        availableClasses: [],
        availableSubjects: [],

        async init() {
            await this.loadAvailableData();
            if (this.reportType) {
                await this.loadReport();
            }
        },

        async loadAvailableData() {
            try {
                // Load available classes and subjects from teacher API
                const classesResponse = await window.teacherAPI.getMyClasses();
                if (classesResponse && classesResponse.success) {
                    this.availableClasses = classesResponse.classes || [];
                }
            } catch (error) {
                console.error('Error loading available data:', error);
            }
        },

        async loadReport() {
            this.loading = true;
            this.error = null;
            
            try {
                switch (this.reportType) {
                    case 'student-data':
                        await this.loadStudentData();
                        break;
                    case 'result-cards':
                        await this.loadResultCards();
                        break;
                    case 'attendance-summary':
                        await this.loadAttendanceSummary();
                        break;
                    case 'class-performance':
                        await this.loadClassPerformance();
                        break;
                    case 'subject-analytics':
                        await this.loadSubjectAnalytics();
                        break;
                }
            } catch (error) {
                console.error('Error loading report:', error);
                this.error = 'Failed to load report';
            } finally {
                this.loading = false;
            }
        },

        async loadStudentData() {
            const response = await window.teacherReportsAPI.getStudentData(this.filters);
            if (response && response.success) {
                this.studentData = response.data || [];
            } else {
                this.error = response?.error || 'Failed to load student data';
            }
        },

        async loadResultCards() {
            const response = await window.teacherReportsAPI.getResultCards(this.filters);
            if (response && response.success) {
                this.resultCards = response.data || [];
            } else {
                this.error = response?.error || 'Failed to load result cards';
            }
        },

        async loadAttendanceSummary() {
            const response = await window.teacherReportsAPI.getAttendanceSummary(this.filters);
            if (response && response.success) {
                this.attendanceSummary = response.data;
            } else {
                this.error = response?.error || 'Failed to load attendance summary';
            }
        },

        async loadClassPerformance() {
            const response = await window.teacherReportsAPI.generateClassPerformanceReport(this.filters);
            if (response && response.success) {
                this.classPerformance = response.data;
            } else {
                this.error = response?.error || 'Failed to load class performance';
            }
        },

        async loadSubjectAnalytics() {
            const response = await window.teacherReportsAPI.getSubjectPerformanceAnalytics(this.filters);
            if (response && response.success) {
                this.subjectAnalytics = response.data;
            } else {
                this.error = response?.error || 'Failed to load subject analytics';
            }
        },

        async generateReport() {
            if (!this.validateFilters()) return;

            this.loading = true;
            
            try {
                switch (this.reportType) {
                    case 'student-report':
                        if (this.selectedStudent) {
                            const response = await window.teacherReportsAPI.generateStudentReport(
                                this.selectedStudent.id, 
                                this.filters
                            );
                            if (response && response.success) {
                                this.previewData = response.data;
                                this.showPreview = true;
                            }
                        }
                        break;
                }
            } catch (error) {
                console.error('Error generating report:', error);
                this.error = 'Failed to generate report';
            } finally {
                this.loading = false;
            }
        },

        async saveComments() {
            if (!this.selectedStudent || !this.comments[this.selectedStudent.id]) return;

            try {
                const response = await window.teacherReportsAPI.saveComments({
                    studentId: this.selectedStudent.id,
                    comments: this.comments[this.selectedStudent.id],
                    term: this.filters.term,
                    year: this.filters.year,
                    classId: this.selectedClass?.id
                });
                
                if (response && response.success) {
                    this.showNotification('Comments saved successfully', 'success');
                } else {
                    this.showNotification('Failed to save comments', 'error');
                }
            } catch (error) {
                console.error('Error saving comments:', error);
                this.showNotification('Failed to save comments', 'error');
            }
        },

        async exportReport(format = 'pdf') {
            try {
                const response = await window.teacherReportsAPI.exportReport(this.reportType, {
                    ...this.filters,
                    format: format
                });
                
                if (response && response.success) {
                    // Download the file
                    const link = document.createElement('a');
                    link.href = response.data.downloadUrl;
                    link.download = `${this.reportType}_${new Date().toISOString().split('T')[0]}.${format}`;
                    link.click();
                    
                    this.showNotification('Report exported successfully', 'success');
                } else {
                    this.showNotification('Failed to export report', 'error');
                }
            } catch (error) {
                console.error('Error exporting report:', error);
                this.showNotification('Failed to export report', 'error');
            }
        },

        validateFilters() {
            if (!this.filters.year) {
                this.showNotification('Please select a year', 'warning');
                return false;
            }
            
            if (!this.filters.term) {
                this.showNotification('Please select a term', 'warning');
                return false;
            }
            
            if (this.reportType === 'student-report' && !this.selectedStudent) {
                this.showNotification('Please select a student', 'warning');
                return false;
            }
            
            return true;
        },

        selectStudent(student) {
            this.selectedStudent = student;
            this.comments[student.id] = student.comments || '';
        },

        updateComments(studentId, comments) {
            this.comments[studentId] = comments;
        },

        getGradeColor(grade) {
            if (grade >= 80) return 'text-green-600 bg-green-100';
            if (grade >= 70) return 'text-blue-600 bg-blue-100';
            if (grade >= 60) return 'text-yellow-600 bg-yellow-100';
            if (grade >= 50) return 'text-orange-600 bg-orange-100';
            return 'text-red-600 bg-red-100';
        },

        getAttendanceColor(percentage) {
            if (percentage >= 95) return 'text-green-600 bg-green-100';
            if (percentage >= 85) return 'text-blue-600 bg-blue-100';
            if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
            if (percentage >= 65) return 'text-orange-600 bg-orange-100';
            return 'text-red-600 bg-red-100';
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

        getPerformanceLevel(average) {
            if (average >= 80) return 'Excellent';
            if (average >= 70) return 'Good';
            if (average >= 60) return 'Average';
            if (average >= 50) return 'Below Average';
            return 'Poor';
        },

        getPerformanceColor(average) {
            if (average >= 80) return 'text-green-600';
            if (average >= 70) return 'text-blue-600';
            if (average >= 60) return 'text-yellow-600';
            if (average >= 50) return 'text-orange-600';
            return 'text-red-600';
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
            this.loadReport();
        },

        clearFilters() {
            this.filters = {
                year: new Date().getFullYear().toString(),
                term: '1',
                className: '',
                subjectId: '',
                month: new Date().getMonth() + 1,
                includeAttendance: true,
                includeBehavior: true
            };
            this.loadReport();
        },

        changeReportType(type) {
            this.reportType = type;
            this.showPreview = false;
            this.previewData = null;
            this.loadReport();
        },

        closePreview() {
            this.showPreview = false;
            this.previewData = null;
        },

        printReport() {
            if (this.showPreview && this.previewData) {
                window.print();
            }
        }
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TeacherReportsAPI, teacherReports };
}
