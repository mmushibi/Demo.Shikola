/*
Shikola Mock Data Generator
Generates realistic mock data for demo purposes
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
        cities: ['Lusaka', 'Kitwe', 'Ndola', 'Kabwe', 'Chingola', 'Mufulira', 'Luanshya', 'Livingstone', 'Kasama', 'Chipata', 'Mongu', 'Solwezi', 'Mansa'],
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

    function generateAssignment() {
        const now = new Date();
        const assignedOn = getRandomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now);
        const dueOn = getRandomDate(new Date(now.getTime() + 24 * 60 * 60 * 1000), new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
        const statuses = ['pending', 'submitted', 'graded'];
        const priorities = ['high', 'medium', 'low'];
        const status = getRandomItem(statuses);
        
        let submittedOn = null;
        let gradedOn = null;
        let grade = null;
        
        if (status === 'submitted') {
            submittedOn = getRandomDate(assignedOn, dueOn);
        } else if (status === 'graded') {
            submittedOn = getRandomDate(assignedOn, dueOn);
            gradedOn = getRandomDate(submittedOn, new Date());
            grade = getRandomItem(['A+', 'A', 'B', 'C', 'D']);
        }

        return {
            id: 'ASSIGN-' + getRandomInt(1000, 9999),
            title: `${getRandomItem(['Essay', 'Project', 'Worksheet', 'Research', 'Presentation'])} on ${getRandomItem(ZAMBIAN_DATA.subjects)}`,
            description: `Complete the ${getRandomItem(['assignment', 'exercise', 'task'])} covering ${getRandomItem(['basic concepts', 'advanced topics', 'practical applications'])} of the subject.`,
            subject: getRandomItem(ZAMBIAN_DATA.subjects),
            teacherName: `Mr./Ms. ${getRandomItem(ZAMBIAN_DATA.lastNames)}`,
            assignedOn: formatDate(assignedOn),
            dueOn: formatDate(dueOn),
            submittedOn: submittedOn ? formatDate(submittedOn) : null,
            gradedOn: gradedOn ? formatDate(gradedOn) : null,
            status: status,
            priority: getRandomItem(priorities),
            grade: grade,
            maxScore: getRandomInt(50, 100),
            score: grade ? getRandomInt(40, 100) : null,
            attachments: Math.random() > 0.7 ? [`document_${getRandomInt(100, 999)}.pdf`] : [],
            submissionType: getRandomItem(['online', 'upload', 'in-class']),
            estimatedTime: getRandomInt(30, 180) + ' minutes'
        };
    }

    function generateAttendanceRecord(pupilId, classId) {
        const now = new Date();
        const statuses = ['present', 'absent', 'late', 'excused'];
        const records = [];
        
        // Generate attendance for the past 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            // Skip weekends
            if (date.getDay() === 0 || date.getDay() === 6) continue;
            
            records.push({
                id: `ATT-${pupilId}-${formatDate(date)}`,
                pupilId: pupilId,
                classId: classId,
                date: formatDate(date),
                status: getRandomItem(statuses),
                recordedBy: `Teacher ${getRandomItem(ZAMBIAN_DATA.lastNames)}`,
                notes: Math.random() > 0.8 ? getRandomItem(['Feeling unwell', 'Family emergency', 'Medical appointment']) : null
            });
        }
        
        return records;
    }

    function generateGrade(pupilId, subject) {
        const examTypes = ['Assignment', 'Quiz', 'Mid-term', 'Final', 'Project'];
        const examType = getRandomItem(examTypes);
        const maxScore = examType === 'Final' ? 100 : getRandomInt(50, 100);
        const score = getRandomInt(Math.floor(maxScore * 0.6), maxScore);
        
        let grade;
        if (score >= 90) grade = 'A+';
        else if (score >= 80) grade = 'A';
        else if (score >= 70) grade = 'B';
        else if (score >= 60) grade = 'C';
        else if (score >= 50) grade = 'D';
        else grade = 'F';

        return {
            id: `GRADE-${pupilId}-${subject}-${getRandomInt(1000, 9999)}`,
            pupilId: pupilId,
            subject: subject,
            examType: examType,
            term: 'Term ' + getRandomInt(1, 3),
            academicYear: '2026',
            score: score,
            maxScore: maxScore,
            grade: grade,
            percentage: Math.round((score / maxScore) * 100),
            date: formatDate(getRandomDate(new Date('2026-01-01'), new Date())),
            teacher: `Mr./Ms. ${getRandomItem(ZAMBIAN_DATA.lastNames)}`,
            comments: Math.random() > 0.7 ? getRandomItem(['Excellent work', 'Good effort', 'Needs improvement', 'Outstanding performance']) : null
        };
    }

    function generateTimetableEntry(classId, subject) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const times = ['08:00-09:00', '09:00-10:00', '10:30-11:30', '11:30-12:30', '14:00-15:00', '15:00-16:00'];
        
        return {
            id: `TT-${classId}-${getRandomInt(1000, 9999)}`,
            classId: classId,
            subject: subject,
            teacher: `Mr./Ms. ${getRandomItem(ZAMBIAN_DATA.lastNames)}`,
            day: getRandomItem(days),
            time: getRandomItem(times),
            room: `Room ${getRandomInt(101, 210)}`,
            duration: getRandomInt(45, 90) + ' minutes'
        };
    }

    function generateNotification() {
        const types = ['assignment', 'grade', 'attendance', 'general', 'reminder'];
        const type = getRandomItem(types);
        
        let title, message, link;
        switch(type) {
            case 'assignment':
                title = 'New Assignment Posted';
                message = `A new assignment has been posted for ${getRandomItem(ZAMBIAN_DATA.subjects)}`;
                link = '/portals/pupil-portal/home-assignments.html';
                break;
            case 'grade':
                title = 'Grade Posted';
                message = `Your ${getRandomItem(['quiz', 'assignment', 'exam'])} grade has been posted`;
                link = '/portals/pupil-portal/my-report-card.html';
                break;
            case 'attendance':
                title = 'Attendance Reminder';
                message = 'Please ensure regular attendance for better academic performance';
                link = '/portals/pupil-portal/dashboard.html';
                break;
            case 'general':
                title = 'School Announcement';
                message = getRandomItem(['Parent-teacher meeting scheduled', 'School event upcoming', 'Holiday announcement']);
                link = '/portals/pupil-portal/dashboard.html';
                break;
            case 'reminder':
                title = 'Assignment Due Soon';
                message = `Your ${getRandomItem(ZAMBIAN_DATA.subjects)} assignment is due tomorrow`;
                link = '/portals/pupil-portal/home-assignments.html';
                break;
        }

        return {
            id: 'NOTIF-' + getRandomInt(10000, 99999),
            title: title,
            message: message,
            type: type,
            link: link,
            read: Math.random() > 0.3,
            createdAt: formatDate(getRandomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date())),
            priority: getRandomItem(['high', 'medium', 'low'])
        };
    }

    // Mock API generators
    window.ShikolaMockData = {
        // Generate assignments for a pupil
        generateAssignments: function(count = 20) {
            const assignments = [];
            for (let i = 0; i < count; i++) {
                assignments.push(generateAssignment());
            }
            return assignments;
        },

        // Generate attendance records for a pupil
        generateAttendance: function(pupilId, classId) {
            return generateAttendanceRecord(pupilId, classId);
        },

        // Generate grades for a pupil
        generateGrades: function(pupilId, subjectCount = 8) {
            const grades = [];
            for (let i = 0; i < subjectCount; i++) {
                grades.push(generateGrade(pupilId, getRandomItem(ZAMBIAN_DATA.subjects)));
            }
            return grades;
        },

        // Generate timetable for a class
        generateTimetable: function(classId) {
            const timetable = [];
            const subjectsPerDay = getRandomInt(5, 8);
            
            for (let i = 0; i < subjectsPerDay; i++) {
                timetable.push(generateTimetableEntry(classId, getRandomItem(ZAMBIAN_DATA.subjects)));
            }
            return timetable;
        },

        // Generate notifications
        generateNotifications: function(count = 15) {
            const notifications = [];
            for (let i = 0; i < count; i++) {
                notifications.push(generateNotification());
            }
            return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        },

        // Generate complete pupil profile
        generatePupilProfile: function() {
            const gender = Math.random() > 0.5 ? 'male' : 'female';
            const firstName = getRandomItem(ZAMBIAN_DATA.firstNames[gender]);
            const lastName = getRandomItem(ZAMBIAN_DATA.lastNames);
            const pupilId = 'REG-' + getRandomInt(100, 999);
            
            return {
                id: pupilId,
                firstName: firstName,
                lastName: lastName,
                fullName: `${firstName} ${lastName}`,
                gender: gender === 'male' ? 'Male' : 'Female',
                dateOfBirth: formatDate(getRandomDate(new Date('2005-01-01'), new Date('2015-12-31'))),
                class: getRandomItem(['Grade 1A', 'Grade 2B', 'Grade 3A', 'Grade 4B', 'Grade 5A', 'Grade 6B', 'Grade 7A', 'Grade 8B', 'Grade 9A', 'Grade 10B', 'Grade 11A', 'Grade 12B']),
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@shikola.edu.zm`,
                phone: '+260' + getRandomInt(950000000, 979999999),
                address: `${getRandomInt(100, 999)} ${getRandomItem(['Kabulonga', 'Rhodes Park', 'Chelston', 'Kansenshi'])} Road, ${getRandomItem(ZAMBIAN_DATA.cities)}`,
                parentName: `${getRandomItem(ZAMBIAN_DATA.firstNames.female)} ${lastName}`,
                parentPhone: '+260' + getRandomInt(950000000, 979999999),
                status: 'Active',
                admissionYear: getRandomInt(2015, 2024)
            };
        },

        // Initialize mock data in localStorage
        initializeMockData: function() {
            console.log('Initializing Shikola mock data...');
            
            // Generate mock pupil profile
            const pupil = this.generatePupilProfile();
            localStorage.setItem('shikola_current_pupil', JSON.stringify(pupil));
            
            // Generate mock assignments
            const assignments = this.generateAssignments(25);
            localStorage.setItem('shikola_mock_assignments', JSON.stringify(assignments));
            
            // Generate mock attendance
            const attendance = this.generateAttendance(pupil.id, pupil.class);
            localStorage.setItem('shikola_mock_attendance', JSON.stringify(attendance));
            
            // Generate mock grades
            const grades = this.generateGrades(pupil.id, 10);
            localStorage.setItem('shikola_mock_grades', JSON.stringify(grades));
            
            // Generate mock timetable
            const timetable = this.generateTimetable(pupil.class);
            localStorage.setItem('shikola_mock_timetable', JSON.stringify(timetable));
            
            // Generate mock notifications
            const notifications = this.generateNotifications(20);
            localStorage.setItem('shikola_mock_notifications', JSON.stringify(notifications));
            
            console.log('Mock data initialization complete!');
            
            // Trigger event for UI updates
            window.dispatchEvent(new CustomEvent('shikola:mock-data-initialized', {
                detail: { success: true, timestamp: new Date() }
            }));
        },

        // Clear mock data
        clearMockData: function() {
            const keys = [
                'shikola_current_pupil',
                'shikola_mock_assignments',
                'shikola_mock_attendance',
                'shikola_mock_grades',
                'shikola_mock_timetable',
                'shikola_mock_notifications'
            ];
            
            keys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log('Mock data cleared');
        }
    };

    // Auto-initialize if in demo mode
    if (window.SHIKOLA_CONFIG && window.SHIKOLA_CONFIG.DEMO_MODE) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(() => {
                    window.ShikolaMockData.initializeMockData();
                }, 1000);
            });
        } else {
            setTimeout(() => {
                window.ShikolaMockData.initializeMockData();
            }, 1000);
        }
    }

    // Make available globally
    window.initializeShikolaMockData = window.ShikolaMockData.initializeMockData.bind(window.ShikolaMockData);
    window.clearShikolaMockData = window.ShikolaMockData.clearMockData.bind(window.ShikolaMockData);

})();
