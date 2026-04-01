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
// Pupil Timetable API Integration
class PupilTimetableAPI {
    constructor() {
        this.baseURL = window.apiConfig?.baseURL || '';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    }

    // Helper method to get cached data or fetch fresh data
    async getCachedOrFetch(cacheKey, fetchFunction) {
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const data = await fetchFunction();
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            return data;
        } catch (error) {
            // Return cached data if available, even if expired
            if (cached) {
                console.warn('API request failed, returning cached data:', error);
                return cached.data;
            }
            throw error;
        }
    }

    // Get comprehensive timetable data
    async getTimetable(options = {}) {
        const params = new URLSearchParams();
        
        if (options.classId) params.append('classId', options.classId);
        if (options.academicYear) params.append('academicYear', options.academicYear);
        if (options.viewType) params.append('viewType', options.viewType);
        if (options.date) params.append('date', options.date.toISOString());
        if (options.year) params.append('year', options.year.toString());
        if (options.month) params.append('month', options.month.toString());

        const cacheKey = `timetable_${params.toString()}`;
        
        return this.getCachedOrFetch(cacheKey, async () => {
            const response = await fetch(`${this.baseURL}/api/pupil-portal/timetable?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch timetable');
            }

            return result.data;
        });
    }

    // Get today's schedule
    async getTodaySchedule() {
        const cacheKey = 'today_schedule';
        
        return this.getCachedOrFetch(cacheKey, async () => {
            const response = await fetch(`${this.baseURL}/api/pupil-portal/timetable/today`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch today\'s schedule');
            }

            return result.data;
        });
    }

    // Get week schedule
    async getWeekSchedule(academicYear = null) {
        const params = new URLSearchParams();
        if (academicYear) params.append('academicYear', academicYear);

        const cacheKey = `week_schedule_${academicYear || 'current'}`;
        
        return this.getCachedOrFetch(cacheKey, async () => {
            const response = await fetch(`${this.baseURL}/api/pupil-portal/timetable/week?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch week schedule');
            }

            return result.data;
        });
    }

    // Get month schedule
    async getMonthSchedule(year, month) {
        const cacheKey = `month_schedule_${year}_${month}`;
        
        return this.getCachedOrFetch(cacheKey, async () => {
            const response = await fetch(`${this.baseURL}/api/pupil-portal/timetable/month?year=${year}&month=${month}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch month schedule');
            }

            return result.data;
        });
    }

    // Get class options
    async getClassOptions() {
        const cacheKey = 'class_options';
        
        return this.getCachedOrFetch(cacheKey, async () => {
            const response = await fetch(`${this.baseURL}/api/pupil-portal/timetable/class-options`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch class options');
            }

            return result.data;
        });
    }

    // Get filtered timetable
    async getFilteredTimetable(filters) {
        const cacheKey = `filtered_timetable_${JSON.stringify(filters)}`;
        
        return this.getCachedOrFetch(cacheKey, async () => {
            const response = await fetch(`${this.baseURL}/api/pupil-portal/timetable/filter`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch filtered timetable');
            }

            return result.data;
        });
    }

    // Real-time updates (WebSocket or polling)
    async enableRealTimeUpdates(callback) {
        // For now, implement polling - can be enhanced with WebSocket later
        const pollInterval = 30000; // 30 seconds
        
        const poll = async () => {
            try {
                const todaySchedule = await this.getTodaySchedule();
                callback(todaySchedule, 'today');
                
                // Clear cache to force fresh data on next poll
                this.cache.delete('today_schedule');
            } catch (error) {
                console.error('Real-time update failed:', error);
            }
        };

        // Initial poll
        await poll();

        // Set up interval for polling
        const intervalId = setInterval(poll, pollInterval);

        // Return cleanup function
        return () => {
            clearInterval(intervalId);
        };
    }

    // Utility methods
    getAuthToken() {
        if (window.shikolaAuth && typeof window.shikolaAuth.getToken === 'function') {
            return window.shikolaAuth.getToken();
        }
        
        // Fallback to localStorage
        return localStorage.getItem('shikola_token') || '';
    }

    clearCache() {
        this.cache.clear();
    }

    // Format time for display
    formatTime(timeString) {
        if (!timeString) return '';
        
        try {
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours);
            const minute = parseInt(minutes);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
        } catch (error) {
            return timeString;
        }
    }

    // Get current academic year
    getCurrentAcademicYear() {
        const now = new Date();
        const year = now.getFullYear();
        // Assuming academic year starts in September
        return now.getMonth() >= 8 ? year.toString() : (year - 1).toString();
    }

    // Convert day key to full day name
    dayKeyToFullName(dayKey) {
        const dayMap = {
            'MON': 'Monday',
            'TUE': 'Tuesday',
            'WED': 'Wednesday',
            'THU': 'Thursday',
            'FRI': 'Friday',
            'SAT': 'Saturday',
            'SUN': 'Sunday'
        };
        return dayMap[dayKey] || dayKey;
    }

    // Calculate time until class
    getTimeUntilClass(startTime) {
        if (!startTime) return null;

        try {
            const now = new Date();
            const [classHours, classMinutes] = startTime.split(':');
            const classTime = new Date();
            classTime.setHours(parseInt(classHours), parseInt(classMinutes), 0, 0);
            
            // If class time is earlier than current time, it's tomorrow
            if (classTime <= now) {
                classTime.setDate(classTime.getDate() + 1);
            }
            
            const diff = classTime - now;
            const diffHours = Math.floor(diff / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            if (diffHours > 0) {
                return `${diffHours}h ${diffMinutes}m`;
            } else if (diffMinutes > 0) {
                return `${diffMinutes}m`;
            } else {
                return 'Starting now';
            }
        } catch (error) {
            return null;
        }
    }

    // Check if class is in progress
    isClassInProgress(startTime, endTime) {
        if (!startTime || !endTime) return false;

        try {
            const now = new Date();
            const [startHours, startMinutes] = startTime.split(':');
            const [endHours, endMinutes] = endTime.split(':');
            
            const classStart = new Date();
            classStart.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
            
            const classEnd = new Date();
            classEnd.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
            
            return now >= classStart && now <= classEnd;
        } catch (error) {
            return false;
        }
    }

    // Get status for a class slot
    getClassSlotStatus(slot) {
        if (!slot) return 'empty';
        
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        if (this.isClassInProgress(slot.StartTime, slot.EndTime)) {
            return 'in-progress';
        } else if (currentTime < slot.StartTime) {
            return 'upcoming';
        } else {
            return 'completed';
        }
    }

    // Transform backend data to frontend format
    transformTimetableData(backendData) {
        if (!backendData) return null;

        const transformed = {
            metadata: {
                academicYear: backendData.metadata?.academicYear || '',
                term: backendData.metadata?.term || '',
                className: backendData.metadata?.className || '',
                classId: backendData.metadata?.classId || '',
                generatedAt: backendData.metadata?.generatedAt || new Date().toISOString(),
                isActive: backendData.metadata?.isActive ?? true,
                weekdays: backendData.metadata?.weekdays || [],
                periods: backendData.metadata?.periods || []
            },
            weeklyTimetable: backendData.weeklyTimetable || {},
            todaySlots: (backendData.todaySlots || []).map(slot => ({
                ...slot,
                status: this.getClassSlotStatus(slot),
                timeUntilStart: this.getTimeUntilClass(slot.StartTime),
                formattedStartTime: this.formatTime(slot.StartTime),
                formattedEndTime: this.formatTime(slot.EndTime)
            })),
            weekGrid: (backendData.weekGrid || []).map(row => ({
                ...row,
                cells: (row.cells || []).map(cell => ({
                    ...cell,
                    slot: cell.slot ? {
                        ...cell.slot,
                        status: this.getClassSlotStatus(cell.slot),
                        formattedStartTime: this.formatTime(cell.slot.StartTime),
                        formattedEndTime: this.formatTime(cell.slot.EndTime)
                    } : null
                }))
            })),
            calendar: {
                ...backendData.calendar,
                weeks: (backendData.calendar?.weeks || []).map(week => 
                    week.map(day => ({
                        ...day,
                        isToday: day.isToday && new Date(day.year, day.month, day.day).toDateString() === new Date().toDateString()
                    }))
                )
            }
        };

        return transformed;
    }
}

// Global instance
window.pupilTimetableAPI = new PupilTimetableAPI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PupilTimetableAPI;
}
