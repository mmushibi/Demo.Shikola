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
(function() {
    'use strict';

    // Audit Trail Management System
    const AuditTrail = {
        // Configuration
        config: {
            apiEndpoint: '/api/accountant/audit-trail',
            refreshInterval: 30000, // 30 seconds
            maxRecords: 100
        },

        // State
        state: {
            activities: [],
            isLoading: false,
            lastRefresh: null,
            filters: {
                entityType: null,
                actionType: null,
                userEmail: null,
                startDate: null,
                endDate: null
            }
        },

        // Initialize audit trail
        init: function() {
            this.bindEvents();
            this.loadAuditData();
            this.startAutoRefresh();
            console.log('Audit Trail initialized');
        },

        // Bind DOM events
        bindEvents: function() {
            // Search functionality
            const searchInput = document.querySelector('input[placeholder="Search audit logs..."]');
            if (searchInput) {
                searchInput.addEventListener('input', this.debounce((e) => {
                    this.handleSearch(e.target.value);
                }, 300));
            }

            // Filter dropdowns
            const filterSelects = document.querySelectorAll('select');
            filterSelects.forEach(select => {
                select.addEventListener('change', (e) => {
                    this.handleFilterChange(e.target);
                });
            });

            // Export buttons
            const exportButtons = document.querySelectorAll('button');
            exportButtons.forEach(button => {
                if (button.textContent.includes('Export') || button.textContent.includes('Generate Report')) {
                    button.addEventListener('click', () => {
                        this.handleExport();
                    });
                }
            });

            // Refresh button
            const refreshButton = document.querySelector('button:has(.fa-sync)');
            if (refreshButton) {
                refreshButton.addEventListener('click', () => {
                    this.loadAuditData();
                });
            }
        },

        // Load audit data from API
        loadAuditData: async function() {
            if (this.state.isLoading) return;

            this.state.isLoading = true;
            this.updateLoadingState(true);

            try {
                const params = new URLSearchParams();
                
                // Add filters
                Object.keys(this.state.filters).forEach(key => {
                    if (this.state.filters[key]) {
                        params.append(key, this.state.filters[key]);
                    }
                });

                const response = await fetch(`${this.config.apiEndpoint}?${params.toString()}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getAuthToken()}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                if (data.success) {
                    this.state.activities = data.data || [];
                    this.state.lastRefresh = new Date();
                    this.updateUI();
                    this.updateSummaryCards();
                } else {
                    throw new Error(data.error || 'Failed to load audit data');
                }
            } catch (error) {
                console.error('Error loading audit data:', error);
                this.showError('Failed to load audit data. Please check your connection and try again.');
            } finally {
                this.state.isLoading = false;
                this.updateLoadingState(false);
            }
        },

        // Update UI with loaded data
        updateUI: function() {
            this.updateActivityChart();
            this.updateAuditLogs();
            this.updateSystemActivity();
            this.updateComplianceStatus();
        },

        // Update summary cards
        updateSummaryCards: function() {
            const activities = this.state.activities;
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            const summary = {
                total: activities.length,
                today: activities.filter(a => new Date(a.timestamp) >= today).length,
                week: activities.filter(a => new Date(a.timestamp) >= weekAgo).length,
                critical: activities.filter(a => a.severity === 'critical').length
            };

            // Update cards
            this.updateCard('total-activities', summary.total, 'activities recorded');
            this.updateCard('today-activities', summary.today, 'activities today');
            this.updateCard('week-activities', summary.week, 'activities this week');
            this.updateCard('critical-events', summary.critical, 'critical events');
        },

        // Update individual card
        updateCard: function(cardId, value, description) {
            const card = document.querySelector(`[data-card="${cardId}"]`);
            const summary = document.querySelector(`[data-summary="${cardId.replace('-', '-count')}"]`);
            
            if (card) {
                card.textContent = typeof value === 'number' ? value.toLocaleString() : value;
            }
            if (summary) {
                const count = value === 1 ? description.replace(/activities|events/, '').trim() : description;
                summary.textContent = value === 0 ? `No ${count}` : `${value} ${count}`;
            }
        },

        // Update activity chart
        updateActivityChart: function() {
            const activities = this.state.activities;
            const typeCounts = {};
            
            activities.forEach(activity => {
                const type = activity.action_type || 'unknown';
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            });

            const total = activities.length || 1;
            
            // Update progress bars
            Object.keys(typeCounts).forEach(type => {
                const percentage = Math.round((typeCounts[type] / total) * 100);
                const progressElement = document.querySelector(`[data-progress="${type}"]`);
                const percentageElement = document.querySelector(`[data-percentage="${type}"]`);
                
                if (progressElement) {
                    progressElement.style.width = `${percentage}%`;
                }
                if (percentageElement) {
                    percentageElement.textContent = `${percentage}%`;
                }
            });
        },

        // Update audit logs table
        updateAuditLogs: function() {
            const container = document.querySelector('.text-center.py-12');
            if (!container) return;

            if (this.state.activities.length === 0) {
                container.innerHTML = `
                    <i class="fas fa-history text-4xl text-slate-300 mb-3"></i>
                    <p class="text-sm text-slate-500">No audit logs found</p>
                    <p class="text-xs text-slate-400 mt-1">System activities will appear here once recorded</p>
                `;
                return;
            }

            // Create table rows
            const tableHTML = this.state.activities.slice(0, 50).map(activity => `
                <div class="px-4 py-3 grid grid-cols-2 md:grid-cols-12 gap-2 items-center border-b border-slate-100">
                    <div class="md:col-span-2 text-slate-500 text-xs">${this.formatDate(activity.timestamp)}</div>
                    <div class="md:col-span-2">
                        <div class="font-medium text-slate-800 text-xs">${activity.user_email || 'System'}</div>
                    </div>
                    <div class="md:col-span-2">
                        <div class="text-xs text-slate-600">${this.formatAction(activity.action_type)}</div>
                    </div>
                    <div class="md:col-span-2">
                        <div class="text-xs text-slate-600">${activity.entity_type || 'N/A'}</div>
                    </div>
                    <div class="md:col-span-2">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.getTypeColor(activity.action_type)}">
                            ${activity.action_type || 'Unknown'}
                        </span>
                    </div>
                    <div class="md:col-span-2">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.getStatusColor(activity.status)}">
                            ${activity.status || 'Success'}
                        </span>
                    </div>
                </div>
            `).join('');

            container.outerHTML = `<div class="divide-y divide-slate-100">${tableHTML}</div>`;
        },

        // Update system activity section
        updateSystemActivity: function() {
            const container = document.querySelector('[x-show="activeTab === \'system-activity\'"] .text-center.py-12');
            if (!container) return;

            const systemActivities = this.state.activities.filter(a => a.entity_type === 'system');
            
            if (systemActivities.length === 0) {
                container.innerHTML = `
                    <i class="fas fa-cogs text-4xl text-slate-300 mb-3"></i>
                    <p class="text-sm text-slate-500">No system activity data available</p>
                    <p class="text-xs text-slate-400 mt-1">System events will be logged here</p>
                `;
            } else {
                container.innerHTML = `
                    <div class="space-y-2">
                        ${systemActivities.slice(0, 10).map(activity => `
                            <div class="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                <div class="text-xs text-slate-600">${activity.description || 'System event'}</div>
                                <div class="text-xs text-slate-400">${this.formatDate(activity.timestamp)}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        },

        // Update compliance status
        updateComplianceStatus: function() {
            // This would typically fetch compliance data from a separate endpoint
            // For now, we'll update based on audit trail completeness
            const hasAuditLogs = this.state.activities.length > 0;
            const hasRecentActivity = this.state.activities.some(a => 
                new Date(a.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            );

            // Update compliance indicators
            const auditLoggingStatus = document.querySelector('.bg-slate-50.rounded-xl.p-4 .flex.items-center.justify-between:nth-child(3) span');
            if (auditLoggingStatus) {
                if (hasAuditLogs) {
                    auditLoggingStatus.className = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800';
                    auditLoggingStatus.textContent = 'Active';
                } else {
                    auditLoggingStatus.className = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800';
                    auditLoggingStatus.textContent = 'Inactive';
                }
            }
        },

        // Handle search
        handleSearch: function(query) {
            if (!query) {
                this.state.filters.userEmail = null;
            } else {
                this.state.filters.userEmail = query;
            }
            this.loadAuditData();
        },

        // Handle filter change
        handleFilterChange: function(select) {
            const filterType = this.getFilterType(select);
            if (filterType) {
                this.state.filters[filterType] = select.value === 'All' || select.value === 'All Types' || select.value === 'All Users' ? null : select.value;
                this.loadAuditData();
            }
        },

        // Get filter type from select element
        getFilterType: function(select) {
            const options = select.options;
            if (options[0]?.text === 'All Types' || options[0]?.text === 'User Actions') return 'actionType';
            if (options[0]?.text === 'All Users') return 'userEmail';
            if (options[0]?.text === 'All Systems') return 'entityType';
            if (options[0]?.text === 'All Standards') return 'compliance';
            return null;
        },

        // Handle export
        handleExport: function() {
            const data = this.state.activities;
            const csv = this.convertToCSV(data);
            this.downloadCSV(csv, 'audit-trail.csv');
        },

        // Convert data to CSV
        convertToCSV: function(data) {
            const headers = ['Timestamp', 'User', 'Action', 'Entity', 'Type', 'Status', 'Description'];
            const rows = data.map(activity => [
                activity.timestamp,
                activity.user_email || 'System',
                this.formatAction(activity.action_type),
                activity.entity_type || 'N/A',
                activity.action_type || 'Unknown',
                activity.status || 'Success',
                activity.description || ''
            ]);

            return [headers, ...rows].map(row => row.join(',')).join('\n');
        },

        // Download CSV
        downloadCSV: function(csv, filename) {
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
        },

        // Update loading state
        updateLoadingState: function(isLoading) {
            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => {
                if (button.textContent.includes('Export') || button.textContent.includes('Refresh')) {
                    button.disabled = isLoading;
                    if (isLoading) {
                        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Loading...';
                    } else {
                        button.innerHTML = button.textContent.includes('Export') ? 
                            '<i class="fas fa-download mr-1"></i> Export' : 
                            '<i class="fas fa-sync mr-1"></i> Refresh';
                    }
                }
            });
        },

        // Show error message
        showError: function(message) {
            // Use existing notification system if available
            if (window.showNotification) {
                window.showNotification(message, 'error');
            } else {
                alert(message);
            }
        },

        // Format date
        formatDate: function(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        },

        // Format action
        formatAction: function(action) {
            if (!action) return 'Unknown';
            return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        },

        // Get type color
        getTypeColor: function(type) {
            const colors = {
                'create': 'bg-blue-100 text-blue-800',
                'update': 'bg-yellow-100 text-yellow-800',
                'delete': 'bg-red-100 text-red-800',
                'login': 'bg-green-100 text-green-800',
                'logout': 'bg-gray-100 text-gray-800'
            };
            return colors[type?.toLowerCase()] || 'bg-gray-100 text-gray-800';
        },

        // Get status color
        getStatusColor: function(status) {
            const colors = {
                'success': 'bg-green-100 text-green-800',
                'failed': 'bg-red-100 text-red-800',
                'pending': 'bg-yellow-100 text-yellow-800',
                'warning': 'bg-orange-100 text-orange-800'
            };
            return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
        },

        // Get auth token
        getAuthToken: function() {
            return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        },

        // Start auto refresh
        startAutoRefresh: function() {
            setInterval(() => {
                this.loadAuditData();
            }, this.config.refreshInterval);
        },

        // Debounce function
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            AuditTrail.init();
        });
    } else {
        AuditTrail.init();
    }

    // Make available globally
    window.AuditTrail = AuditTrail;
})();
