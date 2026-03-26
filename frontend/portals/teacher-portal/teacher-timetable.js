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
 * Enhanced Teacher Timetable Management
 * Real-time data fetching, synchronization, and UI management
 */

(function() {
    'use strict';

    // Configuration
    const TIMETABLE_CONFIG = {
        apiBase: window.SHIKOLA_API_BASE || '/api',
        refreshInterval: 30000, // 30 seconds
        syncInterval: 15000,    // 15 seconds
        retryAttempts: 3,
        retryDelay: 2000
    };

    // State management
    let timetableState = {
        timetable: [],
        classes: [],
        subjects: [],
        todayEntries: [],
        weekGrid: {},
        stats: {
            totalLessons: 0,
            totalClasses: 0,
            lessonsToday: 0,
            freePeriodsToday: 0
        },
        currentLesson: null,
        nextLesson: null,
        isLoading: false,
        lastSyncTime: null,
        error: null
    };

    // Cache management
    const cache = {
        get: function(key) {
            try {
                const cached = localStorage.getItem(`shikola_teacher_timetable_${key}`);
                return cached ? JSON.parse(cached) : null;
            } catch (e) {
                return null;
            }
        },
        set: function(key, data, ttl = 300000) { // 5 minutes default TTL
            try {
                const cacheData = {
                    data: data,
                    timestamp: Date.now(),
                    ttl: ttl
                };
                localStorage.setItem(`shikola_teacher_timetable_${key}`, JSON.stringify(cacheData));
            } catch (e) {
                console.warn('Failed to cache data:', e);
            }
        },
        isValid: function(key) {
            try {
                const cached = localStorage.getItem(`shikola_teacher_timetable_${key}`);
                if (!cached) return false;
                const cacheData = JSON.parse(cached);
                return (Date.now() - cacheData.timestamp) < cacheData.ttl;
            } catch (e) {
                return false;
            }
        }
    };

    // API client
    const api = {
        request: async function(endpoint, options = {}) {
            const token = localStorage.getItem('authToken');
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };

            try {
                const response = await fetch(`${TIMETABLE_CONFIG.apiBase}${endpoint}`, {
                    ...defaultOptions,
                    ...options,
                    headers: {
                        ...defaultOptions.headers,
                        ...options.headers
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return await response.json();
            } catch (error) {
                console.error(`API request failed for ${endpoint}:`, error);
                throw error;
            }
        },

        getTimetable: async function(classId = null) {
            const params = classId ? `?class_id=${classId}` : '';
            return await this.request(`/teacher/timetable${params}`);
        },

        getTodayTimetable: async function() {
            return await this.request('/teacher/timetable/today');
        },

        getWeekTimetable: async function() {
            return await this.request('/teacher/timetable/week');
        },

        syncTimetable: async function(lastSyncTime = null) {
            return await this.request('/teacher/timetable/sync', {
                method: 'POST',
                body: JSON.stringify({ last_sync_time: lastSyncTime })
            });
        },

        exportTimetable: async function(format = 'csv', classId = null) {
            const params = new URLSearchParams({ format });
            if (classId) params.append('class_id', classId);
            return await this.request(`/teacher/timetable/export?${params}`);
        }
    };

    // Data processing utilities
    const dataProcessor = {
        processTimetableData: function(data) {
            if (!data || !data.timetable) return timetableState;

            timetableState = {
                ...timetableState,
                timetable: data.timetable || [],
                classes: data.classes || [],
                subjects: data.subjects || [],
                stats: data.stats || timetableState.stats,
                lastSyncTime: new Date().toISOString(),
                error: null
            };

            return timetableState;
        },

        processTodayData: function(data) {
            if (!data || !data.entries) return timetableState;

            timetableState.todayEntries = data.entries || [];
            timetableState.currentLesson = data.summary?.currentLesson || null;
            timetableState.nextLesson = data.summary?.nextLesson || null;

            return timetableState;
        },

        processWeekData: function(data) {
            if (!data || !data.weekGrid) return timetableState;

            timetableState.weekGrid = data.weekGrid || {};

            return timetableState;
        },

        formatTimeSlot: function(startTime, endTime) {
            return `${startTime} - ${endTime}`;
        },

        getLessonStatus: function(startTime, endTime) {
            const now = new Date();
            const currentTime = now.toTimeString().slice(0, 5);
            const startDate = new Date(`1970-01-01T${startTime}`);
            const endDate = new Date(`1970-01-01T${endTime}`);
            const current = new Date(`1970-01-01T${currentTime}`);

            if (current < startDate) return 'upcoming';
            if (current > endDate) return 'completed';
            return 'current';
        },

        groupByTimeSlot: function(entries) {
            const grouped = {};
            
            entries.forEach(entry => {
                const timeSlot = this.formatTimeSlot(entry.start_time, entry.end_time);
                if (!grouped[timeSlot]) {
                    grouped[timeSlot] = [];
                }
                grouped[timeSlot].push(entry);
            });

            return grouped;
        },

        getTodayLessons: function() {
            const today = new Date();
            const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
            
            return timetableState.timetable.filter(entry => 
                entry.day_of_week === dayOfWeek && 
                !entry.is_break_time
            );
        },

        getFreePeriodsToday: function() {
            const today = new Date();
            const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
            
            return timetableState.timetable.filter(entry => 
                entry.day_of_week === dayOfWeek && 
                entry.is_break_time
            );
        },

        getClassesThisTerm: function() {
            const classMap = new Map();
            
            timetableState.timetable.forEach(entry => {
                if (!entry.is_break_time && entry.class_id && entry.class_name) {
                    if (!classMap.has(entry.class_id)) {
                        classMap.set(entry.class_id, {
                            className: entry.class_name,
                            gradeLevel: entry.grade_level,
                            subjects: []
                        });
                    }
                    
                    if (entry.subject_name && 
                        !classMap.get(entry.class_id).subjects.includes(entry.subject_name)) {
                        classMap.get(entry.class_id).subjects.push(entry.subject_name);
                    }
                }
            });

            return Array.from(classMap.values());
        }
    };

    // Real-time synchronization
    const syncManager = {
        syncInterval: null,
        isRunning: false,

        start: function() {
            if (this.isRunning) return;
            
            this.isRunning = true;
            this.syncInterval = setInterval(async () => {
                try {
                    await this.performSync();
                } catch (error) {
                    console.error('Background sync failed:', error);
                }
            }, TIMETABLE_CONFIG.syncInterval);

            console.log('Timetable sync manager started');
        },

        stop: function() {
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
                this.syncInterval = null;
            }
            this.isRunning = false;
            console.log('Timetable sync manager stopped');
        },

        performSync: async function() {
            try {
                const lastSyncTime = timetableState.lastSyncTime;
                const syncData = await api.syncTimetable(lastSyncTime);

                if (syncData.success && syncData.data.has_updates) {
                    // Process updates
                    syncData.data.updates.forEach(update => {
                        this.processUpdate(update);
                    });

                    // Trigger UI refresh
                    this.notifyUpdate('timetable_updated', syncData.data.updates);
                }
            } catch (error) {
                console.error('Sync failed:', error);
                timetableState.error = error.message;
            }
        },

        processUpdate: function(update) {
            const { action_type } = update;
            
            switch (action_type) {
                case 'updated':
                    this.updateEntry(update);
                    break;
                case 'created':
                    this.addEntry(update);
                    break;
                case 'deleted':
                    this.removeEntry(update);
                    break;
            }
        },

        updateEntry: function(updatedEntry) {
            const index = timetableState.timetable.findIndex(entry => entry.id === updatedEntry.id);
            if (index >= 0) {
                timetableState.timetable[index] = { ...timetableState.timetable[index], ...updatedEntry };
            }
        },

        addEntry: function(newEntry) {
            timetableState.timetable.push(newEntry);
        },

        removeEntry: function(entryId) {
            timetableState.timetable = timetableState.timetable.filter(entry => entry.id !== entryId);
        },

        notifyUpdate: function(type, data) {
            // Dispatch custom event for UI components
            window.dispatchEvent(new CustomEvent('shikola:timetable_update', {
                detail: { type, data }
            }));

            // Notify real-time sync system
            if (window.ShikolaRealtimeSync) {
                window.ShikolaRealtimeSync.sendEvent('timetable', type, data);
            }
        }
    };

    // UI utilities
    const uiUtils = {
        showLoading: function(show = true) {
            timetableState.isLoading = show;
            this.updateLoadingUI();
        },

        updateLoadingUI: function() {
            const loadingElements = document.querySelectorAll('[data-timetable-loading]');
            loadingElements.forEach(element => {
                if (timetableState.isLoading) {
                    element.style.display = 'block';
                } else {
                    element.style.display = 'none';
                }
            });
        },

        showError: function(message) {
            timetableState.error = message;
            this.updateErrorUI();
        },

        updateErrorUI: function() {
            const errorElements = document.querySelectorAll('[data-timetable-error]');
            errorElements.forEach(element => {
                if (timetableState.error) {
                    element.textContent = timetableState.error;
                    element.style.display = 'block';
                } else {
                    element.style.display = 'none';
                }
            });
        },

        updateStats: function() {
            const statsElements = {
                totalLessons: document.querySelectorAll('[data-stat="total-lessons"]'),
                totalClasses: document.querySelectorAll('[data-stat="total-classes"]'),
                lessonsToday: document.querySelectorAll('[data-stat="lessons-today"]'),
                freePeriodsToday: document.querySelectorAll('[data-stat="free-periods-today"]')
            };

            Object.entries(statsElements).forEach(([stat, elements]) => {
                const value = timetableState.stats[stat] || 0;
                elements.forEach(element => {
                    element.textContent = value;
                });
            });
        },

        updateCurrentLesson: function() {
            const currentElements = document.querySelectorAll('[data-current-lesson]');
            const nextElements = document.querySelectorAll('[data-next-lesson]');

            currentElements.forEach(element => {
                if (timetableState.currentLesson) {
                    element.innerHTML = this.formatLessonDisplay(timetableState.currentLesson);
                } else {
                    element.innerHTML = '<span class="text-slate-400">No current lesson</span>';
                }
            });

            nextElements.forEach(element => {
                if (timetableState.nextLesson) {
                    element.innerHTML = this.formatLessonDisplay(timetableState.nextLesson);
                } else {
                    element.innerHTML = '<span class="text-slate-400">No upcoming lesson</span>';
                }
            });
        },

        formatLessonDisplay: function(lesson) {
            if (!lesson) return '';
            
            return `
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full ${lesson.status === 'current' ? 'bg-green-500' : 'bg-blue-500'}"></div>
                    <div>
                        <div class="font-medium">${lesson.subject_name || 'Lesson'}</div>
                        <div class="text-xs text-slate-500">
                            ${lesson.start_time} - ${lesson.end_time} · ${lesson.class_name}
                            ${lesson.room ? ` · ${lesson.room}` : ''}
                        </div>
                    </div>
                </div>
            `;
        },

        updateWeekGrid: function() {
            const gridElement = document.querySelector('[data-week-grid]');
            if (!gridElement) return;

            const weekGridHTML = this.generateWeekGridHTML();
            gridElement.innerHTML = weekGridHTML;
        },

        generateWeekGridHTML: function() {
            const weekdays = [
                { key: 1, label: 'Monday' },
                { key: 2, label: 'Tuesday' },
                { key: 3, label: 'Wednesday' },
                { key: 4, label: 'Thursday' },
                { key: 5, label: 'Friday' }
            ];

            const timeSlots = [...new Set(timetableState.timetable.map(entry => 
                `${entry.start_time}-${entry.end_time}`
            ))].sort();

            let html = `
                <div class="overflow-x-auto">
                    <table class="min-w-full text-xs">
                        <thead class="bg-slate-50">
                            <tr>
                                <th class="px-2 py-1 text-left">Time</th>
                                ${weekdays.map(day => `<th class="px-2 py-1 text-left">${day.label}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
            `;

            timeSlots.forEach(timeSlot => {
                const [startTime, endTime] = timeSlot.split('-');
                html += `
                    <tr>
                        <td class="px-2 py-1 font-medium">${startTime} - ${endTime}</td>
                `;

                weekdays.forEach(day => {
                    const entry = timetableState.timetable.find(e => 
                        e.day_of_week === day.key && 
                        e.start_time === startTime && 
                        e.end_time === endTime
                    );

                    if (entry) {
                        const bgColor = entry.is_break_time ? 'bg-slate-100' : 
                                       entry.subject_color ? `bg-${entry.subject_color}-50` : 'bg-blue-50';
                        html += `
                            <td class="px-2 py-1">
                                <div class="${bgColor} rounded p-1">
                                    ${entry.is_break_time ? 
                                        `<div class="text-slate-600">${entry.break_type || 'Break'}</div>` :
                                        `<div class="font-medium">${entry.subject_name}</div>
                                        <div class="text-xs text-slate-500">${entry.class_name}</div>
                                        ${entry.room ? `<div class="text-xs text-slate-400">${entry.room}</div>` : ''}
                                    `}
                                </div>
                            </td>
                        `;
                    } else {
                        html += '<td class="px-2 py-1"></td>';
                    }
                });

                html += '</tr>';
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;

            return html;
        }
    };

    // Main controller
    const timetableController = {
        init: async function() {
            try {
                uiUtils.showLoading(true);
                
                // Load initial data
                await this.loadInitialData();
                
                // Start real-time sync
                syncManager.start();
                
                // Set up event listeners
                this.setupEventListeners();
                
                // Update UI
                this.updateUI();
                
                uiUtils.showLoading(false);
                console.log('Teacher timetable initialized successfully');
            } catch (error) {
                console.error('Failed to initialize timetable:', error);
                uiUtils.showError('Failed to load timetable data');
                uiUtils.showLoading(false);
            }
        },

        loadInitialData: async function() {
            // Check cache first
            if (cache.isValid('timetable')) {
                const cachedData = cache.get('timetable');
                dataProcessor.processTimetableData(cachedData.data);
            } else {
                // Load from API
                const timetableData = await api.getTimetable();
                if (timetableData.success) {
                    dataProcessor.processTimetableData(timetableData.data);
                    cache.set('timetable', timetableData.data);
                }
            }

            // Load today's data
            const todayData = await api.getTodayTimetable();
            if (todayData.success) {
                dataProcessor.processTodayData(todayData.data);
            }

            // Load week data
            const weekData = await api.getWeekTimetable();
            if (weekData.success) {
                dataProcessor.processWeekData(weekData.data);
            }
        },

        setupEventListeners: function() {
            // Listen for real-time updates
            window.addEventListener('shikola:timetable_update', (event) => {
                this.handleRealtimeUpdate(event.detail);
            });

            // Listen for class selection changes
            const classSelect = document.querySelector('[data-class-select]');
            if (classSelect) {
                classSelect.addEventListener('change', (e) => {
                    this.filterByClass(e.target.value);
                });
            }

            // Listen for refresh button clicks
            const refreshButton = document.querySelector('[data-refresh-timetable]');
            if (refreshButton) {
                refreshButton.addEventListener('click', () => {
                    this.refreshData();
                });
            }

            // Listen for export button clicks
            const exportButton = document.querySelector('[data-export-timetable]');
            if (exportButton) {
                exportButton.addEventListener('click', () => {
                    this.exportTimetable();
                });
            }
        },

        handleRealtimeUpdate: function(update) {
            console.log('Real-time update received:', update);
            this.updateUI();
        },

        updateUI: function() {
            uiUtils.updateStats();
            uiUtils.updateCurrentLesson();
            uiUtils.updateWeekGrid();
        },

        filterByClass: async function(classId) {
            try {
                uiUtils.showLoading(true);
                const filteredData = await api.getTimetable(classId);
                if (filteredData.success) {
                    dataProcessor.processTimetableData(filteredData.data);
                    this.updateUI();
                }
            } catch (error) {
                uiUtils.showError('Failed to filter by class');
            } finally {
                uiUtils.showLoading(false);
            }
        },

        refreshData: async function() {
            try {
                uiUtils.showLoading(true);
                await this.loadInitialData();
                this.updateUI();
                uiUtils.showError(null); // Clear any previous errors
            } catch (error) {
                uiUtils.showError('Failed to refresh data');
            } finally {
                uiUtils.showLoading(false);
            }
        },

        exportTimetable: async function() {
            try {
                const classSelect = document.querySelector('[data-class-select]');
                const classId = classSelect ? classSelect.value : null;
                
                const exportData = await api.exportTimetable('csv', classId);
                if (exportData.success) {
                    this.downloadCSV(exportData.data, 'timetable.csv');
                }
            } catch (error) {
                uiUtils.showError('Failed to export timetable');
            }
        },

        downloadCSV: function(data, filename) {
            if (!data || data.length === 0) {
                uiUtils.showError('No data to export');
                return;
            }

            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(','),
                ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        },

        destroy: function() {
            syncManager.stop();
            // Clean up event listeners
            window.removeEventListener('shikola:timetable_update', this.handleRealtimeUpdate);
        }
    };

    // Public API
    window.ShikolaTeacherTimetable = {
        init: timetableController.init.bind(timetableController),
        refresh: timetableController.refreshData.bind(timetableController),
        export: timetableController.exportTimetable.bind(timetableController),
        getState: () => timetableState,
        destroy: timetableController.destroy.bind(timetableController)
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ShikolaTeacherTimetable.init();
        });
    } else {
        window.ShikolaTeacherTimetable.init();
    }

})();
