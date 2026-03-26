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
 * Shikola Real-Time Synchronization Service
 * Handles real-time data synchronization across all portals
 */
(function() {
    'use strict';

    // Configuration
    const SYNC_CONFIG = {
        websocketUrl: window.SHIKOLA_WS_URL || '/ws',
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
        syncIntervals: {
            dashboard: 30000,      // 30 seconds
            notifications: 15000,  // 15 seconds
            attendance: 60000,     // 1 minute
            grades: 120000,        // 2 minutes
            assignments: 45000,     // 45 seconds
            fees: 300000,          // 5 minutes
            messages: 20000        // 20 seconds
        }
    };

    // State management
    let ws = null;
    let reconnectAttempts = 0;
    let isConnected = false;
    let syncIntervals = {};
    let subscribers = {};
    let lastSyncTimes = {};

    // WebSocket connection
    function connectWebSocket() {
        try {
            ws = new WebSocket(SYNC_CONFIG.websocketUrl);
            
            ws.onopen = function() {
                console.log('Real-time sync connected');
                isConnected = true;
                reconnectAttempts = 0;
                startSyncIntervals();
                notifySubscribers('connection', { connected: true });
            };

            ws.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    handleRealtimeUpdate(data);
                } catch (e) {
                    console.error('Failed to parse WebSocket message:', e);
                }
            };

            ws.onclose = function() {
                console.log('Real-time sync disconnected');
                isConnected = false;
                stopSyncIntervals();
                notifySubscribers('connection', { connected: false });
                attemptReconnect();
            };

            ws.onerror = function(error) {
                console.error('WebSocket error:', error);
            };

        } catch (e) {
            console.error('Failed to create WebSocket connection:', e);
            // Fallback to polling
            startPollingMode();
        }
    }

    // Reconnection logic
    function attemptReconnect() {
        if (reconnectAttempts < SYNC_CONFIG.maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect (${reconnectAttempts}/${SYNC_CONFIG.maxReconnectAttempts})`);
            setTimeout(connectWebSocket, SYNC_CONFIG.reconnectInterval);
        } else {
            console.log('Max reconnection attempts reached, switching to polling mode');
            startPollingMode();
        }
    }

    // Polling mode fallback
    function startPollingMode() {
        console.log('Starting polling mode for real-time sync');
        Object.keys(SYNC_CONFIG.syncIntervals).forEach(dataType => {
            if (!syncIntervals[dataType]) {
                syncIntervals[dataType] = setInterval(() => {
                    pollForUpdates(dataType);
                }, SYNC_CONFIG.syncIntervals[dataType]);
            }
        });
    }

    // Poll for updates
    async function pollForUpdates(dataType) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch(`${window.SHIKOLA_API_BASE}/api/sync/${dataType}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'If-Modified-Since': lastSyncTimes[dataType] || '1970-01-01'
                }
            });

            if (response.status === 200) {
                const data = await response.json();
                if (data.updates && data.updates.length > 0) {
                    data.updates.forEach(update => {
                        handleRealtimeUpdate({
                            type: dataType,
                            action: 'update',
                            data: update
                        });
                    });
                    lastSyncTimes[dataType] = new Date().toISOString();
                }
            } else if (response.status === 304) {
                // No updates
                lastSyncTimes[dataType] = new Date().toISOString();
            }
        } catch (e) {
            console.error(`Failed to poll for ${dataType} updates:`, e);
        }
    }

    // Handle real-time updates
    function handleRealtimeUpdate(message) {
        const { type, action, data } = message;
        
        console.log(`Real-time update: ${type} - ${action}`, data);
        
        // Update localStorage cache
        updateLocalStorageCache(type, data);
        
        // Notify subscribers
        notifySubscribers(type, { action, data });
        
        // Trigger UI refresh if needed
        triggerUIRefresh(type, action, data);
    }

    // Update localStorage cache
    function updateLocalStorageCache(type, data) {
        try {
            const cacheKey = `shikola_${getCurrentPortal()}_${type}_v1`;
            const cached = localStorage.getItem(cacheKey);
            
            if (cached) {
                const cacheData = JSON.parse(cached);
                
                // Update or remove item in cache
                if (action === 'delete' && data.id) {
                    cacheData.data = cacheData.data.filter(item => item.id !== data.id);
                } else if (action === 'update' && data.id) {
                    const index = cacheData.data.findIndex(item => item.id === data.id);
                    if (index >= 0) {
                        cacheData.data[index] = data;
                    } else {
                        cacheData.data.push(data);
                    }
                } else if (action === 'create') {
                    cacheData.data.push(data);
                }
                
                // Update timestamp
                cacheData.timestamp = Date.now();
                localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            }
        } catch (e) {
            console.error('Failed to update localStorage cache:', e);
        }
    }

    // Get current portal
    function getCurrentPortal() {
        const path = window.location.pathname;
        if (path.includes('pupil-portal')) return 'pupil';
        if (path.includes('teacher-portal')) return 'teacher';
        if (path.includes('school-admin')) return 'school_admin';
        if (path.includes('super-admin')) return 'super_admin';
        if (path.includes('accountant-portal')) return 'accountant';
         return 'unknown';
    }

    // Notify subscribers
    function notifySubscribers(type, data) {
        if (subscribers[type]) {
            subscribers[type].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error('Subscriber callback error:', e);
                }
            });
        }
    }

    // Trigger UI refresh
    function triggerUIRefresh(type, action, data) {
        // Custom refresh logic based on data type
        switch (type) {
            case 'notifications':
                if (window.refreshNotifications) {
                    window.refreshNotifications();
                }
                break;
            case 'assignments':
                if (window.refreshAssignments) {
                    window.refreshAssignments();
                }
                break;
            case 'grades':
                if (window.refreshGrades) {
                    window.refreshGrades();
                }
                break;
            case 'attendance':
                if (window.refreshAttendance) {
                    window.refreshAttendance();
                }
                break;
            case 'messages':
                if (window.refreshMessages) {
                    window.refreshMessages();
                }
                break;
            default:
                // Generic refresh
                if (window.refreshDashboard) {
                    window.refreshDashboard();
                }
        }
    }

    // Start sync intervals
    function startSyncIntervals() {
        Object.keys(SYNC_CONFIG.syncIntervals).forEach(dataType => {
            if (!syncIntervals[dataType]) {
                syncIntervals[dataType] = setInterval(() => {
                    if (isConnected) {
                        // WebSocket mode - server will push updates
                    } else {
                        // Polling mode
                        pollForUpdates(dataType);
                    }
                }, SYNC_CONFIG.syncIntervals[dataType]);
            }
        });
    }

    // Stop sync intervals
    function stopSyncIntervals() {
        Object.keys(syncIntervals).forEach(dataType => {
            if (syncIntervals[dataType]) {
                clearInterval(syncIntervals[dataType]);
                delete syncIntervals[dataType];
            }
        });
    }

    // Public API
    window.ShikolaRealtimeSync = {
        // Subscribe to updates
        subscribe: function(type, callback) {
            if (!subscribers[type]) {
                subscribers[type] = [];
            }
            subscribers[type].push(callback);
        },

        // Unsubscribe from updates
        unsubscribe: function(type, callback) {
            if (subscribers[type]) {
                subscribers[type] = subscribers[type].filter(cb => cb !== callback);
            }
        },

        // Manual sync trigger
        sync: function(type) {
            if (isConnected) {
                // Send sync request via WebSocket
                ws.send(JSON.stringify({ action: 'sync', type: type }));
            } else {
                // Poll for updates
                pollForUpdates(type);
            }
        },

        // Get connection status
        isConnected: function() {
            return isConnected;
        },

        // Start the service
        start: function() {
            connectWebSocket();
        },

        // Stop the service
        stop: function() {
            stopSyncIntervals();
            if (ws) {
                ws.close();
            }
        },

        // Send real-time event
        sendEvent: function(type, action, data) {
            if (isConnected) {
                ws.send(JSON.stringify({
                    type: type,
                    action: action,
                    data: data,
                    timestamp: new Date().toISOString()
                }));
            }
        }
    };

    // Auto-start when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.ShikolaRealtimeSync.start();
        });
    } else {
        window.ShikolaRealtimeSync.start();
    }

})();
