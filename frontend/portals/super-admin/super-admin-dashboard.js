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
 * Super Admin Dashboard JavaScript
 * Handles data loading, Alpine.js initialization, and dashboard interactions
 */

document.addEventListener('alpine:init', () => {
    // Alpine.js data store for dashboard
    Alpine.data('superAdminDashboard', () => ({
        // Loading states
        loading: false,
        dashboardError: null,
        
        // Dashboard data
        kpis: {
            schools: { active: 0, trial: 0, inactive: 0 },
            subscriptions: { total: 0, active: 0, expired: 0, cancelled: 0 },
            revenue: { currentMonth: 0, lastMonth: 0, growth: 0 },
            users: { totalStudents: 0, totalTeachers: 0, totalAdmins: 0 },
            recentActivity: 0
        },
        
        // Plan distribution for charts
        planDistribution: [],
        
        // Subscriptions preview
        subscriptionsPreview: [],
        
        // Activity preview
        activityPreview: [],
        
        // Upcoming events
        upcomingEvents: [],
        
        // Sync status
        syncStatus: null,
        
        // Calendar data
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear(),
        
        // Initialize dashboard
        async init() {
            console.log('Super Admin Dashboard initializing...');
            
            // Clear any cached data to ensure fresh data from API
            if (window.ShikolaOfflineManager) {
                window.ShikolaOfflineManager.clearCache();
            }
            
            await this.loadDashboardData();
            this.updateSyncStatus();
            await this.loadUpcomingEvents();
            
            // Set up real-time data refresh every 30 seconds
            setInterval(() => {
                if (this.syncStatus && this.syncStatus.status === 'online') {
                    this.loadDashboardData();
                }
            }, 30000);
            
            // Update sync status every 10 seconds
            setInterval(() => this.updateSyncStatus(), 10000);
        },
        
        // Load all dashboard data
        async loadDashboardData() {
            console.log('🔄 Loading dashboard data...');
            this.loading = true;
            this.dashboardError = null;
            
            try {
                console.log('📡 Checking API availability...');
                console.log('API Base:', window.SHIKOLA_API_BASE);
                console.log('ShikolaAPI available:', !!window.ShikolaAPI);
                console.log('OfflineManager available:', !!window.ShikolaOfflineManager);
                
                // Load main dashboard data
                console.log('📊 Loading dashboard data from API...');
                const dashboardResponse = await window.ShikolaOfflineManager.getDashboard();
                console.log('📈 Dashboard response:', dashboardResponse);
                
                if (dashboardResponse.success) {
                    this.kpis = dashboardResponse.data;
                    console.log('✅ Dashboard data loaded successfully:', this.kpis);
                } else {
                    throw new Error(dashboardResponse.error || 'Failed to load dashboard data');
                }
                
                // Load analytics for plan distribution
                console.log('📉 Loading analytics data...');
                const analyticsResponse = await window.ShikolaOfflineManager.getAnalytics();
                console.log('📊 Analytics response:', analyticsResponse);
                
                if (analyticsResponse.success) {
                    this.planDistribution = analyticsResponse.data.planDistribution || [];
                    console.log('✅ Plan distribution loaded:', this.planDistribution);
                } else {
                    console.warn('⚠️ Failed to load analytics:', analyticsResponse.error);
                }
                
                // Load subscriptions preview
                console.log('💳 Loading subscriptions data...');
                const subscriptionsResponse = await window.ShikolaOfflineManager.getSubscriptions({ limit: 5 });
                console.log('💰 Subscriptions response:', subscriptionsResponse);
                
                if (subscriptionsResponse.success) {
                    this.subscriptionsPreview = subscriptionsResponse.data.slice(0, 5);
                    console.log('✅ Subscriptions preview loaded:', this.subscriptionsPreview);
                } else {
                    console.warn('⚠️ Failed to load subscriptions:', subscriptionsResponse.error);
                }
                
                // Load activity preview
                console.log('📋 Loading activity log...');
                const activityResponse = await window.ShikolaOfflineManager.getActivityLog({ limit: 5 });
                console.log('📝 Activity response:', activityResponse);
                
                if (activityResponse.success) {
                    this.activityPreview = activityResponse.data.data.slice(0, 5);
                    console.log('✅ Activity preview loaded:', this.activityPreview);
                } else {
                    console.warn('⚠️ Failed to load activity log:', activityResponse.error);
                }
                
                console.log('🎉 All dashboard data loaded successfully!');
                
            } catch (error) {
                console.error('❌ Error loading dashboard data:', error);
                this.dashboardError = 'Failed to load dashboard data: ' + error.message;
            } finally {
                this.loading = false;
                console.log('🏁 Dashboard loading completed');
            }
        },
        
        // Update sync status
        updateSyncStatus() {
            if (window.ShikolaOfflineManager) {
                this.syncStatus = window.ShikolaOfflineManager.getSyncStatus();
            }
        },
        
        // Load upcoming events from API
        async loadUpcomingEvents() {
            try {
                // For now, keep this empty - events will be loaded from a real endpoint later
                this.upcomingEvents = [];
            } catch (error) {
                console.warn('Failed to load upcoming events:', error);
                this.upcomingEvents = [];
            }
        },
        
        // Calendar functions
        getCalendarLabel() {
            const months = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
            return `${months[this.currentMonth]} ${this.currentYear}`;
        },
        
        calendarDays() {
            const firstDay = new Date(this.currentYear, this.currentMonth, 1);
            const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDayOfWeek = firstDay.getDay();
            
            const days = [];
            const today = new Date();
            
            // Add empty cells for days before month starts
            for (let i = 0; i < startingDayOfWeek; i++) {
                days.push({ label: '', muted: true, today: false });
            }
            
            // Add days of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const isToday = today.getDate() === day && 
                               today.getMonth() === this.currentMonth && 
                               today.getFullYear() === this.currentYear;
                
                days.push({
                    label: day.toString(),
                    muted: false,
                    today: isToday
                });
            }
            
            return days;
        },
        
        prevMonth() {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
        },
        
        nextMonth() {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
        },
        
        // Chart functions
        getPlanPercent(count) {
            if (!this.planDistribution.length) return 0;
            const maxCount = Math.max(...this.planDistribution.map(p => p.count));
            return maxCount > 0 ? (count / maxCount) * 100 : 0;
        },
        
        // Event type functions
        getEventTypeColor(type) {
            const colors = {
                maintenance: 'bg-amber-100 text-amber-600',
                trial_expiry: 'bg-orange-100 text-orange-600',
                upgrade: 'bg-emerald-100 text-emerald-600',
                system_update: 'bg-sky-100 text-sky-600'
            };
            return colors[type] || 'bg-slate-100 text-slate-600';
        },
        
        getEventTypeIcon(type) {
            const icons = {
                maintenance: 'fas fa-tools',
                trial_expiry: 'fas fa-clock',
                upgrade: 'fas fa-arrow-up',
                system_update: 'fas fa-sync'
            };
            return icons[type] || 'fas fa-calendar';
        },
        
        // Activity functions
        isSubscriptionUpgradeEntry(entry) {
            return entry.actionType === 'UPGRADE' && entry.entityType === 'Subscription';
        },
        
        openActivityEntry(entry) {
            if (!this.isSubscriptionUpgradeEntry(entry)) return;
            
            // In a real implementation, this would open a modal or navigate to details
            console.log('Opening subscription upgrade entry:', entry);
        },
        
        // Formatting functions
        formatCurrency(amount) {
            if (!amount) return 'ZMW 0';
            return new Intl.NumberFormat('en-ZM', {
                style: 'currency',
                currency: 'ZMW',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        },
        
        formatDateShort(dateString) {
            if (!dateString) return '—';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
        },
        
        formatDateTime(dateString) {
            if (!dateString) return '—';
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        formatEventDate(date) {
            if (!date) return '—';
            const now = new Date();
            const eventDate = new Date(date);
            const diffTime = eventDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Tomorrow';
            if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
            
            return this.formatDateShort(date);
        },
        
        // Refresh dashboard
        async refresh() {
            console.log('Manually refreshing dashboard...');
            this.dashboardError = null;
            await this.loadDashboardData();
            this.updateSyncStatus();
        },
        
        // Auto-refresh when coming back online
        async handleReconnection() {
            console.log('Connection restored, refreshing data...');
            this.syncStatus = {
                status: 'recovering',
                message: 'Connection restored, syncing data...',
                icon: 'fas fa-sync fa-spin'
            };
            
            await this.refresh();
            
            this.syncStatus = {
                status: 'online',
                message: 'Real-time data',
                icon: 'fas fa-circle text-emerald-500'
            };
        }
    }));
});

// Initialize Alpine.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('Super Admin Dashboard DOM loaded');
    
    // Set up Alpine.js
    if (window.Alpine) {
        window.Alpine.start();
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Dashboard error:', event.error);
});

// Handle online/offline events
window.addEventListener('online', async () => {
    console.log('Connection restored - refreshing dashboard');
    // Trigger dashboard refresh if Alpine is available
    if (window.Alpine && window.Alpine.$store) {
        const dashboard = window.Alpine.$store.superAdminDashboard;
        if (dashboard) {
            await dashboard.handleReconnection();
        }
    }
});

window.addEventListener('offline', () => {
    console.log('Connection lost - entering offline mode');
    // Update sync status if Alpine is available
    if (window.Alpine && window.Alpine.$store) {
        const dashboard = window.Alpine.$store.superAdminDashboard;
        if (dashboard) {
            dashboard.syncStatus = {
                status: 'offline',
                message: 'Connection lost - retrying...',
                icon: 'fas fa-wifi-slash text-slate-400'
            };
        }
    }
});
