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
 * Shikola Cross-Portal Data Synchronization
 * Ensures data consistency across all user portals with real-time updates
 */
(function (window) {
    'use strict';

    if (!window.ShikolaAPI) {
        console.error('ShikolaAPI not found. Cross-portal sync requires unified API client.');
        return;
    }

    class CrossPortalSync {
        constructor() {
            this.syncChannels = new Map();
            this.subscribers = new Map();
            this.lastSyncTimes = new Map();
            this.syncInterval = 30000; // 30 seconds
            this.initialized = false;
        }

        async initialize() {
            if (this.initialized) return;

            try {
                // Get current user and setup sync channels
                const user = await window.ShikolaAPI.auth.getCurrentUser();
                if (!user) {
                    throw new Error('User not authenticated');
                }

                this.setupSyncChannels(user);
                this.setupEventListeners();
                this.startPeriodicSync();
                
                this.initialized = true;
                console.log('Cross-portal sync initialized for user:', user.role);
            } catch (error) {
                console.error('Failed to initialize cross-portal sync:', error);
                throw error;
            }
        }

        setupSyncChannels(user) {
            // Define sync channels based on user role
            const channels = {
                'Super Admin': ['*'], // All channels
                'Operations': ['pupils', 'fees', 'exams', 'attendance'],
                'School Admin': ['pupils', 'fees', 'exams', 'attendance', 'classes', 'timetables'],
                'Head Teacher': ['pupils', 'attendance', 'exams', 'classes'],
                'Deputy Head': ['pupils', 'attendance', 'exams', 'classes'],
                'Teacher': ['pupils', 'attendance', 'exams', 'assignments', 'classes'],
                'Accountant': ['fees', 'payments', 'expenses'],
                'Parent': ['pupils', 'fees', 'attendance', 'exams'],
                'Pupil': ['assignments', 'exams', 'attendance', 'timetables']
            };

            const userChannels = channels[user.role] || [];
            
            userChannels.forEach(channel => {
                if (channel === '*') {
                    // Subscribe to all channels
                    Object.keys(this.getSyncChannelMappings()).forEach(ch => {
                        this.connectToChannel(ch, user);
                    });
                } else {
                    this.connectToChannel(channel, user);
                }
            });
        }

        getSyncChannelMappings() {
            return {
                'pupils': {
                    events: ['pupil-created', 'pupil-updated', 'pupil-deleted', 'pupil-enrolled'],
                    portals: ['school-admin', 'teacher', 'parent', 'pupil'],
                    syncType: 'immediate'
                },
                'fees': {
                    events: ['fee-created', 'fee-updated', 'fee-deleted', 'payment-recorded'],
                    portals: ['school-admin', 'accountant', 'parent', 'pupil'],
                    syncType: 'immediate'
                },
                'exams': {
                    events: ['exam-created', 'exam-updated', 'exam-deleted', 'exam-published', 'results-published'],
                    portals: ['school-admin', 'teacher', 'pupil', 'parent'],
                    syncType: 'immediate'
                },
                'attendance': {
                    events: ['attendance-marked', 'attendance-updated'],
                    portals: ['school-admin', 'teacher', 'parent'],
                    syncType: 'immediate'
                },
                'classes': {
                    events: ['class-created', 'class-updated', 'class-deleted', 'pupil-assigned'],
                    portals: ['school-admin', 'teacher'],
                    syncType: 'immediate'
                },
                'assignments': {
                    events: ['assignment-created', 'assignment-updated', 'assignment-submitted', 'assignment-graded'],
                    portals: ['teacher', 'pupil'],
                    syncType: 'immediate'
                },
                'timetables': {
                    events: ['timetable-updated', 'class-scheduled'],
                    portals: ['school-admin', 'teacher', 'pupil'],
                    syncType: 'periodic'
                },
                'payments': {
                    events: ['payment-received', 'payment-failed', 'refund-processed'],
                    portals: ['accountant', 'parent'],
                    syncType: 'immediate'
                }
            };
        }

        connectToChannel(channel, user) {
            try {
                const ws = window.ShikolaAPI.ws.connect(channel);
                
                if (ws) {
                    this.syncChannels.set(channel, {
                        websocket: ws,
                        lastActivity: Date.now(),
                        userRole: user.role,
                        schoolId: user.schoolId
                    });

                    console.log(`Connected to sync channel: ${channel}`);
                }
            } catch (error) {
                console.error(`Failed to connect to channel ${channel}:`, error);
            }
        }

        setupEventListeners() {
            // Listen for local data changes and broadcast them
            window.addEventListener('shikola:data-changed', (event) => {
                this.handleLocalDataChange(event.detail);
            });

            // Listen for WebSocket updates
            window.addEventListener('shikola:realtime-update', (event) => {
                this.handleRealtimeUpdate(event.detail);
            });

            // Listen for page visibility changes to trigger sync
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    this.performFullSync();
                }
            });
        }

        handleLocalDataChange(data) {
            const { resource, action, payload } = data;
            
            // Broadcast to relevant sync channels
            const channelMappings = this.getSyncChannelMappings();
            
            Object.keys(channelMappings).forEach(channel => {
                if (channelMappings[channel].events.includes(`${resource}-${action}`)) {
                    this.broadcastToChannel(channel, {
                        type: 'data-change',
                        resource,
                        action,
                        payload,
                        timestamp: Date.now(),
                        source: window.location.pathname
                    });
                }
            });
        }

        handleRealtimeUpdate(data) {
            const { channel, data: updateData } = data;
            
            // Update local cache
            this.updateLocalCache(channel, updateData);
            
            // Notify subscribers
            this.notifySubscribers(channel, updateData);
            
            // Update UI components
            this.updateUIComponents(channel, updateData);
        }

        broadcastToChannel(channel, message) {
            const channelInfo = this.syncChannels.get(channel);
            if (channelInfo && channelInfo.websocket) {
                try {
                    channelInfo.websocket.send(JSON.stringify(message));
                    channelInfo.lastActivity = Date.now();
                } catch (error) {
                    console.error(`Failed to broadcast to channel ${channel}:`, error);
                }
            }
        }

        updateLocalCache(channel, data) {
            // Clear relevant cache entries
            if (window.ShikolaAPI && window.ShikolaAPI.cache) {
                const patterns = {
                    'pupils': ['pupils:', 'pupil:'],
                    'fees': ['fees:', 'fee:', 'payments:'],
                    'exams': ['exams:', 'exam:', 'questions:', 'chapters:'],
                    'attendance': ['attendance:'],
                    'classes': ['classes:', 'class:'],
                    'assignments': ['assignments:', 'assignment:'],
                    'timetables': ['timetables:', 'timetable:']
                };

                const cachePatterns = patterns[channel] || [];
                cachePatterns.forEach(pattern => {
                    window.ShikolaAPI.cache.clear();
                    // More specific cache clearing could be implemented here
                });
            }
        }

        notifySubscribers(channel, data) {
            const channelSubscribers = this.subscribers.get(channel) || [];
            const globalSubscribers = this.subscribers.get('*') || [];
            
            [...channelSubscribers, ...globalSubscribers].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in sync subscriber callback:', error);
                }
            });
        }

        updateUIComponents(channel, data) {
            // Dispatch specific events for UI components
            const events = {
                'pupils': 'shikola:pupils-updated',
                'fees': 'shikola:fees-updated',
                'exams': 'shikola:exams-updated',
                'attendance': 'shikola:attendance-updated',
                'classes': 'shikola:classes-updated',
                'assignments': 'shikola:assignments-updated',
                'timetables': 'shikola:timetables-updated'
            };

            const eventName = events[channel];
            if (eventName) {
                window.dispatchEvent(new CustomEvent(eventName, {
                    detail: { channel, data }
                }));
            }
        }

        startPeriodicSync() {
            setInterval(() => {
                this.performPeriodicSync();
            }, this.syncInterval);
        }

        async performPeriodicSync() {
            try {
                const channels = Array.from(this.syncChannels.keys());
                
                for (const channel of channels) {
                    const channelInfo = this.getSyncChannelMappings()[channel];
                    
                    if (channelInfo && channelInfo.syncType === 'periodic') {
                        await this.syncChannelData(channel);
                    }
                }
            } catch (error) {
                console.error('Periodic sync failed:', error);
            }
        }

        async performFullSync() {
            try {
                console.log('Performing full sync...');
                
                const channels = Array.from(this.syncChannels.keys());
                await Promise.all(channels.map(channel => this.syncChannelData(channel)));
                
                console.log('Full sync completed');
            } catch (error) {
                console.error('Full sync failed:', error);
            }
        }

        async syncChannelData(channel) {
            try {
                const lastSync = this.lastSyncTimes.get(channel) || 0;
                const now = Date.now();
                
                // Check if sync is needed (avoid excessive API calls)
                if (now - lastSync < 10000) { // 10 seconds minimum interval
                    return;
                }

                // Call appropriate API to get latest data
                const apiMethods = {
                    'pupils': () => window.ShikolaAPI.pupils.list(),
                    'fees': () => window.ShikolaAPI.fees.list(),
                    'exams': () => window.ShikolaAPI.exams.list(),
                    'attendance': () => window.ShikolaAPI.attendance.list(),
                    'classes': () => window.ShikolaAPI.classes.list(),
                    'assignments': () => window.ShikolaAPI.assignments?.list(),
                    'timetables': () => window.ShikolaAPI.timetables.list()
                };

                const apiMethod = apiMethods[channel];
                if (apiMethod) {
                    await apiMethod();
                    this.lastSyncTimes.set(channel, now);
                }
            } catch (error) {
                console.error(`Failed to sync channel ${channel}:`, error);
            }
        }

        subscribe(channel, callback) {
            if (!this.subscribers.has(channel)) {
                this.subscribers.set(channel, []);
            }
            this.subscribers.get(channel).push(callback);
        }

        unsubscribe(channel, callback) {
            const callbacks = this.subscribers.get(channel);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        }

        getSyncStatus() {
            return {
                initialized: this.initialized,
                connectedChannels: Array.from(this.syncChannels.keys()),
                lastSyncTimes: Object.fromEntries(this.lastSyncTimes),
                subscribers: Object.fromEntries(
                    Array.from(this.subscribers.entries()).map(([k, v]) => [k, v.length])
                )
            };
        }
    }

    const crossPortalSync = new CrossPortalSync();

    window.ShikolaSync = {
        initialize: () => crossPortalSync.initialize(),
        subscribe: (channel, callback) => crossPortalSync.subscribe(channel, callback),
        unsubscribe: (channel, callback) => crossPortalSync.unsubscribe(channel, callback),
        performFullSync: () => crossPortalSync.performFullSync(),
        getStatus: () => crossPortalSync.getSyncStatus(),
        broadcastDataChange: (resource, action, payload) => {
            crossPortalSync.handleLocalDataChange({ resource, action, payload });
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            crossPortalSync.initialize().catch(error => {
                console.error('Failed to initialize cross-portal sync:', error);
            });
        });
    } else {
        crossPortalSync.initialize().catch(error => {
            console.error('Failed to initialize cross-portal sync:', error);
        });
    }

    console.log('Shikola Cross-Portal Sync loaded');

})(window);
