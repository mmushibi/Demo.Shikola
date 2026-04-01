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
// Pupil Live Classes API Integration
class PupilLiveClassesAPI {
    constructor() {
        this.baseURL = window.SHIKOLA_API_BASE || '/api';
        this.token = null;
        this.init();
    }

    init() {
        this.token = localStorage.getItem('shikola_token') || localStorage.getItem('authToken');
        if (!this.token) {
            console.warn('No authentication token found for live classes');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api/pupilliveclasses${endpoint}`;
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
            console.error('Live classes API error:', error);
            throw error;
        }
    }

    redirectToLogin() {
        window.location.href = '../../public/index.html';
    }

    // Get live classes for the pupil
    async getLiveClasses(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.status) params.append('status', filters.status);
        
        const queryString = params.toString();
        return await this.request(`/live-classes${queryString ? '?' + queryString : ''}`);
    }

    // Join a live class
    async joinLiveClass(classId) {
        return await this.request(`/live-classes/${classId}/join`, {
            method: 'POST'
        });
    }

    // Leave a live class
    async leaveLiveClass(classId) {
        return await this.request(`/live-classes/${classId}/leave`, {
            method: 'POST'
        });
    }

    // Get recordings
    async getRecordings() {
        return await this.request('/live-classes/recordings');
    }

    // Mark recording as viewed
    async markRecordingViewed(classId, recordingId) {
        return await this.request(`/live-classes/${classId}/recordings/${recordingId}/view`, {
            method: 'POST'
        });
    }
}

// Initialize the API
window.pupilLiveClassesAPI = new PupilLiveClassesAPI();

// Alpine.js component for live classes
function pupilLiveClasses() {
    return {
        liveClasses: [],
        recordings: [],
        currentClass: null,
        loading: false,
        error: null,
        joinedClasses: new Set(),
        showRecordings: false,
        filters: {
            status: '',
            startDate: '',
            endDate: ''
        },

        async init() {
            await this.loadLiveClasses();
            await this.loadRecordings();
            this.setupRealtimeUpdates();
        },

        async loadLiveClasses() {
            this.loading = true;
            this.error = null;
            
            try {
                const response = await window.pupilLiveClassesAPI.getLiveClasses(this.filters);
                if (response && response.success) {
                    this.liveClasses = response.data || [];
                    this.updateJoinedClasses();
                } else {
                    this.error = response?.error || 'Failed to load live classes';
                }
            } catch (error) {
                console.error('Error loading live classes:', error);
                this.error = 'Failed to load live classes';
            } finally {
                this.loading = false;
            }
        },

        async loadRecordings() {
            try {
                const response = await window.pupilLiveClassesAPI.getRecordings();
                if (response && response.success) {
                    this.recordings = response.data || [];
                }
            } catch (error) {
                console.error('Error loading recordings:', error);
            }
        },

        updateJoinedClasses() {
            // Check which classes the pupil has already joined
            this.liveClasses.forEach(liveClass => {
                if (liveClass.status === 'active' && this.joinedClasses.has(liveClass.id)) {
                    liveClass.isJoined = true;
                }
            });
        },

        async joinClass(liveClass) {
            if (!this.canJoinClass(liveClass)) return;

            try {
                const response = await window.pupilLiveClassesAPI.joinLiveClass(liveClass.id);
                if (response && response.success) {
                    this.joinedClasses.add(liveClass.id);
                    liveClass.isJoined = true;
                    
                    // Open the live class in a new window
                    if (response.data?.roomUrl) {
                        window.open(response.data.roomUrl, '_blank');
                    }
                    
                    this.showNotification('Successfully joined live class', 'success');
                } else {
                    this.showNotification(response?.error || 'Failed to join class', 'error');
                }
            } catch (error) {
                console.error('Error joining class:', error);
                this.showNotification('Failed to join live class', 'error');
            }
        },

        async leaveClass(liveClass) {
            if (!liveClass.isJoined) return;

            try {
                const response = await window.pupilLiveClassesAPI.leaveLiveClass(liveClass.id);
                if (response && response.success) {
                    this.joinedClasses.delete(liveClass.id);
                    liveClass.isJoined = false;
                    this.showNotification('Successfully left live class', 'success');
                } else {
                    this.showNotification(response?.error || 'Failed to leave class', 'error');
                }
            } catch (error) {
                console.error('Error leaving class:', error);
                this.showNotification('Failed to leave live class', 'error');
            }
        },

        canJoinClass(liveClass) {
            const now = new Date();
            const startTime = new Date(liveClass.start);
            const endTime = new Date(liveClass.end);
            
            return liveClass.status === 'active' || 
                   (liveClass.status === 'scheduled' && now >= startTime && now <= endTime);
        },

        getClassStatus(liveClass) {
            if (liveClass.cancelled) return 'cancelled';
            if (liveClass.isJoined) return 'joined';
            if (liveClass.status === 'active') return 'active';
            if (liveClass.status === 'scheduled') return 'scheduled';
            return 'ended';
        },

        getStatusColor(liveClass) {
            const status = this.getClassStatus(liveClass);
            switch (status) {
                case 'active': return 'text-green-600 bg-green-100';
                case 'scheduled': return 'text-blue-600 bg-blue-100';
                case 'joined': return 'text-purple-600 bg-purple-100';
                case 'cancelled': return 'text-red-600 bg-red-100';
                default: return 'text-gray-600 bg-gray-100';
            }
        },

        formatTime(dateTime) {
            return new Date(dateTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        formatDate(dateTime) {
            return new Date(dateTime).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        },

        formatDuration(minutes) {
            if (!minutes) return '45 min';
            return `${minutes} min`;
        },

        async watchRecording(recording) {
            try {
                // Mark as viewed
                await window.pupilLiveClassesAPI.markRecordingViewed(recording.classId, recording.id);
                recording.viewCount = (recording.viewCount || 0) + 1;
                
                // Open recording in new window
                window.open(recording.recordingUrl, '_blank');
            } catch (error) {
                console.error('Error watching recording:', error);
                this.showNotification('Failed to open recording', 'error');
            }
        },

        formatFileSize(bytes) {
            if (!bytes) return 'Unknown size';
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
        },

        setupRealtimeUpdates() {
            // Listen for real-time updates
            if (window.connection) {
                window.connection.on('LiveClassUpdate', (update) => {
                    const liveClass = this.liveClasses.find(lc => lc.id === update.classId);
                    if (liveClass) {
                        Object.assign(liveClass, update.data);
                    }
                });

                window.connection.on('LiveClassParticipantUpdate', (update) => {
                    const liveClass = this.liveClasses.find(lc => lc.id === update.classId);
                    if (liveClass) {
                        liveClass.participants = update.data.currentParticipants;
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
            this.loadLiveClasses();
        },

        clearFilters() {
            this.filters = {
                status: '',
                startDate: '',
                endDate: ''
            };
            this.loadLiveClasses();
        },

        toggleRecordings() {
            this.showRecordings = !this.showRecordings;
        }
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PupilLiveClassesAPI, pupilLiveClasses };
}
