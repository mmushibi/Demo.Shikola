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
// Global User Search API Integration
class GlobalUserSearchAPI {
    constructor() {
        this.baseURL = 'http://localhost:5231'; // Use .NET API port for super admin endpoints
        this.token = null;
        this.init();
    }

    init() {
        this.token = localStorage.getItem('shikola_token') || localStorage.getItem('authToken');
        if (!this.token) {
            console.warn('No authentication token found for global user search');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api/globalsearch${endpoint}`;
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
            console.error('Global user search API error:', error);
            throw error;
        }
    }

    redirectToLogin() {
        window.location.href = '../../public/index.html';
    }

    // Global user search
    async searchUsers(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.search) params.append('search', filters.search);
        if (filters.type) params.append('type', filters.type);
        if (filters.role) params.append('role', filters.role);
        if (filters.limit) params.append('limit', filters.limit);
        if (filters.offset) params.append('offset', filters.offset);
        
        const queryString = params.toString();
        return await this.request(`/global-user-search${queryString ? '?' + queryString : ''}`);
    }

    // Get user details
    async getUserDetails(userId, userType) {
        return await this.request(`/users/${userType}/${userId}`);
    }

    // Get user statistics
    async getUserStatistics() {
        return await this.request('/statistics');
    }

    // Get user activity
    async getUserActivity(userId, userType) {
        return await this.request(`/users/${userType}/${userId}/activity`);
    }

    // Search across schools
    async searchAcrossSchools(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.search) params.append('search', filters.search);
        if (filters.schoolId) params.append('schoolId', filters.schoolId);
        if (filters.userType) params.append('userType', filters.userType);
        if (filters.limit) params.append('limit', filters.limit);
        
        const queryString = params.toString();
        return await this.request(`/cross-school-search${queryString ? '?' + queryString : ''}`);
    }

    // Export search results
    async exportSearchResults(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.search) params.append('search', filters.search);
        if (filters.type) params.append('type', filters.type);
        if (filters.role) params.append('role', filters.role);
        if (filters.format) params.append('format', filters.format);
        if (filters.limit) params.append('limit', filters.limit);
        
        const queryString = params.toString();
        return await this.request(`/export${queryString ? '?' + queryString : ''}`);
    }

    // Get global settings
    async getGlobalSettings() {
        return await this.request('/settings/global');
    }

    // Update security settings
    async updateSecuritySettings(settings) {
        return await this.request('/settings/security', {
            method: 'POST',
            body: JSON.stringify(settings)
        });
    }
}

// Initialize the API
window.globalUserSearchAPI = new GlobalUserSearchAPI();

// Alpine.js component for global user search
function globalUserSearch() {
    return {
        searchResults: [],
        selectedUser: null,
        userDetails: null,
        userActivity: null,
        statistics: null,
        loading: false,
        error: null,
        showAdvancedFilters: false,
        showUserDetails: false,
        searchQuery: '',
        api: window.globalUserSearchAPI,
        filters: {
            search: '',
            type: '',
            role: '',
            status: '',
            schoolId: '',
            limit: 20,
            offset: 0
        },
        availableTypes: ['pupil', 'teacher', 'parent', 'admin', 'operations', 'accountant'],
        availableRoles: ['Super Admin', 'Operations', 'School Admin', 'Head Teacher', 'Deputy Head', 'Teacher', 'Accountant', 'Parent', 'Pupil'],
        pagination: {
            currentPage: 1,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
            totalCount: 0
        },
        showImpersonationPolicyModal: false,
        impersonationPolicy: {
            requireReason: 'true',
            allowedTargets: ['Super Admin', 'Operations', 'School Admin', 'Head Teacher', 'Deputy Head', 'Teacher', 'Accountant']
        },
        savingPolicy: false,
        suggestions: [],
        showSuggestions: false,

        async init() {
            await this.loadStatistics();
            await this.loadCurrentImpersonationPolicy();
            this.setupSearchDebounce();
        },

        setupSearchDebounce() {
            // Debounce search to avoid too many API calls
            let timeout;
            this.$watch('searchQuery', (newValue) => {
                if (newValue.length > 0) {
                    this.showSuggestions = true;
                    this.updateSuggestions(newValue);
                } else {
                    this.showSuggestions = false;
                    this.suggestions = [];
                }
                
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    if (newValue.length >= 2 || newValue.length === 0) {
                        this.performSearch();
                    }
                }, 500);
            });
        },

        updateSuggestions(query) {
            this.suggestions = [];
        },

        selectSuggestion(suggestion) {
            this.searchQuery = suggestion.name;
            this.showSuggestions = false;
            this.performSearch();
        },

        hideSuggestions() {
            setTimeout(() => this.showSuggestions = false, 150); // Delay to allow click
        },

        async performSearch() {
            this.loading = true;
            this.error = null;
            
            try {
                const response = await window.globalUserSearchAPI.searchUsers({
                    ...this.filters,
                    search: this.searchQuery
                });
                
                if (response && response.success) {
                    this.searchResults = response.data.users || [];
                    this.pagination = {
                        currentPage: response.data.currentPage || 1,
                        totalPages: response.data.totalPages || 1,
                        hasNext: response.data.hasNext || false,
                        hasPrevious: response.data.hasPrevious || false,
                        totalCount: response.data.totalCount || 0
                    };
                } else {
                    this.error = response?.error || 'Failed to search users';
                    this.searchResults = [];
                }
            } catch (error) {
                console.error('Error searching users:', error);
                this.error = 'Failed to search users';
                this.searchResults = [];
            } finally {
                this.loading = false;
            }
        },

        async loadStatistics() {
            try {
                const response = await window.globalUserSearchAPI.getUserStatistics();
                if (response && response.success) {
                    this.statistics = response.data;
                }
            } catch (error) {
                console.error('Error loading statistics:', error);
            }
        },

        async loadUserDetails(user) {
            this.loading = true;
            
            try {
                const response = await window.globalUserSearchAPI.getUserDetails(user.id, user.type);
                if (response && response.success) {
                    this.userDetails = response.data;
                    this.selectedUser = user;
                    this.showUserDetails = true;
                } else {
                    this.error = response?.error || 'Failed to load user details';
                }
            } catch (error) {
                console.error('Error loading user details:', error);
                this.error = 'Failed to load user details';
            } finally {
                this.loading = false;
            }
        },

        async loadUserActivity(user) {
            try {
                const response = await window.globalUserSearchAPI.getUserActivity(user.id, user.type);
                if (response && response.success) {
                    this.userActivity = response.data;
                }
            } catch (error) {
                console.error('Error loading user activity:', error);
            }
        },

        async exportResults(format = 'csv') {
            try {
                const response = await window.globalUserSearchAPI.exportSearchResults({
                    ...this.filters,
                    search: this.searchQuery,
                    format: format
                });
                
                if (response && response.success) {
                    // Create download link
                    const link = document.createElement('a');
                    link.href = response.data.downloadUrl;
                    link.download = response.data.fileName;
                    link.click();
                    
                    this.showNotification('Search results exported successfully', 'success');
                } else {
                    this.showNotification('Failed to export results', 'error');
                }
            } catch (error) {
                console.error('Error exporting results:', error);
                this.showNotification('Failed to export results', 'error');
            }
        },

        applyFilters() {
            this.filters.offset = 0;
            this.pagination.currentPage = 1;
            this.performSearch();
        },

        clearFilters() {
            this.filters = {
                search: '',
                type: '',
                role: '',
                schoolId: '',
                limit: 20,
                offset: 0
            };
            this.searchQuery = '';
            this.pagination.currentPage = 1;
            this.performSearch();
        },

        nextPage() {
            if (this.pagination.hasNext) {
                this.filters.offset += this.filters.limit;
                this.pagination.currentPage++;
                this.performSearch();
            }
        },

        previousPage() {
            if (this.pagination.hasPrevious) {
                this.filters.offset = Math.max(0, this.filters.offset - this.filters.limit);
                this.pagination.currentPage--;
                this.performSearch();
            }
        },

        goToPage(page) {
            this.filters.offset = (page - 1) * this.filters.limit;
            this.pagination.currentPage = page;
            this.performSearch();
        },

        viewUser(user) {
            window.location.href = `user-details.html?id=${user.id}&type=${user.type}`;
        },

        editImpersonationPolicy() {
            this.showImpersonationPolicyModal = true;
            this.loadCurrentImpersonationPolicy();
        },

        async loadCurrentImpersonationPolicy() {
            try {
                const response = await this.api.getGlobalSettings();
                if (response && response.security) {
                    this.impersonationPolicy = {
                        requireReason: response.security.impersonation_policy === 'enabled_with_audit' ? 'true' : 'false',
                        allowedTargets: ['Super Admin', 'Operations', 'School Admin', 'Head Teacher', 'Deputy Head', 'Teacher', 'Accountant']
                    };
                }
            } catch (error) {
                console.error('Failed to load impersonation policy:', error);
                // Fallback to default values
                this.impersonationPolicy = {
                    requireReason: 'true',
                    allowedTargets: ['Super Admin', 'Operations', 'School Admin', 'Head Teacher', 'Deputy Head', 'Teacher', 'Accountant']
                };
            }
        },

        async saveImpersonationPolicy() {
            this.savingPolicy = true;
            try {
                const policyData = {
                    impersonation_policy: this.impersonationPolicy.requireReason === 'true' ? 'enabled_with_audit' : 'disabled',
                    allowed_targets: this.impersonationPolicy.allowedTargets
                };

                const response = await this.api.updateSecuritySettings(policyData);

                if (response && response.success) {
                    this.showImpersonationPolicyModal = false;
                    this.showNotification('Impersonation policy updated successfully', 'success');
                    this.updatePolicyDisplay();
                } else {
                    throw new Error('Failed to update policy');
                }
            } catch (error) {
                console.error('Failed to save impersonation policy:', error);
                this.showNotification('Failed to update impersonation policy', 'error');
            } finally {
                this.savingPolicy = false;
            }
        },

        updatePolicyDisplay() {
            const requireReasonElement = document.getElementById('policy-require-reason');
            if (requireReasonElement) {
                requireReasonElement.textContent = this.impersonationPolicy.requireReason === 'true' ? 'Yes' : 'No';
            }
            
            // Update header policy status
            const headerStatusElement = document.getElementById('header-policy-status');
            if (headerStatusElement) {
                headerStatusElement.textContent = this.impersonationPolicy.requireReason === 'true' ? 'Enabled' : 'Disabled';
            }
            
            // Update allowed targets display
            const allowedTargetsElement = document.querySelector('[data-policy-targets]');
            if (allowedTargetsElement) {
                const targetCount = this.impersonationPolicy.allowedTargets.length;
                if (targetCount === 9) {
                    allowedTargetsElement.textContent = 'All roles';
                } else if (targetCount >= 6) {
                    allowedTargetsElement.textContent = 'Admins & staff roles';
                } else {
                    allowedTargetsElement.textContent = `${targetCount} selected roles`;
                }
            }
        },

        showNotification(message, type = 'info') {
            // Simple notification implementation
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-medium z-50 ${
                type === 'success' ? 'bg-green-500' : 
                type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        },

        closeUserDetails() {
            this.showUserDetails = false;
            this.selectedUser = null;
            this.userDetails = null;
            this.userActivity = null;
        },

        getTypeColor(type) {
            switch (type) {
                case 'pupil': return 'text-blue-600 bg-blue-100';
                case 'teacher': return 'text-green-600 bg-green-100';
                case 'parent': return 'text-purple-600 bg-purple-100';
                case 'admin': return 'text-red-600 bg-red-100';
                case 'operations': return 'text-orange-600 bg-orange-100';
                case 'accountant': return 'text-indigo-600 bg-indigo-100';
                default: return 'text-gray-600 bg-gray-100';
            }
        },

        getRoleColor(role) {
            switch (role) {
                case 'Super Admin': return 'text-purple-600 bg-purple-100';
                case 'Operations': return 'text-orange-600 bg-orange-100';
                case 'School Admin': return 'text-red-600 bg-red-100';
                case 'Head Teacher': return 'text-blue-600 bg-blue-100';
                case 'Deputy Head': return 'text-blue-600 bg-blue-100';
                case 'Teacher': return 'text-green-600 bg-green-100';
                case 'Accountant': return 'text-indigo-600 bg-indigo-100';
                case 'Parent': return 'text-yellow-600 bg-yellow-100';
                case 'Pupil': return 'text-pink-600 bg-pink-100';
                default: return 'text-gray-600 bg-gray-100';
            }
        },

        getStatusColor(status) {
            switch (status) {
                case 'active': return 'text-green-600 bg-green-100';
                case 'inactive': return 'text-red-600 bg-red-100';
                case 'suspended': return 'text-yellow-600 bg-yellow-100';
                case 'pending': return 'text-blue-600 bg-blue-100';
                default: return 'text-gray-600 bg-gray-100';
            }
        },

        formatDateTime(dateString) {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },

        getInitials(name) {
            if (!name) return '';
            return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
        },

        highlightSearchTerm(text, term) {
            if (!term || !text) return text;
            const regex = new RegExp(`(${term})`, 'gi');
            return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
        },

        showNotification(message, type = 'info') {
            // Show notification using existing notification system
            if (window.showNotification) {
                window.showNotification(message, type);
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        },

        toggleAdvancedFilters() {
            this.showAdvancedFilters = !this.showAdvancedFilters;
        }
    };
}

// Alpine.js component registration
document.addEventListener('alpine:init', () => {
    Alpine.data('globalUserSearch', () => globalUserSearch);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GlobalUserSearchAPI, globalUserSearch };
}
