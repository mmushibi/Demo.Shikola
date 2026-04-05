/*
Shikola Teacher Mock Data Generator
Generates realistic mock data for teacher portal demo purposes
*/

(function() {
    'use strict';

    // Zambian names and data for realistic mock data
    const ZAMBIAN_DATA = {
        firstNames: {
            male: ['Chipo', 'John', 'Brian', 'Abraham', 'Emmanuel', 'Christopher', 'Felix', 'Issac', 'Kennedy', 'Moses', 'Oliver', 'Quinton', 'Samson', 'Umar', 'William', 'Xavier', 'Zachary', 'Benjamin', 'Daniel'],
            female: ['Mary', 'Patricia', 'Ruth', 'Beatrice', 'Grace', 'Hannah', 'Joyce', 'Linda', 'Nancy', 'Precious', 'Rachel', 'Taona', 'Victoria', 'Yvonne', 'Angela', 'Carol', 'Elizabeth']
        },
        lastNames: ['Bwalya', 'Mulenga', 'Phiri', 'Chanda', 'Nkhata', 'Tembo', 'Siamuleya', 'Kalaba', 'Mwale', 'Sakala', 'Chileshe', 'Moyo', 'Banda', 'Mwansa', 'Nyirenda', 'Simukonda'],
        subjects: ['Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Civic Education', 'Art', 'Music', 'Physical Education', 'Computer Studies', 'Agriculture', 'Business Studies', 'French', 'Religious Education', 'Economics', 'Accounting', 'Literature']
    };

    // Helper functions
    function getRandomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getRandomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    function formatTime(date) {
        return date.toTimeString().split(' ')[0].substring(0, 5);
    }

    // Generate teacher profile
    function generateTeacherProfile() {
        const gender = Math.random() > 0.5 ? 'male' : 'female';
        const firstName = getRandomItem(ZAMBIAN_DATA.firstNames[gender]);
        const lastName = getRandomItem(ZAMBIAN_DATA.lastNames);
        
        return {
            id: 'TCH-' + getRandomInt(100, 999),
            firstName: firstName,
            lastName: lastName,
            fullName: `${firstName} ${lastName}`,
            gender: gender === 'male' ? 'Male' : 'Female',
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@shikola.edu.zm`,
            phone: '+260' + getRandomInt(950000000, 979999999),
            employeeId: 'EMP' + getRandomInt(10000, 99999),
            department: getRandomItem(['Academic', 'Sciences', 'Languages', 'Arts', 'Physical Education']),
            qualification: getRandomItem(['Bachelor of Education', 'Master of Education', 'Postgraduate Diploma']),
            specialization: getRandomItem(ZAMBIAN_DATA.subjects),
            experience: getRandomInt(2, 15) + ' years',
            status: 'Active',
            joinDate: formatDate(getRandomDate(new Date('2015-01-01'), new Date('2024-12-31')))
        };
    }

    // Generate class data
    function generateClass(teacherId) {
        const grades = ['Grade 1A', 'Grade 2B', 'Grade 3A', 'Grade 4B', 'Grade 5A', 'Grade 6B', 'Grade 7A', 'Grade 8B', 'Grade 9A', 'Grade 10B', 'Grade 11A', 'Grade 12B'];
        
        return {
            id: 'CLS-' + getRandomInt(1000, 9999),
            name: getRandomItem(grades),
            subject: getRandomItem(ZAMBIAN_DATA.subjects),
            teacherId: teacherId,
            room: `Room ${getRandomInt(101, 210)}`,
            capacity: getRandomInt(25, 40),
            currentEnrollment: getRandomInt(20, 38),
            schedule: getRandomItem(['08:00-09:00', '09:00-10:00', '10:30-11:30', '11:30-12:30', '14:00-15:00', '15:00-16:00']),
            term: 'Term ' + getRandomInt(1, 3),
            academicYear: '2026'
        };
    }

    // Generate student data
    function generateStudent(classId) {
        const gender = Math.random() > 0.5 ? 'male' : 'female';
        const firstName = getRandomItem(ZAMBIAN_DATA.firstNames[gender]);
        const lastName = getRandomItem(ZAMBIAN_DATA.lastNames);
        
        return {
            id: 'STU-' + getRandomInt(1000, 9999),
            firstName: firstName,
            lastName: lastName,
            fullName: `${firstName} ${lastName}`,
            gender: gender === 'male' ? 'Male' : 'Female',
            classId: classId,
            admissionNumber: 'ADM' + getRandomInt(10000, 99999),
            dateOfBirth: formatDate(getRandomDate(new Date('2005-01-01'), new Date('2015-12-31'))),
            enrollmentDate: formatDate(getRandomDate(new Date('2020-01-01'), new Date('2025-01-01'))),
            status: getRandomItem(['Active', 'Active', 'Active', 'Transferred']),
            attendanceRate: getRandomInt(75, 98),
            averageGrade: getRandomInt(55, 95)
        };
    }

    // Generate attendance record
    function generateAttendanceRecord(classId, date) {
        const statuses = ['present', 'absent', 'late', 'excused'];
        const statusWeights = [0.8, 0.1, 0.05, 0.05]; // 80% present, 10% absent, 5% late, 5% excused
        
        let status;
        const rand = Math.random();
        let cumulative = 0;
        for (let i = 0; i < statusWeights.length; i++) {
            cumulative += statusWeights[i];
            if (rand < cumulative) {
                status = statuses[i];
                break;
            }
        }
        
        return {
            id: `ATT-${classId}-${formatDate(date)}`,
            classId: classId,
            date: formatDate(date),
            totalStudents: getRandomInt(25, 35),
            present: status === 'present' ? getRandomInt(20, 30) : getRandomInt(15, 25),
            absent: status === 'absent' ? getRandomInt(2, 5) : getRandomInt(1, 3),
            late: status === 'late' ? getRandomInt(1, 3) : getRandomInt(0, 2),
            excused: status === 'excused' ? getRandomInt(1, 2) : getRandomInt(0, 1),
            recordedBy: 'Teacher',
            notes: Math.random() > 0.8 ? getRandomItem(['Good attendance', 'Some students late', 'Medical excuses received']) : null
        };
    }

    // Generate timetable entry
    function generateTimetableEntry(classId, subject) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const times = ['08:00-09:00', '09:00-10:00', '10:30-11:30', '11:30-12:30', '14:00-15:00', '15:00-16:00'];
        
        return {
            id: `TT-${classId}-${getRandomInt(1000, 9999)}`,
            classId: classId,
            subject: subject,
            day: getRandomItem(days),
            time: getRandomItem(times),
            room: `Room ${getRandomInt(101, 210)}`,
            duration: getRandomInt(45, 90) + ' minutes',
            type: getRandomItem(['Regular Lesson', 'Practical', 'Lab Session', 'Tutorial'])
        };
    }

    // Generate assessment data
    function generateAssessment(classId, subject) {
        const types = ['Quiz', 'Test', 'Assignment', 'Project', 'Exam'];
        const type = getRandomItem(types);
        const now = new Date();
        const createdDate = getRandomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now);
        const dueDate = getRandomDate(new Date(now.getTime() + 24 * 60 * 60 * 1000), new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
        
        return {
            id: `ASM-${classId}-${getRandomInt(1000, 9999)}`,
            classId: classId,
            subject: subject,
            title: `${type} - ${subject}`,
            type: type,
            description: `Complete ${type.toLowerCase()} covering ${getRandomItem(['basic concepts', 'advanced topics', 'practical applications'])} of ${subject}.`,
            totalMarks: getRandomInt(50, 100),
            duration: getRandomInt(30, 120) + ' minutes',
            createdDate: formatDate(createdDate),
            dueDate: formatDate(dueDate),
            status: getRandomItem(['draft', 'published', 'completed']),
            submissionsCount: getRandomInt(15, 30),
            markedCount: type === 'Exam' ? 0 : getRandomInt(10, 25)
        };
    }

    // Generate report data
    function generateReport(classId, subject) {
        const reportTypes = ['Attendance Report', 'Performance Report', 'Grade Distribution', 'Class Progress'];
        const type = getRandomItem(reportTypes);
        
        return {
            id: `RPT-${classId}-${getRandomInt(1000, 9999)}`,
            classId: classId,
            subject: subject,
            title: type,
            type: type,
            generatedDate: formatDate(getRandomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date())),
            period: getRandomItem(['Weekly', 'Monthly', 'Termly']),
            status: getRandomItem(['generated', 'reviewed', 'submitted']),
            fileUrl: `reports/${type.toLowerCase().replace(' ', '_')}_${formatDate(new Date())}.pdf`,
            size: getRandomInt(100, 500) + ' KB'
        };
    }

    // Mock API for teachers
    window.ShikolaTeacherMockData = {
        // Generate complete teacher profile
        generateTeacherProfile: function() {
            return generateTeacherProfile();
        },

        // Generate classes for a teacher
        generateClasses: function(teacherId, count = 4) {
            const classes = [];
            for (let i = 0; i < count; i++) {
                classes.push(generateClass(teacherId));
            }
            return classes;
        },

        // Generate students for classes
        generateStudents: function(classes) {
            const students = [];
            classes.forEach(cls => {
                const studentCount = getRandomInt(20, 35);
                for (let i = 0; i < studentCount; i++) {
                    students.push(generateStudent(cls.id));
                }
            });
            return students;
        },

        // Generate attendance records
        generateAttendance: function(classes, days = 30) {
            const attendance = [];
            const now = new Date();
            
            for (let i = 0; i < days; i++) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                // Skip weekends
                if (date.getDay() === 0 || date.getDay() === 6) continue;
                
                classes.forEach(cls => {
                    attendance.push(generateAttendanceRecord(cls.id, date));
                });
            }
            
            return attendance.sort((a, b) => new Date(b.date) - new Date(a.date));
        },

        // Generate timetable
        generateTimetable: function(classes) {
            const timetable = [];
            classes.forEach(cls => {
                const entriesPerClass = getRandomInt(15, 25);
                for (let i = 0; i < entriesPerClass; i++) {
                    timetable.push(generateTimetableEntry(cls.id, cls.subject));
                }
            });
            return timetable;
        },

        // Generate assessments
        generateAssessments: function(classes, count = 20) {
            const assessments = [];
            for (let i = 0; i < count; i++) {
                const cls = getRandomItem(classes);
                assessments.push(generateAssessment(cls.id, cls.subject));
            }
            return assessments.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
        },

        // Generate reports
        generateReports: function(classes, count = 15) {
            const reports = [];
            for (let i = 0; i < count; i++) {
                const cls = getRandomItem(classes);
                reports.push(generateReport(cls.id, cls.subject));
            }
            return reports.sort((a, b) => new Date(b.generatedDate) - new Date(a.generatedDate));
        },

        // Initialize teacher mock data
        initializeTeacherMockData: function() {
            console.log('Initializing Shikola Teacher mock data...');
            
            // Generate teacher profile
            const teacher = this.generateTeacherProfile();
            localStorage.setItem('shikola_teacher_profile', JSON.stringify(teacher));
            
            // Generate classes
            const classes = this.generateClasses(teacher.id, 4);
            localStorage.setItem('shikola_teacher_classes', JSON.stringify(classes));
            
            // Generate students
            const students = this.generateStudents(classes);
            localStorage.setItem('shikola_teacher_students', JSON.stringify(students));
            
            // Generate attendance
            const attendance = this.generateAttendance(classes);
            localStorage.setItem('shikola_teacher_attendance', JSON.stringify(attendance));
            
            // Generate timetable
            const timetable = this.generateTimetable(classes);
            localStorage.setItem('shikola_teacher_timetable', JSON.stringify(timetable));
            
            // Generate assessments
            const assessments = this.generateAssessments(classes);
            localStorage.setItem('shikola_teacher_assessments', JSON.stringify(assessments));
            
            // Generate reports
            const reports = this.generateReports(classes);
            localStorage.setItem('shikola_teacher_reports', JSON.stringify(reports));
            
            // Generate notifications
            const notifications = [
                {
                    id: 'NOTIF-1',
                    title: 'New Assignment Submitted',
                    message: '5 students have submitted their Mathematics assignments',
                    type: 'assignment',
                    read: false,
                    time: '2 hours ago',
                    actionUrl: 'classes.html'
                },
                {
                    id: 'NOTIF-2',
                    title: 'Attendance Alert',
                    message: 'Grade 8B has low attendance this week',
                    type: 'attendance',
                    read: false,
                    time: '5 hours ago',
                    actionUrl: 'attendance.html'
                },
                {
                    id: 'NOTIF-3',
                    title: 'Report Generated',
                    message: 'Monthly performance report is ready for review',
                    type: 'report',
                    read: true,
                    time: '1 day ago',
                    actionUrl: 'reports.html'
                }
            ];
            localStorage.setItem('shikola_teacher_notifications', JSON.stringify(notifications));
            
            console.log('Teacher mock data initialization complete!');
            
            // Trigger event for UI updates
            window.dispatchEvent(new CustomEvent('shikola:teacher-mock-data-initialized', {
                detail: { success: true, timestamp: new Date() }
            }));
        },

        // Get dashboard statistics
        getDashboardStats: function() {
            const classes = JSON.parse(localStorage.getItem('shikola_teacher_classes') || '[]');
            const students = JSON.parse(localStorage.getItem('shikola_teacher_students') || '[]');
            const assessments = JSON.parse(localStorage.getItem('shikola_teacher_assessments') || '[]');
            const attendance = JSON.parse(localStorage.getItem('shikola_teacher_attendance') || '[]');
            
            return {
                myClassesCount: classes.length,
                studentsThisTerm: students.length,
                assessmentsToMark: assessments.filter(a => a.markedCount < a.submissionsCount).length,
                examTestOverview: {
                    unpublishedCount: getRandomInt(2, 8),
                    recentCount: assessments.filter(a => a.type === 'Exam').length,
                    averageScore: getRandomInt(65, 85),
                    pendingMarks: assessments.filter(a => a.markedCount < a.submissionsCount).reduce((sum, a) => sum + (a.submissionsCount - a.markedCount), 0)
                },
                teachingLessonsWeek: [12, 15, 18, 14, 16, 13, 17],
                teachingAssessmentsWeek: [3, 5, 4, 6, 3, 7, 4],
                teachingAttendanceAvg: [92, 88, 94, 90, 87, 91, 89]
            };
        }
    };

    // Auto-initialize if in demo mode
    if (window.SHIKOLA_CONFIG && window.SHIKOLA_CONFIG.DEMO_MODE) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(() => {
                    window.ShikolaTeacherMockData.initializeTeacherMockData();
                }, 1500);
            });
        } else {
            setTimeout(() => {
                window.ShikolaTeacherMockData.initializeTeacherMockData();
            }, 1500);
        }
    }

    // Make available globally
    window.initializeTeacherMockData = window.ShikolaTeacherMockData.initializeTeacherMockData.bind(window.ShikolaTeacherMockData);

})();
