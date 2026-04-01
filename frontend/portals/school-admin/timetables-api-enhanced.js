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
// Enhanced Timetables API Integration with Real-time Sync and AI
class TimetableAPI {
    constructor() {
        this.baseURL = window.SHIKOLA_API_BASE || 'http://localhost:3000/api';
        this.signalRConnection = null;
        this.syncStatus = {
            isConnected: false,
            lastSync: null,
            pendingUpdates: []
        };
    }

    // Initialize SignalR connection for real-time updates
    async initializeSignalR() {
        try {
            const token = localStorage.getItem('shikola_token') || localStorage.getItem('authToken');
            if (!token) {
                console.warn('No authentication token found for SignalR connection');
                return false;
            }

            this.signalRConnection = new signalR.HubConnectionBuilder()
                .withUrl(`${this.baseURL.replace('/api', '')}/timetableHub`, {
                    accessTokenFactory: () => token
                })
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Information)
                .build();

            // Set up event handlers
            this.signalRConnection.onreconnected(() => {
                console.log('SignalR reconnected');
                this.syncStatus.isConnected = true;
            });

            this.signalRConnection.onreconnecting(() => {
                console.log('SignalR reconnecting...');
                this.syncStatus.isConnected = false;
            });

            this.signalRConnection.onclose(() => {
                console.log('SignalR connection closed');
                this.syncStatus.isConnected = false;
            });

            // Set up real-time event handlers
            this.setupSignalREvents();

            // Start the connection
            await this.signalRConnection.start();
            this.syncStatus.isConnected = true;
            
            console.log('SignalR connection established');
            return true;
        } catch (error) {
            console.error('Failed to initialize SignalR:', error);
            this.syncStatus.isConnected = false;
            return false;
        }
    }

    setupSignalREvents() {
        if (!this.signalRConnection) return;

        // Timetable updates
        this.signalRConnection.on('TimetableUpdated', (data) => {
            console.log('Timetable updated:', data);
            this.handleRealTimeUpdate('timetable', data);
        });

        // Conflict notifications
        this.signalRConnection.on('ConflictDetected', (data) => {
            console.log('Conflict detected:', data);
            this.handleConflictAlert(data.conflicts);
        });

        // Sync notifications
        this.signalRConnection.on('SyncNotification', (data) => {
            console.log('Sync notification:', data);
            this.handleSyncNotification(data);
        });

        // Optimization updates
        this.signalRConnection.on('OptimizationUpdate', (data) => {
            console.log('Optimization update:', data);
            this.handleOptimizationUpdate(data);
        });

        // Entity updates
        this.signalRConnection.on('EntityUpdated', (data) => {
            console.log('Entity updated:', data);
            this.handleEntityUpdate(data);
        });

        // Connection status
        this.signalRConnection.on('Connected', (data) => {
            console.log('Connected to hub:', data);
        });

        this.signalRConnection.on('Pong', (timestamp) => {
            console.log('Ping response:', timestamp);
        });
    }

    // Periods CRUD operations
    async getPeriods() {
        try {
            const response = await this.authenticatedFetch('/timetable/periods');
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error fetching periods:', error);
            return [];
        }
    }

    async createPeriod(periodData) {
        try {
            const response = await this.authenticatedFetch('/timetable/periods', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(periodData)
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error creating period:', error);
            return { success: false, error: 'Failed to create period' };
        }
    }

    async updatePeriod(periodId, periodData) {
        try {
            const response = await this.authenticatedFetch(`/timetable/periods/${periodId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(periodData)
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error updating period:', error);
            return { success: false, error: 'Failed to update period' };
        }
    }

    async deletePeriod(periodId) {
        try {
            const response = await this.authenticatedFetch(`/timetable/periods/${periodId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error deleting period:', error);
            return { success: false, error: 'Failed to delete period' };
        }
    }

    // Rooms CRUD operations
    async getRooms() {
        try {
            const response = await this.authenticatedFetch('/timetable/rooms');
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error fetching rooms:', error);
            return [];
        }
    }

    async createRoom(roomData) {
        try {
            const response = await this.authenticatedFetch('/timetable/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roomData)
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error creating room:', error);
            return { success: false, error: 'Failed to create room' };
        }
    }

    // Lesson Definitions CRUD operations
    async getLessonDefinitions() {
        try {
            const response = await this.authenticatedFetch('/timetable/lesson-definitions');
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error fetching lesson definitions:', error);
            return [];
        }
    }

    async createLessonDefinition(lessonData) {
        try {
            const response = await this.authenticatedFetch('/timetable/lesson-definitions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lessonData)
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error creating lesson definition:', error);
            return { success: false, error: 'Failed to create lesson definition' };
        }
    }

    // AI Timetable Generation
    async generateAITimetable(request) {
        try {
            this.showProgressNotification('Shikola AI is analyzing your school constraints...');
            
            const response = await this.authenticatedFetch('/timetable/generate-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showProgressNotification('AI optimization completed successfully!', 'success');
                return result.data;
            } else {
                this.showProgressNotification('AI generation failed: ' + result.error, 'error');
                return null;
            }
        } catch (error) {
            console.error('Error generating AI timetable:', error);
            this.showProgressNotification('AI generation failed due to network error', 'error');
            return null;
        }
    }

    // Conflict Management
    async getConflicts(academicYear, term) {
        try {
            const response = await this.authenticatedFetch(`/timetable/conflicts/${academicYear}/${term}`);
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error fetching conflicts:', error);
            return [];
        }
    }

    async resolveConflict(resolution) {
        try {
            const response = await this.authenticatedFetch('/timetable/resolve-conflict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resolution)
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error resolving conflict:', error);
            return { success: false, error: 'Failed to resolve conflict' };
        }
    }

    // Timetable Retrieval
    async getMasterTimetable(academicYear, term) {
        try {
            const response = await this.authenticatedFetch(`/timetable/master/${academicYear}/${term}`);
            const result = await response.json();
            return result.success ? result.data : null;
        } catch (error) {
            console.error('Error fetching master timetable:', error);
            return null;
        }
    }

    async getClassTimetable(academicYear, term, className) {
        try {
            const response = await this.authenticatedFetch(`/timetable/class/${academicYear}/${term}/${className}`);
            const result = await response.json();
            return result.success ? result.data : null;
        } catch (error) {
            console.error('Error fetching class timetable:', error);
            return null;
        }
    }

    async getTeacherTimetable(academicYear, term, teacherId) {
        try {
            const response = await this.authenticatedFetch(`/timetable/teacher/${academicYear}/${term}/${teacherId}`);
            const result = await response.json();
            return result.success ? result.data : null;
        } catch (error) {
            console.error('Error fetching teacher timetable:', error);
            return null;
        }
    }

    // Sync Operations
    async syncTimetable(request) {
        try {
            const response = await this.authenticatedFetch('/timetable/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            const result = await response.json();
            return result.success ? result.data : null;
        } catch (error) {
            console.error('Error syncing timetable:', error);
            return null;
        }
    }

    // Optimization Settings
    async getOptimizationSettings() {
        try {
            const response = await this.authenticatedFetch('/timetable/optimization-settings');
            const result = await response.json();
            return result.success ? result.data : {};
        } catch (error) {
            console.error('Error fetching optimization settings:', error);
            return {};
        }
    }

    async saveOptimizationSettings(settings) {
        try {
            const response = await this.authenticatedFetch('/timetable/optimization-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const result = await response.json();
            return result.success ? result.data : null;
        } catch (error) {
            console.error('Error saving optimization settings:', error);
            return null;
        }
    }

    // Export/Import Operations
    async exportTimetable(academicYear, term, format) {
        try {
            const response = await this.authenticatedFetch(`/timetable/export/${academicYear}/${term}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format: format })
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `timetable_${academicYear}_${term}.${format.toLowerCase()}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error exporting timetable:', error);
            return false;
        }
    }

    async importTimetable(file, academicYear, term) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('academicYear', academicYear);
            formData.append('term', term);

            const response = await this.authenticatedFetch('/timetable/import', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            return result.success ? result.data : null;
        } catch (error) {
            console.error('Error importing timetable:', error);
            return null;
        }
    }

    // Helper methods
    async authenticatedFetch(url, options = {}) {
        const token = localStorage.getItem('shikola_token') || localStorage.getItem('authToken');
        const headers = {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        return fetch(`${this.baseURL}${url}`, {
            ...options,
            headers
        });
    }

    // Real-time event handlers
    handleRealTimeUpdate(type, data) {
        // Dispatch custom event for Alpine.js to handle
        window.dispatchEvent(new CustomEvent('timetableUpdate', {
            detail: { type, data }
        }));
    }

    handleConflictAlert(conflicts) {
        // Show conflict notification
        window.dispatchEvent(new CustomEvent('conflictDetected', {
            detail: { conflicts }
        }));
    }

    handleSyncNotification(data) {
        // Update sync status
        this.syncStatus.lastSync = new Date();
        window.dispatchEvent(new CustomEvent('syncNotification', {
            detail: data
        }));
    }

    handleOptimizationUpdate(data) {
        // Show optimization progress
        window.dispatchEvent(new CustomEvent('optimizationUpdate', {
            detail: data
        }));
    }

    handleEntityUpdate(data) {
        // Handle entity-specific updates
        window.dispatchEvent(new CustomEvent('entityUpdate', {
            detail: data
        }));
    }

    showProgressNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        } text-white`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Utility methods
    async ping() {
        if (this.signalRConnection) {
            try {
                await this.signalRConnection.invoke('Ping');
                return true;
            } catch (error) {
                console.error('Ping failed:', error);
                return false;
            }
        }
        return false;
    }

    async getConnectionStats() {
        if (this.signalRConnection) {
            try {
                await this.signalRConnection.invoke('GetConnectionStats');
                return true;
            } catch (error) {
                console.error('Failed to get connection stats:', error);
                return false;
            }
        }
        return false;
    }

    async joinTimetableGroup(timetableId) {
        if (this.signalRConnection) {
            try {
                await this.signalRConnection.invoke('JoinTimetableGroup', timetableId);
                return true;
            } catch (error) {
                console.error('Failed to join timetable group:', error);
                return false;
            }
        }
        return false;
    }

    async leaveTimetableGroup(timetableId) {
        if (this.signalRConnection) {
            try {
                await this.signalRConnection.invoke('LeaveTimetableGroup', timetableId);
                return true;
            } catch (error) {
                console.error('Failed to leave timetable group:', error);
                return false;
            }
        }
        return false;
    }

    // Cleanup
    disconnect() {
        if (this.signalRConnection) {
            this.signalRConnection.stop();
            this.signalRConnection = null;
        }
        this.syncStatus.isConnected = false;
    }
}

// Global instance
window.timetableAPI = new TimetableAPI();

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Load SignalR library if not already loaded
    if (typeof signalR === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/7.0.5/signalr.min.js';
        script.onload = async () => {
            await window.timetableAPI.initializeSignalR();
        };
        document.head.appendChild(script);
    } else {
        await window.timetableAPI.initializeSignalR();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    window.timetableAPI.disconnect();
});
