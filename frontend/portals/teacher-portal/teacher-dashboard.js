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
(function (window) {
    function todayIsoDate() {
        var d = new Date();
        return d.toISOString().slice(0, 10);
    }

    function safeNumber(value, fallback) {
        var n = Number(value);
        return Number.isFinite(n) ? n : (fallback || 0);
    }

    function teacherDashboardData() {
        return {
            // Loading / error state for dashboard aggregates
            dashboardLoading: false,
            dashboardError: null,

            // Top cards
            myClassesCount: 0,
            myClasses: [],
            mySubjectsCount: 0,
            mySubjects: [],
            studentsThisTerm: 0,
            assessmentsToMark: 0,

            // Teaching activity summary (used in the chart caption)
            teachingLessonsWeek: 0,
            teachingAssessmentsWeek: 0,
            teachingAttendanceAvg: 0,

            // Today section
            todayLessons: [],
            todayAverageAttendance: 0,
            pendingTasks: [],

            // Attendance snapshot
            attendanceSummary: {
                classes: [],
                totalPresent: 0,
                totalAbsent: 0,
                totalStudents: 0,
                presentPct: 0,
                absentPct: 0
            },

            // Upcoming schedule items
            upcomingItems: [],

            // Exam/Class Test overview
            examTestOverview: {
                unpublishedCount: 0,
                recentCount: 0,
                averageScore: null,
                pendingMarks: 0
            },

            // Student selection and reporting
            selectedStudent: null,
            students: [],
            get filteredStudents() {
                if (!Array.isArray(this.students)) return [];
                return this.students;
            },

            // Notifications
            notifications: [],
            open: false, // Ensure notifications start closed
            unreadCount: function() {
                if (!Array.isArray(this.notifications)) return 0;
                return this.notifications.filter(function(n) { return !n.read; }).length;
            },
            loadServerNotifications: function() {
                // Load notifications from server or local storage
                try {
                    var stored = localStorage.getItem('shikola_notifications_v1');
                    if (stored) {
                        this.notifications = JSON.parse(stored) || [];
                    } else {
                        this.notifications = [];
                        this.saveNotifications();
                    }
                } catch (e) {
                    this.notifications = [];
                }
            },
            markAllRead: function() {
                if (Array.isArray(this.notifications)) {
                    this.notifications.forEach(function(n) { n.read = true; });
                    this.saveNotifications();
                }
            },
            clearAll: function() {
                this.notifications = [];
                this.saveNotifications();
            },
            handleClick: function(notification) {
                if (notification && typeof notification === 'object') {
                    notification.read = true;
                    this.saveNotifications();
                    if (notification.actionUrl || notification.link) {
                        try {
                            window.location.href = notification.actionUrl || notification.link;
                        } catch (e) {
                            console.warn('Failed to navigate to notification link:', e);
                        }
                    }
                }
            },
            saveNotifications: function() {
                try {
                    localStorage.setItem('shikola_notifications_v1', JSON.stringify(this.notifications));
                } catch (e) {
                    console.warn('Failed to save notifications:', e);
                }
            },

            // Helpers
            get apiBase() {
                return window.SHIKOLA_API_BASE || '/api';
            },

            async initDashboard() {
                try {
                    this.dashboardLoading = true;
                    this.dashboardError = null;
                    this.loadServerNotifications(); // Initialize notifications
                    
                    // Authentication check
                    if (window.authManager && typeof window.authManager.isAuthenticated === 'function') {
                        if (!window.authManager.isAuthenticated()) {
                            console.warn('[Teacher Dashboard] User not authenticated, skipping dashboard data load');
                            this.dashboardError = 'Please log in to view dashboard data';
                            this.dashboardLoading = false;
                            return;
                        }
                    } else if (window.ShikolaAuth && typeof window.ShikolaAuth.isAuthenticated === 'function') {
                        const authenticated = await window.ShikolaAuth.isAuthenticated();
                        if (!authenticated) {
                            console.warn('[Teacher Dashboard] User not authenticated, skipping dashboard data load');
                            this.dashboardError = 'Please log in to view dashboard data';
                            this.dashboardLoading = false;
                            return;
                        }
                    }
                    
                    await this.refreshDashboard();
                    await this.fetchCrossPortalData();
                    this.attachRealtimeListeners();
                    this.initializeSearchSuggestions();
                } catch (e) {
                    console.error('Teacher dashboard load failed', e);
                    this.dashboardError = e && e.message ? e.message : 'Failed to load dashboard data.';
                } finally {
                    this.dashboardLoading = false;
                }
            },

            async refreshDashboard() {
                var self = this;
                var today = todayIsoDate();

                try {
                    // Use the new enhanced dashboard API
                    var dashboardResponse = await this.safeFetchJson('/api/teacher/dashboard');
                    
                    if (dashboardResponse && dashboardResponse.success && dashboardResponse.data) {
                        var data = dashboardResponse.data;
                        
                        // Update stats
                        this.myClassesCount = data.stats.classesCount || 0;
                        this.mySubjectsCount = data.stats.subjectsCount || 0;
                        this.studentsThisTerm = data.stats.pupilsThisTerm || 0;
                        this.assessmentsToMark = data.stats.assignmentsCount || 0;
                        this.teachingAttendanceAvg = data.stats.averageAttendance || 0;
                        
                        // Update attendance
                        if (data.attendance) {
                            this.todayAverageAttendance = data.attendance.percentage || 0;
                            this.attendanceSummary.totalPresent = data.attendance.present || 0;
                            this.attendanceSummary.totalAbsent = data.attendance.absent || 0;
                            this.attendanceSummary.totalStudents = data.attendance.total || 0;
                            this.attendanceSummary.presentPct = data.attendance.percentage || 0;
                        }
                        
                        // Update upcoming classes
                        if (Array.isArray(data.upcomingClasses)) {
                            this.upcomingItems = data.upcomingClasses;
                        }
                        
                        // Update recent assignments
                        if (Array.isArray(data.recentAssignments)) {
                            this.pendingTasks = data.recentAssignments.map(function(a) {
                                return {
                                    task: a.title,
                                    class: a.className,
                                    due: new Date(a.dueDate).toLocaleDateString(),
                                    priority: new Date(a.dueDate) <= new Date(today) ? 'high' : 'medium'
                                };
                            });
                        }
                        
                        // Update notifications
                        if (Array.isArray(data.notifications)) {
                            this.notifications = data.notifications.map(function(n) {
                                return {
                                    id: n.id,
                                    title: n.title,
                                    message: n.message,
                                    time: n.time,
                                    read: n.read,
                                    type: n.type,
                                    link: null
                                };
                            });
                        }
                    }
                    
                    // Load classes separately for detailed info
                    var classesResponse = await this.safeFetchJson('/api/teacher/my-classes');
                    if (classesResponse && classesResponse.success) {
                        this.myClasses = classesResponse.classes || [];
                        this.mySubjects = classesResponse.subjects || [];
                    }
                    
                } catch (e) {
                    console.error('Failed to refresh dashboard:', e);
                    this.dashboardError = e.message || 'Failed to load dashboard data';
                }
            },

            async safeFetchJson(path) {
                var url = this.apiBase + path;
                var token = null;
                try {
                    token = localStorage.getItem('authToken');
                } catch (e) {
                    token = null;
                }
                var headers = { 'Content-Type': 'application/json' };
                if (token) {
                    headers.Authorization = 'Bearer ' + token;
                }
                var res = await fetch(url, { headers: headers });
                if (!res.ok) {
                    if (res.status === 401) {
                        console.warn('Authentication required for', path);
                        // Return appropriate fallback data based on the endpoint
                        if (path.includes('/dashboard')) {
                            return { stats: { classesCount: 0, subjectsCount: 0, pupilsThisTerm: 0, assignmentsCount: 0 }, attendance: { present: 0, absent: 0, total: 0, percentage: 0 }, upcomingClasses: [] };
                        } else if (path.includes('/classes')) {
                            return { classes: [], subjects: [] };
                        } else if (path.includes('/assignments') || path.includes('/live-classes') || path.includes('/class-tests')) {
                            return [];
                        } else {
                            return null;
                        }
                    }
                    throw new Error('HTTP ' + res.status + ' ' + res.statusText);
                }
                return res.json();
            },

            buildAttendanceSummary: function (dateIso, classes) {
                var summary = {
                    classes: [],
                    totalPresent: 0,
                    totalAbsent: 0,
                    totalStudents: 0,
                    presentPct: 0,
                    absentPct: 0
                };
                if (!window.ShikolaAttendanceStore || typeof window.ShikolaAttendanceStore.loadStudentAttendanceForClass !== 'function') {
                    return summary;
                }
                if (!Array.isArray(classes) || !classes.length) {
                    return summary;
                }
                try {
                    classes.forEach(function (cls) {
                        if (!cls || !cls.name) return;
                        var rec = window.ShikolaAttendanceStore.loadStudentAttendanceForClass(dateIso, cls.name);
                        if (!rec || !rec.attendance) return;
                        var present = 0;
                        var absent = 0;
                        var att = rec.attendance || {};
                        for (var id in att) {
                            if (!Object.prototype.hasOwnProperty.call(att, id)) continue;
                            var status = att[id];
                            if (status === 'P') present += 1;
                            else if (status === 'A') absent += 1;
                        }
                        var total = present + absent;
                        if (!total) return;
                        summary.classes.push({
                            class: cls.name,
                            present: present,
                            absent: absent,
                            total: total
                        });
                        summary.totalPresent += present;
                        summary.totalAbsent += absent;
                        summary.totalStudents += total;
                    });
                } catch (e) {
                    summary.classes = [];
                    summary.totalPresent = 0;
                    summary.totalAbsent = 0;
                    summary.totalStudents = 0;
                }
                if (summary.totalStudents > 0) {
                    summary.presentPct = Math.round((summary.totalPresent * 100) / summary.totalStudents);
                    summary.absentPct = Math.round((summary.totalAbsent * 100) / summary.totalStudents);
                } else {
                    summary.presentPct = 0;
                    summary.absentPct = 0;
                }
                return summary;
            },

            buildUpcomingItems: function (assignments, liveClasses) {
                var items = [];
                var today = new Date();

                try {
                    (assignments || []).forEach(function (a) {
                        var label = a.title || 'Assignment';
                        var subtitle = (a.classes && a.classes.join(', ')) || '';
                        var timeLabel = '';
                        if (a.dueDate) {
                            var d = new Date(a.dueDate);
                            timeLabel = d.toLocaleDateString();
                        } else if (a.createdAt) {
                            var c = new Date(a.createdAt);
                            timeLabel = 'Created · ' + c.toLocaleDateString();
                        }
                        items.push({
                            type: 'assessment',
                            title: label,
                            subtitle: subtitle,
                            time: timeLabel,
                            location: 'Classroom',
                            icon: 'fa-clipboard-check',
                            color: 'orange',
                            urgency: 'medium'
                        });
                    });
                } catch (e) {
                    console.warn('Failed to process assignments for upcoming items:', e);
                }

                try {
                    (liveClasses || []).forEach(function (cls) {
                        if (!cls) return;
                        var status = cls.status || 'upcoming';
                        var urgency = 'low';
                        if (status === 'live') urgency = 'now';
                        else if (status === 'upcoming') urgency = 'soon';
                        items.push({
                            type: 'lesson',
                            title: cls.title || 'Live class',
                            subtitle: cls.topic || '',
                            time: cls.scheduledAt || cls.startedAt ? new Date(cls.scheduledAt || cls.startedAt).toLocaleString() : '',
                            location: cls.roomName || 'Online',
                            icon: 'fa-chalkboard-teacher',
                            color: 'indigo',
                            urgency: urgency
                        });
                    });
                } catch (e) {
                    console.warn('Failed to process live classes for upcoming items:', e);
                }

                // Sort by urgency / time (very lightweight)
                try {
                    items.sort(function (a, b) {
                        var order = { now: 0, high: 1, soon: 2, medium: 3, low: 4 };
                        var ua = order[a.urgency] != null ? order[a.urgency] : 99;
                        var ub = order[b.urgency] != null ? order[b.urgency] : 99;
                        if (ua !== ub) return ua - ub;
                        return String(a.title || '').localeCompare(String(b.title || ''));
                    });
                } catch (e) {
                    console.warn('Failed to sort upcoming items:', e);
                }

                return items;
            },

            buildExamTestOverview: function (myClasses) {
                // Synchronous fallback - kept for compatibility
                return {
                    unpublishedCount: 0,
                    recentCount: 0,
                    averageScore: null,
                    pendingMarks: 0
                };
            },

            async buildExamTestOverviewAsync() {
                var self = this;
                var overview = {
                    unpublishedCount: 0,
                    recentCount: 0,
                    averageScore: null,
                    pendingMarks: 0
                };

                // Fetch class tests from API
                try {
                    var classTests = await this.safeFetchJson('/api/teacher/class-tests');
                    if (Array.isArray(classTests)) {
                        var draftCount = 0;
                        var publishedCount = 0;
                        var oneWeekAgo = new Date();
                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

                        classTests.forEach(function (test) {
                            if (!test) return;
                            if (test.status === 'draft') draftCount++;
                            if (test.status === 'published') publishedCount++;
                            if (test.created_at && new Date(test.created_at) >= oneWeekAgo) {
                                overview.recentCount++;
                            }
                        });

                        overview.unpublishedCount = draftCount;
                        overview.pendingMarks = draftCount;
                    }
                } catch (e) {
                    console.warn('Failed to load class tests from API', e);
                    // Fallback to localStorage
                    try {
                        var classTestsData = localStorage.getItem('shikola_teacher_class_tests');
                        if (classTestsData) {
                            var testsData = JSON.parse(classTestsData);
                            if (Array.isArray(testsData.tests)) {
                                testsData.tests.forEach(function (test) {
                                    if (test && test.status === 'pending') overview.pendingMarks++;
                                });
                            }
                        }
                    } catch (e2) {
                        console.warn('Failed to load class tests from localStorage:', e2);
                    }
                }

                return overview;
            },

            attachRealtimeListeners: function () {
                var self = this;

                // Attendance changes
                window.addEventListener('shikola:attendance-updated', function () {
                    self.refreshDashboard();
                });

                // Classes changes
                window.addEventListener('shikola:classes-updated', function () {
                    self.refreshDashboard();
                });

                // Exam marks changes
                window.addEventListener('shikola:exam-mark-added', function () {
                    self.refreshDashboard();
                });

                // Class test marks changes (if events exist)
                window.addEventListener('shikola:class-test-marks-saved', function () {
                    self.refreshDashboard();
                });

                // Teacher-specific events
                window.addEventListener('shikola:assignment-created', function (evt) {
                    self.refreshDashboard();
                    // Add notification
                    if (window.ShikolaNotifications) {
                        window.ShikolaNotifications.add({
                            title: 'New Assignment Created',
                            message: evt.detail ? evt.detail.title || 'Assignment created' : 'Assignment created',
                            link: 'class-tests.html'
                        });
                    }
                });

                window.addEventListener('shikola:live-class-started', function (evt) {
                    self.refreshDashboard();
                    // Add notification
                    if (window.ShikolaNotifications) {
                        window.ShikolaNotifications.add({
                            title: 'Live Class Started',
                            message: evt.detail ? evt.detail.title || 'Live class is now active' : 'Live class is now active',
                            link: 'my-timetable.html'
                        });
                    }
                });

                window.addEventListener('shikola:class-scheduled', function (evt) {
                    self.refreshDashboard();
                    // Add notification
                    if (window.ShikolaNotifications) {
                        window.ShikolaNotifications.add({
                            title: 'Class Scheduled',
                            message: evt.detail ? evt.detail.subject + ' - ' + evt.detail.className : 'New class scheduled',
                            link: 'my-timetable.html'
                        });
                    }
                });

                // Storage changes (cross-tab sync)
                window.addEventListener('storage', function () {
                    self.refreshDashboard();
                });

                // Window focus (refresh when user returns)
                window.addEventListener('focus', function () {
                    self.refreshDashboard();
                });
            },

            // Initialize search suggestions
            async initializeSearchSuggestions() {
                var self = this;
                try {
                    var suggestions = await this.loadSearchSuggestions();
                    // Make suggestions available to the search component
                    if (window.Alpine && window.Alpine.store) {
                        window.Alpine.store('searchSuggestions', suggestions);
                    }
                } catch (e) {
                    console.warn('Failed to initialize search suggestions:', e);
                }
            },

            // View All Schedule function
            viewAllSchedule: function() {
                // Navigate to a comprehensive schedule view or expand current view
                window.location.href = 'my-timetable.html';
            },

            // Enhanced search with autocomplete
            async loadSearchSuggestions() {
                var suggestions = [];
                try {
                    // Get classes
                    var classesData = await this.safeFetchJson('/api/teacher/my-classes');
                    if (classesData && Array.isArray(classesData.classes)) {
                        classesData.classes.forEach(function(cls) {
                            suggestions.push({
                                name: cls.name || cls.title || 'Class',
                                type: 'class',
                                icon: 'fa-chalkboard',
                                url: 'classes.html'
                            });
                        });
                    }

                    // Get pupils
                    var pupilsData = await this.safeFetchJson('/api/teacher/pupils');
                    if (Array.isArray(pupilsData)) {
                        pupilsData.forEach(function(pupil) {
                            suggestions.push({
                                name: pupil.name || 'Student',
                                type: 'pupil',
                                icon: 'fa-user-graduate',
                                url: 'classes.html#students'
                            });
                        });
                    }

                    // Get assignments/assessments
                    var assignmentsData = await this.safeFetchJson('/api/teacher/assignments');
                    if (Array.isArray(assignmentsData)) {
                        assignmentsData.forEach(function(assignment) {
                            suggestions.push({
                                name: assignment.title || 'Assignment',
                                type: 'assessment',
                                icon: 'fa-clipboard-check',
                                url: 'class-tests.html'
                            });
                        });
                    }
                } catch (e) {
                    console.warn('Failed to load search suggestions:', e);
                }
                return suggestions;
            },

            // Cross-portal data fetching
            async fetchCrossPortalData() {
                var self = this;
                try {
                    // Fetch timetable data
                    var timetableData = await this.safeFetchJson('/api/teacher/timetable');
                    if (Array.isArray(timetableData)) {
                        this.processTimetableData(timetableData);
                    }

                    // Fetch live classes for real-time updates
                    var liveClassesData = await this.safeFetchJson('/api/teacher/live-classes');
                    if (Array.isArray(liveClassesData)) {
                        this.processLiveClassesData(liveClassesData);
                    }

                    // Listen for real-time events from other portals
                    this.setupCrossPortalListeners();
                } catch (e) {
                    console.warn('Failed to fetch cross-portal data:', e);
                }
            },

            processTimetableData: function(timetable) {
                var self = this;
                var today = new Date().toISOString().slice(0, 10);
                var upcomingScheduleItems = [];

                timetable.forEach(function(item) {
                    if (!item || !item.date) return;
                    
                    var itemDate = new Date(item.date).toISOString().slice(0, 10);
                    var isToday = itemDate === today;
                    var isFuture = itemDate > today;

                    if (isToday || isFuture) {
                        upcomingScheduleItems.push({
                            type: 'lesson',
                            title: item.subject || 'Lesson',
                            subtitle: item.className || 'Class',
                            time: item.startTime ? new Date(item.date + ' ' + item.startTime).toLocaleString() : item.date,
                            location: item.room || 'Classroom',
                            icon: 'fa-chalkboard-teacher',
                            color: isToday ? 'emerald' : 'indigo',
                            urgency: isToday ? 'now' : 'soon'
                        });
                    }
                });

                // Merge with existing upcoming items
                if (upcomingScheduleItems.length > 0) {
                    this.upcomingItems = this.upcomingItems.concat(upcomingScheduleItems);
                    this.sortUpcomingItems();
                }
            },

            processLiveClassesData: function(liveClasses) {
                var self = this;
                var liveScheduleItems = [];

                liveClasses.forEach(function(cls) {
                    if (!cls) return;
                    
                    liveScheduleItems.push({
                        type: 'live-class',
                        title: cls.title || 'Live Class',
                        subtitle: cls.topic || '',
                        time: cls.scheduledAt ? new Date(cls.scheduledAt).toLocaleString() : '',
                        location: cls.roomName || 'Online',
                        icon: 'fa-video',
                        color: cls.status === 'live' ? 'emerald' : 'indigo',
                        urgency: cls.status === 'live' ? 'now' : 'soon'
                    });
                });

                // Merge with existing upcoming items
                if (liveScheduleItems.length > 0) {
                    this.upcomingItems = this.upcomingItems.concat(liveScheduleItems);
                    this.sortUpcomingItems();
                }
            },

            setupCrossPortalListeners: function() {
                var self = this;
                
                // Listen for events from other portals
                window.addEventListener('shikola:class-scheduled', function(e) {
                    self.refreshDashboard();
                });

                window.addEventListener('shikola:assignment-created', function(e) {
                    self.refreshDashboard();
                });

                window.addEventListener('shikola:live-class-started', function(e) {
                    self.refreshDashboard();
                });

                // Listen for storage events from other tabs/portals
                window.addEventListener('storage', function(e) {
                    if (e.key && e.key.includes('shikola_')) {
                        self.refreshDashboard();
                    }
                });
            },

            sortUpcomingItems: function() {
                var self = this;
                try {
                    this.upcomingItems.sort(function(a, b) {
                        var order = { now: 0, high: 1, soon: 2, medium: 3, low: 4 };
                        var ua = order[a.urgency] != null ? order[a.urgency] : 99;
                        var ub = order[b.urgency] != null ? order[b.urgency] : 99;
                        if (ua !== ub) return ua - ub;
                        
                        // Sort by time if urgency is same
                        var timeA = new Date(a.time || 0);
                        var timeB = new Date(b.time || 0);
                        return timeA - timeB;
                    });
                } catch (e) {
                    console.warn('Failed to sort upcoming items:', e);
                }
            },

            // Teaching activity fallback when no data
            getTeachingActivityFallback: function() {
                // No mock data - requires real backend data
                return {
                    lessons: [],
                    assessments: [],
                    attendance: []
                };
            },

            // Helpers reused by the Upcoming Schedule UI
            getItemColor: function (item) {
                switch (item && item.color) {
                    case 'slate': return 'bg-slate-100 text-slate-500';
                    case 'orange': return 'bg-orange-100 text-orange-500';
                    case 'indigo': return 'bg-indigo-100 text-indigo-500';
                    case 'emerald': return 'bg-emerald-100 text-emerald-500';
                    case 'purple': return 'bg-purple-100 text-purple-500';
                    default: return 'bg-slate-100 text-slate-500';
                }
            },

            getUrgencyBadge: function (item) {
                switch (item && item.urgency) {
                    case 'now': return 'bg-red-100 text-red-600 animate-pulse';
                    case 'high': return 'bg-orange-100 text-orange-600';
                    case 'medium': return 'bg-blue-100 text-blue-600';
                    case 'soon': return 'bg-emerald-100 text-emerald-600';
                    case 'low': return 'bg-slate-100 text-slate-600';
                    default: return 'bg-slate-100 text-slate-600';
                }
            },

            getTypeLabel: function (item) {
                if (!item) return '';
                switch (item.type) {
                    case 'lesson': return 'Lesson';
                    case 'assessment': return 'Assessment';
                    case 'exam': return 'Exam';
                    case 'live-class': return 'Live Class';
                    case 'meeting': return 'Meeting';
                    default: return String(item.type || '');
                }
            },

            // PDF, CSV, and Print functionality
            generatePDFReport: function(type) {
                try {
                    if (type === 'student') {
                        this.generateStudentPDF();
                    } else if (type === 'class') {
                        this.generateClassPDF();
                    } else {
                        this.generateDashboardPDF();
                    }
                } catch (e) {
                    console.error('PDF generation failed:', e);
                    this.showNotification('Failed to generate PDF report');
                }
            },

            generateStudentPDF: function() {
                if (!this.selectedStudent) {
                    this.showNotification('Please select a student first');
                    return;
                }

                try {
                    // Use jsPDF library if available, otherwise fallback to browser print
                    if (window.jspdf && window.jspdf.jsPDF) {
                        const jsPDF = window.jspdf.jsPDF;
                        const doc = new jsPDF('p', 'pt', 'a4');
                        
                        // Add title
                        doc.setFontSize(16);
                        doc.text('Student Attendance Report', 40, 40);
                        
                        // Add student info
                        doc.setFontSize(12);
                        doc.text('Student: ' + this.selectedStudent, 40, 70);
                        doc.text('Generated: ' + new Date().toLocaleDateString(), 40, 90);
                        
                        // Create attendance data table
                        if (this.attendanceSummary) {
                            const attendanceData = [
                                ['Metric', 'Count', 'Percentage'],
                                ['Present Days', this.attendanceSummary.totalPresent, this.attendanceSummary.presentPct + '%'],
                                ['Absent Days', this.attendanceSummary.totalAbsent, this.attendanceSummary.absentPct + '%'],
                                ['Total Days', this.attendanceSummary.totalStudents, '100%']
                            ];
                            
                            doc.autoTable({
                                head: [attendanceData[0]],
                                body: attendanceData.slice(1),
                                startY: 120,
                                styles: { fontSize: 10, cellPadding: 5 },
                                headStyles: { fillColor: [15, 23, 42], textColor: 255 },
                                alternateRowStyles: { fillColor: [245, 245, 245] }
                            });
                            
                            // Add weekly breakdown if available
                            const weeklyData = [
                                ['Week', 'Present', 'Absent', 'Percentage']
                            ];
                            
                            doc.autoTable({
                                head: [weeklyData[0]],
                                body: weeklyData.slice(1),
                                startY: doc.lastAutoTable.finalY + 20,
                                styles: { fontSize: 10, cellPadding: 5 },
                                headStyles: { fillColor: [15, 23, 42], textColor: 255 },
                                alternateRowStyles: { fillColor: [245, 245, 245] }
                            });
                        }
                        
                        // Save the PDF
                        const filename = 'student-attendance-' + this.selectedStudent.replace(/\s+/g, '_') + '.pdf';
                        doc.save(filename);
                        this.showNotification('Student attendance PDF downloaded successfully');
                    } else {
                        // Fallback to print
                        this.printReport('student');
                    }
                } catch (e) {
                    console.error('Student PDF generation failed:', e);
                    this.showNotification('Failed to generate student PDF');
                }
            },

            generateClassPDF: function() {
                try {
                    if (window.jspdf && window.jspdf.jsPDF) {
                        const jsPDF = window.jspdf.jsPDF;
                        const doc = new jsPDF('l', 'pt', 'a4');
                        
                        // Add title
                        doc.setFontSize(16);
                        doc.text('Class Attendance Report', 40, 40);
                        
                        // Add class info
                        doc.setFontSize(12);
                        doc.text('Total Students: ' + this.studentsThisTerm, 40, 70);
                        doc.text('Generated: ' + new Date().toLocaleDateString(), 40, 90);
                        
                        // Create class summary table - requires real data from backend
                        const classSummaryData = [
                            ['Class Name', 'Total Students', 'Average Attendance', 'Status']
                        ];
                        
                        doc.autoTable({
                            head: [classSummaryData[0]],
                            body: classSummaryData.slice(1),
                            startY: 120,
                            styles: { fontSize: 10, cellPadding: 5 },
                            headStyles: { fillColor: [15, 23, 42], textColor: 255 },
                            alternateRowStyles: { fillColor: [245, 245, 245] }
                        });
                        
                        // Add weekly attendance breakdown - requires backend API
                        const weeklyAttendanceData = [
                            ['Week', 'Mathematics', 'English', 'Science', 'History', 'Overall %']
                        ];
                        
                        doc.autoTable({
                            head: [weeklyAttendanceData[0]],
                            body: weeklyAttendanceData.slice(1),
                            startY: doc.lastAutoTable.finalY + 20,
                            styles: { fontSize: 10, cellPadding: 5 },
                            headStyles: { fillColor: [15, 23, 42], textColor: 255 },
                            alternateRowStyles: { fillColor: [245, 245, 245] }
                        });
                        
                        // Save the PDF
                        const filename = 'class-attendance-report-' + new Date().toISOString().slice(0, 10) + '.pdf';
                        doc.save(filename);
                        this.showNotification('Class attendance PDF report downloaded successfully');
                    } else {
                        // Fallback to print
                        this.printReport('class');
                    }
                } catch (e) {
                    console.error('Class PDF generation failed:', e);
                    this.showNotification('Failed to generate class PDF');
                }
            },

            generateDashboardPDF: function() {
                try {
                    if (window.jspdf && window.jspdf.jsPDF) {
                        const jsPDF = window.jspdf.jsPDF;
                        const doc = new jsPDF('p', 'pt', 'a4');
                        
                        // Add title
                        doc.setFontSize(16);
                        doc.text('Teacher Dashboard Report', 40, 40);
                        
                        // Add summary info
                        doc.setFontSize(12);
                        doc.text('Report Generated: ' + new Date().toLocaleDateString(), 40, 70);
                        doc.text('Teacher: ' + (this.user ? this.user.name : 'Current User'), 40, 90);
                        
                        // Create dashboard summary table
                        const summaryData = [
                            ['Metric', 'Value', 'Status'],
                            ['My Classes', this.myClassesCount, this.myClassesCount > 0 ? 'Active' : 'None'],
                            ['Students This Term', this.studentsThisTerm, this.studentsThisTerm > 0 ? 'Enrolled' : 'None'],
                            ['Assessments to Mark', this.assessmentsToMark, this.assessmentsToMark > 0 ? 'Pending' : 'Complete'],
                            ['Lessons This Week', this.teachingLessonsWeek, this.teachingLessonsWeek > 0 ? 'Scheduled' : 'None'],
                            ['Average Attendance', this.teachingAttendanceAvg + '%', this.teachingAttendanceAvg >= 90 ? 'Good' : 'Needs Improvement']
                        ];
                        
                        doc.autoTable({
                            head: [summaryData[0]],
                            body: summaryData.slice(1),
                            startY: 120,
                            styles: { fontSize: 10, cellPadding: 5 },
                            headStyles: { fillColor: [15, 23, 42], textColor: 255 },
                            alternateRowStyles: { fillColor: [245, 245, 245] }
                        });
                        
                        // Add teaching activity breakdown - requires real data
                        const activityData = [
                            ['Day', 'Lessons', 'Assessments', 'Attendance %']
                        ];
                        
                        doc.autoTable({
                            head: [activityData[0]],
                            body: activityData.slice(1),
                            startY: doc.lastAutoTable.finalY + 20,
                            styles: { fontSize: 10, cellPadding: 5 },
                            headStyles: { fillColor: [15, 23, 42], textColor: 255 },
                            alternateRowStyles: { fillColor: [245, 245, 245] }
                        });
                        
                        // Add upcoming items summary
                        if (this.upcomingItems && this.upcomingItems.length > 0) {
                            const upcomingData = [
                                ['Activity', 'Time', 'Priority', 'Type']
                            ];
                            
                            this.upcomingItems.slice(0, 5).forEach(function(item) {
                                upcomingData.push([
                                    item.title || 'Activity',
                                    item.time || 'TBD',
                                    item.urgency || 'medium',
                                    item.type || 'general'
                                ]);
                            });
                            
                            doc.autoTable({
                                head: [upcomingData[0]],
                                body: upcomingData.slice(1),
                                startY: doc.lastAutoTable.finalY + 20,
                                styles: { fontSize: 10, cellPadding: 5 },
                                headStyles: { fillColor: [15, 23, 42], textColor: 255 },
                                alternateRowStyles: { fillColor: [245, 245, 245] }
                            });
                        }
                        
                        // Save the PDF
                        const filename = 'dashboard-report-' + new Date().toISOString().slice(0, 10) + '.pdf';
                        doc.save(filename);
                        this.showNotification('Dashboard PDF report downloaded successfully');
                    } else {
                        // Fallback to print
                        this.printReport();
                    }
                } catch (e) {
                    console.error('Dashboard PDF generation failed:', e);
                    this.showNotification('Failed to generate dashboard PDF');
                }
            },

            printReport: function(type) {
                try {
                    // Create a new window for printing with spreadsheet-like content
                    const printWindow = window.open('', '_blank');
                    let printContent = '';
                    
                    if (type === 'student') {
                        printContent = this.generateStudentPrintContent();
                    } else if (type === 'class') {
                        printContent = this.generateClassPrintContent();
                    } else {
                        printContent = this.generateDashboardPrintContent();
                    }
                    
                    printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Report</title>
                            <style>
                                body { 
                                    font-family: Arial, sans-serif; 
                                    margin: 20px; 
                                    font-size: 12px;
                                }
                                table { 
                                    border-collapse: collapse; 
                                    width: 100%; 
                                    margin-bottom: 20px;
                                }
                                th, td { 
                                    border: 1px solid #ddd; 
                                    padding: 8px; 
                                    text-align: left; 
                                }
                                th { 
                                    background-color: #f2f2f2; 
                                    font-weight: bold;
                                }
                                .header { 
                                    font-size: 16px; 
                                    font-weight: bold; 
                                    margin-bottom: 10px; 
                                }
                                .summary { 
                                    margin-bottom: 20px; 
                                }
                                @media print { 
                                    body { margin: 10px; }
                                    .no-print { display: none; }
                                }
                            </style>
                        </head>
                        <body>
                            ${printContent}
                            <script>
                                window.onload = function() {
                                    window.print();
                                    window.close();
                                }
                            </script>
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                    this.showNotification('Print dialog opened');
                } catch (e) {
                    console.error('Print failed:', e);
                    window.print(); // Ultimate fallback
                }
            },

            generateStudentPrintContent: function() {
                let content = `
                    <div class="header">Student Attendance Report</div>
                    <div class="summary">
                        <p><strong>Student:</strong> ${this.selectedStudent || 'N/A'}</p>
                        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                `;
                
                if (this.attendanceSummary) {
                    content += `
                        <table>
                            <thead>
                                <tr>
                                    <th>Metric</th>
                                    <th>Count</th>
                                    <th>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Present Days</td>
                                    <td>${this.attendanceSummary.totalPresent}</td>
                                    <td>${this.attendanceSummary.presentPct}%</td>
                                </tr>
                                <tr>
                                    <td>Absent Days</td>
                                    <td>${this.attendanceSummary.totalAbsent}</td>
                                    <td>${this.attendanceSummary.absentPct}%</td>
                                </tr>
                                <tr>
                                    <td>Total Days</td>
                                    <td>${this.attendanceSummary.totalStudents}</td>
                                    <td>100%</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                    
                    // Add weekly breakdown - requires real data
                    content += `
                        <table>
                            <thead>
                                <tr>
                                    <th>Week</th>
                                    <th>Present</th>
                                    <th>Absent</th>
                                    <th>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td colspan="4">No weekly data available</td></tr>
                            </tbody>
                        </table>
                    `;
                }
                
                return content;
            },

            generateClassPrintContent: function() {
                let content = `
                    <div class="header">Class Attendance Report</div>
                    <div class="summary">
                        <p><strong>Total Students:</strong> ${this.studentsThisTerm}</p>
                        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                `;
                
                // Class summary table - requires real data
                content += `
                    <table>
                        <thead>
                            <tr>
                                <th>Class Name</th>
                                <th>Total Students</th>
                                <th>Average Attendance</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="4">No class data available</td></tr>
                        </tbody>
                    </table>
                `;
                
                // Weekly attendance breakdown - requires real data
                content += `
                    <table>
                        <thead>
                            <tr>
                                <th>Week</th>
                                <th>Mathematics</th>
                                <th>English</th>
                                <th>Science</th>
                                <th>History</th>
                                <th>Overall %</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="6">No weekly attendance data available</td></tr>
                        </tbody>
                    </table>
                `;
                
                return content;
            },

            generateDashboardPrintContent: function() {
                let content = `
                    <div class="header">Teacher Dashboard Report</div>
                    <div class="summary">
                        <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString()}</p>
                        <p><strong>Teacher:</strong> ${this.user ? this.user.name : 'Current User'}</p>
                    </div>
                `;
                
                // Dashboard summary table
                content += `
                    <table>
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Value</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>My Classes</td><td>${this.myClassesCount}</td><td>${this.myClassesCount > 0 ? 'Active' : 'None'}</td></tr>
                            <tr><td>Students This Term</td><td>${this.studentsThisTerm}</td><td>${this.studentsThisTerm > 0 ? 'Enrolled' : 'None'}</td></tr>
                            <tr><td>Assessments to Mark</td><td>${this.assessmentsToMark}</td><td>${this.assessmentsToMark > 0 ? 'Pending' : 'Complete'}</td></tr>
                            <tr><td>Lessons This Week</td><td>${this.teachingLessonsWeek}</td><td>${this.teachingLessonsWeek > 0 ? 'Scheduled' : 'None'}</td></tr>
                            <tr><td>Average Attendance</td><td>${this.teachingAttendanceAvg}%</td><td>${this.teachingAttendanceAvg >= 90 ? 'Good' : 'Needs Improvement'}</td></tr>
                        </tbody>
                    </table>
                `;
                
                // Teaching activity breakdown - requires real data
                content += `
                    <table>
                        <thead>
                            <tr>
                                <th>Day</th>
                                <th>Lessons</th>
                                <th>Assessments</th>
                                <th>Attendance %</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="4">No teaching activity data available</td></tr>
                        </tbody>
                    </table>
                `;
                
                return content;
            },

            generateCSV: function(type) {
                try {
                    let csvData = [];
                    let filename = '';
                    
                    if (type === 'students') {
                        // Generate student data CSV
                        csvData = [
                            ['Student Name', 'Class', 'Attendance %', 'Status']
                        ];
                        
                        // Add real data from backend API (requires database connection)
                        if (this.myClasses && this.myClasses.length > 0) {
                            this.myClasses.forEach(function(cls) {
                                csvData.push([cls.name || cls.title || 'Student', cls.className || 'N/A', 'N/A', 'N/A']);
                            });
                        }
                        
                        filename = 'students-' + new Date().toISOString().slice(0, 10) + '.csv';
                    } else if (type === 'attendance') {
                        // Generate attendance data CSV
                        csvData = [
                            ['Date', 'Class', 'Present', 'Absent', 'Total', 'Percentage']
                        ];
                        
                        if (this.attendanceSummary) {
                            csvData.push([
                                new Date().toISOString().slice(0, 10),
                                'All Classes',
                                this.attendanceSummary.totalPresent,
                                this.attendanceSummary.totalAbsent,
                                this.attendanceSummary.totalStudents,
                                this.attendanceSummary.presentPct + '%'
                            ]);
                        }
                        
                        filename = 'attendance-' + new Date().toISOString().slice(0, 10) + '.csv';
                    } else {
                        // Generate dashboard summary CSV
                        csvData = [
                            ['Metric', 'Value'],
                            ['My Classes', this.myClassesCount],
                            ['Students This Term', this.studentsThisTerm],
                            ['Assessments to Mark', this.assessmentsToMark],
                            ['Lessons This Week', this.teachingLessonsWeek],
                            ['Assessments This Week', this.teachingAssessmentsWeek],
                            ['Average Attendance', this.teachingAttendanceAvg + '%']
                        ];
                        
                        filename = 'dashboard-summary-' + new Date().toISOString().slice(0, 10) + '.csv';
                    }
                    
                    if (window.shikolaExportPrint && typeof window.shikolaExportPrint.exportToCSV === 'function') {
                        window.shikolaExportPrint.exportToCSV(csvData, filename);
                        this.showNotification('CSV exported successfully');
                    } else {
                        // Fallback CSV generation
                        this.downloadCSV(csvData, filename);
                    }
                } catch (e) {
                    console.error('CSV generation failed:', e);
                    this.showNotification('Failed to generate CSV');
                }
            },

            downloadCSV: function(data, filename) {
                try {
                    let csvContent = '';
                    data.forEach(function(row) {
                        if (Array.isArray(row)) {
                            csvContent += row.join(',') + '\n';
                        } else {
                            csvContent += row + '\n';
                        }
                    });
                    
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    link.click();
                    
                    window.URL.revokeObjectURL(url);
                    this.showNotification('CSV downloaded successfully');
                } catch (e) {
                    console.error('CSV download failed:', e);
                    this.showNotification('Failed to download CSV');
                }
            },

            showStudentReport: function(student) {
                this.selectedStudent = student;
                // In a real implementation, this would show a detailed student report
                this.showNotification('Student report for: ' + student);
            },

            showNotification: function(message) {
                // Simple notification system
                console.log('[Teacher Dashboard]', message);
                // You could also integrate with a proper notification system here
            }
        };
    }

    // Expose a global initDashboard function for Alpine.js
    window.initDashboard = function() {
        const dashboard = window.teacherDashboardData();
        if (dashboard && typeof dashboard.initDashboard === 'function') {
            return dashboard.initDashboard();
        }
    };

    window.teacherDashboardData = teacherDashboardData;
})(window);
