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
// Accountant Dashboard Real-time API Integration
class AccountantDashboardAPI {
    constructor() {
        this.baseURL = '/api/accountantdashboard';
        this.cache = new Map();
        this.refreshInterval = 30000; // 30 seconds
        this.signalRConnection = null;
        this.isRealTimeEnabled = true;
        this.lastUpdate = null;
        this.subscribers = new Map();
    }

    // Initialize the API connection
    async initialize() {
        try {
            // Initialize SignalR connection
            await this.initializeSignalR();
            
            // Load initial data
            await this.loadInitialData();
            
            // Set up periodic refresh
            this.setupPeriodicRefresh();
            
            console.log('[AccountantDashboardAPI] Initialized successfully');
        } catch (error) {
            console.error('[AccountantDashboardAPI] Initialization failed:', error);
        }
    }

    // Initialize SignalR connection for real-time updates
    async initializeSignalR() {
        try {
            // Check if SignalR is available
            if (typeof signalR === 'undefined') {
                console.warn('[AccountantDashboardAPI] SignalR not available, falling back to polling');
                return;
            }

            const connection = new signalR.HubConnectionBuilder()
                .withUrl('/hubs/accountantdashboard', {
                    accessTokenFactory: () => this.getAuthToken(),
                    skipNegotiation: true,
                    transport: signalR.HttpTransportType.WebSockets
                })
                .withAutomaticReconnect({
                    nextRetryDelayInMilliseconds: retryContext => {
                        // Exponential backoff with jitter
                        const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
                        return delay + Math.random() * 1000;
                    }
                })
                .configureLogging(signalR.LogLevel.Warning) // Reduce log noise
                .build();

            // Set up event handlers
            connection.onreconnected(() => {
                console.log('[AccountantDashboardAPI] SignalR reconnected');
                this.notifySubscribers('connection', { status: 'connected' });
            });

            connection.onreconnecting(() => {
                console.log('[AccountantDashboardAPI] SignalR reconnecting...');
                this.notifySubscribers('connection', { status: 'reconnecting' });
            });

            connection.onclose(() => {
                console.log('[AccountantDashboardAPI] SignalR connection closed');
                this.notifySubscribers('connection', { status: 'disconnected' });
            });

            // Set up dashboard event handlers
            connection.on('FinancialDataUpdated', (data) => {
                console.log('[AccountantDashboardAPI] Financial data updated:', data);
                this.handleFinancialUpdate(data);
            });

            connection.on('TransactionDataUpdated', (data) => {
                console.log('[AccountantDashboardAPI] Transaction data updated:', data);
                this.handleTransactionUpdate(data);
            });

            connection.on('NewNotification', (data) => {
                console.log('[AccountantDashboardAPI] New notification:', data);
                this.handleNewNotification(data);
            });

            connection.on('DashboardRefreshRequested', (data) => {
                console.log('[AccountantDashboardAPI] Dashboard refresh requested:', data);
                this.refreshDashboard();
            });

            connection.on('SystemAlert', (data) => {
                console.log('[AccountantDashboardAPI] System alert:', data);
                this.handleSystemAlert(data);
            });

            connection.on('InitialDataLoaded', (data) => {
                console.log('[AccountantDashboardAPI] Initial data loaded:', data);
                this.notifySubscribers('initialData', data);
            });

            // Start the connection with timeout
            try {
                await connection.start();
                this.signalRConnection = connection;
                console.log('[AccountantDashboardAPI] SignalR connection established');
            } catch (err) {
                console.warn('[AccountantDashboardAPI] SignalR connection failed, using polling fallback:', err);
                // Don't throw error, allow fallback to polling
            }
        } catch (error) {
            console.warn('[AccountantDashboardAPI] SignalR initialization failed:', error);
            // Don't throw error, allow fallback to polling
        }
    }

    // Load initial dashboard data
    async loadInitialData() {
        try {
            const dashboardData = await this.getDashboard();
            this.notifySubscribers('dashboard', dashboardData);
            
            const financialOverview = await this.getFinancialOverview();
            this.notifySubscribers('financialOverview', financialOverview);
            
            const recentTransactions = await this.getRecentTransactions();
            this.notifySubscribers('transactions', recentTransactions);
            
            const chartData = await this.getChartData();
            this.notifySubscribers('chart', chartData);
            
            const notifications = await this.getNotifications();
            this.notifySubscribers('notifications', notifications);
            
            this.lastUpdate = new Date();
        } catch (error) {
            console.error('[AccountantDashboardAPI] Failed to load initial data:', error);
            throw error;
        }
    }

    // Get dashboard data
    async getDashboard(useRealTime = true) {
        try {
            const url = useRealTime ? `${this.baseURL}/dashboard/realtime` : `${this.baseURL}/dashboard`;
            const response = await fetch(url, {
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.lastUpdate = new Date();
            
            // Cache the data
            this.cache.set('dashboard', data);
            
            return data;
        } catch (error) {
            console.error('[AccountantDashboardAPI] Failed to get dashboard data:', error);
            
            // Return cached data if available
            const cachedData = this.cache.get('dashboard');
            if (cachedData) {
                console.warn('[AccountantDashboardAPI] Using cached dashboard data');
                return cachedData;
            }
            
            throw error;
        }
    }

    // Get financial overview
    async getFinancialOverview() {
        try {
            const response = await fetch(`${this.baseURL}/financial-overview`, {
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.cache.set('financialOverview', data);
            
            return data;
        } catch (error) {
            console.error('[AccountantDashboardAPI] Failed to get financial overview:', error);
            
            const cachedData = this.cache.get('financialOverview');
            if (cachedData) {
                return cachedData;
            }
            
            throw error;
        }
    }

    // Get recent transactions
    async getRecentTransactions(limit = 10) {
        try {
            const response = await fetch(`${this.baseURL}/transactions/recent?limit=${limit}`, {
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.cache.set('transactions', data);
            
            return data;
        } catch (error) {
            console.error('[AccountantDashboardAPI] Failed to get recent transactions:', error);
            
            const cachedData = this.cache.get('transactions');
            if (cachedData) {
                return cachedData;
            }
            
            throw error;
        }
    }

    // Get chart data
    async getChartData(months = 6) {
        try {
            const response = await fetch(`${this.baseURL}/charts/revenue-expense?months=${months}`, {
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.cache.set('chartData', data);
            
            return data;
        } catch (error) {
            console.error('[AccountantDashboardAPI] Failed to get chart data:', error);
            
            const cachedData = this.cache.get('chartData');
            if (cachedData) {
                return cachedData;
            }
            
            throw error;
        }
    }

    // Get notifications
    async getNotifications() {
        try {
            const response = await fetch(`${this.baseURL}/notifications`, {
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.cache.set('notifications', data);
            
            return data;
        } catch (error) {
            console.error('[AccountantDashboardAPI] Failed to get notifications:', error);
            
            const cachedData = this.cache.get('notifications');
            if (cachedData) {
                return cachedData;
            }
            
            throw error;
        }
    }

    // Refresh dashboard data
    async refreshDashboard() {
        try {
            const response = await fetch(`${this.baseURL}/refresh`, {
                method: 'POST',
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Update cache
            this.cache.set('dashboard', { success: true, data: data.data });
            
            // Notify subscribers
            this.notifySubscribers('dashboard', { success: true, data: data.data });
            
            console.log('[AccountantDashboardAPI] Dashboard refreshed successfully');
            return data;
        } catch (error) {
            console.error('[AccountantDashboardAPI] Failed to refresh dashboard:', error);
            throw error;
        }
    }

    // Add quick income
    async addQuickIncome(incomeData) {
        try {
            const response = await fetch(`${this.baseURL}/quick-income`, {
                method: 'POST',
                headers: {
                    ...this.getHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(incomeData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Clear relevant cache
            this.cache.delete('dashboard');
            this.cache.delete('transactions');
            
            // Notify subscribers
            this.notifySubscribers('transactionAdded', data);
            
            return data;
        } catch (error) {
            console.error('[AccountantDashboardAPI] Failed to add quick income:', error);
            throw error;
        }
    }

    // Add quick expense
    async addQuickExpense(expenseData) {
        try {
            const response = await fetch(`${this.baseURL}/quick-expense`, {
                method: 'POST',
                headers: {
                    ...this.getHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(expenseData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Clear relevant cache
            this.cache.delete('dashboard');
            this.cache.delete('transactions');
            
            // Notify subscribers
            this.notifySubscribers('transactionAdded', data);
            
            return data;
        } catch (error) {
            console.error('[AccountantDashboardAPI] Failed to add quick expense:', error);
            throw error;
        }
    }

    // Handle real-time updates
    handleFinancialUpdate(data) {
        // Clear cached financial data
        this.cache.delete('dashboard');
        this.cache.delete('financialOverview');
        
        // Refresh financial data
        this.getFinancialOverview().then(financialData => {
            this.notifySubscribers('financialUpdate', financialData);
        });
        
        this.notifySubscribers('financialUpdate', data);
    }

    handleTransactionUpdate(data) {
        // Clear cached transaction data
        this.cache.delete('dashboard');
        this.cache.delete('transactions');
        
        // Refresh transaction data
        this.getRecentTransactions().then(transactionData => {
            this.notifySubscribers('transactionUpdate', transactionData);
        });
        
        this.notifySubscribers('transactionUpdate', data);
    }

    handleNewNotification(data) {
        // Clear cached notification data
        this.cache.delete('notifications');
        
        // Refresh notification data
        this.getNotifications().then(notificationData => {
            this.notifySubscribers('notificationUpdate', notificationData);
        });
        
        this.notifySubscribers('notificationUpdate', data);
    }

    handleSystemAlert(data) {
        this.notifySubscribers('systemAlert', data);
    }

    // Setup periodic refresh
    setupPeriodicRefresh() {
        if (this.refreshInterval > 0) {
            setInterval(async () => {
                try {
                    // Only use polling if SignalR is not connected
                    if (!this.signalRConnection || this.signalRConnection.state !== signalR.HubConnectionState.Connected) {
                        console.log('[AccountantDashboardAPI] Performing periodic refresh');
                        await this.refreshDashboard();
                    }
                } catch (error) {
                    console.error('[AccountantDashboardAPI] Periodic refresh failed:', error);
                }
            }, this.refreshInterval);
        }
    }

    // Subscribe to data updates
    subscribe(eventType, callback) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, new Set());
        }
        this.subscribers.get(eventType).add(callback);
    }

    // Unsubscribe from data updates
    unsubscribe(eventType, callback) {
        if (this.subscribers.has(eventType)) {
            this.subscribers.get(eventType).delete(callback);
        }
    }

    // Notify subscribers of data updates
    notifySubscribers(eventType, data) {
        if (this.subscribers.has(eventType)) {
            this.subscribers.get(eventType).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[AccountantDashboardAPI] Error in subscriber callback for ${eventType}:`, error);
                }
            });
        }
    }

    // Get authentication token
    getAuthToken() {
        // This should get the JWT token from wherever it's stored
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
    }

    // Get request headers
    getHeaders() {
        const token = this.getAuthToken();
        const headers = {
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    // Check if API is available
    isAvailable() {
        if (!this.signalRConnection) {
            return false;
        }
        
        // Check if signalR is available
        if (typeof signalR === 'undefined') {
            return false;
        }
        
        return this.signalRConnection.state === signalR.HubConnectionState.Connected;
    }

    // Get connection status
    getConnectionStatus() {
        if (!this.signalRConnection) {
            return 'disconnected';
        }
        
        // Check if signalR is available
        if (typeof signalR === 'undefined') {
            return 'unknown';
        }
        
        switch (this.signalRConnection.state) {
            case signalR.HubConnectionState.Connected:
                return 'connected';
            case signalR.HubConnectionState.Connecting:
                return 'connecting';
            case signalR.HubConnectionState.Reconnecting:
                return 'reconnecting';
            case signalR.HubConnectionState.Disconnected:
                return 'disconnected';
            default:
                return 'unknown';
        }
    }

    // Disconnect from the API
    async disconnect() {
        try {
            if (this.signalRConnection) {
                await this.signalRConnection.stop();
                this.signalRConnection = null;
            }
            
            this.cache.clear();
            this.subscribers.clear();
            
            console.log('[AccountantDashboardAPI] Disconnected successfully');
        } catch (error) {
            console.error('[AccountantDashboardAPI] Error during disconnection:', error);
        }
    }
}

// Global instance
window.AccountantDashboardAPI = new AccountantDashboardAPI();
