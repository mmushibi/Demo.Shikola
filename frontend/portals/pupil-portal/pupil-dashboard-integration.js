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
 * Pupil Dashboard Integration for Activities and Study Timetable
 * This file provides functions to integrate activities and study sessions into the pupil dashboard
 */

// Store for activities and study sessions
const PupilDashboardStore = {
    activities: [],
    studySessions: [],
    
    // Load data from localStorage
    loadData() {
        try {
            const activities = localStorage.getItem('pupil_activities');
            const studySessions = localStorage.getItem('pupil_study_sessions');
            
            if (activities) {
                this.activities = JSON.parse(activities);
            }
            
            if (studySessions) {
                this.studySessions = JSON.parse(studySessions);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    },
    
    // Get upcoming activities for dashboard
    getUpcomingActivities(limit = 3) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return this.activities
            .filter(activity => {
                const activityDate = new Date(activity.date);
                return activityDate >= today;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, limit);
    },
    
    // Get upcoming study sessions for dashboard
    getUpcomingStudySessions(limit = 3) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return this.studySessions
            .filter(session => {
                const sessionDate = new Date(session.date);
                return sessionDate >= today;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, limit);
    },
    
    // Get today's activities and study sessions
    getTodayItems() {
        const today = new Date().toISOString().split('T')[0];
        
        const todayActivities = this.activities.filter(activity => activity.date === today);
        const todayStudySessions = this.studySessions.filter(session => session.date === today);
        
        return {
            activities: todayActivities,
            studySessions: todayStudySessions,
            totalItems: todayActivities.length + todayStudySessions.length
        };
    },
    
    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    },
    
    // Format time for display
    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    },
    
    // Get activity icon based on category
    getActivityIcon(category) {
        const icons = {
            'Sports': 'fas fa-running',
            'Clubs': 'fas fa-users',
            'Music': 'fas fa-music',
            'Art': 'fas fa-palette',
            'Study': 'fas fa-book',
            'Social': 'fas fa-comments',
            'Other': 'fas fa-calendar'
        };
        return icons[category] || 'fas fa-calendar';
    },
    
    // Get activity color based on category
    getActivityColor(category) {
        const colors = {
            'Sports': 'text-green-600 bg-green-100',
            'Clubs': 'text-blue-600 bg-blue-100',
            'Music': 'text-purple-600 bg-purple-100',
            'Art': 'text-pink-600 bg-pink-100',
            'Study': 'text-indigo-600 bg-indigo-100',
            'Social': 'text-orange-600 bg-orange-100',
            'Other': 'text-slate-600 bg-slate-100'
        };
        return colors[category] || 'text-slate-600 bg-slate-100';
    }
};

// Dashboard component functions
window.PupilDashboardComponents = {
    
    // Render upcoming activities widget
    renderUpcomingActivities(container, limit = 3) {
        const activities = PupilDashboardStore.getUpcomingActivities(limit);
        
        if (activities.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-calendar-plus text-2xl text-slate-300 mb-2"></i>
                    <div class="text-sm text-slate-500">No upcoming activities</div>
                    <div class="text-xs text-slate-400 mt-1">Add activities in your timetable</div>
                </div>
            `;
            return;
        }
        
        const html = activities.map(activity => {
            const icon = PupilDashboardStore.getActivityIcon(activity.category);
            const color = PupilDashboardStore.getActivityColor(activity.category);
            const date = PupilDashboardStore.formatDate(activity.date);
            const time = activity.time ? PupilDashboardStore.formatTime(activity.time) : '';
            
            return `
                <div class="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div class="w-8 h-8 rounded-full ${color} flex items-center justify-center flex-shrink-0">
                        <i class="${icon} text-xs"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-slate-800 text-sm truncate" title="${activity.title}">
                            ${activity.title}
                        </div>
                        <div class="text-xs text-slate-500 mt-1">
                            ${date} ${time ? `• ${time}` : ''}
                        </div>
                        ${activity.description ? `<div class="text-xs text-slate-400 mt-1 truncate">${activity.description}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    },
    
    // Render upcoming study sessions widget
    renderUpcomingStudySessions(container, limit = 3) {
        const sessions = PupilDashboardStore.getUpcomingStudySessions(limit);
        
        if (sessions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-book text-2xl text-slate-300 mb-2"></i>
                    <div class="text-sm text-slate-500">No study sessions scheduled</div>
                    <div class="text-xs text-slate-400 mt-1">Create a study timetable</div>
                </div>
            `;
            return;
        }
        
        const html = sessions.map(session => {
            const date = PupilDashboardStore.formatDate(session.date);
            const time = PupilDashboardStore.formatTime(session.time);
            
            return `
                <div class="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-book-open text-blue-600 text-xs"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-slate-800 text-sm truncate" title="${session.subject}">
                            ${session.subject}
                        </div>
                        <div class="text-xs text-slate-600 mt-1 truncate" title="${session.topic}">
                            ${session.topic}
                        </div>
                        <div class="text-xs text-slate-500 mt-1">
                            ${date} • ${time} • ${session.duration}
                        </div>
                        ${session.location ? `<div class="text-xs text-slate-400 mt-1"><i class="fas fa-map-marker-alt mr-1"></i>${session.location}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    },
    
    // Render today's schedule widget
    renderTodaySchedule(container) {
        const todayItems = PupilDashboardStore.getTodayItems();
        
        if (todayItems.totalItems === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-calendar-day text-2xl text-slate-300 mb-2"></i>
                    <div class="text-sm text-slate-500">Nothing scheduled for today</div>
                    <div class="text-xs text-slate-400 mt-1">Check your timetable and study plan</div>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        // Render activities
        if (todayItems.activities.length > 0) {
            html += '<div class="mb-4"><h4 class="text-xs font-medium text-slate-600 mb-2">Activities</h4>';
            html += todayItems.activities.map(activity => {
                const icon = PupilDashboardStore.getActivityIcon(activity.category);
                const color = PupilDashboardStore.getActivityColor(activity.category);
                const time = activity.time ? PupilDashboardStore.formatTime(activity.time) : 'All day';
                
                return `
                    <div class="flex items-center gap-2 p-2 rounded-lg ${color} mb-2">
                        <i class="${icon} text-xs"></i>
                        <div class="flex-1">
                            <div class="font-medium text-xs truncate">${activity.title}</div>
                            <div class="text-xs opacity-75">${time}</div>
                        </div>
                    </div>
                `;
            }).join('');
            html += '</div>';
        }
        
        // Render study sessions
        if (todayItems.studySessions.length > 0) {
            html += '<div><h4 class="text-xs font-medium text-slate-600 mb-2">Study Sessions</h4>';
            html += todayItems.studySessions.map(session => {
                const time = PupilDashboardStore.formatTime(session.time);
                
                return `
                    <div class="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200 mb-2">
                        <i class="fas fa-book-open text-blue-600 text-xs"></i>
                        <div class="flex-1">
                            <div class="font-medium text-xs truncate">${session.subject}</div>
                            <div class="text-xs text-slate-600">${time} • ${session.duration}</div>
                        </div>
                    </div>
                `;
            }).join('');
            html += '</div>';
        }
        
        container.innerHTML = html;
    },
    
    // Initialize dashboard components
    init() {
        PupilDashboardStore.loadData();
        
        // Auto-update every minute
        setInterval(() => {
            PupilDashboardStore.loadData();
        }, 60000);
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.PupilDashboardComponents.init();
    });
} else {
    window.PupilDashboardComponents.init();
}

// Make available globally
window.PupilDashboardStore = PupilDashboardStore;
