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
 * Enhanced Messaging Backend Integration
 * Provides real C# backend integration with auto-save, sync, and cross-portal sharing
 */

class ShikolaMessagingBackend {
    constructor() {
        this.apiBase = '/api/messaging';
        this.syncInterval = 30000; // 30 seconds
        this.autoSaveInterval = 5000; // 5 seconds
        this.lastSyncTime = null;
        this.isOnline = navigator.onLine;
        this.pendingMessages = [];
        this.syncInProgress = false;
        this.autoSaveInProgress = false;
        this.connection = null;
        this.hubConnection = null;
        
        this.init();
    }

    async init() {
        // Monitor online/offline status
        window.addEventListener('online', () => this.isOnline = true);
        window.addEventListener('offline', () => this.isOnline = false);
        
        // Initialize SignalR connection for real-time messaging
        await this.initializeSignalR();
        
        // Start background sync
        this.startBackgroundSync();
        
        // Start auto-save
        this.startAutoSave();
        
        // Setup cross-portal message sharing
        this.setupCrossPortalSharing();
        
        // Load cached messages
        await this.loadCachedMessages();
        
        console.log('Shikola Messaging Backend Integration initialized');
    }
    
    /**
     * Initialize SignalR connection for real-time messaging
     */
    async initializeSignalR() {
        try {
            // Check if SignalR is available
            if (typeof signalR === 'undefined') {
                console.warn('SignalR not loaded. Real-time messaging will not work.');
                return;
            }
            
            // Create connection to messaging hub
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl('/messagingHub')
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Information)
                .build();
            
            // Set up event handlers
            this.setupSignalREventHandlers();
            
            // Start the connection
            await this.connection.start();
            
            console.log('SignalR connected for real-time messaging');
        } catch (error) {
            console.error('Failed to initialize SignalR:', error);
        }
    }
    
    /**
     * Setup SignalR event handlers
     */
    setupSignalREventHandlers() {
        // Handle incoming messages
        this.connection.on('ReceiveMessage', (message) => {
            this.handleRealTimeMessage(message);
        });
        
        // Handle message sent confirmation
        this.connection.on('MessageSent', (message) => {
            this.handleMessageSentConfirmation(message);
        });
        
        // Handle message read notifications
        this.connection.on('MessageRead', (data) => {
            this.handleMessageReadNotification(data);
        });
        
        // Handle typing notifications
        this.connection.on('UserTyping', (data) => {
            this.handleTypingNotification(data);
        });
        
        // Handle notifications
        this.connection.on('ReceiveNotification', (notification) => {
            this.handleRealTimeNotification(notification);
        });
        
        // Handle connection events
        this.connection.onreconnected(() => {
            console.log('SignalR reconnected');
            this.syncMessages(); // Sync on reconnect
        });
        
        this.connection.onclose(() => {
            console.log('SignalR connection closed');
        });
    }
    
    /**
     * Handle real-time incoming messages
     */
    handleRealTimeMessage(message) {
        try {
            // Update UI with new message
            this.triggerMessageUpdate(message);
            
            // Show notification for new message
            if (!message.isMine) {
                this.showToast(`New message from ${message.senderName || 'Someone'}`, 'info', 3000);
            }
            
            // Store in local cache
            this.cacheMessage(message);
            
            console.log('Real-time message received:', message);
        } catch (error) {
            console.error('Error handling real-time message:', error);
        }
    }
    
    /**
     * Handle message sent confirmation
     */
    handleMessageSentConfirmation(message) {
        try {
            // Update UI to show message was sent
            this.triggerMessageUpdate(message);
            console.log('Message sent confirmation:', message);
        } catch (error) {
            console.error('Error handling message sent confirmation:', error);
        }
    }
    
    /**
     * Handle message read notifications
     */
    handleMessageReadNotification(data) {
        try {
            // Update message status in UI
            this.updateMessageStatus(data.messageId, 'read');
            console.log('Message read notification:', data);
        } catch (error) {
            console.error('Error handling message read notification:', error);
        }
    }
    
    /**
     * Handle typing notifications
     */
    handleTypingNotification(data) {
        try {
            // Show typing indicator in UI
            this.triggerTypingUpdate(data);
            console.log('Typing notification:', data);
        } catch (error) {
            console.error('Error handling typing notification:', error);
        }
    }
    
    /**
     * Handle real-time notifications
     */
    handleRealTimeNotification(notification) {
        try {
            // Show notification
            this.showToast(notification.title || 'Notification', 'info', 3000);
            
            // Store notification
            this.storeNotification(notification);
            console.log('Real-time notification:', notification);
        } catch (error) {
            console.error('Error handling real-time notification:', error);
        }
    }
    
    /**
     * Send typing notification
     */
    async sendTypingNotification(threadId, isTyping) {
        try {
            if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
                await this.connection.invoke('SendTypingNotification', threadId, isTyping);
            }
        } catch (error) {
            console.error('Error sending typing notification:', error);
        }
    }
    
    /**
     * Join thread for real-time updates
     */
    async joinThread(threadId) {
        try {
            if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
                await this.connection.invoke('JoinThread', threadId);
            }
        } catch (error) {
            console.error('Error joining thread:', error);
        }
    }
    
    /**
     * Leave thread
     */
    async leaveThread(threadId) {
        try {
            if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
                await this.connection.invoke('LeaveThread', threadId);
            }
        } catch (error) {
            console.error('Error leaving thread:', error);
        }
    }
    
    /**
     * Trigger typing update event
     */
    triggerTypingUpdate(data) {
        window.dispatchEvent(new CustomEvent('shikola:typing-update', {
            detail: data
        }));
    }
    
    /**
     * Store notification locally
     */
    storeNotification(notification) {
        try {
            const key = 'shikola_notifications_v1';
            let notifications = [];
            
            try {
                const stored = localStorage.getItem(key);
                if (stored) {
                    notifications = JSON.parse(stored) || [];
                }
            } catch (e) {
                notifications = [];
            }
            
            notifications.unshift({
                ...notification,
                id: `rt_${Date.now()}`,
                timestamp: new Date().toISOString(),
                read: false
            });
            
            if (notifications.length > 100) {
                notifications = notifications.slice(0, 100);
            }
            
            localStorage.setItem(key, JSON.stringify(notifications));
        } catch (error) {
            console.error('Error storing notification:', error);
        }
    }

    /**
     * Get threads with filtering and search
     */
    async getThreads(role = '', query = '') {
        try {
            const response = await fetch(`${this.apiBase}/threads?role=${encodeURIComponent(role)}&query=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            
            if (result.success) {
                // Cache threads for offline access
                this.cacheThreads(result.data);
                return result.data;
            } else {
                throw new Error(result.error || 'Failed to get threads');
            }
        } catch (error) {
            console.error('Error getting threads:', error);
            this.showToast('Failed to load conversations', 'error');
            return [];
        }
    }

    /**
     * Get messages for a specific thread
     */
    async getMessages(threadId) {
        try {
            const response = await fetch(`${this.apiBase}/threads/${threadId}/messages`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            
            if (result.success) {
                // Cache messages for offline access
                this.cacheMessages(threadId, result.data);
                
                // Mark messages as read
                result.data.forEach(msg => {
                    if (!msg.isMine && msg.status === 'sent') {
                        this.markMessageAsRead(msg.id);
                    }
                });
                
                return result.data;
            } else {
                throw new Error(result.error || 'Failed to get messages');
            }
        } catch (error) {
            console.error('Error getting messages:', error);
            this.showToast('Failed to load messages', 'error');
            return [];
        }
    }

    /**
     * Send a new message
     */
    async sendMessage(messageData) {
        try {
            // Add to pending messages for auto-save
            const tempId = `temp_${Date.now()}`;
            const messageWithId = {
                ...messageData,
                id: tempId,
                status: 'sending',
                createdAt: new Date().toISOString(),
                isMine: true
            };
            
            this.pendingMessages.push(messageWithId);
            
            const response = await fetch(`${this.apiBase}/send`, {
                method: 'POST',
                headers: {
                    ...this.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    toUserId: messageData.toUserId,
                    toUserRole: messageData.toUserRole,
                    body: messageData.body,
                    threadId: messageData.threadId,
                    attachments: messageData.attachments || []
                })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            
            if (result.success) {
                // Remove from pending and update with real data
                this.pendingMessages = this.pendingMessages.filter(m => m.id !== tempId);
                
                const realMessage = {
                    ...result.data,
                    status: 'sent',
                    isMine: true
                };
                
                // Cache the message
                this.cacheMessage(realMessage);
                
                // Store in both users' local storage
                this.storeMessageInLocalStorage(realMessage);
                
                // Trigger real-time update
                this.triggerMessageUpdate(realMessage);
                
                this.showToast('Message sent successfully', 'success');
                return realMessage;
            } else {
                throw new Error(result.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showToast('Failed to send message', 'error');
            
            // Keep in pending for retry
            return messageData;
        }
    }

    /**
     * Upload file with size validation
     */
    async uploadFile(file) {
        try {
            // Check file size limit (10MB)
            const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
            if (file.size > maxFileSize) {
                this.showToast(`File size exceeds 10MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`, 'error', 5000);
                throw new Error('File size exceeds 10MB limit');
            }
            
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`${this.apiBase}/upload`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: formData
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('File uploaded successfully', 'success');
                return result.data;
            } else {
                throw new Error(result.error || 'Failed to upload file');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            this.showToast('Failed to upload file', 'error');
            throw error;
        }
    }

    /**
     * Mark message as read
     */
    async markMessageAsRead(messageId) {
        try {
            await fetch(`${this.apiBase}/threads/${this.getActiveThreadId()}/messages/${messageId}/read`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });
            
            // Update local cache
            this.updateMessageStatus(messageId, 'read');
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    }

    /**
     * Delete message
     */
    async deleteMessage(messageId) {
        try {
            const response = await fetch(`${this.apiBase}/messages/${messageId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                // Remove from cache
                this.removeMessageFromCache(messageId);
                this.showToast('Message deleted', 'success');
            } else {
                throw new Error('Failed to delete message');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            this.showToast('Failed to delete message', 'error');
        }
    }

    /**
     * Delete thread
     */
    async deleteThread(threadId) {
        try {
            const response = await fetch(`${this.apiBase}/threads/${threadId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                // Remove from cache
                this.removeThreadFromCache(threadId);
                this.showToast('Conversation deleted', 'success');
            } else {
                throw new Error('Failed to delete conversation');
            }
        } catch (error) {
            console.error('Error deleting thread:', error);
            this.showToast('Failed to delete conversation', 'error');
        }
    }

    /**
     * Sync messages with server
     */
    async syncMessages() {
        if (this.syncInProgress || !this.isOnline) return;
        
        try {
            this.syncInProgress = true;
            
            const response = await fetch(`${this.apiBase}/sync`, {
                method: 'POST',
                headers: {
                    ...this.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lastSyncTime: this.lastSyncTime,
                    threadIds: this.getCachedThreadIds()
                })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            
            if (result.success) {
                const syncData = result.data;
                
                // Update cache with new data
                this.updateCacheWithSyncData(syncData);
                
                // Update last sync time
                this.lastSyncTime = syncData.lastSyncTime;
                
                // Trigger UI updates
                this.triggerSyncUpdate(syncData);
                
                console.log('Sync completed:', syncData);
            } else {
                throw new Error(result.error || 'Sync failed');
            }
        } catch (error) {
            console.error('Error syncing messages:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Start background sync
     */
    startBackgroundSync() {
        setInterval(() => {
            if (this.isOnline && !this.syncInProgress) {
                this.syncMessages();
            }
        }, this.syncInterval);
    }

    /**
     * Start auto-save for drafts
     */
    startAutoSave() {
        setInterval(() => {
            this.autoSaveDrafts();
        }, this.autoSaveInterval);
    }

    /**
     * Auto-save drafts to local storage
     */
    autoSaveDrafts() {
        if (this.autoSaveInProgress) return;
        
        try {
            this.autoSaveInProgress = true;
            
            // Get current draft from active input
            const draftInputs = document.querySelectorAll('[data-draft="true"]');
            const drafts = {};
            
            draftInputs.forEach(input => {
                const threadId = input.dataset.threadId || 'global';
                const value = input.value.trim();
                
                if (value) {
                    drafts[threadId] = {
                        content: value,
                        timestamp: new Date().toISOString(),
                        threadId: threadId
                    };
                }
            });
            
            // Save to local storage
            if (Object.keys(drafts).length > 0) {
                localStorage.setItem('shikola_message_drafts', JSON.stringify(drafts));
                console.log('Drafts auto-saved:', drafts);
            }
        } catch (error) {
            console.error('Error auto-saving drafts:', error);
        } finally {
            this.autoSaveInProgress = false;
        }
    }

    /**
     * Load cached messages from local storage
     */
    async loadCachedMessages() {
        try {
            const cachedThreads = localStorage.getItem('shikola_cached_threads');
            const cachedMessages = localStorage.getItem('shikola_cached_messages');
            
            if (cachedThreads) {
                const threads = JSON.parse(cachedThreads);
                this.triggerThreadsUpdate(threads);
            }
            
            if (cachedMessages) {
                const messages = JSON.parse(cachedMessages);
                Object.keys(messages).forEach(threadId => {
                    this.triggerMessagesUpdate(threadId, messages[threadId]);
                });
            }
        } catch (error) {
            console.error('Error loading cached messages:', error);
        }
    }

    /**
     * Cache threads for offline access
     */
    cacheThreads(threads) {
        try {
            localStorage.setItem('shikola_cached_threads', JSON.stringify(threads));
        } catch (error) {
            console.error('Error caching threads:', error);
        }
    }

    /**
     * Cache messages for offline access
     */
    cacheMessages(threadId, messages) {
        try {
            const cached = JSON.parse(localStorage.getItem('shikola_cached_messages') || '{}');
            cached[threadId] = messages;
            localStorage.setItem('shikola_cached_messages', JSON.stringify(cached));
        } catch (error) {
            console.error('Error caching messages:', error);
        }
    }

    /**
     * Cache single message
     */
    cacheMessage(message) {
        try {
            const cached = JSON.parse(localStorage.getItem('shikola_cached_messages') || '{}');
            const threadId = message.threadId;
            
            if (!cached[threadId]) {
                cached[threadId] = [];
            }
            
            cached[threadId].push(message);
            localStorage.setItem('shikola_cached_messages', JSON.stringify(cached));
        } catch (error) {
            console.error('Error caching message:', error);
        }
    }

    /**
     * Store message in both users' local storage for cross-portal access
     */
    storeMessageInLocalStorage(message) {
        try {
            const storageKey = `shikola_messages_${new Date().toISOString().split('T')[0]}`;
            let existingMessages = [];
            
            try {
                existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
            } catch (e) {
                existingMessages = [];
            }
            
            existingMessages.push(message);
            localStorage.setItem(storageKey, JSON.stringify(existingMessages));
            
            // Also store in shared storage for cross-portal access
            const sharedKey = 'shikola_messages_shared';
            let sharedMessages = [];
            
            try {
                sharedMessages = JSON.parse(localStorage.getItem(sharedKey) || '[]');
            } catch (e) {
                sharedMessages = [];
            }
            
            sharedMessages.push(message);
            localStorage.setItem(sharedKey, JSON.stringify(sharedMessages));
            
        } catch (error) {
            console.error('Error storing message in local storage:', error);
        }
    }

    /**
     * Setup cross-portal message sharing
     */
    setupCrossPortalSharing() {
        // Listen for storage events from other tabs/portals
        window.addEventListener('storage', (e) => {
            if (e.key === 'shikola_messages_shared') {
                try {
                    const newMessages = JSON.parse(e.newValue || '[]');
                    newMessages.forEach(message => {
                        this.triggerCrossPortalMessage(message);
                    });
                } catch (error) {
                    console.error('Error handling cross-portal message:', error);
                }
            }
        });
        
        // Set up custom event for intra-page communication
        window.addEventListener('shikola:new-message', (e) => {
            this.handleCrossPortalMessage(e.detail);
        });
    }

    /**
     * Trigger cross-portal message event
     */
    triggerCrossPortalMessage(message) {
        window.dispatchEvent(new CustomEvent('shikola:new-message', {
            detail: message
        }));
    }

    /**
     * Handle cross-portal message
     */
    handleCrossPortalMessage(message) {
        // Show toast notification for message from other portal
        this.showToast(`New message from ${message.senderName || 'another portal'}`, 'info');
        
        // Update UI if we're on messaging page
        if (window.location.pathname.includes('messaging.html')) {
            this.triggerMessageUpdate(message);
        }
    }

    /**
     * Get authentication headers
     */
    getAuthHeaders() {
        const token = localStorage.getItem('shikola_token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        // Create or update toast container
        let toastContainer = document.getElementById('shikola-toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'shikola-toast-container';
            toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(toastContainer);
        }
        
        const toast = document.createElement('div');
        toast.className = `p-4 rounded-lg shadow-lg text-white max-w-sm transform transition-all duration-300 translate-x-full ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
        }`;
        
        toast.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    ${type === 'success' ? '<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-8 8 0zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.293 7.293a1 1 0 001.414 1.414l2 2a1 1 0 001.414 0z" clip-rule="evenodd"/></svg>' :
                  type === 'error' ? '<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-8 8 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 00-1.414 0z" clip-rule="evenodd"/></svg>' :
                  '<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0zm-7 4a1 1 0 11-2 0 1 1 0 01-2 0zm-1-4a1 1 0 00-1 1v3a1 1 0 002 0v-3a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>'}
                </div>
                <div class="ml-3 text-sm font-medium">${message}</div>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after duration
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    /**
     * Trigger threads update event
     */
    triggerThreadsUpdate(threads) {
        window.dispatchEvent(new CustomEvent('shikola:threads-updated', {
            detail: threads
        }));
    }

    /**
     * Trigger messages update event
     */
    triggerMessagesUpdate(threadId, messages) {
        window.dispatchEvent(new CustomEvent('shikola:messages-updated', {
            detail: { threadId, messages }
        }));
    }

    /**
     * Trigger message update event
     */
    triggerMessageUpdate(message) {
        window.dispatchEvent(new CustomEvent('shikola:message-updated', {
            detail: message
        }));
    }

    /**
     * Trigger sync update event
     */
    triggerSyncUpdate(syncData) {
        window.dispatchEvent(new CustomEvent('shikola:sync-completed', {
            detail: syncData
        }));
    }

    /**
     * Get active thread ID from UI
     */
    getActiveThreadId() {
        const activeThread = document.querySelector('[data-active-thread="true"]');
        return activeThread ? activeThread.dataset.threadId : null;
    }

    /**
     * Get cached thread IDs
     */
    getCachedThreadIds() {
        const cached = localStorage.getItem('shikola_cached_threads');
        if (cached) {
            const threads = JSON.parse(cached);
            return threads.map(t => t.id);
        }
        return [];
    }

    /**
     * Update message status in cache
     */
    updateMessageStatus(messageId, status) {
        try {
            const cached = JSON.parse(localStorage.getItem('shikola_cached_messages') || '{}');
            Object.keys(cached).forEach(threadId => {
                const thread = cached[threadId];
                if (thread) {
                    const message = thread.find(m => m.id === messageId);
                    if (message) {
                        message.status = status;
                        if (status === 'read') {
                            message.readAt = new Date().toISOString();
                        }
                    }
                }
            });
            localStorage.setItem('shikola_cached_messages', JSON.stringify(cached));
        } catch (error) {
            console.error('Error updating message status:', error);
        }
    }

    /**
     * Remove message from cache
     */
    removeMessageFromCache(messageId) {
        try {
            const cached = JSON.parse(localStorage.getItem('shikola_cached_messages') || '{}');
            Object.keys(cached).forEach(threadId => {
                if (cached[threadId]) {
                    cached[threadId] = cached[threadId].filter(m => m.id !== messageId);
                }
            });
            localStorage.setItem('shikola_cached_messages', JSON.stringify(cached));
        } catch (error) {
            console.error('Error removing message from cache:', error);
        }
    }

    /**
     * Remove thread from cache
     */
    removeThreadFromCache(threadId) {
        try {
            const cached = JSON.parse(localStorage.getItem('shikola_cached_threads') || '[]');
            const updated = cached.filter(t => t.id !== threadId);
            localStorage.setItem('shikola_cached_threads', JSON.stringify(updated));
            
            // Also remove messages for this thread
            const messagesCache = JSON.parse(localStorage.getItem('shikola_cached_messages') || '{}');
            delete messagesCache[threadId];
            localStorage.setItem('shikola_cached_messages', JSON.stringify(messagesCache));
        } catch (error) {
            console.error('Error removing thread from cache:', error);
        }
    }

    /**
     * Update cache with sync data
     */
    updateCacheWithSyncData(syncData) {
        try {
            // Update threads
            if (syncData.updatedThreads.length > 0) {
                const cachedThreads = JSON.parse(localStorage.getItem('shikola_cached_threads') || '[]');
                const mergedThreads = this.mergeThreads(cachedThreads, syncData.updatedThreads);
                localStorage.setItem('shikola_cached_threads', JSON.stringify(mergedThreads));
            }
            
            // Update messages
            if (syncData.newMessages.length > 0) {
                const cachedMessages = JSON.parse(localStorage.getItem('shikola_cached_messages') || '{}');
                syncData.newMessages.forEach(message => {
                    const threadId = message.threadId;
                    if (!cachedMessages[threadId]) {
                        cachedMessages[threadId] = [];
                    }
                    cachedMessages[threadId].push(message);
                });
                localStorage.setItem('shikola_cached_messages', JSON.stringify(cachedMessages));
            }
        } catch (error) {
            console.error('Error updating cache with sync data:', error);
        }
    }

    /**
     * Merge threads with updated data
     */
    mergeThreads(existing, updated) {
        const merged = [...existing];
        updated.forEach(updatedThread => {
            const existingIndex = merged.findIndex(t => t.id === updatedThread.id);
            if (existingIndex >= 0) {
                merged[existingIndex] = updatedThread;
            } else {
                merged.push(updatedThread);
            }
        });
        return merged;
    }
}

// Initialize the backend integration
window.ShikolaMessagingBackend = new ShikolaMessagingBackend();
