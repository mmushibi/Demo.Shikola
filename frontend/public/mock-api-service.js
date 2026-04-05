/*
Shikola Mock API Service
Provides mock API responses for demo purposes
*/

(function() {
    'use strict';

    // Mock API service that simulates real API calls
    window.ShikolaMockAPI = {
        // Helper to simulate API delay
        delay: function(ms = 300) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        // Helper to get mock data from localStorage
        getMockData: function(key) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : [];
            } catch (error) {
                console.error(`Error loading mock data for ${key}:`, error);
                return [];
            }
        },

        // Helper to save mock data to localStorage
        saveMockData: function(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
            } catch (error) {
                console.error(`Error saving mock data for ${key}:`, error);
            }
        },

        // Simulate API response
        simulateResponse: async function(success, data = null, error = null) {
            await this.delay();
            if (success) {
                return {
                    success: true,
                    data: data,
                    message: 'Success',
                    timestamp: new Date().toISOString()
                };
            } else {
                return {
                    success: false,
                    error: error || 'An error occurred',
                    timestamp: new Date().toISOString()
                };
            }
        },

        // Assignments API
        assignments: {
            list: async function(filters = {}) {
                const assignments = window.ShikolaMockAPI.getMockData('shikola_mock_assignments');
                let filtered = assignments;

                // Apply filters
                if (filters.status) {
                    filtered = filtered.filter(a => a.status === filters.status);
                }
                if (filters.subject) {
                    filtered = filtered.filter(a => a.subject === filters.subject);
                }
                if (filters.priority) {
                    filtered = filtered.filter(a => a.priority === filters.priority);
                }

                return window.ShikolaMockAPI.simulateResponse(true, filtered);
            },

            get: async function(id) {
                const assignments = window.ShikolaMockAPI.getMockData('shikola_mock_assignments');
                const assignment = assignments.find(a => a.id === id);
                
                if (assignment) {
                    return window.ShikolaMockAPI.simulateResponse(true, assignment);
                } else {
                    return window.ShikolaMockAPI.simulateResponse(false, null, 'Assignment not found');
                }
            },

            submit: async function(id, submission) {
                const assignments = window.ShikolaMockAPI.getMockData('shikola_mock_assignments');
                const assignment = assignments.find(a => a.id === id);
                
                if (assignment) {
                    assignment.status = 'submitted';
                    assignment.submittedOn = new Date().toISOString().split('T')[0];
                    assignment.submission = submission;
                    
                    window.ShikolaMockAPI.saveMockData('shikola_mock_assignments', assignments);
                    return window.ShikolaMockAPI.simulateResponse(true, assignment);
                } else {
                    return window.ShikolaMockAPI.simulateResponse(false, null, 'Assignment not found');
                }
            }
        },

        // Attendance API
        attendance: {
            list: async function(pupilId, filters = {}) {
                const attendance = window.ShikolaMockAPI.getMockData('shikola_mock_attendance');
                let filtered = attendance.filter(a => a.pupilId === pupilId);

                if (filters.startDate) {
                    filtered = filtered.filter(a => a.date >= filters.startDate);
                }
                if (filters.endDate) {
                    filtered = filtered.filter(a => a.date <= filters.endDate);
                }

                return window.ShikolaMockAPI.simulateResponse(true, filtered);
            },

            getStats: async function(pupilId) {
                const attendance = window.ShikolaMockAPI.getMockData('shikola_mock_attendance');
                const pupilAttendance = attendance.filter(a => a.pupilId === pupilId);
                
                const stats = {
                    total: pupilAttendance.length,
                    present: pupilAttendance.filter(a => a.status === 'present').length,
                    absent: pupilAttendance.filter(a => a.status === 'absent').length,
                    late: pupilAttendance.filter(a => a.status === 'late').length,
                    excused: pupilAttendance.filter(a => a.status === 'excused').length,
                    percentage: 0
                };

                if (stats.total > 0) {
                    stats.percentage = Math.round(((stats.present + stats.excused) / stats.total) * 100);
                }

                return window.ShikolaMockAPI.simulateResponse(true, stats);
            }
        },

        // Grades API
        grades: {
            list: async function(pupilId, filters = {}) {
                const grades = window.ShikolaMockAPI.getMockData('shikola_mock_grades');
                let filtered = grades.filter(g => g.pupilId === pupilId);

                if (filters.subject) {
                    filtered = filtered.filter(g => g.subject === filters.subject);
                }
                if (filters.term) {
                    filtered = filtered.filter(g => g.term === filters.term);
                }
                if (filters.examType) {
                    filtered = filtered.filter(g => g.examType === filters.examType);
                }

                return window.ShikolaMockAPI.simulateResponse(true, filtered);
            },

            getAverage: async function(pupilId) {
                const grades = window.ShikolaMockAPI.getMockData('shikola_mock_grades');
                const pupilGrades = grades.filter(g => g.pupilId === pupilId);
                
                if (pupilGrades.length === 0) {
                    return window.ShikolaMockAPI.simulateResponse(true, { average: 0, count: 0 });
                }

                const totalPercentage = pupilGrades.reduce((sum, g) => sum + g.percentage, 0);
                const average = Math.round(totalPercentage / pupilGrades.length);

                return window.ShikolaMockAPI.simulateResponse(true, {
                    average: average,
                    count: pupilGrades.length,
                    grade: average >= 90 ? 'A+' : average >= 80 ? 'A' : average >= 70 ? 'B' : average >= 60 ? 'C' : average >= 50 ? 'D' : 'F'
                });
            },

            getSubjectAverages: async function(pupilId) {
                const grades = window.ShikolaMockAPI.getMockData('shikola_mock_grades');
                const pupilGrades = grades.filter(g => g.pupilId === pupilId);
                
                const subjectGroups = {};
                pupilGrades.forEach(grade => {
                    if (!subjectGroups[grade.subject]) {
                        subjectGroups[grade.subject] = [];
                    }
                    subjectGroups[grade.subject].push(grade.percentage);
                });

                const subjectAverages = {};
                Object.keys(subjectGroups).forEach(subject => {
                    const percentages = subjectGroups[subject];
                    const average = Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length);
                    subjectAverages[subject] = average;
                });

                return window.ShikolaMockAPI.simulateResponse(true, subjectAverages);
            }
        },

        // Timetable API
        timetable: {
            list: async function(classId, filters = {}) {
                const timetable = window.ShikolaMockAPI.getMockData('shikola_mock_timetable');
                let filtered = timetable.filter(t => t.classId === classId);

                if (filters.day) {
                    filtered = filtered.filter(t => t.day === filters.day);
                }
                if (filters.subject) {
                    filtered = filtered.filter(t => t.subject === filters.subject);
                }

                // Sort by time
                filtered.sort((a, b) => a.time.localeCompare(b.time));

                return window.ShikolaMockAPI.simulateResponse(true, filtered);
            },

            getTodaySchedule: async function(classId) {
                const timetable = window.ShikolaMockAPI.getMockData('shikola_mock_timetable');
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const today = days[new Date().getDay()];
                
                const todaySchedule = timetable.filter(t => 
                    t.classId === classId && t.day === today
                ).sort((a, b) => a.time.localeCompare(b.time));

                return window.ShikolaMockAPI.simulateResponse(true, todaySchedule);
            }
        },

        // Notifications API
        notifications: {
            list: async function(filters = {}) {
                const notifications = window.ShikolaMockAPI.getMockData('shikola_mock_notifications');
                let filtered = notifications;

                if (filters.type) {
                    filtered = filtered.filter(n => n.type === filters.type);
                }
                if (filters.read !== undefined) {
                    filtered = filtered.filter(n => n.read === filters.read);
                }

                return window.ShikolaMockAPI.simulateResponse(true, filtered);
            },

            markAsRead: async function(id) {
                const notifications = window.ShikolaMockAPI.getMockData('shikola_mock_notifications');
                const notification = notifications.find(n => n.id === id);
                
                if (notification) {
                    notification.read = true;
                    window.ShikolaMockAPI.saveMockData('shikola_mock_notifications', notifications);
                    return window.ShikolaMockAPI.simulateResponse(true, notification);
                } else {
                    return window.ShikolaMockAPI.simulateResponse(false, null, 'Notification not found');
                }
            },

            markAllAsRead: async function() {
                const notifications = window.ShikolaMockAPI.getMockData('shikola_mock_notifications');
                notifications.forEach(n => n.read = true);
                window.ShikolaMockAPI.saveMockData('shikola_mock_notifications', notifications);
                return window.ShikolaMockAPI.simulateResponse(true, notifications);
            },

            getUnreadCount: async function() {
                const notifications = window.ShikolaMockAPI.getMockData('shikola_mock_notifications');
                const unreadCount = notifications.filter(n => !n.read).length;
                return window.ShikolaMockAPI.simulateResponse(true, { count: unreadCount });
            }
        },

        // Pupil Profile API
        pupils: {
            getProfile: async function(pupilId) {
                const pupil = window.ShikolaMockAPI.getMockData('shikola_current_pupil');
                
                if (pupil && pupil.id === pupilId) {
                    return window.ShikolaMockAPI.simulateResponse(true, pupil);
                } else {
                    return window.ShikolaMockAPI.simulateResponse(false, null, 'Pupil not found');
                }
            },

            getCurrentPupil: async function() {
                const pupil = window.ShikolaMockAPI.getMockData('shikola_current_pupil');
                return window.ShikolaMockAPI.simulateResponse(true, pupil);
            }
        }
    };

    // Extend the existing ShikolaAPI if it exists, otherwise create it
    if (!window.ShikolaAPI) {
        window.ShikolaAPI = {};
    }

    // Merge mock API into ShikolaAPI
    Object.assign(window.ShikolaAPI, window.ShikolaMockAPI);

    // Initialize assignments data if needed
    if (window.ShikolaAssignmentsMockData) {
        window.ShikolaAssignmentsMockData.initializeAssignmentsData();
    }

    console.log('Shikola Mock API Service loaded');

})();
