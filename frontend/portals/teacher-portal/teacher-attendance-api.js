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
// Teacher Attendance API Integration
class TeacherAttendanceAPI {
    constructor() {
        this.baseURL = window.SHIKOLA_API_BASE || '/api';
        this.token = null;
        this.init();
    }

    init() {
        this.token = localStorage.getItem('shikola_token') || localStorage.getItem('authToken');
        if (!this.token) {
            console.warn('No authentication token found for attendance');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api/teacherattendance${endpoint}`;
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
            console.error('Teacher attendance API error:', error);
            throw error;
        }
    }

    redirectToLogin() {
        window.location.href = '../../public/index.html';
    }

    // Get attendance dashboard
    async getAttendanceDashboard() {
        return await this.request('/dashboard');
    }

    // Get attendance records
    async getAttendanceRecords(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.classId) params.append('classId', filters.classId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.subject) params.append('subject', filters.subject);
        
        const queryString = params.toString();
        return await this.request(`/records${queryString ? '?' + queryString : ''}`);
    }

    // Get attendance summary
    async getAttendanceSummary(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.classId) params.append('classId', filters.classId);
        if (filters.month) params.append('month', filters.month);
        if (filters.year) params.append('year', filters.year);
        
        const queryString = params.toString();
        return await this.request(`/summary${queryString ? '?' + queryString : ''}`);
    }

    // Save attendance
    async saveAttendance(attendanceData) {
        return await this.request('/save', {
            method: 'POST',
            body: JSON.stringify(attendanceData)
        });
    }

    // Get pupil attendance details
    async getPupilAttendance(pupilId, filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        
        const queryString = params.toString();
        return await this.request(`/pupils/${pupilId}${queryString ? '?' + queryString : ''}`);
    }

    // Add attendance remark
    async addAttendanceRemark(remarkData) {
        return await this.request('/remarks', {
            method: 'POST',
            body: JSON.stringify(remarkData)
        });
    }

    // Get attendance statistics
    async getAttendanceStatistics(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.classId) params.append('classId', filters.classId);
        if (filters.term) params.append('term', filters.term);
        if (filters.year) params.append('year', filters.year);
        
        const queryString = params.toString();
        return await this.request(`/statistics${queryString ? '?' + queryString : ''}`);
    }

    // Export attendance data
    async exportAttendance(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.classId) params.append('classId', filters.classId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.format) params.append('format', filters.format);
        
        const queryString = params.toString();
        return await this.request(`/export${queryString ? '?' + queryString : ''}`);
    }
}

// Initialize the API
window.teacherAttendanceAPI = new TeacherAttendanceAPI();

// Alpine.js component for teacher attendance
function teacherAttendance() {
    return {
        dashboard: null,
        attendanceRecords: [],
        attendanceSummary: null,
        statistics: null,
        selectedClass: null,
        selectedDate: new Date().toISOString().split('T')[0],
        loading: false,
        error: null,
        showStatistics: false,
        filters: {
            classId: '',
            startDate: '',
            endDate: '',
            subject: '',
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
        },
        attendanceData: {},
        remarks: [],

        async init() {
            await this.loadDashboard();
            await this.loadAttendanceSummary();
            this.setupRealtimeUpdates();
        },

        async loadDashboard() {
            this.loading = true;
            this.error = null;
            
            try {
                const response = await window.teacherAttendanceAPI.getAttendanceDashboard();
                if (response) {
                    this.dashboard = response;
                } else {
                    this.error = 'Failed to load attendance dashboard';
                }
            } catch (error) {
                console.error('Error loading dashboard:', error);
                this.error = 'Failed to load attendance dashboard';
            } finally {
                this.loading = false;
            }
        },

        async loadAttendanceRecords() {
            this.loading = true;
            this.error = null;
            
            try {
                const response = await window.teacherAttendanceAPI.getAttendanceRecords(this.filters);
                if (response) {
                    this.attendanceRecords = response.data || [];
                    this.initializeAttendanceData();
                } else {
                    this.error = 'Failed to load attendance records';
                }
            } catch (error) {
                console.error('Error loading attendance records:', error);
                this.error = 'Failed to load attendance records';
            } finally {
                this.loading = false;
            }
        },

        async loadAttendanceSummary() {
            try {
                const response = await window.teacherAttendanceAPI.getAttendanceSummary(this.filters);
                if (response) {
                    this.attendanceSummary = response.data;
                }
            } catch (error) {
                console.error('Error loading attendance summary:', error);
            }
        },

        async loadStatistics() {
            this.loading = true;
            
            try {
                const response = await window.teacherAttendanceAPI.getAttendanceStatistics(this.filters);
                if (response) {
                    this.statistics = response.data;
                }
            } catch (error) {
                console.error('Error loading statistics:', error);
                this.error = 'Failed to load statistics';
            } finally {
                this.loading = false;
            }
        },

        initializeAttendanceData() {
            this.attendanceData = {};
            this.attendanceRecords.forEach(record => {
                if (!this.attendanceData[record.date]) {
                    this.attendanceData[record.date] = {};
                }
                this.attendanceData[record.date][record.pupilId] = record.status;
            });
        },

        async saveAttendance() {
            const attendanceToSave = [];
            
            Object.keys(this.attendanceData).forEach(date => {
                Object.keys(this.attendanceData[date]).forEach(pupilId => {
                    attendanceToSave.push({
                        pupilId: pupilId,
                        date: date,
                        status: this.attendanceData[date][pupilId],
                        classId: this.selectedClass?.id
                    });
                });
            });

            if (attendanceToSave.length === 0) {
                this.showNotification('No attendance data to save', 'warning');
                return;
            }

            this.loading = true;
            
            try {
                const response = await window.teacherAttendanceAPI.saveAttendance({
                    attendance: attendanceToSave,
                    classId: this.selectedClass?.id,
                    date: this.selectedDate
                });
                
                if (response && response.success) {
                    this.showNotification('Attendance saved successfully', 'success');
                    await this.loadAttendanceRecords();
                } else {
                    this.showNotification('Failed to save attendance', 'error');
                }
            } catch (error) {
                console.error('Error saving attendance:', error);
                // Backend API errors should not show as frontend toasts
                // this.showNotification('Failed to save attendance', 'error');
            } finally {
                this.loading = false;
            }
        },

        updateAttendance(pupilId, status) {
            if (!this.attendanceData[this.selectedDate]) {
                this.attendanceData[this.selectedDate] = {};
            }
            this.attendanceData[this.selectedDate][pupilId] = status;
        },

        getAttendanceStatus(pupilId) {
            return this.attendanceData[this.selectedDate]?.[pupilId] || 'present';
        },

        getAttendanceCount(status) {
            if (!this.attendanceData[this.selectedDate]) return 0;
            
            return Object.values(this.attendanceData[this.selectedDate])
                .filter(s => s === status).length;
        },

        getAttendancePercentage(status = 'present') {
            const total = Object.keys(this.attendanceData[this.selectedDate] || {}).length;
            if (total === 0) return 0;
            
            const count = this.getAttendanceCount(status);
            return Math.round((count / total) * 100);
        },

        formatPercentage(value) {
            return `${value}%`;
        },

        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        },

        getStatusColor(status) {
            switch (status) {
                case 'present': return 'text-green-600 bg-green-100';
                case 'absent': return 'text-red-600 bg-red-100';
                case 'late': return 'text-yellow-600 bg-yellow-100';
                case 'excused': return 'text-blue-600 bg-blue-100';
                default: return 'text-gray-600 bg-gray-100';
            }
        },

        getStatusIcon(status) {
            switch (status) {
                case 'present': return 'fas fa-check-circle';
                case 'absent': return 'fas fa-times-circle';
                case 'late': return 'fas fa-clock';
                case 'excused': return 'fas fa-file-medical';
                default: return 'fas fa-question-circle';
            }
        },

        async addRemark(pupilId, remark) {
            try {
                const response = await window.teacherAttendanceAPI.addAttendanceRemark({
                    pupilId: pupilId,
                    classId: this.selectedClass?.id,
                    date: this.selectedDate,
                    remark: remark,
                    status: 'added'
                });
                
                if (response && response.success) {
                    this.showNotification('Remark added successfully', 'success');
                    this.remarks.push({ pupilId, remark, date: this.selectedDate });
                } else {
                    this.showNotification('Failed to add remark', 'error');
                }
            } catch (error) {
                console.error('Error adding remark:', error);
                // Backend API errors should not show as frontend toasts
                // this.showNotification('Failed to add remark', 'error');
            }
        },

        async exportData(format = 'excel') {
            try {
                const response = await window.teacherAttendanceAPI.exportAttendance({
                    ...this.filters,
                    format: format
                });
                
                if (response && response.success) {
                    // Download the file
                    const link = document.createElement('a');
                    link.href = response.data.downloadUrl;
                    link.download = `attendance_${new Date().toISOString().split('T')[0]}.${format}`;
                    link.click();
                    
                    this.showNotification('Attendance data exported successfully', 'success');
                } else {
                    this.showNotification('Failed to export data', 'error');
                }
            } catch (error) {
                console.error('Error exporting data:', error);
                // Backend API errors should not show as frontend toasts
                // this.showNotification('Failed to export data', 'error');
            }
        },

        setupRealtimeUpdates() {
            // Listen for real-time attendance updates
            if (window.connection) {
                window.connection.on('AttendanceUpdate', (update) => {
                    if (update.classId === this.selectedClass?.id) {
                        this.loadAttendanceRecords();
                    }
                });
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
            this.loadAttendanceRecords();
            this.loadAttendanceSummary();
        },

        clearFilters() {
            this.filters = {
                classId: '',
                startDate: '',
                endDate: '',
                subject: '',
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear()
            };
            this.loadAttendanceRecords();
            this.loadAttendanceSummary();
        },

        toggleStatistics() {
            this.showStatistics = !this.showStatistics;
            if (this.showStatistics && !this.statistics) {
                this.loadStatistics();
            }
        },

        selectClass(classObj) {
            this.selectedClass = classObj;
            this.filters.classId = classObj.id;
            this.loadAttendanceRecords();
        }
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TeacherAttendanceAPI, teacherAttendance };
}
