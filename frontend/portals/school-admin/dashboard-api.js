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
(function () {
    'use strict';

    // Dashboard API integration with real backend
    class SchoolAdminDashboard {
        constructor() {
            // Use the same API base as shared-api-client.js
            this.apiBase = window.SHIKOLA_API_BASE || 'http://localhost:3000';
            this.cache = new Map();
            this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        }

        getToken() {
            try {
                return localStorage.getItem('shikola_token') || localStorage.getItem('authToken');
            } catch (e) {
                return null;
            }
        }

        async fetchJson(path, options = {}) {
            // Skip API calls in demo mode
            if (!window.SHIKOLA_API_BASE || window.SHIKOLA_API_BASE === 'http://localhost:3000') {
                throw new Error('API not configured - demo mode');
            }

            const token = this.getToken();
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = 'Bearer ' + token;
            }

            const response = await fetch(this.apiBase + path, {
                ...options,
                headers
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Unauthorized - token missing or invalid
                    console.warn('Authentication required. Please log in.');
                    throw new Error('Authentication required');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        }

        getCacheKey(endpoint) {
            return `dashboard_${endpoint}`;
        }

        isCacheValid(cacheKey) {
            const cached = this.cache.get(cacheKey);
            if (!cached) return false;
            return Date.now() - cached.timestamp < this.cacheTimeout;
        }

        getFromCache(cacheKey) {
            const cached = this.cache.get(cacheKey);
            if (this.isCacheValid(cacheKey)) {
                return cached.data;
            }
            this.cache.delete(cacheKey);
            return null;
        }

        setCache(cacheKey, data) {
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
        }

        async getDashboardData(forceRefresh = false) {
            const cacheKey = this.getCacheKey('main');
            
            if (!forceRefresh) {
                const cached = this.getFromCache(cacheKey);
                if (cached) return cached;
            }

            try {
                const response = await this.fetchJson('/api/admin/dashboard');
                
                if (response.success && response.data) {
                    this.setCache(cacheKey, response.data);
                    return response.data;
                } else {
                    throw new Error(response.message || 'Failed to load dashboard data');
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                throw error;
            }
        }

        formatCurrency(amount) {
            return new Intl.NumberFormat('en-ZM', {
                style: 'currency',
                currency: 'ZMW',
                minimumFractionDigits: 2
            }).format(amount);
        }

        formatPercentage(value) {
            return `${value.toFixed(1)}%`;
        }

        formatNumber(num) {
            return new Intl.NumberFormat().format(num);
        }

        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-ZM', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }

        formatTime(dateString) {
            return new Date(dateString).toLocaleTimeString('en-ZM', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        formatDateTime(dateString) {
            return new Date(dateString).toLocaleString('en-ZM', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    // Dashboard UI Manager
    class DashboardUIManager {
        constructor(dashboardApi) {
            this.api = dashboardApi;
            this.isLoading = false;
        }

        async refreshDashboard() {
            if (this.isLoading) return;
            
            this.isLoading = true;
            this.setLoadingState(true);

            try {
                const data = await this.api.getDashboardData();
                this.updateAllSections(data);
                this.setLoadingState(false);
            } catch (error) {
                console.error('Failed to refresh dashboard:', error);
                
                if (error.message === 'Authentication required') {
                    this.showError('Please log in to view dashboard data');
                    // Show empty state with login prompt
                    this.showEmptyState();
                } else {
                    this.showError('Failed to load dashboard data');
                }
                
                this.setLoadingState(false);
            }
        }

        showEmptyState() {
            const containers = document.querySelectorAll('[data-list], [data-stat]');
            containers.forEach(container => {
                if (container.getAttribute('data-list')) {
                    container.innerHTML = '<div class="text-[11px] text-slate-400 text-center py-2">Please log in to view data</div>';
                } else if (container.getAttribute('data-stat')) {
                    container.textContent = '---';
                }
            });
        }

        setLoadingState(loading) {
            const loadingElements = document.querySelectorAll('[data-loading]');
            loadingElements.forEach(el => {
                el.style.display = loading ? 'block' : 'none';
            });

            const contentElements = document.querySelectorAll('[data-content]');
            contentElements.forEach(el => {
                el.style.display = loading ? 'none' : 'block';
            });
        }

        showError(message) {
            // Show error notification
            if (window.showNotification) {
                window.showNotification(message, 'error');
            } else {
                console.error(message);
            }
        }

        updateAllSections(data) {
            this.updateQuickStats(data.quickStats);
            this.updateManagementValue(data.managementValue);
            this.updatePupilsPerClass(data.pupilsPerClass);
            this.updateTodaysOverview(data.todaysOverview);
            this.updateGenderRatio(data.genderRatio);
            this.updateRecentAnnouncements(data.recentAnnouncements);
            this.updateUpcomingSchedule(data.upcomingSchedule);
            this.updateTopPupils(data.topPupils);
        }

        updateQuickStats(stats) {
            // Update stat cards
            this.updateElement('[data-stat="total-students"]', this.api.formatNumber(stats.totalPupils));
            this.updateElement('[data-stat="total-teachers"]', this.api.formatNumber(stats.totalTeachers));
            this.updateElement('[data-stat="total-classes"]', this.api.formatNumber(stats.totalClasses));
            this.updateElement('[data-stat="total-subjects"]', this.api.formatNumber(stats.totalSubjects));
            
            // Update financial stats
            this.updateElement('[data-stat="total-revenue"]', this.api.formatCurrency(stats.totalRevenue));
            this.updateElement('[data-stat="total-expenses"]', this.api.formatCurrency(stats.totalExpenses));
            this.updateElement('[data-stat="total-profit"]', this.api.formatCurrency(stats.totalProfit));
            
            // Update today's stats
            this.updateElement('[data-stat="today-attendance"]', this.api.formatNumber(stats.todayAttendance));
            this.updateElement('[data-stat="today-admissions"]', this.api.formatNumber(stats.todayAdmissions));
        }

        updateManagementValue(management) {
            this.updateElement('[data-stat="performance-score"]', this.api.formatPercentage(management.performanceScore));
            this.updateElement('[data-stat="timetable-classes"]', this.api.formatNumber(management.classesScheduledToday));
            this.updateElement('[data-stat="revenue-growth"]', this.api.formatPercentage(management.revenueGrowth));
            this.updateElement('[data-stat="active-teachers"]', this.api.formatNumber(management.activeTeachers));
            this.updateElement('[data-stat="occupancy-rate"]', this.api.formatPercentage(management.occupancyRate));
            this.updateElement('[data-stat="efficiency-score"]', this.api.formatPercentage(management.efficiencyScore));
        }

        updatePupilsPerClass(pupilsPerClass) {
            const container = document.querySelector('[data-list="pupils-per-class"]');
            const emptyState = document.querySelector('[data-empty="pupils-per-class"]');
            
            if (!container) return;

            // Clear existing content
            container.innerHTML = '';

            if (pupilsPerClass.length === 0) {
                emptyState.style.display = 'block';
                return;
            }

            emptyState.style.display = 'none';

            pupilsPerClass.forEach(cls => {
                const item = this.createPupilsPerClassItem(cls);
                container.appendChild(item);
            });

            // Update total pupils label
            const totalPupils = pupilsPerClass.reduce((sum, cls) => sum + cls.pupilCount, 0);
            this.updateElement('[data-stat="total-pupils-per-class"]', `${this.api.formatNumber(totalPupils)} pupils`);
        }

        createPupilsPerClassItem(cls) {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between';

            const leftDiv = document.createElement('div');
            leftDiv.className = 'flex items-center gap-3';

            const classInfo = document.createElement('div');
            classInfo.innerHTML = `
                <div class="font-medium text-slate-700">${cls.className}</div>
                <div class="text-[11px] text-slate-400">${cls.grade} · ${cls.pupilCount}/${cls.maxCapacity} pupils</div>
            `;

            const progressBar = document.createElement('div');
            progressBar.className = 'w-20 h-2 bg-slate-100 rounded-full overflow-hidden';
            
            const progressFill = document.createElement('div');
            progressFill.className = 'h-full bg-gradient-to-r from-orange-400 to-orange-500';
            progressFill.style.width = `${Math.min(cls.occupancyPercentage, 100)}%`;

            progressBar.appendChild(progressFill);
            leftDiv.appendChild(classInfo);
            leftDiv.appendChild(progressBar);

            const occupancyLabel = document.createElement('div');
            occupancyLabel.className = 'text-xs text-slate-500';
            occupancyLabel.textContent = this.api.formatPercentage(cls.occupancyPercentage);

            item.appendChild(leftDiv);
            item.appendChild(occupancyLabel);

            return item;
        }

        updateTodaysOverview(overview) {
            this.updateElement('[data-stat="present-pupils"]', this.api.formatNumber(overview.presentPupils));
            this.updateElement('[data-stat="absent-pupils"]', this.api.formatNumber(overview.absentPupils));
            this.updateElement('[data-stat="late-pupils"]', this.api.formatNumber(overview.latePupils));
            this.updateElement('[data-stat="new-admissions"]', this.api.formatNumber(overview.newAdmissions));
            this.updateElement('[data-stat="attendance-percentage"]', this.api.formatPercentage(overview.attendancePercentage));

            // Update recent activities
            this.updateRecentActivities(overview.recentActivities);
        }

        updateRecentActivities(activities) {
            const container = document.querySelector('[data-list="recent-activities"]');
            if (!container) return;

            container.innerHTML = '';

            if (activities.length === 0) {
                container.innerHTML = '<div class="text-[11px] text-slate-400 text-center py-2">No recent activities</div>';
                return;
            }

            activities.forEach(activity => {
                const item = this.createActivityItem(activity);
                container.appendChild(item);
            });
        }

        createActivityItem(activity) {
            const item = document.createElement('div');
            item.className = 'flex items-center gap-3 text-xs';

            const icon = document.createElement('div');
            icon.className = this.getActivityIconClass(activity.type);
            icon.innerHTML = this.getActivityIcon(activity.type);

            const content = document.createElement('div');
            content.className = 'flex-1';
            content.innerHTML = `
                <div class="text-slate-700">${activity.description}</div>
                <div class="text-[11px] text-slate-400">${activity.time}</div>
            `;

            item.appendChild(icon);
            item.appendChild(content);

            if (activity.link) {
                item.style.cursor = 'pointer';
                item.addEventListener('click', () => {
                    window.location.href = activity.link;
                });
            }

            return item;
        }

        getActivityIconClass(type) {
            const iconClasses = {
                'attendance': 'w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center',
                'admission': 'w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center',
                'payment': 'w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center'
            };
            return iconClasses[type] || iconClasses['attendance'];
        }

        getActivityIcon(type) {
            const icons = {
                'attendance': '<i class="fas fa-user-check text-xs"></i>',
                'admission': '<i class="fas fa-user-plus text-xs"></i>',
                'payment': '<i class="fas fa-money-bill text-xs"></i>'
            };
            return icons[type] || icons['attendance'];
        }

        updateGenderRatio(ratio) {
            const maleElement = document.querySelector('[data-stat="male-count"]');
            const femaleElement = document.querySelector('[data-stat="female-count"]');
            const maleBar = document.querySelector('[data-stat="male-bar"]');
            const femaleBar = document.querySelector('[data-stat="female-bar"]');

            if (maleElement) maleElement.textContent = this.api.formatNumber(ratio.maleCount);
            if (femaleElement) femaleElement.textContent = this.api.formatNumber(ratio.femaleCount);
            
            if (maleBar) maleBar.style.width = `${ratio.malePercentage}%`;
            if (femaleBar) femaleBar.style.width = `${ratio.femalePercentage}%`;
        }

        updateRecentAnnouncements(announcements) {
            const container = document.querySelector('[data-list="recent-announcements"]');
            if (!container) return;

            container.innerHTML = '';

            if (announcements.length === 0) {
                container.innerHTML = '<div class="text-[11px] text-slate-400 text-center py-2">No recent announcements</div>';
                return;
            }

            announcements.forEach(announcement => {
                const item = this.createAnnouncementItem(announcement);
                container.appendChild(item);
            });
        }

        createAnnouncementItem(announcement) {
            const item = document.createElement('div');
            item.className = 'border-l-4 border-orange-400 pl-3 py-2';

            const priorityBadge = this.getPriorityBadge(announcement.priority);
            
            item.innerHTML = `
                <div class="flex items-start justify-between gap-2">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <h4 class="font-medium text-slate-700 text-xs">${announcement.title}</h4>
                            ${priorityBadge}
                        </div>
                        <p class="text-[11px] text-slate-600 line-clamp-2">${announcement.content}</p>
                        <div class="text-[10px] text-slate-400 mt-1">
                            By ${announcement.createdBy} · ${this.api.formatDateTime(announcement.createdAt)}
                        </div>
                    </div>
                </div>
            `;

            return item;
        }

        getPriorityBadge(priority) {
            const badges = {
                'high': '<span class="px-2 py-1 bg-red-100 text-red-600 text-[10px] rounded-full">High</span>',
                'medium': '<span class="px-2 py-1 bg-yellow-100 text-yellow-600 text-[10px] rounded-full">Medium</span>',
                'low': '<span class="px-2 py-1 bg-green-100 text-green-600 text-[10px] rounded-full">Low</span>'
            };
            return badges[priority] || badges['medium'];
        }

        updateUpcomingSchedule(schedule) {
            const container = document.querySelector('[data-list="upcoming-schedule"]');
            if (!container) return;

            container.innerHTML = '';

            if (schedule.length === 0) {
                container.innerHTML = '<div class="text-[11px] text-slate-400 text-center py-2">No upcoming classes</div>';
                return;
            }

            schedule.forEach(item => {
                const scheduleItem = this.createScheduleItem(item);
                container.appendChild(scheduleItem);
            });
        }

        createScheduleItem(item) {
            const scheduleItem = document.createElement('div');
            scheduleItem.className = 'flex items-center justify-between py-2 border-b border-slate-100 last:border-0';

            scheduleItem.innerHTML = `
                <div class="flex-1">
                    <div class="font-medium text-slate-700 text-xs">${item.title}</div>
                    <div class="text-[11px] text-slate-400">${item.teacherName} · ${item.location}</div>
                </div>
                <div class="text-right">
                    <div class="text-xs text-slate-600">${this.api.formatTime(item.startTime)}</div>
                    <div class="text-[10px] text-slate-400">${this.api.formatDate(item.startTime)}</div>
                </div>
            `;

            return scheduleItem;
        }

        updateTopPupils(topPupils) {
            const container = document.querySelector('[data-list="top-pupils"]');
            if (!container) return;

            container.innerHTML = '';

            if (topPupils.length === 0) {
                container.innerHTML = '<div class="text-[11px] text-slate-400 text-center py-1">Top pupils will appear here after you record test and exam marks.</div>';
                return;
            }

            topPupils.forEach(pupil => {
                const pupilItem = this.createTopPupilItem(pupil);
                container.appendChild(pupilItem);
            });
        }

        createTopPupilItem(pupil) {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-50';

            const leftDiv = document.createElement('div');
            leftDiv.className = 'flex items-center gap-3';

            const rankBadge = document.createElement('div');
            rankBadge.className = 'h-8 w-8 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 text-white flex items-center justify-center text-xs font-semibold';
            rankBadge.textContent = pupil.rank;

            const infoDiv = document.createElement('div');
            infoDiv.innerHTML = `
                <div class="font-medium text-slate-700 text-xs">${pupil.fullName}</div>
                <div class="text-[11px] text-slate-400">${pupil.className} · ${this.api.formatPercentage(pupil.attendancePercentage)} attendance</div>
            `;

            leftDiv.appendChild(rankBadge);
            leftDiv.appendChild(infoDiv);

            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'text-[11px] text-emerald-500 font-semibold';
            scoreDiv.textContent = this.api.formatPercentage(pupil.averageScore);

            item.appendChild(leftDiv);
            item.appendChild(scoreDiv);

            return item;
        }

        updateElement(selector, value) {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = value;
            }
        }
    }

    // Initialize dashboard
    let dashboardApi;
    let uiManager;

    function initializeDashboard() {
        dashboardApi = new SchoolAdminDashboard();
        uiManager = new DashboardUIManager(dashboardApi);

        // Initial load
        uiManager.refreshDashboard();

        // Set up periodic refresh
        setInterval(() => {
            uiManager.refreshDashboard();
        }, 5 * 60 * 1000); // Refresh every 5 minutes

        // Set up event listeners for real-time updates
        setupEventListeners();
    }

    function setupEventListeners() {
        // Listen for pupil creation events
        try {
            window.addEventListener('shikola:pupil-created', () => {
                uiManager.refreshDashboard();
            });
        } catch (e) {}

        // Listen for employee creation events
        try {
            window.addEventListener('shikola:employee-created', () => {
                uiManager.refreshDashboard();
            });
        } catch (e) {}

        // Listen for attendance updates
        try {
            window.addEventListener('shikola:attendance-updated', () => {
                uiManager.refreshDashboard();
            });
        } catch (e) {}

        // Listen for fee payments
        try {
            window.addEventListener('shikola:fees-payment-recorded', () => {
                uiManager.refreshDashboard();
            });
        } catch (e) {}
    }

    // Make dashboard available globally
    window.SchoolAdminDashboard = {
        refresh: () => uiManager?.refreshDashboard(),
        api: () => dashboardApi,
        ui: () => uiManager
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDashboard);
    } else {
        initializeDashboard();
    }

})();
