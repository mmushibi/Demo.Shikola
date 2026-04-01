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
// Attendance API Integration for School Admin Portal
// Provides real-time backend integration for attendance management

class AttendanceAPI {
    constructor() {
        this.baseURL = window.API_CONFIG?.BASE_URL || '/api';
        this.headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
        };
    }

    getAuthToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: { ...this.headers, ...options.headers },
            ...options
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Attendance API Error:', error);
            throw error;
        }
    }

    // Get attendance by ID
    async getAttendance(id) {
        return await this.request(`/admin/attendance/${id}`);
    }

    // Get attendance list with filters
    async getAttendanceList(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.fromDate) params.append('fromDate', filters.fromDate);
        if (filters.toDate) params.append('toDate', filters.toDate);
        if (filters.classId) params.append('classId', filters.classId);
        if (filters.pupilId) params.append('pupilId', filters.pupilId);
        if (filters.status) params.append('status', filters.status);
        if (filters.page) params.append('page', filters.page);
        if (filters.pageSize) params.append('pageSize', filters.pageSize);

        const endpoint = `/admin/attendance${params.toString() ? '?' + params.toString() : ''}`;
        return await this.request(endpoint);
    }

    // Get class attendance for specific date
    async getClassAttendance(classId, date) {
        return await this.request(`/admin/attendance/class/${classId}/date/${date}`);
    }

    // Get attendance statistics
    async getAttendanceStatistics(date, classId = null) {
        const params = classId ? `?classId=${classId}` : '';
        return await this.request(`/admin/attendance/statistics/${date}${params}`);
    }

    // Get attendance report
    async getAttendanceReport(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.fromDate) params.append('fromDate', filters.fromDate);
        if (filters.toDate) params.append('toDate', filters.toDate);
        if (filters.classId) params.append('classId', filters.classId);
        if (filters.pupilId) params.append('pupilId', filters.pupilId);

        const endpoint = `/admin/attendance/report${params.toString() ? '?' + params.toString() : ''}`;
        return await this.request(endpoint);
    }

    // Create single attendance record
    async createAttendance(attendanceData) {
        return await this.request('/admin/attendance', {
            method: 'POST',
            body: JSON.stringify(attendanceData)
        });
    }

    // Create bulk attendance records
    async createBulkAttendance(bulkData) {
        return await this.request('/admin/attendance/bulk', {
            method: 'POST',
            body: JSON.stringify(bulkData)
        });
    }

    // Update attendance record
    async updateAttendance(id, updateData) {
        return await this.request(`/admin/attendance/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }

    // Delete attendance record
    async deleteAttendance(id) {
        return await this.request(`/admin/attendance/${id}`, {
            method: 'DELETE'
        });
    }

    // Mark attendance (quick mark)
    async markAttendance(markData) {
        return await this.request('/admin/attendance/mark', {
            method: 'POST',
            body: JSON.stringify(markData)
        });
    }

    // Real-time sync helpers
    async syncAttendanceToBackend(localData) {
        try {
            const result = await this.createBulkAttendance(localData);
            return result;
        } catch (error) {
            console.error('Sync failed:', error);
            throw error;
        }
    }

    // Cache management for offline support
    cacheData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to cache data:', error);
        }
    }

    getCachedData(key) {
        try {
            const cached = localStorage.getItem(key);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.warn('Failed to retrieve cached data:', error);
            return null;
        }
    }

    clearCache(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('Failed to clear cache:', error);
        }
    }

    // Real-time event listeners
    subscribeToAttendanceUpdates(callback) {
        // This would integrate with WebSocket or Server-Sent Events
        // For now, we'll use polling as a fallback
        if (this.attendanceInterval) {
            clearInterval(this.attendanceInterval);
        }

        this.attendanceInterval = setInterval(async () => {
            try {
                const updates = await this.getRecentUpdates();
                if (updates.length > 0) {
                    callback(updates);
                }
            } catch (error) {
                console.error('Failed to fetch attendance updates:', error);
            }
        }, 30000); // Poll every 30 seconds
    }

    unsubscribeFromAttendanceUpdates() {
        if (this.attendanceInterval) {
            clearInterval(this.attendanceInterval);
            this.attendanceInterval = null;
        }
    }

    async getRecentUpdates() {
        // This would typically be a WebSocket endpoint
        // For now, return empty array
        return [];
    }
}

// Enhanced attendance management with real-time sync
class AttendanceManager {
    constructor() {
        this.api = new AttendanceAPI();
        this.cache = new Map();
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;

        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processSyncQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    // Load attendance data with caching and real-time sync
    async loadAttendance(filters = {}) {
        const cacheKey = `attendance_${JSON.stringify(filters)}`;
        
        // Try cache first
        const cached = this.api.getCachedData(cacheKey);
        if (cached && !this.isOnline) {
            return cached;
        }

        try {
            // Fetch from backend if online
            if (this.isOnline) {
                const data = await this.api.getAttendanceList(filters);
                this.api.cacheData(cacheKey, data);
                this.cache.set(cacheKey, data);
                return data;
            }
        } catch (error) {
            console.error('Failed to load attendance:', error);
            // Return cached data as fallback
            return this.cache.get(cacheKey) || { records: [], totalCount: 0 };
        }
    }

    // Save attendance with queue support for offline mode
    async saveAttendance(attendanceData) {
        if (this.isOnline) {
            try {
                const result = await this.api.createBulkAttendance(attendanceData);
                return result;
            } catch (error) {
                console.error('Failed to save attendance:', error);
                // Add to queue for retry
                this.syncQueue.push({ type: 'create', data: attendanceData, timestamp: Date.now() });
                return { success: false, message: error.message };
            }
        } else {
            // Offline mode - add to queue
            this.syncQueue.push({ type: 'create', data: attendanceData, timestamp: Date.now() });
            this.saveQueueToStorage();
            return { success: true, message: 'Queued for sync when online' };
        }
    }

    // Update attendance record
    async updateAttendance(id, updateData) {
        if (this.isOnline) {
            try {
                const result = await this.api.updateAttendance(id, updateData);
                return result;
            } catch (error) {
                console.error('Failed to update attendance:', error);
                this.syncQueue.push({ type: 'update', id, data: updateData, timestamp: Date.now() });
                return { success: false, message: error.message };
            }
        } else {
            this.syncQueue.push({ type: 'update', id, data: updateData, timestamp: Date.now() });
            this.saveQueueToStorage();
            return { success: true, message: 'Queued for sync when online' };
        }
    }

    // Process sync queue when coming online
    async processSyncQueue() {
        if (this.syncInProgress || this.syncQueue.length === 0) {
            return;
        }

        this.syncInProgress = true;
        const queue = [...this.syncQueue];
        this.syncQueue = [];

        try {
            for (const item of queue) {
                try {
                    if (item.type === 'create') {
                        await this.api.createBulkAttendance(item.data);
                    } else if (item.type === 'update') {
                        await this.api.updateAttendance(item.id, item.data);
                    }
                } catch (error) {
                    console.error('Failed to sync queue item:', item, error);
                    // Re-add to queue for retry
                    this.syncQueue.push(item);
                }
            }
        } finally {
            this.syncInProgress = false;
            this.saveQueueToStorage();
        }
    }

    // Save queue to localStorage for persistence
    saveQueueToStorage() {
        try {
            localStorage.setItem('attendance_sync_queue', JSON.stringify(this.syncQueue));
        } catch (error) {
            console.error('Failed to save sync queue:', error);
        }
    }

    // Load queue from localStorage
    loadQueueFromStorage() {
        try {
            const stored = localStorage.getItem('attendance_sync_queue');
            if (stored) {
                this.syncQueue = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load sync queue:', error);
        }
    }

    // Subscribe to real-time updates
    subscribeToUpdates(callback) {
        this.api.subscribeToAttendanceUpdates(callback);
    }

    // Unsubscribe from updates
    unsubscribeFromUpdates() {
        this.api.unsubscribeFromAttendanceUpdates();
    }

    // Get sync status
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            queueLength: this.syncQueue.length,
            syncInProgress: this.syncInProgress
        };
    }
}

// Global instances
window.AttendanceAPI = AttendanceAPI;
window.AttendanceManager = AttendanceManager;

// Initialize attendance manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.attendanceManager === 'undefined') {
        window.attendanceManager = new AttendanceManager();
        window.attendanceManager.loadQueueFromStorage();
        
        // Process queue if online
        if (navigator.onLine) {
            window.attendanceManager.processSyncQueue();
        }
    }
});
