/*
Pupil Dashboard Data Loader
Auto-generated mock data loader for Shikola Academy
Generated on 2026-04-05 17:33:00
*/

// Initialize dashboard data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
});

function loadDashboardData() {
    // Wait for mock data to be available
    if (typeof window.ShikolaPupilMockData === 'undefined') {
        setTimeout(loadDashboardData, 100);
        return;
    }

    const mockData = window.ShikolaPupilMockData;
    
    // Set up Alpine.js data for dashboard components
    if (typeof window.Alpine !== 'undefined') {
        // Academic Performance Card
        window.Alpine.data('pupilAcademicCard', () => ({
            academicStatus: 'Excellent',
            averageGrade: 'B+ (83.2%)',
            gradeSummary: '↑ 2.4% from last term',
            recentGrades: mockData.dashboardStats.academicPerformance.recentGrades,
            
            init() {
                this.loadAcademicData();
            },
            
            loadAcademicData() {
                const data = mockData.dashboardStats.academicPerformance;
                this.academicStatus = this.getAcademicStatus(data.averageScore);
                this.averageGrade = `${data.averageGrade} (${data.averageScore}%)`;
                this.gradeSummary = this.getProgressText(data.trend);
                this.recentGrades = data.recentGrades;
            },
            
            getAcademicStatus(score) {
                if (score >= 85) return 'Excellent';
                if (score >= 75) return 'Very Good';
                if (score >= 65) return 'Good';
                if (score >= 55) return 'Satisfactory';
                return 'Needs Improvement';
            },
            
            getProgressText(trend) {
                const arrows = { improving: '↑', declining: '↓', stable: '→' };
                const percentages = { improving: '2.4%', declining: '1.2%', stable: '0.0%' };
                return `${arrows[trend] || '→'} ${percentages[trend] || '0.0%'} from last term`;
            }
        }));
        
        // Assignment Card
        window.Alpine.data('pupilAssignmentCard', () => ({
            assignmentStatus: '5 Pending',
            pendingCount: 5,
            overdueCount: 1,
            recentAssignments: mockData.dashboardStats.assignments.recentAssignments,
            
            init() {
                this.loadAssignmentData();
            },
            
            loadAssignmentData() {
                const data = mockData.dashboardStats.assignments;
                this.pendingCount = data.pendingCount;
                this.overdueCount = data.overdueCount;
                this.assignmentStatus = `${data.pendingCount} Pending`;
                this.recentAssignments = data.recentAssignments;
            },
            
            formatDate(dateString) {
                return mockData.formatDate(dateString);
            },
            
            getPriorityColor(priority) {
                const colors = {
                    high: 'text-red-600 bg-red-50',
                    medium: 'text-yellow-600 bg-yellow-50',
                    low: 'text-green-600 bg-green-50'
                };
                return colors[priority] || 'text-slate-600 bg-slate-50';
            }
        }));
        
        // Attendance Card
        window.Alpine.data('pupilAttendanceCard', () => ({
            attendanceRate: '95%',
            attendanceStatus: 'Excellent',
            thisMonth: 92,
            lastMonth: 88,
            attendanceTrend: 'up',
            
            init() {
                this.loadAttendanceData();
            },
            
            loadAttendanceData() {
                const data = mockData.dashboardStats.attendance;
                this.attendanceRate = `${data.percentage}%`;
                this.thisMonth = data.thisMonth;
                this.lastMonth = data.lastMonth;
                this.attendanceTrend = data.trend;
                this.attendanceStatus = this.getAttendanceStatus(data.percentage);
            },
            
            getAttendanceStatus(percentage) {
                if (percentage >= 95) return 'Excellent';
                if (percentage >= 90) return 'Very Good';
                if (percentage >= 85) return 'Good';
                if (percentage >= 80) return 'Satisfactory';
                return 'Poor';
            }
        }));
        
        // Timetable Card
        window.Alpine.data('pupilTimetableCard', () => ({
            nextLesson: 'Mathematics',
            nextLessonTime: '08:00 AM',
            nextLessonRoom: 'Room 201',
            nextLessonTeacher: 'Daniel Chileshe',
            todayLessons: 6,
            
            init() {
                this.loadTimetableData();
            },
            
            loadTimetableData() {
                const data = mockData.dashboardStats.timetable;
                this.nextLesson = data.nextLesson;
                this.nextLessonTime = mockData.formatTime(data.nextLessonTime);
                this.nextLessonRoom = data.nextLessonRoom;
                this.nextLessonTeacher = data.nextLessonTeacher;
                this.todayLessons = data.todayLessons;
            }
        }));
        
        // Notifications Component
        window.Alpine.data('pupilNotifications', () => ({
            notifications: mockData.dashboardStats.notifications,
            unreadCount: 3,
            
            init() {
                this.updateUnreadCount();
            },
            
            updateUnreadCount() {
                this.unreadCount = this.notifications.filter(n => !n.read).length;
            },
            
            markAsRead(notificationId) {
                const notification = this.notifications.find(n => n.id === notificationId);
                if (notification) {
                    notification.read = true;
                    this.updateUnreadCount();
                }
            },
            
            markAllAsRead() {
                this.notifications.forEach(n => n.read = true);
                this.updateUnreadCount();
            },
            
            clearAll() {
                this.notifications = [];
                this.unreadCount = 0;
            },
            
            getTypeColor(type) {
                const colors = {
                    assignment: 'text-blue-600 bg-blue-50',
                    event: 'text-green-600 bg-green-50',
                    meeting: 'text-purple-600 bg-purple-50',
                    academic: 'text-orange-600 bg-orange-50',
                    sports: 'text-red-600 bg-red-50'
                };
                return colors[type] || 'text-slate-600 bg-slate-50';
            },
            
            getPriorityIcon(priority) {
                const icons = {
                    high: 'fas fa-exclamation-circle text-red-500',
                    medium: 'fas fa-info-circle text-yellow-500',
                    low: 'fas fa-check-circle text-green-500'
                };
                return icons[priority] || 'fas fa-info-circle text-slate-500';
            }
        }));
        
        // Upcoming Events Component
        window.Alpine.data('pupilUpcomingEvents', () => ({
            events: mockData.dashboardStats.upcomingEvents,
            
            init() {
                this.loadEvents();
            },
            
            loadEvents() {
                this.events = mockData.dashboardStats.upcomingEvents;
            },
            
            getTypeColor(type) {
                const colors = {
                    academic: 'bg-blue-100 text-blue-700',
                    sports: 'bg-green-100 text-green-700',
                    meeting: 'bg-purple-100 text-purple-700',
                    cultural: 'bg-orange-100 text-orange-700',
                    workshop: 'bg-pink-100 text-pink-700'
                };
                return colors[type] || 'bg-slate-100 text-slate-700';
            },
            
            formatDate(dateString) {
                return mockData.formatDate(dateString);
            }
        }));
        
        // Recent Activity Component
        window.Alpine.data('pupilRecentActivity', () => ({
            activities: [
                { type: 'assignment', title: 'Submitted Math Assignment', time: '2 hours ago', icon: 'fas fa-check-circle text-green-500' },
                { type: 'grade', title: 'New grade posted: Science - 79%', time: '5 hours ago', icon: 'fas fa-chart-line text-blue-500' },
                { type: 'attendance', title: 'Marked present for today', time: '1 day ago', icon: 'fas fa-user-check text-green-500' },
                { type: 'assignment', title: 'New assignment: English Essay', time: '2 days ago', icon: 'fas fa-book text-orange-500' },
                { type: 'event', title: 'Registered for Science Fair', time: '3 days ago', icon: 'fas fa-calendar text-purple-500' }
            ],
            
            init() {
                this.loadActivities();
            },
            
            loadActivities() {
                // Activities are already defined above
            }
        }));
        
        // Quick Actions Component
        window.Alpine.data('pupilQuickActions', () => ({
            actions: [
                { title: 'View Assignments', icon: 'fas fa-book', color: 'bg-blue-500', link: 'home-assignments.html' },
                { title: 'Check Grades', icon: 'fas fa-chart-line', color: 'bg-green-500', link: 'my-report-card.html' },
                { title: 'View Timetable', icon: 'fas fa-calendar-alt', color: 'bg-purple-500', link: 'my-timetable.html' },
                { title: 'Download Results', icon: 'fas fa-download', color: 'bg-orange-500', link: '#' }
            ],
            
            init() {
                this.loadActions();
            },
            
            loadActions() {
                // Actions are already defined above
            },
            
            handleAction(action) {
                if (action.link && action.link !== '#') {
                    window.location.href = action.link;
                } else if (action.title === 'Download Results') {
                    this.downloadResults();
                }
            },
            
            downloadResults() {
                // Simulate downloading results
                const link = document.createElement('a');
                link.href = '#';
                link.download = 'term-results.pdf';
                link.click();
                
                // Show success message
                this.showNotification('Results downloaded successfully!');
            },
            
            showNotification(message) {
                // Create a simple notification
                const notification = document.createElement('div');
                notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                notification.textContent = message;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.remove();
                }, 3000);
            }
        }));
        
        // Performance Chart Component
        window.Alpine.data('pupilPerformanceChart', () => ({
            chartData: {
                labels: ['Term 1', 'Term 2', 'Term 3'],
                datasets: [{
                    label: 'Average Score',
                    data: [80.8, 83.3, 85.4],
                    borderColor: 'rgb(249, 115, 22)',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    tension: 0.4
                }]
            },
            
            init() {
                this.loadChartData();
            },
            
            loadChartData() {
                // Chart data is already defined above
                // In a real implementation, this would initialize a chart library
            }
        }));
        
        // Subject Performance Component
        window.Alpine.data('pupilSubjectPerformance', () => ({
            subjects: [
                { name: 'Computer Studies', score: 92, grade: 'A+', color: 'bg-green-500' },
                { name: 'Social Studies', score: 91, grade: 'A+', color: 'bg-green-500' },
                { name: 'English', score: 89, grade: 'A', color: 'bg-blue-500' },
                { name: 'Civic Education', score: 90, grade: 'A', color: 'bg-blue-500' },
                { name: 'Mathematics', score: 85, grade: 'A', color: 'bg-blue-500' },
                { name: 'Geography', score: 86, grade: 'B+', color: 'bg-purple-500' },
                { name: 'History', score: 83, grade: 'B+', color: 'bg-purple-500' },
                { name: 'Biology', score: 80, grade: 'B+', color: 'bg-purple-500' }
            ],
            
            init() {
                this.loadSubjectData();
            },
            
            loadSubjectData() {
                // Subjects data is already defined above
            },
            
            getScoreColor(score) {
                if (score >= 90) return 'text-green-600';
                if (score >= 80) return 'text-blue-600';
                if (score >= 70) return 'text-purple-600';
                if (score >= 60) return 'text-yellow-600';
                return 'text-red-600';
            }
        }));
    }
}
